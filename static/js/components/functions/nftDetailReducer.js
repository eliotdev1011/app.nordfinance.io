function nftDetailReducer(state, action) {
  switch (action.type) {
    case "bidModal":
      return { ...state, isBidModalOpen: action.value };
    case "changeBidModal":
      return { ...state, isChangeBidModalOpen: action.value };
    case "hasUserBid":
      return { ...state, hasUserBid: action.value };
    case "changeBid":
      return { ...state, isUserChangingBid: action.value };
    case "contractCall":
      return { ...state, isContractCallInProgress: action.value };
    case "bidSubmission":
      return { ...state, wasBidSubmissionInitiated: action.value };
    case "nftTxns":
      return { ...state, nftTxns: action.value };
    case "userBalance":
      return { ...state, userBalance: action.value };
    default:
      break;
  }
}

export default nftDetailReducer;
