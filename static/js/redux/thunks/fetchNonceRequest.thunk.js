import {
  fetchNonce,
  fetchNonceSuccess,
  fetchNonceFailure,
} from "../actions/fetchNonce.action.js";
import { nftLoansEndPoint } from "../../config/config";
import axios from "axios";

function fetchNonceRequest(userAddress, network) {
  return function (dispatch) {
    dispatch(fetchNonce());
    (async function () {
      try {
        const response = await axios.get(
          `${nftLoansEndPoint}/${network}/get-nonce?address=${userAddress}`
        );
        dispatch(fetchNonceSuccess(response.data.nonce));
      } catch (err) {
        dispatch(fetchNonceFailure(err?.response?.data?.error));
      }
    })();
  };
}

export default fetchNonceRequest;
