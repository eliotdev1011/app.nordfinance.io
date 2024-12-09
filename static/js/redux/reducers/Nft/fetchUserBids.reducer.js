export const fetchUserBidsReducer = (
  state = { userBids: [], success: false, message: "" },
  action
) => {
  switch (action.type) {
    case "FETCH_BIDS":
      return { ...state, success: false, userBids: [], message: "loading" };
    case "FETCH_BIDS_SUCCESS":
      return { ...state, success: true, userBids: action.payload, message: "" };
    case "FETCH_BIDS_FAILURE":
      return {
        ...state,
        success: false,
        userBids: [],
        message: action.payload,
      };
    default:
      return state;
  }
};
