import { nftLoansData, infiniteAmtStr } from "../../config/config";
import numbro from "numbro";
export async function approveERC20(
  currentNetworkID,
  erc20Contract,
  userAddress,
  approvalAmount,
  spenderAddress,
  showSuccessMessage,
  showErrorMessage,
  web3,
  setOverlayText,
  tokenIndex
) {
  const result = { success: false };
  try {
    const alreadyApprovedAmount = await erc20Contract.methods
      .allowance(userAddress, spenderAddress)
      .call();
    const remaining = new web3.utils.BN(approvalAmount).sub(
      new web3.utils.BN(alreadyApprovedAmount)
    );
    if (remaining.isNeg() || remaining.isZero()) {
      showSuccessMessage(
        `${
          approvalAmount.toString() === infiniteAmtStr
            ? `Infinite`
            : numbro(
                web3.utils.fromWei(
                  approvalAmount,
                  nftLoansData[currentNetworkID].supportedErc20Tokens[
                    tokenIndex
                  ].web3EquivalentPrecision
                )
              ).format({
                average: true,
                lowPrecision: true,
                thousandSeparated: true,
                trimMantissa: true,
                mantissa: 2,
                spaceSeparated: false,
              })
        } ${
          nftLoansData[currentNetworkID].supportedErc20Tokens[tokenIndex]
            .subname
        } is already approved!`
      );
      return { success: true, transactionHash: "" };
    }
  } catch (err) {
    showErrorMessage(
      `Failed to approve transfer of ${numbro(
        web3.utils.fromWei(
          approvalAmount,
          nftLoansData[currentNetworkID].supportedErc20Tokens[tokenIndex]
            .web3EquivalentPrecision
        )
      ).format({
        thousandSeparated: true,
        trimMantissa: true,
        mantissa: 2,
        spaceSeparated: false,
      })} ${
        nftLoansData[currentNetworkID].supportedErc20Tokens[tokenIndex].subname
      }`
    );
    return { success: false, transactionHash: err.transactionHash };
  }
  await erc20Contract.methods
    .approve(spenderAddress, approvalAmount)
    .send({ from: userAddress }, (error, transactionHash) => {
      if (error) {
        showErrorMessage(
          `Failed to approve transfer of${" "}
          ${
            approvalAmount.toString() === infiniteAmtStr
              ? `infinite`
              : numbro(
                  web3.utils.fromWei(
                    approvalAmount,
                    nftLoansData[currentNetworkID].supportedErc20Tokens[
                      tokenIndex
                    ].web3EquivalentPrecision
                  )
                ).format({
                  thousandSeparated: true,
                  trimMantissa: true,
                  mantissa: 2,
                  spaceSeparated: false,
                })
          }${" "}
          ${
            nftLoansData[currentNetworkID].supportedErc20Tokens[tokenIndex]
              .subname
          }`
        );
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
    })
    .then(function (receipt) {
      showSuccessMessage(
        `${
          approvalAmount.toString() === infiniteAmtStr
            ? `Infinite`
            : numbro(
                web3.utils.fromWei(
                  approvalAmount,
                  nftLoansData[currentNetworkID].supportedErc20Tokens[
                    tokenIndex
                  ].web3EquivalentPrecision
                )
              ).format({
                thousandSeparated: true,
                trimMantissa: true,
                mantissa: 2,
                spaceSeparated: false,
              })
        } ${
          nftLoansData[currentNetworkID].supportedErc20Tokens[tokenIndex]
            .subname
        } has been successfully approved for transfer!`
      );
      result.receipt = receipt;
      result.success = true;
    })
    .catch((error) => {
      console.log("approval failed: ", error);
    });

  setOverlayText(() => {
    return {
      loadingMessage: "",
      transactionHash: "",
    };
  });
  return result;
}
