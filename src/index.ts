import { JsonRpcProvider } from 'ethers/providers/json-rpc-provider';
import { Transaction } from 'ethers/utils/transaction';
import { 
  Outpoint, Output, Unspent, NodeConfig,
  ValidatorInfo, Type, SpendCondSimResult,
  Tx
} from 'leap-core';

const toLowerCase = val => 
  val && val.toLowerCase ? val.toLowerCase() : val;

const fromRaw = (u): Unspent => ({
  output: u.output,
  outpoint: Outpoint.fromRaw(u.outpoint),
});

const hexlify = (tx: Tx<Type> | string): string => {
  if ((tx as Tx<Type>).hex) {
    return (tx as Tx<Type>).hex();
  }
  return tx as string;
};

enum TokenType {
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  NFT = 'nft',
  ERC1948 = 'erc1948',
  NST = 'nst',
};

interface Colors {
  erc20: Array<string>;
  erc721: Array<string>;
  erc1948: Array<string>;
};

class LeapProvider extends JsonRpcProvider {

  getUnspent(address?: string, color?: string|number): Promise<Array<Unspent>> {
    return this.send(
      'plasma_unspent', 
      [toLowerCase(address), toLowerCase(color)]
    )
    .then(unspent => unspent.map(fromRaw));
  }

  getUnspentByAddress(address: string): Promise<Array<Unspent>> {
    console.warn('DEPRECATED: use getUnspent(address) instead'); // eslint-disable-line no-console
    return this.getUnspent(address);
  }

  getUnspentAll(): Promise<Array<Unspent>> {
    console.warn('DEPRECATED: use getUnspent() instead'); // eslint-disable-line no-console
    return this.getUnspent();
  }

  getColor(tokenAddress: string): Promise<number> {
    return this.send('plasma_getColor', [toLowerCase(tokenAddress)]);
  }

  getColors(type?: TokenType): Promise<string[] | Colors> {
    if (type === TokenType.ERC721 || type === TokenType.NFT) {
      return this.send('plasma_getColors', [true, false]);
    }
    if (type === TokenType.ERC1948 || type === TokenType.NST) {
      return this.send('plasma_getColors', [false, true]);
    }

    if (type === TokenType.ERC20) {
      return this.send('plasma_getColors', [false, false]);
    }

    return Promise.all([
      this.send('plasma_getColors', [false, false]),
      this.send('plasma_getColors', [true, false]),
      this.send('plasma_getColors', [false, true]),
    ]).then(([erc20, erc721, erc1948]) => ({ erc20, erc721, erc1948 }));
  }

  status(): Promise<string> {
    return this.send('plasma_status', []);
  }

  getConfig() : Promise<NodeConfig> {
    return this.send('plasma_getConfig', []);
  }

  getValidatorInfo(): Promise<ValidatorInfo> {
    return this.send('validator_getAddress', []);
  }

  checkSpendingCondition(tx: Tx<Type.SPEND_COND>): Promise<SpendCondSimResult> {
    return this.send('checkSpendingCondition', [tx.hex()])
      .then(({ error, outputs }) => ({
        error,
        outputs: outputs.map(Output.fromJSON),
      }));
  }

  getPeriodByBlockHeight(blockHeightOrTag: number | string) {
    return this.send('plasma_getPeriodByBlockHeight', [blockHeightOrTag]);
  }

  /**
   * Overrides `BaseProvider.sendTransaction` to exclude tx parsing
   * 
   * Given signedTransaction is non-standard, it is a raw Tx object
   * as defined in leap-core, so we cannot parse. 
   * 
   * See: https://github.com/ethers-io/ethers.js/blob/7075c8c2352ec306b5679da6fbe7c2ddf7bd65d1/src.ts/providers/base-provider.ts#L873
   * @param {Tx<Type>|string|Promise<string>} signedTxOrHex signed Leap Tx or raw hex string of signed Leap Tx
   */
  sendTransaction(signedTxOrHex: Tx<Type> | string | Promise<string>) {
    return Promise.all([
      Promise.resolve(signedTxOrHex as PromiseLike<any>),
      this.ready
    ]).then(([signedTxOrHex]) => {
      const signedTransaction = hexlify(signedTxOrHex);
      return this.perform('sendTransaction', { signedTransaction })
        .then((hash) => {
        return this._wrapTransaction(
          { hash } as Transaction,
          hash
        );
      }, (error) => {
        const tx = Tx.fromRaw(signedTransaction);
        error.transaction = { raw: signedTransaction };
        error.transactionHash = tx.hash();
        throw error;
      });
    });
  }

}

module.exports = LeapProvider;