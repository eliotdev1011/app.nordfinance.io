function formBidDetailsReducer(state, action) {
  switch (action.type) {
    case "fAdminFee":
      return { ...state, fAdminFee: action.value };
    case "fLoanDuration":
      return { ...state, fLoanDuration: action.value };
    case "fLoanDurationErr":
      return { ...state, fLoanDurationErr: action.value };
    case "fTokenIndex":
      return { ...state, fTokenIndex: action.value };
    case "fRoi":
      return { ...state, fRoi: action.value };
    case "fRoiErr":
      return { ...state, fRoiErr: action.value };
    case "fIsInterestProRated":
      return { ...state, fIsInterestProRated: action.value };
    case "fPrincipalAmount":
      return { ...state, fPrincipalAmount: action.value };
    case "fPrincipalAmountErr":
      return { ...state, fPrincipalAmountErr: action.value };
    case "fIsApprovalInfinite":
      return { ...state, fIsApprovalInfinite: action.value };
    case "fMaxRepaymentAmount":
      return { ...state, fMaxRepaymentAmount: action.value };
    case "resetFormBidDetails":
      return {
        fLoanDuration: "",
        fLoanDurationErr: "",
        fTokenIndex: 0,
        fRoi: "",
        fRoiErr: "",
        fIsInterestProRated: "true",
        fPrincipalAmount: "",
        fPrincipalAmountErr: "",
        fIsApprovalInfinite: false,
        fMaxRepaymentAmount: "",
        fAdminFee: "",
      };
    default:
      break;
  }
}

export default formBidDetailsReducer;
