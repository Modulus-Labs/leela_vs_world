use halo2_machinelearning::{nn_ops::{
    lookup_ops::DecompTable,
    matrix_ops::{
        linear::{
            batchnorm::{BatchnormChip, BatchnormChipParams, BatchnormConfig},
            conv::{
                Conv3DLayerChip, Conv3DLayerConfig, Conv3DLayerConfigParams, Conv3DLayerParams,
            },
            residual_add::{ResidualAdd2DChip, ResidualAdd2DConfig},
        },
        non_linear::{
            norm_2d::{Normalize2dChip, Normalize2dConfig},
            relu_norm_2d::{ReluNorm2DChip, ReluNorm2DConfig},
            relu_2d::{Relu2DChip, Relu2DConfig, Relu2DChipConfig},
        },
    },
    ColumnAllocator, DecompConfig, InputSizeConfig, NNLayer,
}, felt_to_i64};
use halo2_proofs::{
    arithmetic::FieldExt,
    circuit::{AssignedCell, Chip},
    plonk::{Advice, ConstraintSystem, Error as PlonkError, Fixed},
};

use crate::squeeze_excitation::{
    SqueezeExcitationBlockChip, SqueezeExcitationBlockChipConfig, SqueezeExcitationBlockChipParams,
    SqueezeExcitationBlockConfig,
};

use ndarray::{Array3, Axis};

#[derive(Clone, Debug)]
pub struct ResidualBlockConfig<F: FieldExt> {
    conv_chip: Conv3DLayerConfig<F>,
    bn_chip: BatchnormConfig<F>,
    norm_chip: Normalize2dConfig<F>,
    relu_norm_chip: ReluNorm2DConfig<F>,
    se_chip: SqueezeExcitationBlockConfig<F>,
    residual_add_chip: ResidualAdd2DConfig<F>,
    relu_chip: Relu2DConfig<F>,
}

pub struct ResidualBlockChip<F: FieldExt> {
    config: ResidualBlockConfig<F>,
}

impl<F: FieldExt> Chip<F> for ResidualBlockChip<F> {
    type Config = ResidualBlockConfig<F>;
    type Loaded = ();

    fn config(&self) -> &Self::Config {
        &self.config
    }

    fn loaded(&self) -> &Self::Loaded {
        &()
    }
}

#[derive(Clone, Debug)]
pub struct ResidualBlockChipParams<F: FieldExt> {
    pub conv_params: [Conv3DLayerParams<F>; 2],
    pub bn_params: [BatchnormChipParams<F>; 2],
    pub se_params: SqueezeExcitationBlockChipParams<F>,
}

pub struct ResidualBlockChipConfig<F: FieldExt, Decomp: DecompConfig> {
    pub norm_relu_chip: ReluNorm2DConfig<F>,
    pub norm_chip: Normalize2dConfig<F>,
    pub bn_chip: BatchnormConfig<F>,
    pub conv_chip: Conv3DLayerConfig<F>,
    pub range_table: DecompTable<F, Decomp>,
}

impl<F: FieldExt> NNLayer<F> for ResidualBlockChip<F> {
    type ConfigParams = ResidualBlockChipConfig<F, Self::DecompConfig>;

    type LayerParams = ResidualBlockChipParams<F>;

    type LayerInput = Array3<AssignedCell<F, F>>;

    type LayerOutput = Array3<AssignedCell<F, F>>;

    fn construct(config: <Self as Chip<F>>::Config) -> Self {
        Self { config }
    }

    fn configure(
        meta: &mut ConstraintSystem<F>,
        config_params: Self::ConfigParams,
        advice_allocator: &mut ColumnAllocator<Advice>,
        fixed_allocator: &mut ColumnAllocator<Fixed>,
    ) -> <Self as Chip<F>>::Config {
        let ResidualBlockChipConfig {
            norm_relu_chip,
            norm_chip,
            bn_chip,
            conv_chip,
            range_table,
        } = config_params;

        let se_params = SqueezeExcitationBlockChipConfig {
            range_table: range_table.clone(),
            norm_chip: norm_chip.clone(),
        };
        let se_chip = SqueezeExcitationBlockChip::configure(
            meta,
            se_params,
            advice_allocator,
            fixed_allocator,
        );

        let residual_params = InputSizeConfig {
            input_height: 8,
            input_width: 8,
            input_depth: 128,
        };
        let residual_add_chip =
            ResidualAdd2DChip::configure(meta, residual_params, advice_allocator, fixed_allocator);

        let relu_params = Relu2DChipConfig {
            input_height: 8,
            input_width: 8,
            input_depth: 128,
            range_table: range_table.clone(),
        };
        let relu_chip = Relu2DChip::configure(meta, relu_params, advice_allocator, fixed_allocator);

        ResidualBlockConfig {
            conv_chip,
            bn_chip,
            norm_chip,
            relu_norm_chip: norm_relu_chip,
            se_chip,
            residual_add_chip,
            relu_chip,
        }
    }

    fn add_layer(
        &self,
        layouter: &mut impl halo2_proofs::circuit::Layouter<F>,
        input: Self::LayerInput,
        layer_params: Self::LayerParams,
    ) -> Result<Self::LayerOutput, PlonkError> {
        let config = &self.config;
        let conv_chip = Conv3DLayerChip::construct(config.conv_chip.clone());
        let bn_chip = BatchnormChip::construct(config.bn_chip.clone());
        let norm_chip = Normalize2dChip::construct(config.norm_chip.clone());
        let relu_norm_chip = ReluNorm2DChip::construct(config.relu_norm_chip.clone());
        let se_chip = SqueezeExcitationBlockChip::construct(config.se_chip.clone());
        let residual_add_chip = ResidualAdd2DChip::construct(config.residual_add_chip.clone());
        let relu_chip = Relu2DChip::construct(config.relu_chip.clone());

        let input_copy = input.clone();

        let conv_output =
            conv_chip.add_layer(layouter, input, layer_params.conv_params[0].clone())?;

        let norm_output = norm_chip.add_layer(layouter, conv_output, ())?;
        let bn_output =
            bn_chip.add_layer(layouter, norm_output, layer_params.bn_params[0].clone())?;

        let relu_output = relu_norm_chip.add_layer(layouter, bn_output, ())?;

        let conv_2_output =
            conv_chip.add_layer(layouter, relu_output, layer_params.conv_params[1].clone())?;

        let norm_2_output = norm_chip.add_layer(layouter, conv_2_output, ())?;
        let bn_2_output =
            bn_chip.add_layer(layouter, norm_2_output, layer_params.bn_params[1].clone())?;

        let norm_2_output = norm_chip.add_layer(layouter, bn_2_output, ())?;

        let se_output = se_chip.add_layer(layouter, norm_2_output, layer_params.se_params)?;

        let residual_output = residual_add_chip.add_layer(layouter, [se_output, input_copy], ())?;

        relu_chip.add_layer(layouter, residual_output, ())
    }
}
