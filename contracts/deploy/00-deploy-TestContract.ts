import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { verify } from "../utils/verify"

const deployTestContract: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { deployments, getNamedAccounts, network } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    console.log("Deploying TestContract on ", network.name)

    let args: string[] = ["10"]

    const TestContractDeployResponse = await deploy("TestContract", {
        from: deployer,
        args,
        log: true,
        waitConfirmations: 1,
    })

    console.log(
        "Deployed TestContract to: ",
        TestContractDeployResponse.address
    )

    if (network.name !== "localhost" && network.name !== "hardhat") {
        await verify(TestContractDeployResponse.address, args)
    }
}

export default deployTestContract
deployTestContract.tags = ["all", "testContract"]
