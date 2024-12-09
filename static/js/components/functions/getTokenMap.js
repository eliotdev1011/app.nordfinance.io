import { nftLoansData } from "../../config/config";

function getTokenMap(currentNetworkID) {
  if (currentNetworkID === undefined) {
    throw new Error("currentNetworkID is undefined");
  } else {
    const tokenMap = new Map();
    nftLoansData[currentNetworkID].supportedErc20Tokens.forEach(
      (item, index) => {
        tokenMap.set(item.tokenAddress, index);
      }
    );
    return tokenMap;
  }
}

export default getTokenMap;
