# BLOCK_DEV
Blockchain development using Javascript, Python, and solidity

We have coded a Blockchain in Javascript from scratch using Node.js, express.js, body-parser, Postmate, UUID, sha256, and more.

- We have built an NFT escrow contract on the Ethereum blockchain with solidity

- Mainly, we built a letter of credit Master Smart Contract for a Bank that will issue new LC agreements between parties and manage these agreements/contracts on the blockchain. It will be invoked by the bank entity each time it needs to issue a new LC. On being invoked to issue a new LC, the LC Master contract will create and deploy a new LC smart contract on the blockchain. The LC Master contract will also allocate the funds to the new LC contract on the blockchain. The newly minted LC will disburse these funds when the LC is settled. The LC Master also keeps track of all the LCs issued and their current status.

- We build a Letter of Credit Smart Contract for Buyer and Seller, This contract will serve as an interface for issuing new LCs. Functionality-wise, it is a template that the bank will use for issuing LC contracts. For each contract, the bank will just need to change the contract parameters, and then use this template to create and float the new agreement. Concerning the actual implementation, every time a new LC smart contract needs to be created, the LC Master smart contract will use this contract interface to create and deploy the new agreement.


In this repo you will also find the following:

- Exploratory Data analysis (EDA) on BTC
- Blockchain API programming
- Implementation of Chain Validations and Replacement
- Implementation of a Cryptocurrency called B-coin
- Implementation of proof of work (PoW)
- Implementation of a multi-signature Bitcoin address
- Implementation of Public and Private key generation
  
