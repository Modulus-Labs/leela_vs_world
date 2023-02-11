use halo2_base::halo2_proofs::{halo2curves::{FieldExt, bn256::Fr, group::ff::PrimeField}, circuit::{self, Value, SimpleFloorPlanner, Layouter}, plonk::{Circuit, ConstraintSystem, Error as PlonkError, Column, Instance, Advice}, dev::MockProver};
use poseidon_circuit::{poseidon::{primitives::{ConstantLengthIden3, Absorbing, Domain, ConstantLength, VariableLengthIden3}, Pow5Chip, Pow5Config, Hash, Sponge, PaddedWord, PoseidonSpongeInstructions, StateWord, PoseidonInstructions}, Hashable};
#[derive(Debug, Clone)]
struct PoseidonTestConfig<F: FieldExt + Hashable> {
    input: Column<Instance>,
    output: Column<Instance>,
    input_advice: Column<Advice>,
    poseidon_chip: Pow5Config<F, 3, 2>,
}

struct PoseidonTestCircuit<F: FieldExt> {
    pub input: [Value<F>; INPUT_WIDTH]
}

const INPUT_WIDTH: usize = 3;

impl<F: FieldExt + Hashable> Circuit<F> for PoseidonTestCircuit<F> {
    type Config = PoseidonTestConfig<F>;

    type FloorPlanner = SimpleFloorPlanner;

    fn without_witnesses(&self) -> Self {
        Self {
            input: [Value::unknown(); INPUT_WIDTH]
        }
    }

    fn configure(meta: &mut ConstraintSystem<F>) -> Self::Config {
        let state = (0..3).map(|_| meta.advice_column()).collect::<Vec<_>>();
        let partial_sbox = meta.advice_column();

        let rc_a = (0..3).map(|_| meta.fixed_column()).collect::<Vec<_>>();
        let rc_b = (0..3).map(|_| meta.fixed_column()).collect::<Vec<_>>();

        meta.enable_constant(rc_b[0]);

        let poseidon_chip = Pow5Chip::configure::<<F as Hashable>::SpecType>(meta, state.try_into().unwrap(), partial_sbox, rc_a.try_into().unwrap(), rc_b.try_into().unwrap());
        PoseidonTestConfig {
            input:{
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
            poseidon_chip,
        }
    }

    fn synthesize(&self, config: Self::Config, mut layouter: impl Layouter<F>) -> Result<(), PlonkError> {
        let chip = Pow5Chip::construct(config.poseidon_chip.clone());
        let chip2 = Pow5Chip::construct(config.poseidon_chip);
        let mut sponge: Sponge<F, _, <F as Hashable>::SpecType, _, ConstantLengthIden3<2>, 3, 2> = Sponge::new(chip, layouter.namespace(|| "Poseidon Sponge"))?;
        let inputs = layouter.assign_region(|| "assign inputs" , |mut region| {
            (0..INPUT_WIDTH).map(|index| region.assign_advice_from_instance(|| "load input", config.input, index, config.input_advice, index)).collect::<Result<Vec<_>, _>>()})?;
        println!("input 1: {:?} input 2: {:?}", inputs[0].value(), inputs[1].value());
        sponge.absorb(layouter.namespace(|| "message 1"), PaddedWord::Message(inputs[0].clone()))?;
        sponge.absorb(layouter.namespace(|| "message 2"), PaddedWord::Message(inputs[1].clone()))?;
        //sponge.absorb(layouter.namespace(|| "thing"), PaddedWord::Message(inputs[2].clone()))?;
        // <ConstantLengthIden3<2> as Domain<F, 2>>::padding(INPUT_WIDTH).for_each(|x| {
        //     println!("blah");
        //     sponge.absorb(layouter.namespace(|| "padding"), PaddedWord::Padding(x)).unwrap();
        // });
        //sponge.absorb(layouter.namespace(|| "padding"), PaddedWord::Padding(F::zero())).unwrap();
        let mut output_sponge = sponge.finish_absorbing(layouter.namespace(|| "finish sponge absorption"))?;
        let output = output_sponge.squeeze(layouter.namespace(|| "final squeeze"))?;

        let mut sponge: Sponge<F, _, <F as Hashable>::SpecType, _, ConstantLengthIden3<2>, 3, 2> = Sponge::new(chip2, layouter.namespace(|| "Poseidon Sponge"))?;
        sponge.absorb(layouter.namespace(|| "old hash"), PaddedWord::Message(output))?;
        sponge.absorb(layouter.namespace(|| "blah"), PaddedWord::Message(inputs[2].clone()))?;

        let mut output_sponge = sponge.finish_absorbing(layouter.namespace(|| "finish sponge absorption"))?;
        let output = output_sponge.squeeze(layouter.namespace(|| "final squeeze"))?;

        // let initial_state = [StateWord::from(inputs[0].clone()), StateWord::from(inputs[1].clone()), StateWord::from(inputs[0].clone())];
        // let final_state = <Pow5Chip<_, 3, 2> as PoseidonInstructions<F, <F as Hashable>::SpecType, 3 ,2>>::permute(&chip, &mut layouter, &initial_state)?;
        // println!("output_1 is {:?}, output 2: {:?}, output 3: {:?}", final_state[0], final_state[1], final_state[2]);
        println!("output is {:?}", output.value());
        //layouter.constrain_instance(output.cell(), config.output, 0)?;
        Ok(())
    }
}

fn main() {

    let circuit = PoseidonTestCircuit {
        input: [Value::known(Fr::from(1)), Value::known(Fr::from(1)), Value::known(Fr::from(2))]
    };

    println!("calc output is {:?}", Fr::hasher().hash([Fr::one(), Fr::one()]));

    MockProver::run(8, &circuit, vec![vec![Fr::from(1), Fr::from(1), Fr::from(2)], vec![Fr::from_str_vartime("19928211794257771485102269587486881376606572650317269981454285080979503847156").unwrap()]]).unwrap().assert_satisfied();

}