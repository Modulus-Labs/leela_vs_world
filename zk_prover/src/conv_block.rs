use halo2_machinelearning::nn_ops::{
    matrix_ops::{
        linear::{
            batchnorm::{BatchnormChip, BatchnormChipParams, BatchnormConfig},
            conv::{
                Conv3DLayerChip, Conv3DLayerConfig, Conv3DLayerConfigParams, Conv3DLayerParams,
            },
        },
        non_linear::{
            norm_2d::{Normalize2dChip, Normalize2dConfig},
            relu_norm_2d::{ReluNorm2DChip, ReluNorm2DConfig},
        },
    },
    ColumnAllocator, NNLayer,
};
use halo2_proofs::{
    arithmetic::FieldExt,
    circuit::{AssignedCell, Chip},
    plonk::{Advice, ConstraintSystem, Error as PlonkError, Fixed},
};

use ndarray::{Array3};

#[derive(Clone, Debug)]
pub struct ConvBlockConfig<F: FieldExt> {
    conv_chip: Conv3DLayerConfig<F>,
    bn_chip: BatchnormConfig<F>,
    norm_chip: Normalize2dConfig<F>,
    relu_chip: ReluNorm2DConfig<F>,
}

pub struct ConvBlockChip<F: FieldExt> {
    config: ConvBlockConfig<F>,
}

impl<F: FieldExt> Chip<F> for ConvBlockChip<F> {
    type Config = ConvBlockConfig<F>;
    type Loaded = ();

    fn config(&self) -> &Self::Config {
        &self.config
    }

    fn loaded(&self) -> &Self::Loaded {
        &()
    }
}

#[derive(Clone, Debug)]
pub struct ConvBlockChipParams<F: FieldExt> {
    pub conv_params: Conv3DLayerParams<F>,
    pub bn_params: BatchnormChipParams<F>,
}

pub struct ConvBlockChipConfig<F: FieldExt> {
    pub norm_relu_chip: ReluNorm2DConfig<F>,
    pub norm_chip: Normalize2dConfig<F>,
    pub bn_chip: BatchnormConfig<F>,
}

impl<F: FieldExt> NNLayer<F> for ConvBlockChip<F> {
    type ConfigParams = ConvBlockChipConfig<F>;

    type LayerParams = ConvBlockChipParams<F>;

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
        let conv_config = Conv3DLayerConfigParams {
            input_height: 8,
            input_width: 8,
            input_depth: 112,
            ker_height: 3,
            ker_width: 3,
            padding_width: 1,
            padding_height: 1,
        };

        let conv_chip =
            Conv3DLayerChip::configure(meta, conv_config, advice_allocator, fixed_allocator);
        ConvBlockConfig {
            conv_chip,
            bn_chip: config_params.bn_chip,
            relu_chip: config_params.norm_relu_chip,
            norm_chip: config_params.norm_chip,
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
        let relu_chip = ReluNorm2DChip::construct(config.relu_chip.clone());

        let conv_output = conv_chip.add_layer(layouter, input, layer_params.conv_params)?;

        let conv_output = norm_chip.add_layer(layouter, conv_output, ())?;

        let bn_output = bn_chip.add_layer(layouter, conv_output, layer_params.bn_params)?;

        relu_chip.add_layer(layouter, bn_output, ())
    }
}
