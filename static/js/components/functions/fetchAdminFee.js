async function fetchAdminFee(nftLoanContract, web3, erc20ContractAddress) {
  try {
    const response = await nftLoanContract.methods
      .adminFeeInBasisPoints(erc20ContractAddress)
      .call();
    return response;
  } catch (err) {
    console.error("fetchAdminFee failed: ", err);
  }
}

export { fetchAdminFee };
