import {
  fetchBorrowerLoans,
  fetchBorrowerLoansSuccess,
  fetchBorrowerLoansFailure,
} from "../actions/fetchBorrowerLoans.action.js";
import { nftLoansEndPoint } from "../../config/config";
import axios from "axios";

function fetchBorrowerLoansRequest(network, borrowerAddress) {
  return function (dispatch) {
    dispatch(fetchBorrowerLoans());
    (async function () {
      try {
        const response = await axios.get(
          `${nftLoansEndPoint}/${network}/borrower-loans?borrowerAddress=${borrowerAddress}`
        );
        dispatch(fetchBorrowerLoansSuccess(response.data));
      } catch (err) {
        dispatch(fetchBorrowerLoansFailure(err?.response?.data?.error));
      }
    })();
  };
}

export default fetchBorrowerLoansRequest;
