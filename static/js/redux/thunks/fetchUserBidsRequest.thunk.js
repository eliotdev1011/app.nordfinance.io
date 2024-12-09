import {
  fetchBids,
  fetchBidsSuccess,
  fetchBidsFailure,
} from "../actions/fetchUserBids.action.js";
import axios from "axios";
import { nftLoansEndPoint } from "../../config/config";

function fetchUserBidsRequest(network, userAddress) {
  return function (dispatch) {
    dispatch(fetchBids());

    (async function () {
      try {
        const response = await axios.get(
          `${nftLoansEndPoint}/${network}/lender-bids?lenderAddress=${userAddress}`
        );
        dispatch(fetchBidsSuccess(response.data));
      } catch (err) {
        dispatch(fetchBidsFailure(err.message));
      }
    })();
  };
}

export default fetchUserBidsRequest;
