pub mod conv_block;
pub mod input_parsing;
pub mod policy_head;
pub mod residual_block;
pub mod squeeze_excitation;
pub mod input_unpacking;

use conv_block::{ConvBlockChipParams, ConvBlockChipConfig, ConvBlockConfig, ConvBlockChip};
use halo2_machinelearning::{nn_ops::{
    matrix_ops::{
        linear::{
            batchnorm::{BatchnormChipParams, BatchnormChip}, conv::{Conv3DLayerParams, Conv3DLayerChip, Conv3DLayerConfigParams},
            dist_add_fixed::DistributedAddFixedChipParams,
        },
        non_linear::{norm_2d::{Normalize2DChipConfig, Normalize2dChip}, relu_norm_2d::{ReluNorm2DChipConfig, ReluNorm2DChip}},
    },
    vector_ops::linear::fc::FcChipParams, ColumnAllocator, NNLayer, InputSizeConfig, lookup_ops::DecompTable, DefaultDecomp,
}, felt_to_i64};
use halo2_base::{halo2_proofs::{
    arithmetic::{FieldExt},
    circuit::{Layouter, SimpleFloorPlanner, Value},
    plonk::{Advice, Circuit, Column, ConstraintSystem, Error as PlonkError, Instance, Fixed}, halo2curves::{bn256::Fr},
}, utils::value_to_option};
use input_unpacking::{InputUnpackingChip, InputUnpackingConfig};
use ndarray::{Array, Array3, Array1, Axis};
use once_cell::sync::OnceCell;
use policy_head::{PolicyHeadChipParams, PolicyHeadConfig, PolicyHeadChipConfig, PolicyHeadChip};
use poseidon_circuit::{poseidon::{Pow5Chip, Pow5Config, Sponge, primitives::ConstantLengthIden3, PaddedWord}, Hashable};
use residual_block::{ResidualBlockChipParams, ResidualBlockConfig, ResidualBlockChipConfig, ResidualBlockChip};
use squeeze_excitation::SqueezeExcitationBlockChipParams;

use snark_verifier_sdk::CircuitExt;

pub static OUTPUT: OnceCell<Vec<Value<Fr>>> = OnceCell::new();
pub static HASH_INPUT: OnceCell<Value<Fr>> = OnceCell::new();
pub static HASH_OUTPUT: OnceCell<Value<Fr>> = OnceCell::new();
pub struct LeelaParams<F: FieldExt> {
    pub conv_block: ConvBlockChipParams<F>,
    pub residuals: [ResidualBlockChipParams<F>; 10],
    pub policy_head: PolicyHeadChipParams<F>,
}

#[derive(Clone, Debug)]
pub struct LeelaConfig<F: FieldExt> {
    pub output: Column<Instance>,
    pub input_advice: Column<Advice>,
    pub conv_block_chip: ConvBlockConfig<F>,
    pub residual_chip: ResidualBlockConfig<F>,
    pub policy_head_chip: PolicyHeadConfig<F>,
    pub range_table: DecompTable<F, DefaultDecomp>,
    pub hash_chip: Pow5Config<F, 3, 2>,
    pub input_unpacking_chip: InputUnpackingConfig
}

pub struct LeelaCircuit<F: FieldExt> {
    pub input: Array1<Value<F>>,
    pub params: LeelaParams<F>,
    pub input_hash: Option<F>,
    pub output_hash: Option<F>,
}

impl Circuit<Fr> for LeelaCircuit<Fr> {
    type Config = LeelaConfig<Fr>;

    type FloorPlanner = SimpleFloorPlanner;

