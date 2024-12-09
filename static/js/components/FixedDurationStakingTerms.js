import React from "react";
import PropTypes from "prop-types";

function FixedDurationStakingTerms({ unstakeDate, fixedStakingDuration }) {
  return (
    <>
      <hr></hr>
      <article className="scrolling-box">
        <p className="text-xl pb-2">
          Please go through the following terms &amp; conditions carefully:{" "}
        </p>
        <ol className="px-4">
          <li>
            {`If you decide to stake for ${fixedStakingDuration}, you will be able to unstake only after ${unstakeDate}.`}
          </li>
          <li>
            You can update the duration by selecting same or greater duration,
            for staking and get a higher APR. And, the duration for the entire
            staked amount will reset to the new staking duration from current
            time.
          </li>
          <li>
            If you stake again, the staking duration for the entire stake amount
            (old + new) will be reset to the new duration from the current time.
          </li>
          <li>
            By clicking on the &quot;Yes and Continue&quot; button below, you
            agree to the terms and conditions mentioned above after having read
            them carefully.
          </li>
        </ol>
      </article>
    </>
  );
}

FixedDurationStakingTerms.propTypes = {
  unstakeDate: PropTypes.string,
  fixedStakingDuration: PropTypes.string,
};

export default FixedDurationStakingTerms;
