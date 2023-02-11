use std::marker::PhantomData;

use halo2_machinelearning::{nn_ops::{
    lookup_ops::DecompTable,
    matrix_ops::{
        linear::{
            batchnorm::{BatchnormChip, BatchnormChipParams, BatchnormConfig},
            conv::{
                Conv3DLayerChip, Conv3DLayerConfig, Conv3DLayerParams,
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
use halo2_base::halo2_proofs::{
    arithmetic::FieldExt,
    circuit::{AssignedCell, Chip, Layouter, Value},
    plonk::{Advice, ConstraintSystem, Error as PlonkError, Fixed, Selector, Column, Expression}, poly::Rotation,
};

use ndarray::{Array3, Axis, Array1, Array};

#[derive(Clone, Debug)]
pub struct InputUnpackingConfig {
    input: Column<Advice>,
    output: Array1<Column<Advice>>,
    output_width: usize,
    output_height: usize,
    selector: Selector,
}

pub struct InputUnpackingChip<F: FieldExt> {
    config: InputUnpackingConfig,
    _marker: PhantomData<F>,
}

impl<F: FieldExt> Chip<F> for InputUnpackingChip<F> {
    type Config = InputUnpackingConfig;
    type Loaded = ();

    fn config(&self) -> &Self::Config {
        &self.config
    }

    fn loaded(&self) -> &Self::Loaded {
        &()
    }
}

impl<F: FieldExt> NNLayer<F> for InputUnpackingChip<F> {
    type ConfigParams = (usize, usize);

    type LayerInput = Array1<AssignedCell<F, F>>;

    type LayerOutput = Array3<AssignedCell<F, F>>;

    fn construct(config: <Self as Chip<F>>::Config) -> Self {
        Self { config, _marker: PhantomData }
    }

    fn configure(
        meta: &mut ConstraintSystem<F>,
        config_params: Self::ConfigParams,
        advice_allocator: &mut ColumnAllocator<Advice>,
        _: &mut ColumnAllocator<Fixed>,
    ) -> <Self as Chip<F>>::Config {
        let output_len = config_params.0 * config_params.1;
        let advice = advice_allocator.take(meta, output_len + 1);
        let input = advice[0];
        let output = Array1::from_vec(advice[1..output_len+1].to_vec());

        let selector = meta.selector();

        meta.create_gate("Input Unpacking", |meta| {
            let sel = meta.query_selector(selector);
            let input = meta.query_advice(input, Rotation::cur());
            let output = output.map(|&column| {meta.query_advice(column, Rotation::cur())});

            let base = F::from(2);
            let output_sum = output.clone();
            let (_, sum) = output_sum.into_iter().enumerate().reduce(|(_, accum), (index, item)| {
                let true_base = Expression::Constant((0..index).fold(F::from(1), |expr, _input| expr * base));
                (0, accum + (item * true_base))
            }).unwrap();

            let output_constraint = sel.clone() * (sum - input);

            let mut range_constraints = output.into_iter().map(|item| {
                sel.clone()*((item.clone() - Expression::Constant(F::one()))*item)
            }).collect::<Vec<_>>();
            range_constraints.push(output_constraint);
            range_constraints
        });

        InputUnpackingConfig {
            input,
            output,
            selector,
            output_width: config_params.0,
            output_height: config_params.1
        }
    }

    fn add_layer(
        &self,
        layouter: &mut impl Layouter<F>,
        input: Self::LayerInput,
        layer_params: Self::LayerParams,
    ) -> Result<Self::LayerOutput, PlonkError> {
        layouter.assign_region(|| "unpacking input", |mut region| {
            let out = input.iter().enumerate().flat_map(|(row, input)| {
                input.copy_advice(
                    || "eltwise input",
                    &mut region,
                    self.config.input,
                    row,
                ).unwrap();
    
                let base = 2;
                let word_repr: Value<Vec<u16>> = input.value().and_then(|x| {
                    let mut result = vec![];
                    let mut x = x.get_lower_128();
                    loop {
                        let m = x % base;
                        x /= base;
    
                        result.push(m as u16);
                        if x == 0 {
                            break;
                        }
                    }
                    Value::known(result)
                });

                self.config.output.iter()
                .enumerate().map(|(index, &column)| {
                    region
                        .assign_advice(
                            || "eltwise_inter word_repr",
                            column,
                            row,
                            || {
                                word_repr.clone().map(|x| match index >= x.len() {
                                    false => F::from((x[index] as u64) * Self::DecompConfig::SCALING_FACTOR),
                                    true => F::from(0),
                                })
                            },
                        ).unwrap()
                }).collect::<Vec<_>>()
            }).collect::<Vec<AssignedCell<F, F>>>();
            Ok(Array::from_shape_vec((input.len(), self.config.output_width, self.config.output_height), out).unwrap())
        })
    }
}

#[cfg(test)]
mod tests {
    use halo2_machinelearning::{
        felt_from_i64,
        nn_ops::{ColumnAllocator, DefaultDecomp, NNLayer}, felt_to_i64,
    };

    use halo2_base::halo2_proofs::{
        arithmetic::FieldExt,
        circuit::{Layouter, SimpleFloorPlanner, Value},
        dev::MockProver,
        halo2curves::bn256::Fr,
        plonk::{Advice, Circuit, Column, ConstraintSystem, Error as PlonkError, Fixed, Instance},
    };
    use ndarray::{stack, Array, Array2, Array3, Array4, Axis, Zip, Array1};

    use super::{InputUnpackingConfig, InputUnpackingChip};

    #[derive(Clone, Debug)]
    struct InputUnpackingTestConfig {
        input: Column<Instance>,
        input_advice: Column<Advice>,
        output: Column<Instance>,
        conv_chip: InputUnpackingConfig,
    }

    struct InputUnpackingTestCircuit<F: FieldExt> {
        pub input: Array1<Value<F>>,
    }

    const WIDTH: usize = 8;
    const HEIGHT: usize = 8;
    const DEPTH: usize = 4;

    impl<F: FieldExt> Circuit<F> for InputUnpackingTestCircuit<F> {
        type Config = InputUnpackingTestConfig;

        type FloorPlanner = SimpleFloorPlanner;

        fn without_witnesses(&self) -> Self {
            Self {
                input: Array::from_shape_simple_fn(DEPTH, || {
                    Value::unknown()
                }),
            }
        }

        fn configure(meta: &mut ConstraintSystem<F>) -> Self::Config {
            let mut advice_allocator = ColumnAllocator::<Advice>::new(meta, 0);

            let mut fixed_allocator = ColumnAllocator::<Fixed>::new(meta, 0);

            let conv_chip = InputUnpackingChip::configure(
                meta,
                (WIDTH, HEIGHT),
                &mut advice_allocator,
                &mut fixed_allocator,
            );

            InputUnpackingTestConfig {
                input: {
                    let col = meta.instance_column();
                    meta.enable_equality(col);
                    col
                },
                output: {
                    let col = meta.instance_column();
                    meta.enable_equality(col);
                    col
                },
                input_advice: {
                    let col = meta.advice_column();
                    meta.enable_equality(col);
                    col
                },
                conv_chip,
            }
        }

        fn synthesize(
            &self,
            config: Self::Config,
            mut layouter: impl Layouter<F>,
        ) -> Result<(), PlonkError> {
            let conv_chip = InputUnpackingChip::construct(config.conv_chip);

            let inputs = layouter.assign_region(
                || "input assignment",
                |mut region| {
                    let inputs: Result<Vec<_>, _> = self
                        .input
                        .iter()
                        .enumerate()
                        .map(|(row, _)| {
                            region.assign_advice_from_instance(
                                || "copy input to advice",
                                config.input,
                                row,
                                config.input_advice,
                                row,
                            )
                        })
                        .collect();
                    Ok(Array::from_shape_vec(DEPTH, inputs?).unwrap())
                },
            )?;


            let output = conv_chip.add_layer(&mut layouter, inputs, ())?;

            for (row, output) in output.iter().enumerate() {
                layouter.constrain_instance(output.cell(), config.output, row)?;
            }

            Ok(())
        }
    }

    const TEST_INPUT: [u64; DEPTH] = [10, 0, 10, 0];

    #[test]
    ///test that a simple 8x8x4 w/ 3x3x4 conv works; input and kernal are all 1
    fn test_simple_conv() -> Result<(), PlonkError> {
        let input = TEST_INPUT.map(|x| Value::known(Fr::from(x))).to_vec().into();

        let output: Vec<_> = TEST_INPUT.iter().map(|&x| {
            let mut result = vec![];
            let mut x = x;
            loop {
                let m = x % 2;
                x /= 2;

                result.push(m);
                if x == 0 {
                    break;
                }
            }
            result
        }).flat_map(|mut x| {x.resize(WIDTH*HEIGHT, 0); x}).map(|x| Fr::from(x * 1_048_576)).collect();

        let circuit = InputUnpackingTestCircuit { input };

        let instances = vec![
            TEST_INPUT.map(|x| Fr::from(x)).to_vec().into(),
            output,
        ];

        MockProver::run(9, &circuit, instances)
            .unwrap()
            .assert_satisfied();

        Ok(())
    }
}