    fn without_witnesses(&self) -> Self {
        let conv_params = Conv3DLayerParams {
            kernals: Array::from_shape_simple_fn((128, 3, 3, 128), Value::unknown),
        };
        let bn_params = BatchnormChipParams {
            scalars: Array::from_shape_simple_fn(128, || {
                (Value::unknown(), Value::unknown(), Value::unknown())
            }),
        };
        let conv_block = ConvBlockChipParams {
            conv_params: Conv3DLayerParams {
                kernals: Array::from_shape_simple_fn((112, 3, 3, 128), Value::unknown),
            },
            bn_params: bn_params.clone(),
        };

        let residuals = vec![
            ResidualBlockChipParams {
                conv_params: [conv_params.clone(), conv_params.clone()],
                bn_params: [bn_params.clone(), bn_params.clone()],
                se_params: SqueezeExcitationBlockChipParams {
                    fc_params: [
                        FcChipParams {
                            weights: Array::from_shape_vec((128, 32), vec![Value::unknown(); 32 * 128]).unwrap(),
                            biases: vec![Value::unknown(); 32].into()
                        },
                        FcChipParams {
                            weights: Array::from_shape_vec((32, 256), vec![Value::unknown(); 32 * 256]).unwrap(),
                            biases: vec![Value::unknown(); 256].into()
                        }
                    ]
                }
            };
            10
        ]
        .try_into()
        .unwrap();

        let policy_head = PolicyHeadChipParams {
            conv_1_params: conv_params,
            conv_2_params: Conv3DLayerParams {
                kernals: Array::from_shape_simple_fn((128, 3, 3, 80), Value::unknown),
            },
            bn_params,
            bias_params: DistributedAddFixedChipParams {
                scalars: Array::from_shape_simple_fn(80, Value::unknown),
            },
            gather_map: input_parsing::GATHER_MAP.to_vec().into(),
        };
        let leela_params = LeelaParams {
            conv_block,
            residuals,
            policy_head,
        };
        LeelaCircuit {
            input: Array::from_shape_simple_fn(112, Value::unknown),
            params: leela_params,
            input_hash: None,
            output_hash: None,
        }
    }

    fn configure(meta: &mut ConstraintSystem<Fr>) -> Self::Config {
        let mut advice_allocator = ColumnAllocator::<Advice>::new(meta, 0);
        let mut fixed_allocator = ColumnAllocator::<Fixed>::new(meta, 0);

        let range_table = DecompTable::<_, DefaultDecomp>::configure(meta);

        let conv_params = Conv3DLayerConfigParams { input_height: 8, input_width: 8, input_depth: 128, ker_height: 3, ker_width: 3, padding_width: 1, padding_height: 1, folding_factor: 16 };
        let conv_chip = Conv3DLayerChip::configure(meta, conv_params, &mut advice_allocator, &mut fixed_allocator);

        let bn_params = InputSizeConfig { input_height: 8, input_width: 8, input_depth: 128 };
        let bn_chip = BatchnormChip::configure(meta, bn_params, &mut advice_allocator, &mut fixed_allocator);

        let norm_params = Normalize2DChipConfig { input_height: 8, input_width: 8, input_depth: 128, range_table: range_table.clone() };
        let norm_chip = Normalize2dChip::configure(meta, norm_params, &mut advice_allocator, &mut fixed_allocator);

        let relu_params = ReluNorm2DChipConfig { input_height: 8, input_width: 8, input_depth: 128, range_table: range_table.clone() };
        let relu_chip = ReluNorm2DChip::configure(meta, relu_params, &mut advice_allocator, &mut fixed_allocator);

        let conv_block_params = ConvBlockChipConfig { norm_relu_chip: relu_chip.clone(), norm_chip: norm_chip.clone(), bn_chip: bn_chip.clone() };
        let conv_block_chip = ConvBlockChip::configure(meta, conv_block_params, &mut advice_allocator, &mut fixed_allocator);

        let residual_block_params = ResidualBlockChipConfig { norm_relu_chip: relu_chip.clone(), norm_chip: norm_chip.clone(), bn_chip: bn_chip.clone(), conv_chip: conv_chip.clone(), range_table: range_table.clone() };
        let residual_chip = ResidualBlockChip::configure(meta, residual_block_params, &mut advice_allocator, &mut fixed_allocator);

        let policy_head_params = PolicyHeadChipConfig { norm_relu_chip: relu_chip, norm_chip, bn_chip, conv_chip };
        let policy_head_chip = PolicyHeadChip::configure(meta, policy_head_params, &mut advice_allocator, &mut fixed_allocator);

        let input_unpacking_chip = InputUnpackingChip::configure(meta, (8, 8), &mut advice_allocator, &mut fixed_allocator);

        let input_advice = {let col = meta.advice_column(); meta.enable_equality(col); col};

        let state = (0..3).map(|_| meta.advice_column()).collect::<Vec<_>>();
        let partial_sbox = meta.advice_column();

        let rc_a = (0..3).map(|_| meta.fixed_column()).collect::<Vec<_>>();
        let rc_b = (0..3).map(|_| meta.fixed_column()).collect::<Vec<_>>();

        meta.enable_constant(rc_b[0]);

        let hash_chip = Pow5Chip::configure::<<Fr as Hashable>::SpecType>(meta, state.try_into().unwrap(), partial_sbox, rc_a.try_into().unwrap(), rc_b.try_into().unwrap());

        //println!("advice column count {}, fixed column count {}", meta.num_advice_columns(), meta.num_fixed_columns());

        LeelaConfig {
            output: {let col = meta.instance_column(); meta.enable_equality(col); col},
            input_advice,
            conv_block_chip,
            residual_chip,
            policy_head_chip,
            range_table,
            hash_chip,
            input_unpacking_chip,
        }
    }

