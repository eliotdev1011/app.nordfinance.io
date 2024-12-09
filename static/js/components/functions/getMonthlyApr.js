async function getMonthylApr(stakingContract, duration) {
  try {
    const response = await stakingContract.methods.monthlyAPR(duration).call();
    return response;
  } catch (err) {
    console.log(err);
    return 0;
  }
}

export { getMonthylApr };
