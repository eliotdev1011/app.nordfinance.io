async function checkNftApproval(
  isFungible,
  nftContract,
  accountAddress,
  spenderAddress,
  tokenID
) {
  let approvedSpenderAddress;
  let isNftApprovalGranted = false;

  if (isFungible === "true") {
    try {
      isNftApprovalGranted = await nftContract.methods
        .isApprovedForAll(accountAddress, spenderAddress)
        .call();
    } catch (err) {
      console.log(err);
    }
  } else {
    try {
      approvedSpenderAddress = await nftContract.methods
        .getApproved(tokenID)
        .call();

      isNftApprovalGranted =
        approvedSpenderAddress?.toLowerCase() === spenderAddress.toLowerCase();
    } catch (err) {
      console.log(err);
    }
  }

  return isNftApprovalGranted;
}

export { checkNftApproval };
