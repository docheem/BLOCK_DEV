//SPDX-License-Identifier: MIT

pragma solidity ^0.5.2;



import "./LC.sol";

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";



// Creating an LC Master smart contract


// defining the contract
contract LCMaster {
    
    struct LCData {

        // LC #
        uint LCNo;

        // the buyer address
        address BuyerAcc;

        //the seller address
        address SellerAcc;

        //Amount kept in escrow
        uint Amount;

        // Current status of the LC 
        // (I—Issued, P—Partially Settled, S—Settled)
        bytes2 status;

        // date contract was issued
        uint DOIssue;

        // expiration date
        uint DOExpiry;

        // address where the contract have been deployed
        address LCAddress;
        
        }

        // an array to capture the contract info above
        LCData[] LCDoc;

        // parameters to capture the owner's address 
        address owner;
        ERC20 public ERC20Interface;


    // Defining LC successful event
    // Think of events as announcements that a new LC contract is created successfully
    // or announcement that something important has happened  
    event CreateLCSuccessful (

        // LC number
        uint LCNum,

        // seller ether account
        address SAcc, 

         // buyer ether account
        address BAcc,

        // anount kept in escrow
        uint Amt,

        // LC status
        bytes2 Stat,

        // issue date
        uint DOI,

        // expiration date
        uint DOE,

        // Ethereum address to 
        // where the LC smart contract is deployed (LCAdd)
        address LCAdd
        
        );

    // ModifyLCSuccessful, is called whenever the LC is successfully modified externally
     event ModifyLCSuccessful (
            uint LCNum,
            address SAcc,
            address BAcc,
            uint Amt,
            bytes2 Stat
            );

    // this method allow only the contract owner to access 
    // certain method into our contract
    modifier onlyOwner {

        // this part check if the person thats 
        // trying to execute the contract is the owner
        if (msg.sender != owner) revert();
        
        // if it is the owner, let it be
        _;
        
        }

    // Owner promise to pay, if people buys
    // this code allow owner to transfer and receive assets
    constructor () public payable {

        owner = msg.sender;

        // Owner keeps trcks of everyone who purchase
        // in a notebook
        LCDoc.length = 1;
        
        }



    function createLC(address BAcc, address SAcc,uint Amt, uint DOE) public onlyOwner returns (uint) {
        
        // creating a brand new promise note 
        LC newLC = new LC(LCDoc.length, BAcc, SAcc, Amt, now, DOE, owner);

        // Special way to pay the note by transfering funds in USD to the newly minted contract
        ERC20Interface = ERC20(0x0357B7E560260945c62b99C002eFC4f5B149eC2a);

        // using our specialk way to pay to and transfer funds
        ERC20Interface.transfer(address(newLC), Amt);


        // here we are recording our promissory notes
        // we're saying, Let's add a new entry to our promissory notebook or array (LCDoc) with some details
        LCDoc.push(LCData(LCDoc.length, BAcc, SAcc, Amt, 'I', now, DOE, address(newLC)));

        // Announcing the successful creation of a new promissory note (LC) 
        // and sharing some details about it.
        emit CreateLCSuccessful(LCDoc[LCDoc.length-1].LCNo,
            LCDoc[LCDoc.length-1].SellerAcc,
            LCDoc[LCDoc.length-1].BuyerAcc,
            LCDoc[LCDoc.length-1].Amount,
            LCDoc[LCDoc.length-1].status,
            LCDoc[LCDoc.length-1].DOIssue,
            LCDoc[LCDoc.length-1].DOExpiry,
            LCDoc[LCDoc.length-1].LCAddress);
        
        // Finally, the contract returns the LC number of the newly minted LC to the requestor
        return LCDoc[LCDoc.length-1].LCNo;
    }
    
    // getting the number of LC issued by the LC Master smart contract
    function lengthLC() public view returns (uint) {

        return LCDoc.length;
    }

    // functions that returns details about our smart contract,
    // first verifies if the requestor is the bank or the Buyer or 
    // Seller for whom the contract is issued. Only then does it return the details of the contract.
    function viewLC(uint viewLCNo) public view returns (address,address, uint, bytes2, uint, uint, address) {
        
        if(msg.sender == owner || msg.sender == LCDoc[viewLCNo].SellerAcc || msg.sender == LCDoc[viewLCNo].BuyerAcc) {
            
            return (
                
                LCDoc[viewLCNo].SellerAcc,
                LCDoc[viewLCNo].BuyerAcc,
                LCDoc[viewLCNo].Amount,
                LCDoc[viewLCNo].status,
                LCDoc[viewLCNo].DOIssue,
                LCDoc[viewLCNo].DOExpiry,
                LCDoc[viewLCNo].LCAddress
                );
                
                }
                }


    // Sometimes we need to change things in our LC deals, thi function helps us do that
    function modifyLC(uint LCNum, uint SettleAmt, bytes2 Stat) public {
        
        LCData memory Temp;
        Temp = LCDoc[LCNum];
        Temp.status = Stat;
        Temp.Amount = SettleAmt;
        delete LCDoc[LCNum];
        LCDoc[LCNum] = Temp; 
        
        // announcing to everyone that we have made some changes to our LC bank deal
        emit ModifyLCSuccessful (
            LCDoc[LCNum].LCNo, 
            LCDoc[LCNum].SellerAcc, 
            LCDoc[LCNum].BuyerAcc, 
            LCDoc[LCNum].Amount, 
            LCDoc[LCNum].status
            
            );
                    
    }

}
