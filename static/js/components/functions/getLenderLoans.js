import moment from "moment";
import { nftLoanStates } from "../../config/config";
function getLenderLoans(userBids) {
  const lenderLoans = [];
  userBids.forEach((bid) => {
    if (bid.isSelected) {
      const [nftID, nftContractAddress] = bid.nftKey.split("0x");
      let loanState = bid?.loans?.currentState;
      // determine type
      if (loanState === nftLoanStates.LOAN_STARTED) {
        const currentMoment = moment(new Date().toUTCString());
        const offerStartMoment = moment(bid?.loans?.loanStartDate);

        const timeLapsed = currentMoment.diff(offerStartMoment, "seconds");

        loanState =
          Number(timeLapsed) > Number(bid?.bidDetails?.loanDuration)
            ? nftLoanStates.SEIZE_NFT
            : loanState;
      }
      lenderLoans.push({
        ...bid,
        nftID,
        nftContractAddress: `0x${nftContractAddress}`,
        loanState,
      });
    }
  });
  return lenderLoans;
}

export default getLenderLoans;
