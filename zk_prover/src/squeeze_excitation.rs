use halo2_machinelearning::{nn_ops::{
    lookup_ops::DecompTable,
    matrix_ops::{
        linear::{
            dist_add::{DistributedAddChip, DistributedAddConfig},
            dist_mul::{DistributedMulChip, DistributedMulConfig},
        },
        non_linear::{
            avg_pool::{AvgPool2DChip, AvgPool2DChipConfig, AvgPool2DConfig},
            norm_2d::{Normalize2dChip, Normalize2dConfig},
        },
    },
    vector_ops::{
        linear::fc::{FcChip, FcChipConfig, FcConfig, FcChipParams},
        non_linear::{
            eltwise_ops::{NormalizeChip, NormalizeReluChip, DecompConfig as EltwiseConfig, EltwiseInstructions},
            sigmoid::{SigmoidChip, SigmoidChipConfig, SigmoidConfig},
        },
    },
    ColumnAllocator, DecompConfig, InputSizeConfig, NNLayer,
}, felt_to_i64};
use halo2_base::halo2_proofs::{
    arithmetic::FieldExt,
    circuit::{AssignedCell, Chip},
    plonk::{Advice, ConstraintSystem, Error as PlonkError, Fixed},
};

use ndarray::{Array3, Array1, Axis};

#[derive(Clone, Debug)]
pub struct SqueezeExcitationBlockConfig<F: FieldExt> {
    fc_chips: [FcConfig<F>; 2],
    avg_pool_chip: AvgPool2DConfig<F>,
    dist_mul_chip: DistributedMulConfig<F>,
    dist_add_chip: DistributedAddConfig<F>,
    sigmoid_chip: SigmoidConfig<F>,
    norm_chip: Normalize2dConfig<F>,
    lin_norm_chip: EltwiseConfig<F>,
    lin_relu_chip: EltwiseConfig<F>,
}

pub struct SqueezeExcitationBlockChip<F: FieldExt> {
    config: SqueezeExcitationBlockConfig<F>,
}

impl<F: FieldExt> Chip<F> for SqueezeExcitationBlockChip<F> {
    type Config = SqueezeExcitationBlockConfig<F>;
    type Loaded = ();

    fn config(&self) -> &Self::Config {
        &self.config
    }

    fn loaded(&self) -> &Self::Loaded {
        &()
    }
}

#[derive(Clone, Debug)]
pub struct SqueezeExcitationBlockChipParams<F: FieldExt> {
    pub fc_params: [FcChipParams<F>; 2],
}

pub struct SqueezeExcitationBlockChipConfig<F: FieldExt, Decomp: DecompConfig> {
    pub range_table: DecompTable<F, Decomp>,
    pub norm_chip: Normalize2dConfig<F>,
}

impl<F: FieldExt> NNLayer<F> for SqueezeExcitationBlockChip<F> {
    type ConfigParams = SqueezeExcitationBlockChipConfig<F, Self::DecompConfig>;

    type LayerParams = SqueezeExcitationBlockChipParams<F>;

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
        let elt_advices = advice_allocator.take(meta, Self::DecompConfig::ADVICE_LEN + 3);
        let relu_chip = NormalizeReluChip::<_, 1024, 2>::configure(
            meta,
            elt_advices[0],
            elt_advices[1..elt_advices.len() - 1].into(),
            elt_advices[elt_advices.len() - 1],
            config_params.range_table.clone(),
        );

        let norm_chip = NormalizeChip::<_, 1024, 2>::configure(
            meta,
            elt_advices[0],
            elt_advices[1..elt_advices.len() - 1].into(),
            elt_advices[elt_advices.len() - 1],
            config_params.range_table.clone(),
        );

        let fc_params_1 = FcChipConfig {
            weights_height: 32,
            weights_width: 128,
            folding_factor: 16,
        };
        let fc_chip_1 = FcChip::configure(
            meta,
            fc_params_1,
            advice_allocator,
            fixed_allocator,
        );

        let fc_params_2 = FcChipConfig {
            weights_height: 256,
            weights_width: 32,
            folding_factor: 2,
        };
        let fc_chip_2 = FcChip::configure(
            meta,
            fc_params_2,
            advice_allocator,
            fixed_allocator,
        );

