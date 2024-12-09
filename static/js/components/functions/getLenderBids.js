import { nftLoanStates } from "../../config/config";
function getLenderBids(userBids) {
  const lenderBids = [];
  userBids.forEach((bid) => {
    const nftType =
      bid?.loans?.currentState === nftLoanStates.ACCEPTING_BIDS && bid?.isActive
        ? "edit"
        : bid.isSelected
        ? "selected"
        : !bid?.isActive
        ? "cancelled"
        : "rejected";
    const [nftCollateralId, nftCollateralContract] = bid.nftKey.split("0x");
    lenderBids.push({
      ...bid,
      nftType,
      nftCollateralId,
      nftCollateralContract: `0x${nftCollateralContract}`,
    });
  });
  return lenderBids;
}

export default getLenderBids;
