// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

interface IMyToken {
    function getPastVotes(address, uint256) external view returns (uint256);
}

contract TokenizedBallot {
    
    IMyToken tokenContract;
    uint256 public targetBlocknumber;

    struct Proposal {
        bytes32 name;   
        uint voteCount; 
    }
    Proposal[] public proposals;
    uint public ballotSize;

    mapping(address => uint256) public votingPowerSpent;
    
    constructor(bytes32[] memory proposalNames, address _tokenContract, uint256 _targetBlocknumber) {
        tokenContract = IMyToken(_tokenContract);
        targetBlocknumber = _targetBlocknumber;
        
        ballotSize = proposalNames.length;
        for (uint i = 0; i < proposalNames.length; i++) {    
            proposals.push(Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
        }
    }

    function vote(uint proposal, uint256 amount) external {
        require(votingPower(msg.sender) >= amount, "Insufficient voting power");

        votingPowerSpent[msg.sender] += amount;
        proposals[proposal].voteCount += amount;
    }

    function votingPower(address account) public view returns (uint256) {
        return tokenContract.getPastVotes(account, targetBlocknumber) - votingPowerSpent[account]; 
    }
    
    function winningProposal() public view
            returns (uint winningProposal_)
    {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }
    
    function winnerName() external view
            returns (bytes32 winnerName_)
    {
        winnerName_ = proposals[winningProposal()].name;
    }
}