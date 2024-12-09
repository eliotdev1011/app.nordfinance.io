async function fetchPayoffAmount(nftLoanContract, loanContractID) {
  try {
    const response = await nftLoanContract.methods
      .getPayoffAmount(loanContractID)
      .call();
    return response;
  } catch (err) {
    console.error("get payoffAmount failed: ", err);
    return "";
  }
}
export { fetchPayoffAmount };
