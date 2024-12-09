const FETCH_OFFERS = "FETCH_OFFERS";
const FETCH_OFFERS_SUCCESS = "FETCH_OFFERS_SUCCESS";
const FETCH_OFFERS_FAILURE = "FETCH_OFFERS_FAILURE";

export const fetchOffersOnNft = () => {
  return { type: FETCH_OFFERS };
};

export const fetchOffersOnNftSuccess = (offers) => {
  return { type: FETCH_OFFERS_SUCCESS, payload: offers };
};

export const fetchOffersOnNftFailure = (err) => {
  return { type: FETCH_OFFERS_FAILURE, payload: err };
};
