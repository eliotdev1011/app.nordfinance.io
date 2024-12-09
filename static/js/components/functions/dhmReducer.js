function dhmReducer(state, action) {
  switch (action.type) {
    case "d":
      return { ...state, d: action.value };
    case "h":
      return { ...state, h: action.value };
    case "m":
      return { ...state, m: action.value };
    case "timeRemaining":
      return { ...state, timeRemaining: action.value };
    default:
      break;
  }
}

export default dhmReducer;
