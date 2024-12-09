const FETCH_BORROWER_LOANS = "FETCH_BORROWER_LOANS";
const FETCH_BORROWER_LOANS_SUCCESS = "FETCH_BORROWER_LOANS_SUCCESS";
const FETCH_BORROWER_LOANS_FAILURE = "FETCH_BORROWER_LOANS_FAILURE";

export const fetchBorrowerLoans = () => {
  return { type: FETCH_BORROWER_LOANS };
};

export const fetchBorrowerLoansSuccess = (borrowerLoans) => {
  return { type: FETCH_BORROWER_LOANS_SUCCESS, payload: borrowerLoans };
};

export const fetchBorrowerLoansFailure = (err) => {
  return { type: FETCH_BORROWER_LOANS_FAILURE, payload: err };
};
