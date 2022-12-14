// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UniqueToken is ERC20 {
    constructor() ERC20("Unique", "UQT") {
        _mint(msg.sender, 100000 * 1e18);
    }
}
