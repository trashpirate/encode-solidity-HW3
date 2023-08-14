import {ethers} from "ethers";
import {MyToken__factory} from "../typechain-types";
import {MyToken} from "../typechain-types";
import * as dotenv from 'dotenv';
import {token} from "../typechain-types/@openzeppelin/contracts";
dotenv.config();

async function main() {
    const args = process.argv.slice(2);
    const contractAddress = args[0];
    const receiverAddress = args[1];
    const accountNumber = Number(args[2]);
    const tokenAmount = ethers.parseUnits(args[3]);

    console.log(`Contract Address: ${ contractAddress }`);
    console.log(`Receiver Address: ${ receiverAddress }`);

    const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT_URL ?? "");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEYS?.split(',')[accountNumber] ?? "", provider);

    console.log(`Using address ${ wallet.address }`);
    const balanceBN = await provider.getBalance(wallet.address);
    const balance = Number(ethers.formatUnits(balanceBN));
    console.log(`Wallet balance ${ balance }`);
    if (balance < 0.01) {
        throw new Error("Not enough ether");
    }

    const tokenFactory = new MyToken__factory(wallet);
    const tokenContract = tokenFactory.attach(contractAddress) as MyToken;

    // Transfer tokens
    const transferTx = await tokenContract.transfer(receiverAddress, tokenAmount);
    await transferTx.wait();

    // Check the voting power acc1
    const votes1 = await tokenContract.getVotes(wallet.address);
    console.log(
        `Account ${ wallet.address } has ${ votes1.toString() } units of voting power`
    );

    // Check the voting power acc1
    const votes2 = await tokenContract.getVotes(receiverAddress);
    console.log(
        `Account ${ receiverAddress } has ${ votes2.toString() } units of voting power`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});