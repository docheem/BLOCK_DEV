//SPDX-License-Identifier:MIT
pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./LCMaster.sol";

contract LC {


    // (struct) called "LoC" to write down 
    // important details about a bank deal
    struct LoC {

        // LC number
        uint LCNo;

        // Buyer's Ethereum account address
        address BuyerAcc;

        // seller's Ethereum account address
        address SellerAcc;

        // Amount available in escrow
        uint Amount;

        // Initial amount stored to escrow
        uint IniAmount;

        // Current status of the LC 
        bytes2 Status;

        // contract issue date
        uint DOIssue;

        // contract expiration date
        uint DOExpiry;

        // Hash of the document submitted by the Seller during settlement
        bytes32 DocHash;
        
        }

        LoC LCnew;




        LCMaster LCM; 

        ERC20 public ERC20Interface;

        address bank;

        
        // When we start a new bank deal, this part is like filling out the form with all the important details
        constructor (uint LCNum, address BAcc, address SAcc, uint Amt, uint DOI, uint DOE, address bankadd) public {
            
            bank = bankadd;

            LCnew.LCNo = LCNum;

            LCnew.BuyerAcc = BAcc;

            LCnew.SellerAcc = SAcc;

            LCnew.Amount = Amt;

            // escrow amount
            LCnew.IniAmount = Amt;

            LCnew.Status = 'I' ; // I - Issued, S - Settled, P - Partially Settled

            LCnew.DOIssue = DOI;

            LCnew.DOExpiry = DOE;

            // Default Hash value—No Document submitted yet
            LCnew.DocHash = 0x0;

            // We tell the program who the owner is 
            // (the one who starts the deal) and what tool to use for money (ERC20)
            LCM = LCMaster(msg.sender);

            ERC20Interface = ERC20(0x0357B7E560260945c62b99C002eFC4f5B149eC2a);
            
            }

            // checking to see if the buyer or the seller is authorize
            modifier onlyAuth {

                // Only the bank, buyer, or seller can do certain things. Others are not allowed.
                if (msg.sender!=bank && msg.sender!=LCnew.BuyerAcc && msg.sender!=LCnew.SellerAcc) revert();

                _;
                }

             // This modification is only for the seller,
             // Only the seller can ask for settlement (closing the deal).
            modifier onlySeller {

                 if (msg.sender!=LCnew.SellerAcc) revert();
                 
                 _;
                 
                 }
    // Triggered when a settlement request is processed 
    // successfully and funds are transferred to the Seller's account
    event SettleLCSuccessful(

        // LC #
        uint LCNum,

        // the Seller's account from which the settlement request was made.
        address SAcc,

        // amount asked for settlement
        uint Amt,

        // initial amount
        uint IAmt,

        //status of LC
        bytes2 Stat,

        // document hash provided for verification during settlement
        bytes32 DocH
        );

    // This function lets authorized people (bank, buyer, or seller) look at the details of the bank deal.
    function viewLCdetails() public onlyAuth view returns (uint, address, address, uint, uint, bytes2, uint, uint, bytes32) {

        return ( 

            // LC number
            LCnew.LCNo,

            // Buyer's Ethereum account address
            LCnew.BuyerAcc,

            // Seller's Ethereum account address 
            LCnew.SellerAcc,

            // Amount available in escrow 
            LCnew.Amount,

            // Initial amount stored to escrow
            LCnew.IniAmount,

            // Current status of the LC (I—Issued, P—Partially Settled, S—Settled)
            LCnew.Status,

            // date contract was issued
            LCnew.DOIssue,

            // expiration date
            LCnew.DOExpiry,

            // Hash of the document submitted by the Seller during settlement
            LCnew.DocHash
            
            );
            
            }


    // invoked by the Seller during a settlement request
function settleLC(uint SettleAmt, bytes32 DocH) public onlySeller {

    // Putting two require statements in place to ensure that our LC contract is valid
    // We check if the request is made within the deal's dates and
    require(LCnew.DOExpiry >= now && now >= LCnew.DOIssue, "LC Expired or Invalid Date of Issue");
    
    // Check to see if the settlement amount is valid
    require(SettleAmt > 0 && SettleAmt <= LCnew.Amount , "Invalid Settlement Amount"); 

    // If not, we update the deal as "Partially Settled" and transfer some money.
    if (SettleAmt == LCnew.Amount) {

        LCnew.Amount = 0;
        LCnew.Status = 'S';
        LCnew.DocHash = DocH;

        ERC20Interface.transfer(msg.sender, SettleAmt);

        LCM.modifyLC(LCnew.LCNo, 0, 'S');
        
        // Announcing that we have made some changes
        emit SettleLCSuccessful(LCnew.LCNo,
        
            // The Seller's Ethereum account to which the funds were transferred 
             LCnew.SellerAcc,

             // The current funds in the escrow
             LCnew.Amount,

             // The initial funds in the escrow
             LCnew.IniAmount,

             // Status of the LC
             LCnew.Status,

             // The hash of the document submitted for settlement
             LCnew.DocHash);
    }
    else {
        // We're calculating the remaining amount of money in the bank deal after the settlement.
        uint currAmt = LCnew.Amount - SettleAmt;
        LCnew.Amount = currAmt;
        LCnew.Status = 'P';
        LCnew.DocHash = DocH;
        
        // We're transferring the settlement amount (`SettleAmt`) to the person who requested it (`msg.sender`).
        ERC20Interface.transfer(msg.sender, SettleAmt);
        
        // We're telling the LCMaster contract (a higher-level contract) to modify the bank deal with a new status 'P' (Partially Settled) and the remaining amount (`currAmt`).
        LCM.modifyLC(LCnew.LCNo, currAmt, 'P');

        // Announcing the successful partial settlement of the LC
        emit SettleLCSuccessful(LCnew.LCNo, LCnew.SellerAcc, LCnew.Amount, LCnew.IniAmount, LCnew.Status, LCnew.DocHash);
    }
}
}