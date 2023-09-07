// Each time we run the file, we want it to act as a different network node. 
// Let's do this by running the file on different ports every time we run it. 




//importing uuid to generate random addresses
const { v4: uuidv1 } = require('uuid');

const nodeAddress = uuidv1().split('-').join('');



// Read the configuration from config.json
//const config = require('/Users/diapp_eng/blockchain/dev/package.json');

// importing request promise library 
// will allow us to make requests to all the other nodes in our network.

//module.exports = rp;

const rp = require('request-promise');


//const rp = require('rp.js'); // or simply require('request-promise')



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//importing express.js
const express = require('express');

const app = express();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//importing body-parser
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//instantiating our blockchain
const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();
const port = process.argv[2];

// Get the current node's URL from command line arguments
// const currentNodeUrl = process.argv[5];



// const newNodeUrl = ['http://localhost:3001',
// 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005'];




// Accessing to the current node's URL
//const currentNodeUrl = process.argv[5];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const networkNodesUrl = [];

//Building the /blockchain endpoint, this endpoint
// will send our entire blockchain back to whoever call it
app.get('/blockchain', function (req, res) {

    res.send(bitcoin);
});





/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Think of this code as a place where someone can give an assistant a transaction to deliver
app.post('/transaction', function(req, res) {

    // the assistant put their tx in a special envelop to deliver
    const newTransaction = req.body;

    // the assistant take the Tx, find which block of the chain this tx should be on and 
    // adds it to a bigger list of things to check and agree upon
    const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);

    // the assistant send a message and tell on which page their tx will be
    res.json({ note: `My Lord Dochee, this transaction will be added in block ${blockIndex}.` });

    
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Imagine you have a special mailbox where you and your friends put exciting stories to share.
// This code is like instructions for a friendly mail carrier who helps make sure everyone knows about the stories.

// Whenever someone writes a new story and wants to share it, the mail carrier gets ready.
app.post('/transaction/broadcast', function(req, res) {

    // Imagine your friend writes a story about their amazing adventure and wants everyone to read it. They put the adventure details in an envelope.
    const newTransaction = bitcoin.createNewTransaction(
        req.body.amount, 
        req.body.sender, 
        req.body.recipient);
    
    // The mail carrier takes the adventure details in the envelope and puts it in their bag to deliver.
    bitcoin.addTransactionToPendingTransactions(newTransaction);

    // The mail carrier gets a list of all your friends' addresses to make sure everyone gets the story.
    const requestPromises = [];
    
    // The mail carrier goes to each friend's house and delivers the story by giving them the envelope.
    bitcoin.networkNodes.forEach(networkNodesUrl => {
        
        // The mail carrier uses each friend's address to reach their house and give them the envelope.
        const requestOptions = {

            // The friend's address (URL)
            uri: networkNodesUrl + '/transaction',
            
            // The mail carrier says it's delivering a message.
            method: 'POST',

            // The envelope with the adventure's details
            body: newTransaction,

            // The mail carrier speaks in a way that your friend can understand.
            json: true
        };

        // The mail carrier keeps a note to visit each friend's house and deliver the story.
        requestPromises.push(rp(requestOptions));

    });

    // The mail carrier visits each friend's house and delivers the story by giving them the envelope.
    // It waits until all friends have received the envelope before moving on.
    Promise.all(requestPromises)

    // After all friends have received the story, the mail carrier says, "Job well done! Everyone knows about the adventure now."
    .then(data => {

        // The mail carrier tells you that it's finished and the adventure is now known to everyone.
        res.json({ note: 'Transaction created and broadcast successfully.'})

    });
        
});



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////






// Building the /mine end point
// think of mining as a special place where we come to add new blocks as a miner
app.get('/mine', function(req, res) {

    // before the miner add new blocks, he look at the last block in the chain
    const lastBlock = bitcoin.getLastBlock();

    // The miner calculating and creating hashes for the new block with the previous block info
    const previousBlockHash = lastBlock['hash'];


    //to mine new block the miner need to do proofOfWork, its like solving a puzzle
    // he will get info from the last block and our new block
    const currentBlockData = {

        transactions: bitcoin.pendingTransactions,

        index: lastBlock['index'] + 1
    };
    


    // creating the new Hash
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);

    //the miner mix and use info gather to create a block hash
    const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);

    // Finally he is creating the new block after mining   
    // adding the new block after mining
    const newBlock = bitcoin.createNewBlock(nonce,previousBlockHash, blockHash);


    
    // put everything in a list
    const requestPromises = [];

    // now the miner is telling each person about the new block
    bitcoin.networkNodes.forEach(networkNodesUrl => {

        const requestOptions = {

            uri: networkNodesUrl + '/receive-new-block',
            method: 'POST',
            body: {newBlock: newBlock },
            json: true
        
        };

        // sending a message to everyone to tell them about the new block
        requestPromises.push(rp(requestOptions));


    })


    Promise.all(requestPromises)
    .then(data => {
        

        // paying our miner for soling this block
        const requestOptions = {
            
        uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
        
        method: 'POST',

        body: {
            amount: 12.5,
            sender:"00",
            recipient: nodeAddress
        
        },

        json: true
    
    };

    return rp(requestOptions);

})

// we wait for the miner to receive the reward and send a thank you message
.then(data => {


    // FInally we twll everyone about the new block
    res.json({

        note: "New block mined & broadcast successfully",

        block: newBlock
    });
});
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////c


app.post('/receive-new-block', function(req, res) {


    // new block being broadcast
    const newBlock = req.body.newBlock;


    // The network nodes will verify the new block by checking 
    // the previousBlockHash on the newBlock to make sure 
    //that it's equal to the hash on the last block in the chain
    const lastBlock = bitcoin.getLastBlock();


    // Testing if the hash of the last block in the chain is 
    // equal to the previousBlockHash in the newBlock 
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;

    // making sure the new block have the correct index
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

    // If the newBlock is legitimate, it should be accepted and added to the chain
    if(correctHash && correctIndex) {
        
        bitcoin.chain.push(newBlock);

        bitcoin.pendingTransactions = [];

        res.json({
            note: 'New block received and accepted.',
            newBlock: newBlock

            

        })

    // sending notes about the rejected block
    } else {
        res.json({

        note: 'New block rejected',

        newBlock: newBlock

        });
    }

});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Building the /register-and-broadcast-node endpoint
// This endpoint will register a node and broadcast that node to the whole network
app.post('/register-and-broadcast-node', function(req, res) {

    //getting the address of the new node that want to join the network
    const newNodeUrl = req.body.newNodeUrl;
    

    // the if statement is checking to see if the new nodes is a part of our network
    if (bitcoin.networkNodes.indexOf(newNodeUrl) === -1) {

        bitcoin.networkNodes.push(newNodeUrl);
    
    }
    
    
    
    const regNodesPromises = [];
    // telling everyone about the new node 
    // It's like telling all your friends to introduce your new friend to their friends.
    const networkNodesUrl = [];
    
    bitcoin.networkNodes.forEach(networkNodesUrl => {
        
        const requestOptions = {
            
            uri: `${networkNodesUrl}/register-node`,

            method: 'POST',

            body: { newNodeUrl: newNodeUrl },

            json: true
        };

        regNodesPromises.push(rp(requestOptions));
    });


    // we gather everyone info on the network and send it 
    // to the newNode to help him register faster
    Promise.all(regNodesPromises)

    .then(requestOptions => {
        
        const bulkRegisterOptions = {

        uri: newNodeUrl + '/register-nodes-bulk',

        method: 'POST',

        body: {allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]},

        json: true
    
    };
            
    //sending notes to confirm registration
    return rp(bulkRegisterOptions);

})
.then(data => {
    
    res.json({ note: 'New Node registered with network successfully' });



});

});



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////




