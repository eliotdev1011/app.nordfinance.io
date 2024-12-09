/**
 * params:
 * stakingContract: Contract
 * accounts: [userAccount]
 *
 * response:
 * [
 *  stakeToken amount,
 *  rewards,
 *  lastUpdateTime,
 *  duration (currentStakingDuration),
 *  stakingTime
 * ]
 *
 * 1 month = 30 days
 */
async function getUserData(stakingContract, accounts) {
  let response = ["0", "0", "0", "0", "0"];
  try {
    response = await stakingContract.methods.getUserData(accounts[0]).call();
  } catch (err) {
    console.log(err);
  }
  return response;
}

export { getUserData };
