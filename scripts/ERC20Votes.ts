import {ethers} from "hardhat";
import {MyToken__factory} from "../typechain-types";

const MINT_VALUE = ethers.parseUnits("1");
async function main() {
    const [deployer, acc1, acc2] = await ethers.getSigners();
    const contractFactory = new MyToken__factory(deployer);
    const contract = await contractFactory.deploy();
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log(`Token contract deployed at ${ contractAddress }`);

    // Mint some tokens
    console.log("\n** MINTING");
    console.log("----------------------------------------------------\n")
    const mintTx = await contract.mint(acc1.address, MINT_VALUE);
    await mintTx.wait();
    console.log(
        `Minted ${ MINT_VALUE.toString() } decimal units to account ${ acc1.address }\n`
    );
    const balanceBN = await contract.balanceOf(acc1.address);
    console.log(
        `Account ${ acc1.address
        } has ${ balanceBN.toString() } decimal units of MyToken\n`
    );
    console.log(
        `Account ${ acc1.address
        } has ${ ethers.formatUnits(balanceBN) } units of MyToken\n`
    );
    const votesInitial = await contract.getVotes(acc1.address);
    console.log(
        `Account ${ acc1.address } has ${ votesInitial.toString() } units of voting power\n`
    );

    console.log("\n** DELEGATE AND CHECK VOTING POWER (ACC1)");
    console.log("----------------------------------------------------\n")
    // Self delegate
    const delegateTx = await contract.connect(acc1).delegate(acc1.address);
    await delegateTx.wait();

    // Check the voting power
    const votes = await contract.getVotes(acc1.address);
    console.log(
        `Account ${ acc1.address } has ${ votes.toString() } units of voting power\n`
    );

    console.log("\n** TRANSFER TOKENS AND CHECK VOTING POWER (ACC1 & ACC2)");
    console.log("----------------------------------------------------\n")
    // Transfer tokens
    const transferTx = await contract
        .connect(acc1)
        .transfer(acc2.address, MINT_VALUE / 2n);
    await transferTx.wait();

    // Check the voting power of acc1
    const votes1AfterTransfer = await contract.getVotes(acc1.address);
    console.log(
        `Account ${ acc1.address
        } has ${ votes1AfterTransfer.toString() } units of voting power after transferring\n`
    );
    // Check the voting power of acc2
    const votes2AfterTransfer = await contract.getVotes(acc2.address);
    console.log(
        `Account ${ acc2.address
        } has ${ votes2AfterTransfer.toString() } units of voting power after receiving a transfer\n`
    );

    console.log("\n** CHECK PAST VOTING POWER (ACC1)");
    console.log("----------------------------------------------------\n")
    // Check past voting power
    const lastBlock = await ethers.provider.getBlock("latest");
    const lastBlockNumber = lastBlock?.number ?? 0;

    // can't look up current blocknumber with this function ( will throw an error )
    for (let index = lastBlockNumber - 1; index > 0; index--) {
        const pastVotes = await contract.getPastVotes(
            acc1.address,
            index
        );
        console.log(
            `Account ${ acc1.address
            } had ${ pastVotes.toString() } units of voting power at block ${ index }\n`
        );
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});