    fn synthesize(
        &self,
        config: Self::Config,
        mut layouter: impl Layouter<Fr>,
    ) -> Result<(), PlonkError> {
        let conv_block_chip = ConvBlockChip::construct(config.conv_block_chip.clone());
        let residual_chip = ResidualBlockChip::construct(config.residual_chip.clone());
        let policy_head_chip = PolicyHeadChip::construct(config.policy_head_chip.clone());
        let input_unpacking_chip = InputUnpackingChip::construct(config.input_unpacking_chip.clone());

        config.range_table.layout(layouter.namespace(|| "range check lookup table"))?;

        let inputs = layouter.assign_region(|| "input assignment", |mut region| {
            let inputs: Result<Vec<_>, _> = self.input.iter().enumerate().map(|(row, &input)| {
                region.assign_advice(|| "copy input to advice", config.input_advice, row, || input)
            }).collect();
            Ok(Array::from_shape_vec(112, inputs?).unwrap())
        })?;

        //hash input
        {
            let mut inputs = inputs.iter();
            let initial_hash = {
                let chip = Pow5Chip::construct(config.hash_chip.clone());
                let mut sponge: Sponge<Fr, _, <Fr as Hashable>::SpecType, _, ConstantLengthIden3<2>, 3, 2> = Sponge::new(chip, layouter.namespace(|| "Poseidon Sponge"))?;
                sponge.absorb(layouter.namespace(|| "sponge 0 message 1"), PaddedWord::Message(inputs.next().unwrap().clone()))?;
                sponge.absorb(layouter.namespace(|| "sponge 0 message 2"), PaddedWord::Message(inputs.next().unwrap().clone()))?;
                sponge.finish_absorbing(layouter.namespace(|| "finish absorbing sponge 0"))?.squeeze(layouter.namespace(|| "sponge 0 output"))
            };

            let final_hash = inputs.enumerate().fold(initial_hash, |accum, (index, input)| {
                let chip = Pow5Chip::construct(config.hash_chip.clone());
                let mut sponge: Sponge<Fr, _, <Fr as Hashable>::SpecType, _, ConstantLengthIden3<2>, 3, 2> = Sponge::new(chip, layouter.namespace(|| format!("Poseidon Sponge {index}")))?;
                sponge.absorb(layouter.namespace(|| format!("sponge {index} message 1")), PaddedWord::Message(accum?))?;
                sponge.absorb(layouter.namespace(|| format!("sponge {index} message 2")), PaddedWord::Message(input.clone()))?;
                sponge.finish_absorbing(layouter.namespace(|| format!("finish absorbing sponge {index}")))?.squeeze(layouter.namespace(|| format!("sponge {index} output")))
            })?;

            layouter.constrain_instance(final_hash.cell(), config.output, 0)?;

            if let Some(_) = HASH_INPUT.get() {
            
            } else {
                HASH_INPUT.set(final_hash.value().map(|x| *x)).unwrap();
            }
    
        }

        let inputs = input_unpacking_chip.add_layer(&mut layouter, inputs, ())?;

        let conv_block_output = conv_block_chip.add_layer(&mut layouter, inputs, self.params.conv_block.clone());

        let residual_output = self.params.residuals.iter().enumerate().fold(conv_block_output, |accum, (_index, residual_params)| {
            residual_chip.add_layer(&mut layouter, accum?, residual_params.clone())
        })?;

        let output = policy_head_chip.add_layer(&mut layouter, residual_output, self.params.policy_head.clone())?;

        if let Some(_) = OUTPUT.get() {
            
        } else {
            OUTPUT.set(output.map(|x| x.value().map(|x| *x)).to_vec()).unwrap();
        }

        //hash output
        {
            let mut outputs = output.iter();
            let initial_hash = {
                let chip = Pow5Chip::construct(config.hash_chip.clone());
                let mut sponge: Sponge<Fr, _, <Fr as Hashable>::SpecType, _, ConstantLengthIden3<2>, 3, 2> = Sponge::new(chip, layouter.namespace(|| "Poseidon Sponge"))?;
                sponge.absorb(layouter.namespace(|| "sponge 0 message 1"), PaddedWord::Message(outputs.next().unwrap().clone()))?;
                sponge.absorb(layouter.namespace(|| "sponge 0 message 2"), PaddedWord::Message(outputs.next().unwrap().clone()))?;
                sponge.finish_absorbing(layouter.namespace(|| "finish absorbing sponge 0"))?.squeeze(layouter.namespace(|| "sponge 0 output"))
            };

            let final_hash = outputs.enumerate().fold(initial_hash, |accum, (index, input)| {
                let chip = Pow5Chip::construct(config.hash_chip.clone());
                let mut sponge: Sponge<Fr, _, <Fr as Hashable>::SpecType, _, ConstantLengthIden3<2>, 3, 2> = Sponge::new(chip, layouter.namespace(|| format!("Poseidon Sponge {index}")))?;
                sponge.absorb(layouter.namespace(|| format!("sponge {index} message 1")), PaddedWord::Message(accum?))?;
                sponge.absorb(layouter.namespace(|| format!("sponge {index} message 2")), PaddedWord::Message(input.clone()))?;
                sponge.finish_absorbing(layouter.namespace(|| format!("finish absorbing sponge {index}")))?.squeeze(layouter.namespace(|| format!("sponge {index} output")))
            })?;

            layouter.constrain_instance(final_hash.cell(), config.output, 1)?;

            if let Some(_) = HASH_OUTPUT.get() {
            
            } else {
                HASH_OUTPUT.set(final_hash.value().map(|x| *x)).unwrap();
            }
        }

        Ok(())
    }
}

