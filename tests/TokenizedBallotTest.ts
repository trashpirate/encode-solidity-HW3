import {expect} from "chai";
import {ethers} from "hardhat";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {MyToken, TokenizedBallot} from "../typechain-types";
import {HardhatEthersSigner} from "@nomicfoundation/hardhat-ethers/signers";
import {AddressLike} from "ethers";

const MINT_VALUE = ethers.parseUnits("100");
const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];
const BLOCK_NUMBER = 1;
let tokenContractAddress: AddressLike;

// manual way of converting stirng into bytes32
function convertStringArrayToBytes32(array: string[]) {
    const bytes32Array = [];
    for (let index = 0; index < array.length; index++) {
        bytes32Array.push(ethers.encodeBytes32String(array[index]));
    }
    return bytes32Array;
}

// function to deploy token contract
async function deployTokenContract() {
    const tokenFactory = await ethers.getContractFactory("MyToken");
    const tokenContract = await tokenFactory.deploy();
    await tokenContract.waitForDeployment();
    return tokenContract;
}

// function to deploy ballot contract
async function deployBallotContract() {
    const ballotFactory = await ethers.getContractFactory("TokenizedBallot");
    const lastBlock = await ethers.provider.getBlock("latest");
    const lastBlockNumber = lastBlock?.number ?? 0;
    const ballotContract = await ballotFactory.deploy(
        convertStringArrayToBytes32(PROPOSALS), tokenContractAddress, lastBlockNumber
    );
    await ballotContract.waitForDeployment();
    return ballotContract;
}


describe("TokenizedBallot", async () => {
    let tokenContract: MyToken;
    let ballotContract: TokenizedBallot;
    let deployer: HardhatEthersSigner, acc1: HardhatEthersSigner, acc2: HardhatEthersSigner;

    beforeEach(async () => {
        [deployer, acc1, acc2] = await ethers.getSigners();

        tokenContract = await loadFixture(deployTokenContract);
        tokenContractAddress = await tokenContract.getAddress();
        // console.log(`Token contract deployed at ${ tokenContractAddress }`);

        // Mint tokens
        const mintTx = await tokenContract.mint(acc1.address, MINT_VALUE);
        await mintTx.wait();

        // Transfer tokens
        const transferTx = await tokenContract
            .connect(acc1)
            .transfer(acc2.address, MINT_VALUE / 2n);
        await transferTx.wait();

        // Account 1: Self delegate
        const delegateTx1 = await tokenContract.connect(acc1).delegate(acc1.address);
        await delegateTx1.wait();

        // Account 2: Self delegate
        const delegateTx2 = await tokenContract.connect(acc2).delegate(acc2.address);
        await delegateTx2.wait();

        // // should go in each test because of block number TODO!
        // ballotContract = await loadFixture(deployBallotContract);

    });
    describe("when the contract is deployed", async () => {
        beforeEach(async () => {
            ballotContract = await loadFixture(deployBallotContract);
        });

        it("has the provided proposals", async () => {
            for (let index = 0; index < PROPOSALS.length; index++) {
                const proposal = await ballotContract.proposals(index);
                expect(ethers.decodeBytes32String(proposal.name)).to.eq(PROPOSALS[index]);
            }

        });

        it("has the provided ballot size", async () => {
            const ballotSize = await ballotContract.ballotSize();
            expect(ballotSize).to.be.eq(PROPOSALS.length);
        });

        it("has zero votes for all proposals", async () => {
            for (let index = 0; index < PROPOSALS.length; index++) {
                const proposal = await ballotContract.proposals(index);
                expect(proposal.voteCount).to.eq(0n); // n is for big number
            }
        });
    });

    describe("when the voter interacts with the vote function in the contract", async () => {
        it("should register the vote", async () => {
            ballotContract = await loadFixture(deployBallotContract);
            const voteProposal = 1;
            const amount = 50;
            const votingPowerBefore = ethers.formatUnits(await ballotContract.votingPower(acc1.address));
            await ballotContract.connect(acc1).vote(voteProposal, ethers.parseUnits(amount.toString()));
            const votingPowerAfter = ethers.formatUnits(await ballotContract.votingPower(acc1.address));
            expect(Number(votingPowerAfter)).to.eq((Number(votingPowerBefore) - amount));
            expect((await ballotContract.proposals(voteProposal)).voteCount).to.be.eq(ethers.parseUnits("50"));
        });
    });

    describe("when the voter interacts with the delegate function in the contract", async () => {
        it("should transfer voting power", async () => {
            const delegateTx = await tokenContract.connect(acc1).delegate(acc2.address);
            await delegateTx.wait();
            ballotContract = await loadFixture(deployBallotContract);
            const votingPower1 = Number(ethers.formatUnits(await ballotContract.votingPower(acc1.address)));
            expect(votingPower1).to.be.eq(0);
            const votingPower2 = Number(ethers.formatUnits(await ballotContract.votingPower(acc2.address)));
            expect(votingPower2).to.be.eq(100);
        });
    });

    describe("when retrieving the voting results", async () => {
        const voteProposal = 1;
        const amount = 50;
        beforeEach(async () => {
            ballotContract = await loadFixture(deployBallotContract);

            await ballotContract.connect(acc1).vote(voteProposal, ethers.parseUnits(amount.toString()));
        });
        it("should give winning proposal", async () => {
            const winner = await ballotContract.winningProposal();
            expect(winner).to.be.eq(1n);
        });

        it("should give winning proposal name", async () => {
            const winnerName = await ballotContract.winnerName();
            expect(ethers.decodeBytes32String(winnerName)).to.be.eq(PROPOSALS[voteProposal]);
        });

    });

});