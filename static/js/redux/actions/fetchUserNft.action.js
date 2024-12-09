const FETCH_NFT = "FETCH_NFT";
const FETCH_NFT_SUCCESS = "FETCH_NFT_SUCCESS";
const FETCH_NFT_FAILURE = "FETCH_NFT_FAILURE";

export const fetchNft = () => {
  return { type: FETCH_NFT };
};

export const fetchNftSuccess = (NFTs) => {
  return { type: FETCH_NFT_SUCCESS, payload: NFTs };
};

export const fetchNftFailure = (err) => {
  return { type: FETCH_NFT_FAILURE, payload: err };
};