// Building the /register-node endpoint
// this endpoint will register a node with the network
app.post('/register-node', function(req, res) {
    

    // Defining the newNodeUrl, This is the data 
    // that we send to the /register-node endpoint 
    const newNodeUrl = req.body.newNodeUrl;


    // we want to do is add newNodeUrl to our networkNodes array, 
    // if it doesn't already exist in that array
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;


    // we do not want to push the newNodeUrl into our networkNodes array if the newNodeUrl 
    // is actually the URL of the current node that we're on
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;



    // Registering the newNodeUrl variable with the node that received the request
    // we push the newNodeUrl into the current node's networkNodes array.
    if (nodeNotAlreadyPresent && notCurrentNode) {
        bitcoin.networkNodes.push(newNodeUrl);
    }
    

    // we are sending back response as usual
    res.json({ note: 'New node registered successfully.' });


});




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////





// Defining the /register-nodes-bulk endpoint
// this endpoint will register multiple nodes at once.
app.post('/register-nodes-bulk', function (req, res) {

    // giving the new node a list of the network to add
    const allNetworkNodes = req.body.allNetworkNodes;
    
    // we're checking to see if the our node is on the list
    allNetworkNodes.forEach(networkNodesUrl => {
        

        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodesUrl) == -1;

        // we do not want to push the newNodeUrl into our networkNodes array if the newNodeUrl 
        // is actually the URL of the current node that we're on
        const notCurrentNode = bitcoin.currentNodeUrl !== networkNodesUrl;

        // if we don't already have that node or friend on the list, we add them
        if (nodeNotAlreadyPresent && notCurrentNode) {

            bitcoin.networkNodes.push(networkNodesUrl);
        }
    });

    //sending notes back to the network
    res.json({ note: 'Bulk registration successful.' });
    
});




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////





