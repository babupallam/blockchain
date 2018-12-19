
const sha256 = require('sha256');
const currentNodeurl = process.argv[3];

const uuid = require('uuid/v1');//for making unique id


//object creation in js isn't like as in other langauge,no need of class
function Blockchain(){
  this.chain = [];
  this.pendingTransactions = [];
  this.createNewBlock(100,'0','0');// NOTE: genesis block ;first block
  this.currentNodeurl = currentNodeurl;
  this.networkNodes = [];//other nodes in the network
}

Blockchain.prototype.createNewBlock = function(nonce,previousBlockHash,hash){
  //create a block object
  const newBlock = {
    index:  this.chain.length+1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,//transactions need to be added
    nonce: nonce,
    hash: hash,//hash of current block
    previousBlockHash: previousBlockHash
  };
  this.pendingTransactions=[];
  this.chain.push(newBlock);
  return newBlock;
}

Blockchain.prototype.getLastBlock = function(){
  return this.chain[this.chain.length - 1];
};

Blockchain.prototype.createNewTransaction = function(amount,sender,recipient){
  const newTransaction = {
    amount: amount,
    sender: sender,
    recipient: recipient,
    transactionId: uuid().split('-').join('')
  };
  return newTransaction;
};
Blockchain.prototype.addTransactionToPendingTransaction = function(transactionObj){
  this.pendingTransactions.push(transactionObj);
  return this.getLastBlock()['index'] + 1;
};

Blockchain.prototype.hashBlock = function(previousBlockHash,currentBlockData,nonce){
  const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
  const hash = sha256(dataAsString);
  return hash;
};
Blockchain.prototype.proofOfWork = function(previousBlockHash,currentBlockData){
  /*
    ==> repeatedly hash block until we get the special hash value
    ==> use currentBlockData and previousBlockHash for hashing
    ==> It is done by changing the nonce value.
  */
  let nonce = 0;
  let hash = this.hashBlock(previousBlockHash,currentBlockData,nonce);
  while (hash.substring(0,4)!='0000') {
    nonce++;
    hash = this.hashBlock(previousBlockHash,currentBlockData,nonce);
  }
  return nonce;
};


Blockchain.prototype.chainIsValid = function(blockchain){
  let validChain = true;
  for(var i = 1; i < blockchain.length; i++){
    const currentBlock = blockchain[i];
    const prevBlock = blockchain[i-1];
    const blockHash = this.hashBlock(prevBlock['hash'],{transactions: currentBlock['transactions'],index: currentBlock['index']},currentBlock['nonce']);
    if(blockHash.substring(0,4) !== '0000')
      validChain = false;
    if(currentBlock['previousBlockHash'] !== prevBlock['hash'])
      validChain = false;
  }
  //checking genesis block
  const genesisBlock = blockchain[0];
  const correctNonce = genesisBlock['nonce'] === 100;
  const correctPreviousHash = genesisBlock['previousBlockHash'] === '0';
  const correctHash = genesisBlock['hash'] === '0';
  const correctTransaction = genesisBlock['transactions'].length === 0;

  if(!correctNonce || !correctPreviousHash || !correctHash || !correctTransaction)
    validChain = false;
  return validChain;
};


Blockchain.prototype.getBlock = function(blockHash){
  let correctBlock = null;
  this.chain.forEach(block =>{
    if(block.hash === blockHash)
      correctBlock = block;
  });
  return correctBlock;
};

Blockchain.prototype.getTransaction = function (transactionId) {
  let correctTransaction = null;
  let correctBlock = null;
  this.chain.forEach(block => {
    block.transactions.forEach(transaction =>{
      if(transaction.transactionId === transactionId){
        correctTransaction = transaction;
        correctBlock = block;
      }
    });
  });
  return{
    transaction: correctTransaction,
    block: correctBlock
  };
};

Blockchain.prototype.getAddressData = function(address){
  const addressTransactions = [];
  this.chain.forEach(block =>{
    block.transactions.forEach(transaction =>{
      if(transaction.sender === address || transaction.recipient === address){
        addressTransactions.push(transaction);
      }
    });
  });

  let balance = 0;
  addressTransactions.forEach(transaction =>{
    if(transaction.recipient === address)
      balance += transaction.amount;
    else if(transaction.sender ===address)
      balance -= transaction.amount;
  });
  return {
    addressTransactions: addressTransactions,
    addressBalance: balance
  };
};




//bottom of file export the constructor
module.exports = Blockchain;







/*like use of class in other languages,but js uses object creation in diff way.
class Blockchain{
    constructor(){
      this.chain=[];
      this.pendingTransactions=[];
    }
    //......
}
*/
