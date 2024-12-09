export const fetchNonceReducer = (
  state = { nonce: "", success: false, message: "" },
  action
) => {
  switch (action.type) {
    case "FETCH_NONCE":
      return { ...state, success: false, message: "loading" };
    case "FETCH_NONCE_SUCCESS":
      return { ...state, success: true, nonce: action.payload, message: "" };
    case "FETCH_NONCE_FAILURE":
      return { ...state, success: false, message: action.payload };
    default:
      return state;
  }
};
