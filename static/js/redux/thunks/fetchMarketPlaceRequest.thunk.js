import {
  fetchMarketPlace,
  fetchMarketPlaceSuccess,
  fetchMarketPlaceFailure,
} from "../actions/marketPlace.action.js";
import { nftLoansEndPoint } from "../../config/config";
import axios from "axios";

function fetchMarketPlaceRequest(network) {
  return function (dispatch) {
    dispatch(fetchMarketPlace());
    (async function () {
      try {
        const response = await axios.get(
          `${nftLoansEndPoint}/${network}/marketplace`
        );
        dispatch(fetchMarketPlaceSuccess(response.data));
      } catch (err) {
        dispatch(fetchMarketPlaceFailure(err));
      }
    })();
  };
}

export default fetchMarketPlaceRequest;
