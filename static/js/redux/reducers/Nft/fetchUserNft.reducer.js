export const fetchUserNftReducer = (
  state = { userNft: [], success: false, message: "" },
  action
) => {
  switch (action.type) {
    case "FETCH_NFT":
      return { ...state, success: false, message: "loading" };
    case "FETCH_NFT_SUCCESS":
      return { ...state, success: true, userNft: action.payload, message: "" };
    case "FETCH_NFT_FAILURE":
      return { ...state, success: false, message: action.payload };
    default:
      return state;
  }
};
