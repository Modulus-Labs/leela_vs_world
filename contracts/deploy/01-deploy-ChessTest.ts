import { ethers } from "hardhat"
import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { ChessTest__factory } from "../typechain-types"
import { verify } from "../utils/verify"

const deployChessTest: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { network } = hre
    // const { deployer } = await getNamedAccounts()

    console.log("Deploying ChessTest on", network.name)

    const ChessTestDeployFactory: ChessTest__factory =
        await ethers.getContractFactory("ChessTest")

    let args: string[] = []

    const ChessTestContract = await ChessTestDeployFactory.deploy()

    console.log("Deployed ChessTest to: ", ChessTestContract.address)

    await verify(ChessTestContract.address, args)
}

export default deployChessTest
deployChessTest.tags = ["all", "ChessTest"]
