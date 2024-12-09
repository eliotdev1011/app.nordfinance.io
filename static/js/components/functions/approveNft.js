import { checkNftApproval } from "./checkNftApproval";
async function approveNft(
  isFungible,
  nftContract,
  spenderAddress,
  userAddress,
  tokenID,
  showSuccessMessage,
  showErrorMessage,
  setOverlayText
) {
  const result = { success: false };
  function receiptCallback(error, transactionHash) {
    if (error) {
      showErrorMessage(`NFT transfer approval failed!`);
      setOverlayText(() => {
        return {
          loadingMessage: "",
          transactionHash: "",
        };
      });
    }
    setOverlayText((prevOverlay) => {
      return {
        loadingMessage: prevOverlay.loadingMessage,
        transactionHash,
      };
    });
  }
  const isNftApprovalGranted = await checkNftApproval(
    isFungible,
    nftContract,
    userAddress,
    spenderAddress,
    tokenID
  );
  if (!isNftApprovalGranted) {
    if (isFungible === "true") {
      const approvalToSet = true;
      await nftContract.methods
        .setApprovalForAll(spenderAddress, approvalToSet)
        .send({ from: userAddress }, receiptCallback)
        .then(function (receipt) {
          showSuccessMessage(`NFT transfer approved!`);
          result.receipt = receipt;
          result.success = true;
        })
        .catch((error) => console.log(error));
    } else {
      await nftContract.methods
        .approve(spenderAddress, tokenID)
        .send({ from: userAddress }, receiptCallback)
        .then(function (receipt) {
          showSuccessMessage(`NFT transfer approved!`);
          result.receipt = receipt;
          result.success = true;
        })
        .catch((error) => console.log(error));
    }
  } else {
    showSuccessMessage(`NFT transfer already approved!`);
    result.success = true;
  }
  return result;
}

export { approveNft };
