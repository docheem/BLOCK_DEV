// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

//import "@openzeppelin/contracts/access/Ownable.sol";
//import "@openzeppelin/contracts/token/ERC721/extensions/E\RC721Burnable.sol";
//import "@openzeppelin/contracts/token/ERC721/extensions/E\8RC721Enumerable.sol";


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




// ERC721Burnable allows us to destroy NFTs that have been redeemed.
// ERC721Enumerable allow us to list which NFTs belong to which owners.
// Ownable contract, which will allow us to enforce access control on sensitive functionality.
contract EscrowNFT is ERC721Burnable,ERC721Enumerable,Ownable {


  // counting how many we have created.
  uint256 public tokenCounter = 0;

  // stores information about each token created, the amount and minted time
  mapping(uint256 => uint256) public amount;
  mapping(uint256 => uint256) public matureTime;



  

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    }

  // The constructor is like the birth certificate for the contract. It gives a name ("EscrowNFT") and symbol ("ESCRW") to the NFTs created by this contract


    constructor() ERC721("EscrowNFT", "ESCRW") {}  // This is the correct constructor definition.

    modifier onlyOwner() {
        require(msg.sender == owner(), "Only the owner can call this function");
        _;
    }


    // This function allows the owner to create new NFTs by taking recipient's address, the amount of the token, and when it matures as inputs.
    
    function mint(address _recipient, uint256 _amount, uint256 _matureTime) public onlyOwner returns (uint256) {
      
      _mint(_recipient, tokenCounter);

      // set values
      amount[tokenCounter] = _amount;
      matureTime[tokenCounter] = _matureTime;

      //increment counter
      tokenCounter++;

      // return unique ID for the NFT created
      return tokenCounter - 1;
    
    }

    

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    

    
    // this view function is requesting informations about a token by using the tokenId
    function tokenDetails(uint256 _tokenId) public view returns (uint256, uint256) {

      // this line is making sure the token exist
      require(_exists(_tokenId), "EscrowNFT: Query for nonexistent token"); 

      // if token exists, we share info about it
      return(amount[_tokenId], matureTime[_tokenId]);
    }

    // this function will return contract address or tells you the address of the contract itself.
    function contractAddress() public view returns (address) {
      
      return address(this);
    }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    

    // When someone wants to send or move NFT, this function makes sure everything happens correctly
    function _beforeTokenTransfer(address _from, address _to, uint256 _amount) internal override(ERC721, ERC721Enumerable) { }

    // this function helps the smart contract tell others if it can               understand and work with specific languages or abilities
    function supportInterface(bytes4 _interfaceId) public viewvirtualoverride(ERC721,ERC721Enumerable) returns (bool) { }
    
    
  }





////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




// using functions and features from the "ownable" contract
contract Escrow is ownable {

  // keeping track of the "EscrowNFT
  EscrowNFT public escrowNFT;
  
  bool public initialized = false; 
  
  // This event announce that something was put in the escrow 
  // like who sent, received and amount involved
  event Escrowed(address _from, address _to, uint256 _amount, uint256 _matureTime);
  
  // This event is used to notify when something has been taken out of escrow or redeem
  event Redeemed(address _recipient, uint256 _amount);

  // This event signals when the contract has been set up or initialized.
  event Initialized(address _escrowNft);

  // modifier is used to check whether the contract has been initialized properly before allowing certain actions
  modifier isInitialized() {

    // checks if the "initialized" variable is "true.
    require(initialized, "Contract is not yet initialized");
    _;
  }

  

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  
  
  //Contract initializations, It checks if the contract has not been initialized yet,then initializes it with an EscrowNFT.
  function initialize(address _escrowNftAddress)external onlyOwner {

    // checks if the contract has not been initialized yet.
    require(!initialized, "Contract already initialized.");

    escrowNFT = escrowNFT(_escrowNftAddress);

    //indicating that the contract has already been initialized
    initialized = true;

    // Telling everyone that the contract have been initialized 
    emit Initialized(_escrowNftAddress);
  }

  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  
  
  // Now we will create a function that allow us to create Escrow NFT
  function escrowEth(address _recipient, uint256 _duration) external payable isInitialized {


    // checks if the person who wants to receive something (_recipient) is a real person with a proper address
    require(_recipient != address(0), "Cannot escrow to zero address");

    // we make sure the person pays at least a tiny bit of digital money (ETH)
    require(msg.value > 0, "cannot Escrow 0 ETH");

    // counting how much digital money (ETH) the person paid 
    uint256 amount = msg.value;

    // We figuring out when the NFT will be ready
    uint256 matureTime = block.timestamp + _duration;

    escrowNFT.mint(_recipient, amount, matureTime);

    // Telling everyone we put the NFT in a safe place
    emit Escrowed(msg.sender, 
                 _recipient,
                 amount,
                 matureTime);
  
  }


  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



  
  // Redemption Function
  // Creating a way for the recipient to redeem the fund in a matured NFT
  function redeemEthFromEscrow(uint256 _tokenId) external isInitialized {

    // This line check if the person redeeming the NFT is the owner
    require(escrowNFT.ownerOf(_tokenId) == msg.sender, "Must own token claim underlying Eth");

    // Asking the escrow to tell us how much is in the account and when it will be ready
    (uint256 amount, uint256 matureTime) = escrowNFT.tokenDetails(_tokenId);


    // We make sure that the time to wait (matureTime) is now or in the         past. If it's still in the future, we can't take out the money yet.
    require(matureTime <= block.timestamp, "Escrow period not expired.");

    // Burning the NFT
    escrowNFT.burn(_tokenId);


    // we send the NFT to the person who asked for it
    (bool success) = msg.sender.call{value: amount} ("");

    require(success, "Transfer failed")

    // Telling everyone, the NFT have been redeemed and the amount
    emit Redeemed(msg.sender, amount);
  }

  


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  
  
// implementing a function that redeem all mature token in user possession, instead asking them to specify the ID of the token they want to redeem


function redeemAllAvailableEth() external isInitialized {
  
  // Counting how many NFT a user have
  uint256 nftBalance = escrowNFT.balanceOf(msg.sender);
  
  // making sure the user have some NFT to open
  require(nftBalance > 0, "No escrow NFTs to redeem.");

  uint256 totalAmount = 0;
  
  // Going through each NFT one by one starting with the first one i = 0
  for (uint256 i = 0; i < nftBalance; i++) {
    
    // We find out which NFT we're looking at right now (the                    "tokenId") and get its special number
    uint256 tokenId = escrowNFT.tokenOfOwnerByIndex(msg.sender, i);


    // we ask the escrowNFT about the amount inside and when it will be         ready
    (uint256 amount, uint256 matureTime) = escrowNFT.tokenDetails(tokenId);

    // if the time to open it is now or in the past, we open it. if its in      the future, we do not
    if (matureTime <= block.timestamp) {

      // burb the NFT and take out the funds or Eth
      escrowNFT.burn(tokenId);

      // add the funds to our total amount
      totalAmount += amount;
      
    }
  }

  // Making sue that we collect money from the safe
  require(totalAmount > 0, "No ether to redeem.");

  // We give all the collected money (totalAmount) to the person who asked for it (msg.sender)
  (bool success, ) = msg.sender.call{value: totalAmount} ("");

  // also check if the transfer was a success
  require(success, "Transfer failed");

  // Finally, we tell everyone that the person has successfully collected their money from the escrow
  emit redeemed(msg.sender, totalAmount);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  
function contractAddress() public view returns (address) {
  return address(this);
}
}
