export const fetchOffersOnNftReducer = (
  state = { offers: [], success: false, message: "" },
  action
) => {
  switch (action.type) {
    case "FETCH_OFFERS":
      return { ...state, success: false, message: "loading" };
    case "FETCH_OFFERS_SUCCESS":
      return { ...state, success: true, offers: action.payload, message: "" };
    case "FETCH_OFFERS_FAILURE":
      return { ...state, success: false, message: action.payload };
    default:
      return state;
  }
};
