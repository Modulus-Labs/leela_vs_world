import { ethers } from "hardhat"
import { TestContract__factory } from "../typechain-types"

async function main() {
    const testContractFactory: TestContract__factory =
        await ethers.getContractFactory("TestContract")
    const testContract = await testContractFactory.deploy(10)

    await testContract.deployed()

    console.log("TestContract deployed to: ", testContract.address)

    const immutableTestUint = await testContract.IMMUTABLE_TEST_UINT()

    console.log(
        "IMMUTABLE_TEST_UINT test uint initialized to ",
        immutableTestUint.toString()
    )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
