import { NFT_MARKETPLACE_STATE } from "../../actions/index.action";

export const nftMarketplaceState = (state = "lend", action) => {
  switch (action.type) {
    case NFT_MARKETPLACE_STATE:
      return action.payload;
    default:
      return state;
  }
};
