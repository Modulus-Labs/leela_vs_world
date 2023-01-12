import { ethers, getNamedAccounts } from "hardhat"
import { ChessTest } from "../typechain-types"

async function main() {
    console.log("---testChessScript---")
    const signer = (await getNamedAccounts())[0]
    const TestChessContract: ChessTest = await ethers.getContractAt(
        "ChessTest",
        "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        signer
    )

    console.log("Move pawn")
    const movePawnResponse = await TestChessContract.callStatic.movePawn()
    await TestChessContract.movePawn()

    console.log("movePawnResponse: ", movePawnResponse.toHexString())
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
