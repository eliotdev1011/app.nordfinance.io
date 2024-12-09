import { fetchAdminFee } from "./fetchAdminFee";
async function setAdminFee(
  nftLoanContract,
  web3,
  tokenAddress,
  formBidDetailsDispatch
) {
  const adminFee = await fetchAdminFee(nftLoanContract, web3, tokenAddress);
  formBidDetailsDispatch({
    type: "fAdminFee",
    value: adminFee,
  });
}

export { setAdminFee };
