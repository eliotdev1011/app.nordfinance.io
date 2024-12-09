import { stakingData } from "../../config/config";

async function updateStakingDuration(
  web3,
  tempkey,
  currentNetworkID,
  duration,
  accounts,
  showSuccessMessage,
  showErrorMessage,
  setOverlay
) {
  const stakingContract = new web3.eth.Contract(
    stakingData[tempkey].contractDetails[currentNetworkID].stakingABI.abi,
    stakingData[tempkey].contractDetails[currentNetworkID].stakingAddress
  );

  setOverlay(true, "Updating staking duration", "");

  try {
    await stakingContract.methods
      .updateMonthlyAPRforUser(duration)
      .send({ from: accounts[0] }, (transactionHash) => {
        setOverlay(true, "Updating staking duration", transactionHash);
      });
    showSuccessMessage("Update staking successful");
  } catch (err) {
    console.log(err);
    showErrorMessage(`Update staking duration failed!`);
  }

  setOverlay(false, "", "");
}
export { updateStakingDuration };
