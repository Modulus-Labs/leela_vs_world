

use std::{time::Instant, path::Path, fs::{self, File}, io::Write, iter};

use std::env::{set_var, var};

use halo2_machinelearning::{felt_from_i64, felt_to_i64};
use halo2_base::{halo2_proofs::{plonk::{Circuit, Error as PlonkError, keygen_vk, keygen_pk, create_proof, verify_proof}, circuit::Value, halo2curves::{bn256::{Fr, Bn256}, FieldExt, group::ff::PrimeField}, poly::{commitment::{ParamsProver, Params}, kzg::{commitment::ParamsKZG, multiopen::{ProverSHPLONK, VerifierSHPLONK, VerifierGWC}, strategy::SingleStrategy}}, dev::MockProver, transcript::{Challenge255, Blake2bWrite, Blake2bRead, TranscriptReadBuffer, TranscriptWriterBuffer}}, utils::{value_to_option, fs::gen_srs}};
use ndarray::{Array, Axis};

use leela_circuit::{input_parsing::read_input, LeelaCircuit, OUTPUT, HASH_INPUT, HASH_OUTPUT};
use rand::{rngs::OsRng, SeedableRng};
use rand_chacha::ChaCha20Rng;
use snark_verifier_sdk::{halo2::{gen_snark, gen_snark_shplonk, aggregation::PublicAggregationCircuit, gen_snark_gwc, gen_proof_shplonk, PoseidonTranscript, gen_proof_gwc}, CircuitExt, evm::{gen_evm_proof_gwc, gen_evm_verifier_gwc, evm_verify, gen_evm_proof_shplonk, gen_evm_verifier_shplonk, encode_calldata}, NativeLoader};

//use snark_verifier_sdk::halo2::gen_snark;



fn main() -> Result<(), PlonkError> {
    const PREFIX: &str = "";
    set_var("VERIFY_CONFIG", "./configs/verify_circuit.config");
    let params = read_input(PREFIX, "./bgnet.json");
    let mut rng = ChaCha20Rng::from_entropy();


    let input: Vec<Fr> = {
        let inputs_raw = std::fs::read_to_string(PREFIX.to_owned() + "./proof_dir/leelaInputs.json").unwrap();
        let inputs = json::parse(&inputs_raw).unwrap();
        inputs.members().map(|input| Fr::from_str_vartime(input.as_str().unwrap()).unwrap()).collect()

        // let input = Array::from_shape_vec((112, 8, 8), input).unwrap();

        // input.axis_iter(Axis(0)).map(|layer| {
        //     let out = layer.iter().enumerate().fold(0_i128, |accum, (row, item)| {
        //         accum + ((item/1_048_576) as i128 * 2_i128.pow(row as u32))
        //     });

        //     Fr::from_u128(out as u128)
        // }).collect()

        // let outputs: Vec<_> = inputs["output"].members().map(|input| felt_from_i64(input.as_i64().unwrap())).collect();
    };
    let input_values: Vec<_> = input.clone().into_iter().map(Value::known).collect();
    let input_array = Array::from_shape_vec(112, input_values).unwrap();

    let mut circuit = LeelaCircuit {
        input: input_array,
        params,
        input_hash: None,
        output_hash: None,
    };

    let mock = {
        let input_instance = vec![vec![Fr::one(), Fr::one()]];

        let prover = MockProver::run(20, &circuit, input_instance).unwrap();
        
        // OUTPUT.get().unwrap().iter().map(|output| {
        //     output.map(|x| felt_to_i64(x))
        // }).enumerate().for_each(|(index, output_calc)| {
        //     println!("output calc for index {} is {:?}", index, output_calc);
        // });

    };

    let output: Vec<_> = OUTPUT.get().unwrap().iter().map(|output| {
        felt_to_i64(value_to_option(*output).unwrap())
    }).collect();

    let mut f = File::create("./proof_dir/calc_output.json")?;

    json::from(output).write(&mut f)?;

    let input_hash = value_to_option(*HASH_INPUT.get().unwrap()).unwrap();
    let output_hash = value_to_option(*HASH_OUTPUT.get().unwrap()).unwrap();

    println!("output hash is {:?}", output_hash);

    // let now = Instant::now();

    // MockProver::run(20, &circuit, vec![vec![input_hash, output_hash]]).unwrap().assert_satisfied();

    // println!("mock prover satisfied in {}", now.elapsed().as_secs_f32());

    circuit.input_hash = Some(input_hash);
    circuit.output_hash = Some(output_hash);


    let params_max: ParamsKZG<Bn256> = gen_srs(24);

    let snark = {
        let now = Instant::now();

        let params = {
            let mut params = params_max.clone();
            params.downsize(20);
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

        let out = gen_snark_shplonk(&params, &pk, circuit, &mut rng, None::<Box<Path>>);
        println!("inner snark generated in {}", now.elapsed().as_secs_f32());
        out
    };

    let agg_circuit = PublicAggregationCircuit::new(&params_max, vec![snark], false, &mut rng);

    let now = Instant::now();

    let vk_agg = keygen_vk(&params_max, &agg_circuit).unwrap();

    println!("vk_agg generated in {}", now.elapsed().as_secs_f32());

    let now = Instant::now();

    let pk_agg = keygen_pk(&params_max, vk_agg, &agg_circuit).unwrap();

    println!("pk_agg generated in {}", now.elapsed().as_secs_f32());

    let now = Instant::now();

    let proof = gen_evm_proof_shplonk(&params_max, &pk_agg, agg_circuit.clone(), agg_circuit.instances(), &mut rng);

    let mut f = File::create("./proof_dir/proof")?;

    f.write_all(proof.as_slice()).unwrap();

    println!("outer proof generated in {}", now.elapsed().as_secs_f32());

    let verifier_contract = gen_evm_verifier_shplonk::<PublicAggregationCircuit>(&params_max, pk_agg.get_vk(), agg_circuit.num_instance(), None);

    let mut f = File::create("./proof_dir/verifier_contract_bytecode")?;

    f.write_all(verifier_contract.as_slice()).unwrap();

    println!("contract len: {:?}", verifier_contract.len());

    println!("instances are {:?}, instance_len is {:?}, proof len is {:?}", agg_circuit.instances(), agg_circuit.num_instance(), proof.len());
    
    let calldata = encode_calldata(&agg_circuit.instances(), &proof);

    let mut f = File::create("./proof_dir/official_calldata")?;

    f.write_all(calldata.as_slice()).unwrap();
    
    evm_verify(verifier_contract, agg_circuit.instances(), proof);

    let instances = &agg_circuit.instances()[0][0..12];

    let instances_output: Vec<_> = instances.iter().flat_map(|value| value.to_repr().as_ref().iter().rev().cloned().collect::<Vec<_>>()).collect();

    let mut f = File::create("./proof_dir/limbs_instance")?;

    f.write_all(instances_output.as_slice()).unwrap();

    println!("Done!");
    Ok(())

}