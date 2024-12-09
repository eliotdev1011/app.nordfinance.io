import { nftLoansData } from "../../config/config";
import getMessageSignature from "./getMessageSignature";
import getSignatureParameters from "./getSignatureParameters";

async function getBorrowerSignature(
  web3,
  nftID,
  borrowerNonce,
  nftContractAddress,
  borrowerAddress,
  currentNetworkID,
  showSuccessMessage,
  showErrorMessage
) {
  const domainType = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ];

  const borrowerSignDataType = [
    { name: "nftCollateralId", type: "uint256" },
    { name: "borrowerNonce", type: "uint256" },
    { name: "nftCollateralContract", type: "address" },
    { name: "borrower", type: "address" },
  ];

  const domainData = {
    name: "NordLoan Promissory Note",
    version: "1",
    chainId: parseInt(currentNetworkID),
    verifyingContract: nftLoansData[currentNetworkID].nftLoanContractAddress,
  };

  const message = {
    nftCollateralId: nftID,
    borrowerNonce,
    nftCollateralContract: nftContractAddress,
    borrower: borrowerAddress,
  };

  const dataToSign = JSON.stringify({
    types: {
      EIP712Domain: domainType,
      BorrowerSignData: borrowerSignDataType,
    },
    primaryType: "BorrowerSignData",
    domain: domainData,
    message: message,
  });

  try {
    const response = await getMessageSignature(
      [borrowerAddress, dataToSign],
      web3
    );
    const { r, s, v } = getSignatureParameters(response.result, web3);
    showSuccessMessage("User signature received");
    const newSignature = r + s.slice(2) + web3.utils.toHex(v).slice(2);
    return newSignature;
  } catch (err) {
    showErrorMessage(`User signature failed!`);
    return "error";
  }
}

export { getBorrowerSignature };
