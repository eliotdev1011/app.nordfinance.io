import axios from "axios";
import { nftLoansEndPoint } from "../../config/config";

async function deregisterNft(network, loanID) {
  try {
    const response = await axios.post(
      `${nftLoansEndPoint}/${network}/deregister-nft`,
      {
        loan_id: loanID,
      }
    );
    return { success: response.data.success };
  } catch (err) {
    return { success: false };
  }
}
export { deregisterNft };