        let avg_pool_config = AvgPool2DChipConfig {
            input_height: 8,
            input_width: 8,
            input_depth: 128,
            norm_chip: norm_chip.clone(),
        };
        let avg_pool_chip =
            AvgPool2DChip::configure(meta, avg_pool_config, advice_allocator, fixed_allocator);

        let input_config = InputSizeConfig {
            input_height: 8,
            input_width: 8,
            input_depth: 128,
        };

        let dist_mul_chip = DistributedMulChip::configure(
            meta,
            input_config.clone(),
            advice_allocator,
            fixed_allocator,
        );
        let dist_add_chip =
            DistributedAddChip::configure(meta, input_config, advice_allocator, fixed_allocator);

        let sigmoid_config = SigmoidChipConfig {
            range_table: config_params.range_table.clone(),
            norm_chip: norm_chip.clone(),
        };
        let sigmoid_chip =
            SigmoidChip::configure(meta, sigmoid_config, advice_allocator, fixed_allocator);

        SqueezeExcitationBlockConfig {
            fc_chips: [fc_chip_1, fc_chip_2],
            avg_pool_chip,
            dist_mul_chip,
            dist_add_chip,
            sigmoid_chip,
            norm_chip: config_params.norm_chip,
            lin_norm_chip: norm_chip,
            lin_relu_chip: relu_chip,
        }
    }

    fn add_layer(
        &self,
        layouter: &mut impl halo2_base::halo2_proofs::circuit::Layouter<F>,
        input: Self::LayerInput,
        layer_params: Self::LayerParams,
    ) -> Result<Self::LayerOutput, PlonkError> {
        let config = &self.config;
        let fc_chip_1 =
            FcChip::construct(config.fc_chips[0].clone());
        let fc_chip_2 =
            FcChip::construct(config.fc_chips[1].clone());
        let avg_pool_chip = AvgPool2DChip::construct(config.avg_pool_chip.clone());
        let sigmoid_chip = SigmoidChip::construct(config.sigmoid_chip.clone());
        let dist_mul_chip = DistributedMulChip::construct(config.dist_mul_chip.clone());
        let dist_add_chip = DistributedAddChip::construct(config.dist_add_chip.clone());
        let norm_chip = Normalize2dChip::construct(config.norm_chip.clone());
        let lin_norm_chip = NormalizeChip::<_, 1024, 2>::construct(config.lin_norm_chip.clone());
        let lin_relu_chip = NormalizeReluChip::<_, 1024, 2>::construct(config.lin_relu_chip.clone());

        let input_copy = input.clone();

        let avg_vec = avg_pool_chip.add_layer(layouter, input, ())?;

        // println!("pre fc_1: {:?}", avg_vec.map(|x| x.value().map(|x| felt_to_i64(*x))));

        let fc_1 = fc_chip_1.add_layer(
            layouter,
            avg_vec,
            layer_params.fc_params[0].clone(),
        )?;

        // println!("post fc_1: {:?}", fc_1.map(|x| x.value().map(|x| felt_to_i64(*x))));

        let fc_1: Result<Array1<_>, _> = fc_1.into_iter().map(|input| {
            lin_relu_chip.apply_elt(layouter.namespace(|| "apply linear relu/norm"), input)
        }).collect();

        let fc_1 = fc_1?;

        let fc_2 = fc_chip_2.add_layer(layouter, fc_1, layer_params.fc_params[1].clone())?;

        let fc_2: Result<Array1<_>, _> = fc_2.into_iter().map(|input| {
            lin_norm_chip.apply_elt(layouter.namespace(|| "apply linear norm"), input)
        }).collect();
        let fc_2 = fc_2?;

        let scale = fc_2.to_vec()[0..128].to_vec();        
        let shift = fc_2.to_vec()[128..].to_vec();

        let scale_sigmoid = sigmoid_chip.add_layer(layouter, scale.into(), ())?;

        let scaled_input = dist_mul_chip.add_layer(layouter, (input_copy, scale_sigmoid), ())?;

        let normed_scaled = norm_chip.add_layer(layouter, scaled_input, ())?;
        dist_add_chip.add_layer(layouter, (normed_scaled, shift.into()), ())
    }
}
