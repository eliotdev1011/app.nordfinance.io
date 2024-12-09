import { nftLoanStates, unitMapping } from "../../config/config";
import numbro from "numbro";

async function setUserNfts(userNft, setUserNFtsWithTypes, web3) {
  if (userNft.length === 0) {
    setUserNFtsWithTypes(() => []);
  } else {
    const userNftsWithTypes = [];
    for (let currentNft of userNft) {
      const [nftID, nftContractAddress] = currentNft.nftKey.split("0x");

      const price = currentNft.rawPrice
        ? numbro(
            web3.utils
              .fromWei(
                currentNft.rawPrice,
                unitMapping[currentNft.priceDecimals]
              )
              .toString()
          ).format({ mantissa: 4 })
        : "0";

      currentNft = { ...currentNft, price };

      if (currentNft.isFungible) {
        // process when currentNft isFungible (ERC1155)
        /*
          1. asset object will have allLoans array
          2. all loans has loans with currentStates = ACCEPTING_BIDS OR
          LOAN_STARTED only, if a loan moves ahead it will be removed
          3. checkBidsNfts, an array of NFTs with loanIDs & currentState = ACCEPTING_BIDS
          4. now, to fill userNftsWithTypes for NftMarketplace:
            if tokenBalance > checkBidsNfts (user has more tokens, yet to be registered)
              userNftsWithTypes array will have asset object with nonCollateralTokenCount & checkBidsNfts spread out
            else if tokenBalance = checkBidsNFts
              userNftsWithTypes array will have only checkBidsNfts
            else 
              user has registered NFT & transferred it
        */

        const checkBidsNfts = [];

        for (let j = 0; j < currentNft.allLoans.length; j++) {
          const currentLoan = currentNft.allLoans[j];
          if (currentLoan.currentState === nftLoanStates.ACCEPTING_BIDS) {
            // eslint-disable-next-line no-unused-vars
            const { allLoans, ...restCurrentNft } = currentNft;
            checkBidsNfts.push({
              ...restCurrentNft,
              nftType: "checkBids",
              loanID: currentLoan.loan_id,
              loanName: currentLoan?.loanName,
              currentState: currentLoan.currentState,
              nftID,
              nftContractAddress: `${nftContractAddress}`,
            });
          }
        }

        const checkBidsCount = checkBidsNfts.length;

        if (Number(currentNft.tokenBalance) > checkBidsCount) {
          const nonCollateralTokenBalance = {
            nonCollateralTokenCount: currentNft.tokenBalance - checkBidsCount,
            totalTokenCount: currentNft.tokenBalance,
          };

          // eslint-disable-next-line no-unused-vars
          const { allLoans, ...restCurrentNft } = currentNft;
          userNftsWithTypes.push({
            ...restCurrentNft,
            nonCollateralTokenBalance,
            nftType: "loan",
            nftID,
            nftContractAddress: `${nftContractAddress}`,
          });
          userNftsWithTypes.push(...checkBidsNfts);
        } else if (Number(currentNft.tokenBalance) === checkBidsCount) {
          userNftsWithTypes.push(...checkBidsNfts);
        } else {
          // user has registered NFT and transferred it before accepting bid
        }
      } else {
        if (currentNft.allLoans.length > 0) {
          const nftType =
            currentNft.allLoans[0].currentState === nftLoanStates.ACCEPTING_BIDS
              ? "checkBids"
              : currentNft.allLoans[0].currentState ===
                nftLoanStates.LOAN_STARTED
              ? "loanStarted"
              : "inConclusive";
          userNftsWithTypes.push({
            ...currentNft,
            nftType,
            nftID,
            nftContractAddress: `0x${nftContractAddress}`,
            loanID: currentNft.allLoans[0].loan_id,
            loanName: currentNft.allLoans[0].loanName,
          });
        } else {
          userNftsWithTypes.push({
            ...currentNft,
            nftType: "loan",
            nftID,
            nftContractAddress: `0x${nftContractAddress}`,
          });
        }
      }
    }
    setUserNFtsWithTypes(() => [...userNftsWithTypes]);
  }
}

export default setUserNfts;
