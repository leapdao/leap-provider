# leap-provider

Ethers.js provider to work with Leap Network.

## Install

```sh
yarn add leap-provider
```

## Usage

Connect to a Wallet:

```js
const LeapProvider = require('leap-provider');
const provider = new LeapProvider('https://testnet-node.leapdao.org');

// can be passed in a Wallet
const plasmaWallet = new ethers.Wallet(privKey, provider);

// or connected to existing wallet
const otherWallet = Wallet.createRandom();
otherWallet.connect(provider);
```

Send transaction to Leap Network:

```js
const LeapProvider = require('leap-provider');
const provider = new LeapProvider('https://testnet-node.leapdao.org');

// create some LeapTransaction
const tx = Tx.transfer(
  ...
);

// tx should be signed
tx.signAll(wallet.privateKey);

// send via provider
const resp = await wallet.provider.sendTransaction(tx);

// wait for inclusion, you will get a proper TransactionReceipt once tx is included in a block
const receipt = await resp.wait();
console.log(receipt);
```
