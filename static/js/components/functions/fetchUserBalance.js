async function fetchUserBalance(erc20Contract, userAddress) {
  try {
    const balance = await erc20Contract.methods
      .balanceOf(userAddress)
      .call({ from: userAddress });
    return balance;
  } catch (err) {
    console.error("fetchUserBalance failed: ", err);
  }
}

export { fetchUserBalance };
