const FETCH_BIDS = "FETCH_BIDS";
const FETCH_BIDS_SUCCESS = "FETCH_BIDS_SUCCESS";
const FETCH_BIDS_FAILURE = "FETCH_BIDS_FAILURE";

export const fetchBids = () => {
  return { type: FETCH_BIDS };
};

export const fetchBidsSuccess = (bids) => {
  return { type: FETCH_BIDS_SUCCESS, payload: bids };
};

export const fetchBidsFailure = (err) => {
  return { type: FETCH_BIDS_FAILURE, payload: err };
};
