const ethers = require('ethers');

class LeapProvider extends ethers.providers.JsonRpcProvider {

  /**
   * Overrides `BaseProvider.sendTransaction` to exclude tx parsing
   * and resolveProperties.
   * 
   * Given signedTransaction is non-standard, it is a LeapTransaction
   * as defined in leap-core, so we cannot parse. 
   * We don't need resolveProperties as LeapTransaction cannot
   * have property promise.
   * 
   * See: https://github.com/ethers-io/ethers.js/blob/7075c8c2352ec306b5679da6fbe7c2ddf7bd65d1/src.ts/providers/base-provider.ts#L873
   * @param {LeapTransaction} signedTransaction signed tx
   */
  sendTransaction(signedTransaction) {
    return this.ready.then(() => {
      let params = { signedTransaction: signedTransaction.hex() };
      return this.perform('sendTransaction', params).then((hash) => {
          return this._wrapTransaction({ hash: signedTransaction.hash() }, hash);
      }, function (error) {
          error.transaction = { raw: signedTransaction.hex() };
          error.transactionHash = signedTransaction.hash();
          throw error;
      });
    });
  }

}

module.exports = LeapProvider;