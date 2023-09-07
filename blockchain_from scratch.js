const sha256 = require('sha256');

// Accessing to the current node's URL
const currentNodeUrl = process.argv[3];


// const uuid = require('uuid');
const { v4: uuidv1 } = require('uuid');






/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////




// Setting up our blockchain
function Blockchain() {

    this.chain = [];

    this.pendingTransactions = [];

    // adding the current node URL
    // to our blockchain data structure
    this.currentNodeUrl = this.networkNodesUrl;
    
    // we also want our blockchain to be aware of all
    // of the other nodes that are inside of our network.
    this.networkNodes = [];

    this.createNewBlock(100, '0', '0');
};




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////




// Implementing the create new block method
Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {

    const newBlock = {
        // number of block
        index: this.chain.length + 1,

        // date the block was made
        timestamp: Date.now(),

        // the transaction in the block
        transactions: this.pendingTransactions,

        // proof of the block that was created
        nonce: nonce,

        // hash of the current block
        hash: hash,

        // hash of the previous block
        previousBlockHash: previousBlockHash,
    };

    // Clear the transactions for the next block
    this.pendingTransactions = [];

    // Pushing the new block
    this.chain.push(newBlock);

    // Return the newBlock
    return newBlock;
};




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////





// This method will simply return the last or most recent block in our blockchain to us
Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1];
};




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////




// Creating new transaction
Blockchain.prototype.createNewTransaction = function (amount, sender, recipient) {

    const newTransaction = {

        amount: amount,
        
        sender: sender,

        recipient: recipient,

        // a unique code assigned to this transaction. It's like a special ID for your transaction
        transactionId: uuidv1().split('-').join(''),
    };

    return newTransaction;
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//  imagine there's a line of people waiting to get their transactions recorded in the blockchain. 
// This function helps put your transaction at the end of that line.
Blockchain.prototype.addTransactionToPendingTransactions = function (transactionObj) {

    this.pendingTransactions.push(transactionObj);

    // returned the index of the block to which the new transaction was added
    return this.getLastBlock().index + 1;

};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// hashing our blocks
// this code take the previous block hash, the current block hash and the nonce to create a new hash
Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {

    // Converting data to string and combining previous and current block data to make new hashes
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);

    // Creating our hash with sha256
    const hash = sha256(dataAsString);

    return hash;
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// Building proof of work method to get an acceptable generated hash
// that starts with four zeros
Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {

    // defining a nonce
    let nonce = 0;

    // hashing all of our data by using the above^ function (Blockchain.prototype.hashBlock), the hashblock method. 
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    // repeatedly hash our previousBlockHash,our currentBlockData, and a nonce
    // for a hash block that starts with four zeros
    while (hash.substring(0, 4) !== '0000') {

        // If the hash that we created does not start with four zeros,
        // we'll want to run our hash again, except this time with the different value of nonce
        nonce++;

        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

        // log out of every hash that we try
        // console.log(hash);
    }

    //return the nonce value that gave us the valid hash
    return nonce;

};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// Building the chain is valid method consensus algorithm

// This is a special inspector that checks if a chain of blocks (a blockchain) is valid.
Blockchain.prototype.chainIsValid = function(blockchain) {


    // We start thinking the chain is valid.
	let validChain = true;  
    
	// Now we go through each block in the chain one by one, starting from the second block.
	for (var i = 1; i < blockchain.length; i++) {
        

        // comparing the current block to the previous block
		const currentBlock = blockchain[i]; 
        
        // This is the block before the current one.
		const prevBlock = blockchain[i - 1];  
		
		// We use the hash block function from above to create a special code for the current block's contents.
		// Think of it like a lock that only opens if everything is correct.
		const blockHash = this.hashBlock(prevBlock['hash'], {

            transactions: currentBlock['transactions'], 

            index: currentBlock['index'] }, currentBlock['nonce']);
		
		// Now we check if the hash starts with four zeros. If it does, it means the block is good
		if (blockHash.substring(0, 4) !== '0000') {

            
			validChain = false;  
		
		// We also check if the current block points back to the right previous block.
		// It's like making sure each block is stacked on top of the right one.
		if (currentBlock['previousBlockHash'] !== prevBlock['hash']) {

			validChain = false;  
		}
	};

	// After checking all the blocks, we also need to make sure the very first block (genesis block) is perfect.
	const genesisBlock = blockchain[0];

	const correctNonce = genesisBlock['nonce'] === 100;
    
	const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';

	const correctHash = genesisBlock['hash'] === '0';


    // verify that the genesis block should have no transactions in it
	const correctTransactions = genesisBlock['transactions'].length === 0;


	// If any of these checks fail, then the whole chain is not valid.
	if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) {

		validChain = false;
	}

	// Finally, we decide if the entire chain is valid or not and return the result.
	return validChain;
};





/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////




// Building thr getBlock method
// this code help us find specific blocks in the chain
Blockchain.prototype.getBlock = function(blockHash) {


    // this is like a bookmark we're using to remember the correct block
    let correctBlock = null

    // looking at each block in the chain
    this.chain.forEach(block => {
        

        //if the block hashes matches the ones we're looking for 
        if(block.hash == blockHash) {
            
            // we found the right block and bookmark it
            correctBlock = block
        };
        
    });

    return correctBlock;

};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Building our Get transaction method
Blockchain.prototype.getTransaction = function(transactionId) {

    // this is like a bookmark to keep track
	let correctTransaction = null;
	let correctBlock = null;

    // looping through each block
	this.chain.forEach(block => {

        // going through each transaction on our blockchain
		block.transactions.forEach(transaction => {


            // if we find the Tx that matches our Tx Id
			if (transaction.transactionId === transactionId) {

                // we bookmark it
				correctTransaction = transaction;

				correctBlock = block;
			};
		});
	});

    // after we look through everything
	return {

        // We tell, which transaction we found
		transaction: correctTransaction,

        // and which block the transaction is on
		block: correctBlock
	};
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// we'll use this method inside of the /address/:address endpoint in network,js file to 
// fetch the data for a specific address that we are searching for

// A special function that helps us find information about an address in the blockchain
Blockchain.prototype.getAddressData = function(address) {

    // We start with an empty list to collect transactions related to the address
    const addressTransactions = [];

    // For each block in the blockchain
    this.chain.forEach(block => {

        // Inside each block, we look at each transaction
        block.transactions.forEach(transaction => {

            // If the sender or receiver of the transaction matches the given address
            if (transaction.sender === address || transaction.recipient === address) {

                // We add this transaction to our list
                addressTransactions.push(transaction);
            }
        });
    });

    // We start with a balance of 0
    let balance = 0;

    // For each transaction related to the address
    addressTransactions.forEach(transaction => {

        // If the address received funds in this transaction
        if (transaction.recipient === address) {

            // We add the funds to the balance
            balance += transaction.amount;
        }

        // If the address sent funds in this transaction
        else if (transaction.sender === address) {

            // We subtract the candies from the balance
            balance -= transaction.amount;
        }
    });

    // We prepare the information to be given back to the person who asked
    return {

        // List of all related transaction
        addressTransactions: addressTransactions, 


        // The total candies the address has
        addressBalance: balance 
    };
};



};




module.exports = Blockchain;