impl CircuitExt<Fr> for LeelaCircuit<Fr> {
    fn num_instance(&self) -> Vec<usize> {
        vec![2]
    }

    fn instances(&self) -> Vec<Vec<Fr>> {
        //let input: Vec<_> = self.input.iter().map(|x| value_to_option(*x).unwrap()).collect();
        vec![vec![self.input_hash.unwrap(), self.output_hash.unwrap()]]
    }
}

#[cfg(test)]
mod tests {
    use std::iter;

    use halo2_machinelearning::{felt_from_i64, felt_to_i64};
    use halo2_base::halo2_proofs::{plonk::{Error as PlonkError}, circuit::{Value}, dev::MockProver, halo2curves::{bn256::Fr, group::ff::PrimeField}};
    use ndarray::{Array};

    use crate::{input_parsing::read_input, LeelaCircuit, OUTPUT};
    #[test]
    fn test_leela() -> Result<(), PlonkError> {
        const PREFIX: &str = "/home/aweso/leela_vs_world/zk_prover/";
        let params = read_input(PREFIX, "bgnet.json");

        let (input, output): (Vec<Fr>, Vec<Fr>) = {
            let inputs_raw = std::fs::read_to_string(PREFIX.to_owned() + "bgnet_intermediates_new.json").unwrap();
            let inputs = json::parse(&inputs_raw).unwrap();
            let input: Vec<_> = inputs["input"].members().map(|input| felt_from_i64(input.as_i64().unwrap())).collect();

            let outputs: Vec<_> = inputs["output"].members().map(|input| felt_from_i64(input.as_i64().unwrap())).collect();
            (input, outputs)
        };
        let input_values: Vec<_> = input.clone().into_iter().map(Value::known).collect();
        let input_array = Array::from_shape_vec(112, input_values).unwrap();


        let circuit = LeelaCircuit {
            input: input_array,
            params,
            input_hash: None,
            output_hash: None,
        };

        let input_instance = vec![input, output];

        let _prover = MockProver::run(17, &circuit, input_instance).unwrap();

        OUTPUT.get().unwrap().iter().map(|output| {
            output.map(felt_to_i64)
        }).enumerate().for_each(|(index, output_calc)| {
            println!("output calc for index {index} is {output_calc:?}");
        });


        // use plotters::prelude::*;
        // let root = BitMapBackend::new("leela_circuit.png", (1024, 3096)).into_drawing_area();
        // root.fill(&WHITE).unwrap();
        // let root = root.titled("leela_circuit", ("sans-serif", 60)).unwrap();
        // halo2_base::halo2_proofs::dev::CircuitLayout::default().render(17, &circuit, &root).unwrap();

        Ok(())

    }

    #[test]
    fn dumb() {
        let instances = [[Fr::one(), Fr::zero()]];
        let output: Vec<_> = iter::empty()
        .chain(
            instances
                .iter()
                .flatten()
                .flat_map(|value| value.to_repr().as_ref().iter().rev().cloned().collect::<Vec<_>>()),
        )
        .collect();

        println!("output raw: {output:?}");
    }
}