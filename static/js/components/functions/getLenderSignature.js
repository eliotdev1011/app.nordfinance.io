import { nftLoansData, uint32ComplementOfZero } from "../../config/config";
import getMessageSignature from "./getMessageSignature";
import getSignatureParameters from "./getSignatureParameters";

async function getLenderSignature(
  web3,
  principalAmount,
  nftCollateralId,
  duration,
  roi,
  adminFee,
  lenderNonce,
  nftCollateralContract,
  lenderAddress,
  maxRepaymentAmount,
  fIsInterestProRated,
  fTokenIndex,
  currentNetworkID,
  showSuccessMessage,
  showErrorMessage
) {
  const loanERC20Denomination =
    nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]
      .tokenAddress;
  const interestIsProRated = fIsInterestProRated;

  const roiToPass = fIsInterestProRated
    ? roi.toString()
    : uint32ComplementOfZero;

  const domainType = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ];

  const lenderSignDataType = [
    { name: "loanPrincipalAmount", type: "uint256" },
    { name: "maximumRepaymentAmount", type: "uint256" },
    { name: "nftCollateralId", type: "uint256" },
    { name: "loanDuration", type: "uint256" },
    { name: "loanInterestRateForDurationInBasisPoints", type: "uint256" },
    { name: "adminFeeInBasisPoints", type: "uint256" },
    { name: "lenderNonce", type: "uint256" },
    { name: "nftCollateralContract", type: "address" },
    { name: "loanERC20Denomination", type: "address" },
    { name: "lender", type: "address" },
    { name: "interestIsProRated", type: "bool" },
  ];

  const domainData = {
    name: "NordLoan Promissory Note",
    version: "1",
    chainId: parseInt(currentNetworkID),
    verifyingContract: nftLoansData[currentNetworkID].nftLoanContractAddress,
  };

  const message = {
    loanPrincipalAmount: principalAmount,
    maximumRepaymentAmount: maxRepaymentAmount,
    nftCollateralId,
    loanDuration: duration,
    loanInterestRateForDurationInBasisPoints: roiToPass,
    adminFeeInBasisPoints: adminFee,
    lenderNonce,
    nftCollateralContract,
    loanERC20Denomination,
    lender: lenderAddress,
    interestIsProRated,
  };

  const dataToSign = JSON.stringify({
    types: {
      EIP712Domain: domainType,
      LenderSignData: lenderSignDataType,
    },
    primaryType: "LenderSignData",
    domain: domainData,
    message: message,
  });

  try {
    const response = await getMessageSignature(
      [lenderAddress, dataToSign],
      web3
    );
    const { r, s, v } = getSignatureParameters(response.result, web3);
    showSuccessMessage("User signature received");
    const newSignature = r + s.slice(2) + web3.utils.toHex(v).slice(2);
    return newSignature;
  } catch (err) {
    console.error(err);
    showErrorMessage("Failure while receiving user signature");
    return "error";
  }
}

export default getLenderSignature;
