import {
  fetchNft,
  fetchNftSuccess,
  fetchNftFailure,
} from "../actions/fetchUserNft.action.js";
import axios from "axios";
import { nftLoansEndPoint } from "../../config/config.js";
import { toChecksumAddress } from "ethereum-checksum-address";

function fetchUserNftRequest(userAddress, network) {
  return function (dispatch) {
    dispatch(fetchNft());

    (async function () {
      try {
        const response = await axios.get(
          `${nftLoansEndPoint}/${network}/user-assets?address=${toChecksumAddress(
            userAddress
          )}`
        );
        dispatch(fetchNftSuccess(response.data));
      } catch (err) {
        dispatch(fetchNftFailure(err));
      }
    })();
  };
}

export default fetchUserNftRequest;