// Building the /consensus endpoint
app.get('/consensus', function(req, res) {
    
    const requestPromises = [];

    // asking everyone about the blockchain
	bitcoin.networkNodes.forEach(networkNodeUrl => {

		const requestOptions = {

			uri: networkNodeUrl + '/blockchain',

			method: 'GET',

			json: true
		};
        
        // pushing everyone answers or requests to an array or in one place
		requestPromises.push(rp(requestOptions));
	});

    // waiting for everyone to answer 
	Promise.all(requestPromises)

	.then(blockchains => {

        // counting our chain
		const currentChainLength = bitcoin.chain.length;

        // keeping track of the longest chain find
		let maxChainLength = currentChainLength;


        // we will remember the longest chain and the new chain
		let newLongestChain = null;

		let newPendingTransactions = null;

        // Asking everyone about their chain to compare
		blockchains.forEach(blockchain => {

            // if everyone has longer chain than ours
			if (blockchain.chain.length > maxChainLength) {

                // we will take their longest chain
				maxChainLength = blockchain.chain.length;

				newLongestChain = blockchain.chain;

				newPendingTransactions = blockchain.pendingTransactions;
			};
		});

        // if we did not find the longest chain, then its not good, 
		if (!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))) {

			res.json({

				note: 'Current chain has not been replaced.',
				chain: bitcoin.chain
			});
		}

        // but if we found a longest chain
		else {

            // we will take the longest chain and make it ours
			bitcoin.chain = newLongestChain;
			bitcoin.pendingTransactions = newPendingTransactions;

			res.json({

				note: 'This chain has been replaced.',
				chain: bitcoin.chain

			});
		}
	});
});






/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Building the block explorer endpoint
// A specific blockHash will be sent with this endpoint, 
// which, as a result, will simply return to us the block 
// that the input of blockHash corresponds to
app.get('/block/:blockHash', function(req, res) {

    const blockHash = req.params.blockHash;

    const correctBlock = bitcoin.getLastBlock(blockHash);

    res.json({

        block: correctBlock
    });

});



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////




// Building the  /transaction/:transactionId endpoint
// With this endpoint, send a transactionId, and in the response, 
// we should expect to get the correct transaction that this ID corresponds to

//when someone ask to see details about a transaction
app.get('/transaction/:transactionId', function(req, res) {

    // get unique Id about the transaction
    // its like the person is saying, I would like to k ow about this transaction
    // with this transaction Id or a unique number
    const transactionId = req.params.transactionId;
    
    //now we look into the chain and find the block with the Tx Id they gave us
    const transactionData = bitcoin.getTransaction(transactionId);


    // we write down the Tx report on a paper and give it to them
    res.json({ 
        
        transaction: transactionData.transaction,
        
        block: transactionData.block

    });

});




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////





// This code helps us provide a report of all the Tx 
// exchanges involving a specific person or address

// when someone asks about a specific address history
app.get('/address/:address', function(req, res) {

    // we get hte address from the request
	const address = req.params.address;
    
    // we use function we created in blockchain.js to find 
    // info about the address in the blockchain
	const addressData = bitcoin.getAddressData(address);

    // we sent response 
	res.json({

        // and write down all the address history
		addressData: addressData
	});
});






/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// block explorer endpoint
app.get('/block-explorer', function(req, res) {
	res.sendFile('./block-explorer/index.html', { root: __dirname });


    



});






/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////









// The mail carrier also knows how to listen to messages from your friends. It keeps its special radio on the same station (port 3001).
app.listen(3000, function() {

    // The mail carrier turns on its radio and says, "I'm listening on channel 3001, friends can talk to me here!"
    console.log(`Listening on port 3000...`);
    
});




app.listen(3002);
app.listen(3003);

