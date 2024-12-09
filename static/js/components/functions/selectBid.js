import axios from "axios";
import { nftLoansEndPoint } from "../../config/config";
async function selectBid(
  loanID,
  bidID,
  transactionHash,
  network,
  showSuccessMessage,
  showErrorMessage,
  tries = 0
) {
  if (tries === 5) {
    showErrorMessage(`Bid acceptance failed!`);
    return;
  }
  try {
    await axios.post(`${nftLoansEndPoint}/${network}/select-bid`, {
      loan_id: loanID,
      bid_id: bidID,
      transactionHash,
    });
    showSuccessMessage(`Bid acceptance successful!`);
  } catch (err) {
    if (err?.response?.data?.includes("code=TIMEOUT")) {
      await selectBid(
        loanID,
        bidID,
        transactionHash,
        network,
        showSuccessMessage,
        showErrorMessage,
        tries + 1
      );
    } else showErrorMessage(`Bid acceptance failed!`);
  }
}

export { selectBid };
