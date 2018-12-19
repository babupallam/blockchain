const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();
const bc1 = [
{
"index": 1,
"timestamp": 1528054398846,
"transactions": [],
"nonce": 100,
"hash": "0",
"previousBlockHash": "0"
},
{
"index": 2,
"timestamp": 1528054412506,
"transactions": [],
"nonce": 18140,
"hash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100",
"previousBlockHash": "0"
},
{
"index": 3,
"timestamp": 1528054413252,
"transactions": [
{
"amount": 12.5,
"sender": "00",
"recipient": "f7c89b70676411e8b9d1799089a9a9b6",
"transacitonId": "00125780676511e8b9d1799089a9a9b6"
}
],
"nonce": 2833,
"hash": "0000d5288939b3de641999b463d106caecec29593eef98e63d0c9146512d3510",
"previousBlockHash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100"
}
];

console.log(bc1[0]);
console.log(bitcoin.chainIsValid(bc1));








/*
console.log(bitcoin,"\n");//to see genesis block


const previousBlockHash = '0';
const currentBlockData = [
  {
    amount: 100,
    sender: 'AAA',
    recipient: 'BBB'
  },
  {
    amount:200,
    sender:'CCC',
    recipient: 'DDD'
  },
  {
    amount: 400,
    sender: 'AAA',
    recipient: 'CCC'
  }
];
const nonce = bitcoin.proofOfWork(previousBlockHash,currentBlockData);
console.log(nonce);

console.log(bitcoin.hashBlock(previousBlockHash,currentBlockData,nonce));



/*
bitcoin.createNewBlock(2344,'0','nnnnnnnnnnnnnn');
bitcoin.createNewTransaction(100,'BOB34543543','ALICE4gsfgfd');
bitcoin.createNewBlock(2344,'nnnnnnnnnnnnnn','nnnsdjfhsdkjg');

bitcoin.createNewTransaction(150,'BOB34543543','ALICE4gsfgfd');
bitcoin.createNewTransaction(200,'BOB34543543','ALICE4gsfgfd');
bitcoin.createNewTransaction(500,'BOB34543543','ALICE4gsfgfd');

bitcoin.createNewBlock(2344,'nnnnnnnnnnnnnn','nnnsdjfhsdkjg');
*/
/*
to make multiple blocks
bitcoin.createNewBlock(345,'5342543654','abcbdbdbddb3443255bdbd');
bitcoin.createNewBlock(34534,'5435435436','453425346ababa');

console.log(bitcoin);
console.log("\n",bitcoin.chain[2]);
*/
