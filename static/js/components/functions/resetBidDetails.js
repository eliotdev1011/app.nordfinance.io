function resetBidDetails(setBidDetails) {
  setBidDetails(() => {
    return {
      loanDuration: "",
      loanDurationErr: "",
      tokenIndex: 0,
      roi: "",
      roiErr: "",
      isInterestProRated: true,
      principalAmount: "",
      principalAmountErr: "",
      maxRepaymentAmount: "",
      adminFee: "",
      assetLenderNonce: "",
    };
  });
}

export default resetBidDetails;
