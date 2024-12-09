const FETCH_MARKETPLACE = "FETCH_MARKETPLACE";
const FETCH_MARKETPLACE_SUCCESS = "FETCH_MARKETPLACE_SUCCESS";
const FETCH_MARKETPLACE_FAILURE = "FETCH_MARKETPLACE_FAILURE";

export const fetchMarketPlace = () => {
  return { type: FETCH_MARKETPLACE };
};

export const fetchMarketPlaceSuccess = (nfts) => {
  return { type: FETCH_MARKETPLACE_SUCCESS, payload: nfts };
};

export const fetchMarketPlaceFailure = (err) => {
  return { type: FETCH_MARKETPLACE_FAILURE, payload: err };
};
