import { network, run } from "hardhat"

export const verify = async (contractAddress: string, args: any[]) => {
    console.log("Verifying contract...")

    if (network.name === "hardhat") {
        console.log("No need to verify, on hardhat network")
        return
    }

    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
        console.log("Contract verified!")
    } catch (error: any) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!")
        } else {
            console.log(error)
        }
    }
}
