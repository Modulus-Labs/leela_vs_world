import { assert, expect } from "chai"
import { deployments, ethers, getNamedAccounts } from "hardhat"
import { TestContract } from "../typechain-types"

describe("TestContract", function () {
    let testContract: TestContract
    let deployer: string

    // Deploy the contracts before each set of tests
    beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer

        // Run all deploy scripts with the "all" tag
        await deployments.fixture("all")
        testContract = await ethers.getContractAt("TestContract", deployer)
    })

    describe("testUint", function () {
        it("starts at 0", async function () {
            const testUint = await testContract.getTestUint()
            // Use assert.equal for simple assertions of equality
            assert.equal(testUint.toString(), "0")
        })

        it("increments by exactly 1", async function () {
            const prevTestUint = await testContract.getTestUint()
            // Use expect().to.emit(contract, "event name") when testing events
            await expect(testContract.incrementTestUint()).to.emit(
                testContract,
                "IncrementedTestUint"
            )
            const newTestUint = await testContract.getTestUint()
            assert.equal(newTestUint.sub(prevTestUint).toString(), "1")
        })

        describe("decrementTestUint", function () {
            it("errors when uint is at 0", async function () {
                const prevTestUint = await testContract.getTestUint()
                assert.equal(prevTestUint.toString(), "0")

                // Use expect().to.be.revertedWith("reason") when testing for reverting
                await expect(
                    testContract.decrementTestUint()
                ).to.be.revertedWith("testUint is 0")
            })

            it("decrements by exactly 1", async function () {
                await testContract.incrementTestUint()
                const prevTestUint = await testContract.getTestUint()
                await testContract.decrementTestUint()
                const newTestUint = await testContract.getTestUint()
                assert.equal(prevTestUint.sub(newTestUint).toString(), "1")
            })
        })
    })
})
