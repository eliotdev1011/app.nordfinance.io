import React from "react";
import PropTypes from "prop-types";

function PercentButton({ percent, handlePercentageClick }) {
  return (
    <button
      className="single-percentage-btn"
      onClick={() => handlePercentageClick(percent, 100)}
    >
      {percent}%
    </button>
  );
}

PercentButton.propTypes = {
  percent: PropTypes.number.isRequired,
  handlePercentageClick: PropTypes.func.isRequired,
};

export default PercentButton;
