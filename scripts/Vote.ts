import {encodeBytes32String} from "ethers";
import {ethers} from "ethers";
import {TokenizedBallot__factory} from "../typechain-types";
import {TokenizedBallot} from "../typechain-types";
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    const args = process.argv.slice(2);
    const contractAddress = args[0];
    const votedPropsal = args[1];
    const votedAmount = ethers.parseUnits(args[2]);
    let accountNumber: number = +args[3];
    console.log(`Vote on Ballot contract: ${ contractAddress }`);

    const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT_URL ?? "");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEYS?.split(',')[accountNumber] ?? "", provider);

    console.log(`Using address ${ wallet.address }`);
    const balanceBN = await provider.getBalance(wallet.address);
    const balance = Number(ethers.formatUnits(balanceBN));
    console.log(`Wallet balance ${ balance }`);
    if (balance < 0.01) {
        throw new Error("Not enough ether");
    }

    const ballotFactory = new TokenizedBallot__factory(wallet);
    const ballotContract = ballotFactory.attach(contractAddress) as TokenizedBallot;
    const tx = await ballotContract.vote(votedPropsal, votedAmount);
    await tx.wait();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});