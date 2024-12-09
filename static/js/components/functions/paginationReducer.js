function paginationReducer(state, action) {
  switch (action.type) {
    case "items":
      return { ...state, items: action.value };
    case "currentItems":
      return { ...state, currentItems: action.value };
    case "pageCount":
      return { ...state, pageCount: action.value };
    case "itemOffset":
      return { ...state, itemOffset: action.value };
    case "resetPagination":
      return { items: [], currentItems: [], pageCount: 0, itemOffset: 0 };
    default:
      break;
  }
}

export default paginationReducer;
