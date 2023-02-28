import { BigNumber } from "ethers"
import { ethers, getNamedAccounts } from "hardhat"
import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { TestContract__factory } from "../typechain-types"
import { verify } from "../utils/verify"

const deployTestContract: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { network } = hre
    const { deployer } = await getNamedAccounts()

    console.log("Deploying TestContract on", network.name)

    const TestContractDeployFactory: TestContract__factory =
        await ethers.getContractFactory("TestContract", deployer)

    let args = BigNumber.from("10")

    const TestContractContract = await TestContractDeployFactory.deploy(args)

    console.log("Deployed TestContract to: ", TestContractContract.address)

    await verify(TestContractContract.address, [args])
}

export default deployTestContract
deployTestContract.tags = ["all", "testContract"]
