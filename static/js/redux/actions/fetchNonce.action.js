const FETCH_NONCE = "FETCH_NONCE";
const FETCH_NONCE_SUCCESS = "FETCH_NONCE_SUCCESS";
const FETCH_NONCE_FAILURE = "FETCH_NONCE_FAILURE";

export const fetchNonce = () => {
  return { type: FETCH_NONCE };
};

export const fetchNonceSuccess = (nonce) => {
  return { type: FETCH_NONCE_SUCCESS, payload: nonce };
};

export const fetchNonceFailure = (err) => {
  return { type: FETCH_NONCE_FAILURE, payload: err };
};
