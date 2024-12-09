export const fetchMarketPlaceReducer = (
  state = { marketNft: [], success: false, message: "" },
  action
) => {
  switch (action.type) {
    case "FETCH_MARKETPLACE":
      return { ...state, success: false, message: "loading" };
    case "FETCH_MARKETPLACE_SUCCESS":
      return {
        ...state,
        success: true,
        marketNft: action.payload,
        message: "",
      };
    case "FETCH_MARKETPLACE_FAILURE":
      return { ...state, success: false, message: action.payload };
    default:
      return state;
  }
};
