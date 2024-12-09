const txnStateMap = {
  LOAN_STARTED: "beginLoan",
  SEIZE_NFT: "beginLoan",
  REPAYMENT_DONE: "payback",
  NFT_SEIZED: "seize",
};
function getRelevantTxnHash(nftState, txHashes) {
  return txHashes[txnStateMap[nftState]];
}

export default getRelevantTxnHash;
