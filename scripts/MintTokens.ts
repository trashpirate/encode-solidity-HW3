import {ethers} from "ethers";
import {MyToken__factory} from "../typechain-types";
import {MyToken} from "../typechain-types";
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    const args = process.argv.slice(2);
    const contractAddress = args[0];
    const minterAddress = args[1];
    const mintValue = ethers.parseUnits(args[2]);
    console.log(`Contract Address: ${ contractAddress }`);
    console.log(`Voter Address: ${ contractAddress }`);

    const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT_URL ?? "");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEYS?.split(',')[0] ?? "", provider);

    console.log(`Using address ${ wallet.address }`);
    const balanceBN = await provider.getBalance(wallet.address);
    const balance = Number(ethers.formatUnits(balanceBN));
    console.log(`Wallet balance ${ balance }`);
    if (balance < 0.01) {
        throw new Error("Not enough ether");
    }

    const tokenFactory = new MyToken__factory(wallet);
    const tokenContract = tokenFactory.attach(contractAddress) as MyToken;
    const tx = await tokenContract.mint(minterAddress, mintValue);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});