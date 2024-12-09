function getNetworkSubname(currentNetworkID) {
  switch (currentNetworkID) {
    case 1:
      return "eth";
    case 56:
      return "bsc";
    default:
      return "undef";
  }
}

export default getNetworkSubname;
