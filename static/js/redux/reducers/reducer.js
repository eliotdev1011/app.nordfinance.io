import { combineReducers } from "redux";
import { nftMarketplaceState } from "./Nft/nftMarketState.reducer";
import { fetchMarketPlaceReducer } from "./Nft/fetchMarketPlace.reducer.js";
import { fetchUserNftReducer } from "./Nft/fetchUserNft.reducer.js";
import { fetchNonceReducer } from "./Nft/fetchNonce.reducer.js";
import { fetchOffersOnNftReducer } from "./Nft/fetchOffersOnNft.reducer.js";
import { fetchUserBidsReducer } from "./Nft/fetchUserBids.reducer.js";
import { fetchBorrowerLoansReducer } from "./Nft/fetchBorrowerLoans.reducer.js";

const appReducer = combineReducers({
  nftMarketplaceState,
  fetchMarketPlaceReducer,
  fetchUserNftReducer,
  fetchNonceReducer,
  fetchOffersOnNftReducer,
  fetchUserBidsReducer,
  fetchBorrowerLoansReducer,
});

const rootReducer = (state, action) => {
  if (action.type === "WALLET_CHANGE") {
    window.localStorage.removeItem("persist:root");
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

export default rootReducer;
