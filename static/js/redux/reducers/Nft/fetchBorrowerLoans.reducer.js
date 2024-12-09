export const fetchBorrowerLoansReducer = (
  state = { borrowerLoans: [], success: false, message: "" },
  action
) => {
  switch (action.type) {
    case "FETCH_BORROWER_LOANS":
      return { ...state, success: false, message: "loading" };
    case "FETCH_BORROWER_LOANS_SUCCESS":
      return {
        ...state,
        success: true,
        borrowerLoans: action.payload,
        message: "",
      };
    case "FETCH_BORROWER_LOANS_FAILURE":
      return { ...state, success: false, message: action.payload };
    default:
      return state;
  }
};
