import React from "react";
import PropTypes from "prop-types";
import { stakingDurationOptions } from "../config/config";

function DurationButton({ duration, selectDuration, fixedStakingDuration }) {
  return (
    <button
      className={
        fixedStakingDuration === duration
          ? `selected-btn single-percentage-btn`
          : `single-percentage-btn`
      }
      onClick={() => selectDuration(duration)}
    >
      {stakingDurationOptions[duration].short}
    </button>
  );
}

DurationButton.propTypes = {
  duration: PropTypes.number.isRequired,
  selectDuration: PropTypes.func.isRequired,
  fixedStakingDuration: PropTypes.number.isRequired,
};

export default DurationButton;
