import {
  fetchOffersOnNft,
  fetchOffersOnNftSuccess,
  fetchOffersOnNftFailure,
} from "../actions/fetchOffersOnNft.action.js";
import { nftLoansEndPoint } from "../../config/config";
import axios from "axios";

function fetchOffersOnNftRequest(loanID, network) {
  return function (dispatch) {
    dispatch(fetchOffersOnNft());
    (async function () {
      try {
        const response = await axios.get(
          `${nftLoansEndPoint}/${network}/offers?loan_id=${loanID}`
        );
        dispatch(fetchOffersOnNftSuccess(response.data));
      } catch (err) {
        dispatch(fetchOffersOnNftFailure(err?.response?.data?.error));
      }
    })();
  };
}

export default fetchOffersOnNftRequest;
