// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error Faucet__InsufficiantTokensBalance();
error Faucet__InsufficiantEtherBalance();
error Faucet__TokensWithdrawLocked();
error Faucet__EtherWithdrawLocked();
error Faucet__NotTheOwner();
error Faucet__TransferFailed();

contract Faucet {
    IERC20 private i_token;
    address private i_owner;

    uint256 private s_lockInterval;
    uint256 private s_tokensPerWithdraw;
    uint256 private s_etherPerWithdraw;

    mapping(address => uint256) s_nextPossibleTokensWithdraw;
    mapping(address => uint256) s_nextPossibleEtherWithdraw;

    event EtherClaimed(address _account, uint256 _amount);
    event TokensClaimed(address _account, uint256 _amount);

    constructor(
        address _token,
        uint256 _lockInterval,
        uint256 _tokensPerWithdraw,
        uint256 _etherPerWithdraw
    ) {
        i_token = IERC20(_token);
        i_owner = msg.sender;
        s_lockInterval = _lockInterval;
        s_tokensPerWithdraw = _tokensPerWithdraw;
        s_etherPerWithdraw = _etherPerWithdraw;
    }

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert Faucet__NotTheOwner();
        }
        _;
    }

    function claimTokens() external {
        if (s_tokensPerWithdraw > i_token.balanceOf(address(this))) {
            revert Faucet__InsufficiantTokensBalance();
        }
        if (s_nextPossibleTokensWithdraw[msg.sender] > block.timestamp) {
            revert Faucet__TokensWithdrawLocked();
        }
        s_nextPossibleTokensWithdraw[msg.sender] =
            block.timestamp +
            s_lockInterval;

        i_token.transfer(msg.sender, s_tokensPerWithdraw);
        emit TokensClaimed(msg.sender, s_tokensPerWithdraw);
    }

    function claimEther() external {
        if (s_etherPerWithdraw > address(this).balance) {
            revert Faucet__InsufficiantEtherBalance();
        }
        if (s_nextPossibleEtherWithdraw[msg.sender] > block.timestamp) {
            revert Faucet__EtherWithdrawLocked();
        }
        s_nextPossibleEtherWithdraw[msg.sender] =
            block.timestamp +
            s_lockInterval;

        (bool success, ) = msg.sender.call{value: s_etherPerWithdraw}("");

        if (!success) {
            revert Faucet__TransferFailed();
        }

        emit EtherClaimed(msg.sender, s_etherPerWithdraw);
    }

    function withdrawTokens() external onlyOwner {
        uint256 balance = i_token.balanceOf(address(this));
        i_token.transfer(msg.sender, balance);
    }

    function withdrawEther() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = msg.sender.call{value: balance}("");
        if (!success) {
            revert Faucet__TransferFailed();
        }
    }

    function setLockInterval(uint256 _lockInterval) external onlyOwner {
        s_lockInterval = _lockInterval;
    }

    function setTokensPerWithdraw(uint256 _amount) external onlyOwner {
        s_tokensPerWithdraw = _amount;
    }

    function setEtherPerWithdraw(uint256 _amount) external onlyOwner {
        s_etherPerWithdraw = _amount;
    }

    receive() external payable {}

    function getLockInterval() external view returns (uint256) {
        return s_lockInterval;
    }

    function getTokensPerWithdraw() external view returns (uint256) {
        return s_tokensPerWithdraw;
    }

    function getEtherPerWithdraw() external view returns (uint256) {
        return s_etherPerWithdraw;
    }

    function getNextPossibleTokenWithdraw(address _account)
        external
        view
        returns (uint256)
    {
        return s_nextPossibleTokensWithdraw[_account];
    }

    function getNextPossibleEtherWithdraw(address _account)
        external
        view
        returns (uint256)
    {
        return s_nextPossibleEtherWithdraw[_account];
    }
}
