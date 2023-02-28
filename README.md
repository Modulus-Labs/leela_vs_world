# leela_vs_world
A repository for the Leela VS the World project for On-Chain machine learning

# Subdirectories
- contracts:
    Smart contracts to run the chess game and handle on-chain voting/betting
- frontend:
    Website to present chess game and allow interaction with the smart contract
- ml_model:
    Machine learning model which plays chess, and scripts to train/test model.
- zk_prover:
    Halo2 based zk prover for leela
"# **Leela Vs World Chess Game Hardhat Project**

This project implements a chess game for Leela Vs World

---

## **🛠️ Set Up**

[Installation]\
To install all the necessary packages, run the following command:

```shell
yarn install
```

\
[Environment Variables]\
Copy `.env.example` file and create a `.env` file with the variables filled in

---

## **🧪 Contract Interactions**

[Compiling]

```shell
npx hardhat compile
```

Note if you get a `configure additional compiler versions in your hardhat config` error,
add compiler versions to `hardhat.config`
<br></br>

[Deploying]

```shell
npx hardhat deploy
```

The --tags argument deploys contract(s) with the given tag(s).\
For example, the following command would deploy all contracts with the tag "testContract"

```shell
npx hardhat deploy --tags testContract
```

<br></br>
[Running Node Locally]

```shell
npx hardhat node
```

<br></br>
[Running Scripts]

```shell
npx hardhat run scripts/_PATH_TO_SCRIPT_
```

For example, the following command will run the script `testScript.ts` in the `scripts/` folder

```shell
npx hardhat run scripts/testScript.ts
```

<br></br>
[Testing]

```shell
npx hardhat test
```

The --grep argument matches any test that has the keywords specified.\
For example, the following command would run all tests that have the phrase "chess game"

```shell
npx hardhat test --grep "chess game"
```

<br/>

Global Optional Arguments

`--network`: Use network to explicitly state the network, default is hardhat/localhost\
For example the following command would run the script `testScript` on Goerli

```shell
npx hardhat run scripts/testScript.ts --network goerli
```

---

## **🚀 TestContract Example**

```shell
npx hardhat compile
```

```shell
npx hardhat deploy
```

```shell
npx hardhat run scripts/testScript.ts
```

```shell
npx hardhat test
```
"