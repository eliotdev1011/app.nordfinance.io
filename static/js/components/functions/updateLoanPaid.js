import axios from "axios";
import { nftLoansEndPoint } from "../../config/config";
async function updateLoanPaid(network, loanID, transactionHash, tries = 0) {
  if (tries === 5) return;
  try {
    await axios.post(`${nftLoansEndPoint}/${network}/pay-loan`, {
      loan_id: loanID,
      transactionHash,
    });
  } catch (err) {
    if (err?.response?.data?.includes("code=TIMEOUT")) {
      await updateLoanPaid(network, loanID, transactionHash, tries + 1);
    }
  }
}

export { updateLoanPaid };
