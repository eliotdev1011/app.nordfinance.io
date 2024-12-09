import axios from "axios";
import { nftLoansEndPoint } from "../../config/config";

async function deregisterBid(network, bidID) {
  try {
    const response = await axios.post(
      `${nftLoansEndPoint}/${network}/deregister-bid`,
      {
        bid_id: bidID,
      }
    );
    return { success: response.data.success };
  } catch (err) {
    return { success: false };
  }
}

export { deregisterBid };
