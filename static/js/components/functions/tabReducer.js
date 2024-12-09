function tabReducer(state, action) {
  switch (action.type) {
    case "collaterals":
      return { ...state, bCollaterals: action.value };
    case "borrowloan":
      return { ...state, bStartedLoans: action.value };
    case "bids":
      return { ...state, lBids: action.value };
    case "lendloan":
      return { ...state, lLoans: action.value };
    default:
      break;
  }
}

export default tabReducer;
