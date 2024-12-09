import { nftLoansData } from "../../config/config";
import { fetchUserBalance } from "./fetchUserBalance";
import numbro from "numbro";
async function checkLenderLiquidity(
  web3,
  currentNetworkID,
  erc20ContractAddress,
  loanPrincipalAmount,
  lenderAddress,
  showSuccessMessage,
  showErrorMessage
) {
  const token = nftLoansData[currentNetworkID].supportedErc20Tokens.find(
    (token) => token.tokenAddress === erc20ContractAddress
  );
  const erc20Contract = new web3.eth.Contract(
    token.tokenABI.abi,
    erc20ContractAddress
  );
  const lenderBalance = await fetchUserBalance(erc20Contract, lenderAddress);

  const averagedPrincipal = numbro(
    web3.utils.fromWei(loanPrincipalAmount, token.web3EquivalentPrecision)
  ).format({ mantissa: 4, average: true });
  const doesLenderHaveLiquidity = web3.utils
    .toBN(lenderBalance)
    .gte(web3.utils.toBN(loanPrincipalAmount));

  if (doesLenderHaveLiquidity) {
    showSuccessMessage(
      `Lender has sufficient (${averagedPrincipal} ${token.subname}) balance`
    );
  } else {
    showErrorMessage(`Loan failed: Lender does not have sufficient balance`);
  }
  return doesLenderHaveLiquidity;
}

export { checkLenderLiquidity };
