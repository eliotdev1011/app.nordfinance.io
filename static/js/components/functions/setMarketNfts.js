import { nftLoanStates } from "../../config/config";
async function setMarketNfts(
  marketNft,
  accounts,
  network,
  setMarketNftsWithTypes,
  lenderBids
) {
  const marketNftsWithTypes = [];
  marketNft.forEach((item) => {
    const [nftId, nftContractAddress] = item?.asset?.nftKey.split("0x");
    let userBidOnNft = [];
    if (lenderBids.length > 0) {
      userBidOnNft = lenderBids?.filter(
        (bid) =>
          item.loan_id === bid.loan_id &&
          bid?.loans?.currentState === nftLoanStates.ACCEPTING_BIDS &&
          bid?.isActive
      );
    }

    const nftType =
      item.borrowerAddress.toLowerCase() === accounts[0].toLowerCase()
        ? "disabled"
        : userBidOnNft.length
        ? "edit"
        : "bid";

    marketNftsWithTypes.push({
      ...item,
      asset: {
        ...item.asset,
        nftId,
        nftContractAddress: `0x${nftContractAddress}`,
      },
      nftType,
    });
  });
  setMarketNftsWithTypes(() => [...marketNftsWithTypes]);
}

export default setMarketNfts;
