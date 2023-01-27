use halo2_machinelearning::{nn_ops::{
    matrix_ops::{
        linear::{
            batchnorm::{BatchnormChip, BatchnormChipParams, BatchnormConfig},
            conv::{
                Conv3DLayerChip, Conv3DLayerConfig, Conv3DLayerParams,
            },
            dist_add_fixed::{
                DistributedAddFixedChip, DistributedAddFixedChipParams, DistributedAddFixedConfig,
            },
        },
        non_linear::{
            norm_2d::{Normalize2dChip, Normalize2dConfig},
            relu_norm_2d::{ReluNorm2DChip, ReluNorm2DConfig},
        },
    },
    vector_ops::gather::gather,
    ColumnAllocator, InputSizeConfig, NNLayer,
}};
use halo2_proofs::{
    arithmetic::FieldExt,
    circuit::{AssignedCell, Chip},
    plonk::{Advice, ConstraintSystem, Error as PlonkError, Fixed},
};

use ndarray::{Array1, Array3};

#[derive(Clone, Debug)]
pub struct PolicyHeadConfig<F: FieldExt> {
    conv_chip: Conv3DLayerConfig<F>,
    bn_chip: BatchnormConfig<F>,
    norm_chip: Normalize2dConfig<F>,
    relu_chip: ReluNorm2DConfig<F>,
    dist_add_chip: DistributedAddFixedConfig<F>,
}

pub struct PolicyHeadChip<F: FieldExt> {
    config: PolicyHeadConfig<F>,
}

impl<F: FieldExt> Chip<F> for PolicyHeadChip<F> {
    type Config = PolicyHeadConfig<F>;
    type Loaded = ();

    fn config(&self) -> &Self::Config {
        &self.config
    }

    fn loaded(&self) -> &Self::Loaded {
        &()
    }
}

#[derive(Clone, Debug)]
pub struct PolicyHeadChipParams<F: FieldExt> {
    pub conv_1_params: Conv3DLayerParams<F>,
    pub conv_2_params: Conv3DLayerParams<F>,
    pub bn_params: BatchnormChipParams<F>,
    pub bias_params: DistributedAddFixedChipParams<F>,
    pub gather_map: Array1<usize>,
}

pub struct PolicyHeadChipConfig<F: FieldExt> {
    pub norm_relu_chip: ReluNorm2DConfig<F>,
    pub norm_chip: Normalize2dConfig<F>,
    pub bn_chip: BatchnormConfig<F>,
    pub conv_chip: Conv3DLayerConfig<F>,
}

impl<F: FieldExt> NNLayer<F> for PolicyHeadChip<F> {
    type ConfigParams = PolicyHeadChipConfig<F>;

    type LayerParams = PolicyHeadChipParams<F>;

    type LayerInput = Array3<AssignedCell<F, F>>;

    type LayerOutput = Array1<AssignedCell<F, F>>;

    fn construct(config: <Self as Chip<F>>::Config) -> Self {
        Self { config }
    }

    fn configure(
        meta: &mut ConstraintSystem<F>,
        config_params: Self::ConfigParams,
        advice_allocator: &mut ColumnAllocator<Advice>,
        fixed_allocator: &mut ColumnAllocator<Fixed>,
    ) -> <Self as Chip<F>>::Config {
        let PolicyHeadChipConfig {
            norm_relu_chip,
            norm_chip,
            bn_chip,
            conv_chip,
        } = config_params;

        let dist_add_config = InputSizeConfig {
            input_height: 8,
            input_width: 8,
            input_depth: 80,
        };

        let dist_add_chip = DistributedAddFixedChip::configure(
            meta,
            dist_add_config,
            advice_allocator,
            fixed_allocator,
        );

        PolicyHeadConfig {
            conv_chip,
            bn_chip,
            norm_chip,
            relu_chip: norm_relu_chip,
            dist_add_chip,
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
        let dist_add_fixed_chip = DistributedAddFixedChip::construct(config.dist_add_chip.clone());

        let conv_output = conv_chip.add_layer(layouter, input, layer_params.conv_1_params)?;
        let norm_output = norm_chip.add_layer(layouter, conv_output, ())?;
        let bn_output = bn_chip.add_layer(layouter, norm_output, layer_params.bn_params)?;
        let relu_output = relu_chip.add_layer(layouter, bn_output, ())?;

        let conv_2_output =
            conv_chip.add_layer(layouter, relu_output, layer_params.conv_2_params)?;

        let bias_output =
            dist_add_fixed_chip.add_layer(layouter, conv_2_output, layer_params.bias_params)?;

        let norm_output = norm_chip.add_layer(layouter, bias_output, ())?;

        //println!("final conv output is {:?}", norm_output.map(|x| x.value().map(|&x| felt_to_i64(x))).index_axis(Axis(0), 0));

        //let norm_output = norm_output.permuted_axes([0, 2, 1]);

        let output_vec = norm_output.to_shape(5120).unwrap().to_owned();

        //println!("output #2689 is {:?}", output_vec.get(2689).unwrap());

        Ok(gather(output_vec, layer_params.gather_map))
    }
}
