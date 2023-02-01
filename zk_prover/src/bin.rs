

use std::{time::Instant, path::Path};

use halo2_machinelearning::{felt_from_i64, felt_to_i64};
use halo2_base::{halo2_proofs::{plonk::{Error as PlonkError, keygen_vk, keygen_pk, create_proof, verify_proof}, circuit::Value, halo2curves::bn256::{Fr, Bn256}, poly::{commitment::{ParamsProver, Params}, kzg::{commitment::ParamsKZG, multiopen::{ProverSHPLONK, VerifierSHPLONK}, strategy::SingleStrategy}}, dev::MockProver, transcript::{Challenge255, Blake2bWrite, Blake2bRead, TranscriptReadBuffer, TranscriptWriterBuffer}}, utils::value_to_option};
use ndarray::{Array};

use leela_circuit::{input_parsing::read_input, LeelaCircuit, OUTPUT};
use rand::rngs::OsRng;
use snark_verifier_sdk::{halo2::{gen_snark, gen_snark_shplonk, aggregation::PublicAggregationCircuit}, CircuitExt};

//use snark_verifier_sdk::halo2::gen_snark;



fn main() -> Result<(), PlonkError> {
    const PREFIX: &str = "/home/ubuntu/leela_zk/";
    let params = read_input(PREFIX, "bgnet.json");

    let (input): (Vec<Fr>) = {
        let inputs_raw = std::fs::read_to_string(PREFIX.to_owned() + "bgnet_intermediates_new.json").unwrap();
        let inputs = json::parse(&inputs_raw).unwrap();
        let input: Vec<_> = inputs["input"].members().map(|input| felt_from_i64(input.as_i64().unwrap())).collect();

        // let outputs: Vec<_> = inputs["output"].members().map(|input| felt_from_i64(input.as_i64().unwrap())).collect();
        (input)
    };
    let input_values: Vec<_> = input.clone().into_iter().map(Value::known).collect();
    let input_array = Array::from_shape_vec((112, 8, 8), input_values).unwrap();


    let mut circuit = LeelaCircuit {
        input: input_array,
        params,
        output: vec![]
    };

    let mock = {
        let input_instance = vec![input.clone(), vec![]];

        let prover = MockProver::run(18, &circuit, input_instance).unwrap();
        
        // OUTPUT.get().unwrap().iter().map(|output| {
        //     output.map(|x| felt_to_i64(x))
        // }).enumerate().for_each(|(index, output_calc)| {
        //     println!("output calc for index {} is {:?}", index, output_calc);
        // });

    };

    let output: Vec<_> = OUTPUT.get().unwrap().iter().map(|output| {
        value_to_option(*output).unwrap()
    }).collect();

    circuit.output = output.clone();

    let now = Instant::now();

    let params_max: ParamsKZG<Bn256> = ParamsProver::new(24);
    let snark = {
        let params = {
            let mut params = params_max.clone();
            params.downsize(18);
            params
        };

        println!("params generated in {}", now.elapsed().as_secs_f32());

        let now = Instant::now();

        let vk = keygen_vk(&params, &circuit).unwrap();

        println!("vk generated in {}", now.elapsed().as_secs_f32());

        let now = Instant::now();

        let pk = keygen_pk(&params, vk, &circuit).unwrap();

        println!("pk generated in {}", now.elapsed().as_secs_f32());

        let now = Instant::now();

        gen_snark_shplonk(&params, &pk, circuit, &mut OsRng, None::<Box<Path>>)
    };
    println!("inner snark generated in {}", now.elapsed().as_secs_f32());

    let mut transcript = Blake2bWrite::<_, _, Challenge255<_>>::init(vec![]);


    let agg_circuit = PublicAggregationCircuit::new(&params_max, vec![snark], false, &mut OsRng);

    let vk_agg = keygen_vk(&params_max, &agg_circuit).unwrap();

    println!("vk_agg generated in {}", now.elapsed().as_secs_f32());

    let now = Instant::now();

    let pk_agg = keygen_pk(&params_max, vk_agg, &agg_circuit).unwrap();

    println!("pk_agg generated in {}", now.elapsed().as_secs_f32());

    let now = Instant::now();

    println!("starting proof!");

    let binding = agg_circuit.instances();

    let instance_vec = binding.iter().map(|x| x.as_slice()).collect::<Vec<_>>();

    let instances = instance_vec.as_slice();

    create_proof::<_, ProverSHPLONK<Bn256>, _, _, _, _>(
        &params_max,
        &pk_agg,
        &[agg_circuit],
        &[instances],
        OsRng,
        &mut transcript,
    )?;

    println!("outer proof generated in {}", now.elapsed().as_secs_f32());

    let proof = transcript.finalize();
    //println!("{:?}", proof);
    let now = Instant::now();
    let strategy = SingleStrategy::new(&params_max);
    let mut transcript = Blake2bRead::<_, _, Challenge255<_>>::init(&proof[..]);

    verify_proof::<_, VerifierSHPLONK<Bn256>, _, _, _>(
        &params_max,
        pk_agg.get_vk(),
        strategy,
        &[instances],
        &mut transcript,
    )?;
    println!("Verification took {}", now.elapsed().as_secs());

    // use plotters::prelude::*;
    // let root = BitMapBackend::new("leela_circuit.png", (1024*4, 3096*4)).into_drawing_area();
    // root.fill(&WHITE).unwrap();
    // let root = root.titled("leela_circuit", ("sans-serif", 60)).unwrap();
    // halo2_base::halo2_proofs::dev::CircuitLayout::default().render(17, &circuit, &root).unwrap();

    println!("Done!");
    Ok(())

}