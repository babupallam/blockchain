//building server
const express =require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const uuid = require('uuid/v1');
const nodeAddress = uuid().split('-').join('');//'' - empty string
const port = process.argv[2];
/*Process.argv takes node start script witten in package.json file
start : "array "
*/

const rp = require('request-promise');//library for request making

//import Blockchain
const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();

app.get('/blockchain',function(req,res){
  //res.send("Hello world");
  res.send(bitcoin);
});

app.post('/transaction',function(req,res){
  const newTransaction = req.body;
  const blockIndex = bitcoin.addTransactionToPendingTransaction(newTransaction);
  res.json({note: `Transaction will be added to the block ${blockIndex}.`});
});
app.post('/transaction/broadcast',function(req,res){
  //creating new transaction
  const newTransaction = bitcoin.createNewTransaction(req.body.amount,req.body.sender,req.body.recipient);
  bitcoin.addTransactionToPendingTransaction(newTransaction);
  const requestPromises = [];
  //broadcast the transaction
  bitcoin.networkNodes.forEach(networkNodeUrl=>{
    const requestOptions ={
      url: networkNodeUrl + '/transaction',
      method:'POST',
      body: newTransaction,
      json: true
    };
    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
  .then(data =>{
    res.json({note:'Transaction created and broadcast successfully'})
  });

});

app.get('/mine',function(req,res){ //creating new block
  const lastBlock = bitcoin.getLastBlock();
  const previousBlockHash = lastBlock['hash'];
  const currentBlockData = {
    transactions: bitcoin.pendingTransactions,
    index: lastBlock['index'] + 1
  };
  const nonce = bitcoin.proofOfWork(previousBlockHash,currentBlockData);
  const blockHash = bitcoin.hashBlock(previousBlockHash,currentBlockData,nonce);
  bitcoin.createNewTransaction(12.5,"00",nodeAddress);//"00" indicate coinbase transaction
  const newBlock = bitcoin.createNewBlock(nonce,previousBlockHash,blockHash);
  const requestPromises=[];
  bitcoin.networkNodes.forEach(networkNodeUrl =>{
    const requestOptions = {
      url: networkNodeUrl +'/receive-new-block',
      method: 'POST',
      body: {newBlock: newBlock},
      json: true
    };
    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
  .then(data =>{
    const requestOptions = {
      url: bitcoin.currentNodeurl + '/transaction/broadcast',
      method: 'POST',
      body: {
        amount: 12.5,
        sender: "00",
        recipient: nodeAddress
      },
      json: true
    };
    return rp(requestOptions);
  })
  .then(data => {
    res.json({
      note: "New block mined  and broadcast successfully",
      block: newBlock
    });
  });
});

app.post('/receive-new-block',function(req,res){
  const newBlock = req.body.newBlock;
  const lastBlock = bitcoin.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock['index'] + 1 === newBlock['index'];
  if(correctHash && correctIndex){
    bitcoin.chain.push(newBlock);
    bitcoin.pendingTransactions = [];
    res.json({
      note: 'New block is received and accepted',
      newBlock: newBlock
    });
  }else{
    res.json({
      note: 'New block is rejected',
      newBlock: newBlock
    });
  }
});

//making decentralized network..........................................

// 1) register a node and broadcast it with in the network
app.post('/register-and-broadcast-node',function(req,res){
  const newNodeUrl = req.body.newNodeUrl;
  //if new node url is already present in node list array,do nothing,else add it.
  if(bitcoin.networkNodes.indexOf(newNodeUrl)==-1)
    bitcoin.networkNodes.push(newNodeUrl);
  const regNodesPromises = [];

  bitcoin.networkNodes.forEach(networkNodeUrl =>{
    //register node endpoints.
    const requestOptions = {
      url: networkNodeUrl + '/register-node',
      method: 'POST',
      body: {newNodeUrl: newNodeUrl},
      json: true
    };
    regNodesPromises.push(rp(requestOptions));
  });

  Promise.all(regNodesPromises)
  .then(data => {
    //use info of all other nodes in the network to new node;
    const bulkRegisterOptions = {
      url: newNodeUrl + '/register-nodes-bulk',
      method: 'POST',
      body:{allNetworkNodes:[ ...bitcoin.networkNodes,bitcoin.currentNodeurl ] },
      json: true
    };
    return rp(bulkRegisterOptions);
  })
  .then(data =>{
      //after successfull sending of second one
    res.json({note: 'New node registered with network successfully. '});
  });
});
// 2) register a node with the network
app.post('/register-node',function(req,res){
  const newNodeUrl =req.body.newNodeUrl;
  const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl)==-1;
  const notCurrentNode = bitcoin.currentNodeurl !== newNodeUrl;
  if(nodeNotAlreadyPresent && notCurrentNode)
    bitcoin.networkNodes.push(newNodeUrl);
  res.json({note:'New node registered with network successfully.'});
});
// 3) register multiple nodes at once.
app.post('/register-nodes-bulk',function(req,res){
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach(networkNodeUrl => {
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeurl !==networkNodeUrl;
    if(nodeNotAlreadyPresent && notCurrentNode)
      bitcoin.networkNodes.push(networkNodeUrl);
  });
  res.json({ note :'Bulk registration is successfull.'});
});

/*How these three differ.
  when new node need to register it send request to one node in the
  network(nightbour).Upon the request from new node,a node which is already in
  the network,will initiate the registration process by invoking (1).
  by (1),the node will broadcast to all in the network.all other node
  invoke (2) for registration.
  after registration ,the node which initiate the registration send back
  all other node info to the new node.  then new node register all other nodes
  in his list by invoking (3).
*/


//to check the length of each blockchain and synchronize with the network.
app.get('/consensus',function(req,res){
  const requestPromises = [];
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      url: networkNodeUrl + '/blockchain',
      method: 'GET',
      json: true
    };
    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
  .then(blockchains =>{ //all the blockchain from everynode in the network

    const currentChainLength = bitcoin.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain = null;
    let newPendingTransactions = null;

    blockchains.forEach(blockchain => {
      if(blockchain.chain.length > maxChainLength){
        maxChainLength = blockchain.chain.length;
        newLongestChain = blockchain.chain;
        newPendingTransactions = blockchain.pendingTransactions;
      };
    });


    if(!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))){
      res.json({
        note:'Current chain has not been replaced.',
        chain: bitcoin.chain
      });
    }else {//if (newLongestChain && bitcoin.chainIsValid(newLongestChain)) {
      bitcoin.chain = newLongestChain;
      bitcoin.pendingTransactions = newPendingTransactions;
      res.json({
        note : 'The chain has been replaced.',
        chain: bitcoin.chain
      });
    }
  });
});


app.get('/block/:blockHash',function(req,res){
  const blockHash = req.params.blockHash;
  const correctBlock = bitcoin.getBlock(blockHash);
  res.json({
    block: correctBlock
  });
});
app.get('/transaction/:transactionId',function(req,res){
  const transactionId = req.params.transactionId;
  const transactionData = bitcoin.getTransaction(transactionId);
  res.json({
    transaction: transactionData.transaction,
    block: transactionData.block
  });
});

// NOTE: to get balance of a particular recipient/sender address

app.get('/address/:address',function(req,res){
  const address = req.params.address;
  const addressData = bitcoin.getAddressData(address);
  res.json({
    addressData: addressData
  });
});

app.get ('/block-explorer',function(reg,res){
  res.sendFile('./block-explorer/index.html',{ root: __dirname });
});

app.listen(port,function(){
  console.log(`Listening on port ${port} ... `);
});
