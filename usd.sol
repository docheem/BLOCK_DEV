//SPDX-License-Identifier:MIT

pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Capped.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


// Define the contract USD and inherit the aforementioned contracts
contract USD is ERC20Detailed, ERC20Capped, Ownable {

    
    constructor()

    // Defining the name, symbols and decimals of the contract
    ERC20Detailed("US Dollar", "USD", 2)

    // Settignthe limit of the USD 
    ERC20Capped(10000000000)

    // Think of minters as people who are here to help you
    MinterRole()

    // this is like a jar for people to pay us
    payable public {}

}

