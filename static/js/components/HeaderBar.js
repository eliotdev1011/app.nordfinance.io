import React from "react";
import { Logo } from "./icon/icon";
import Toggle from "./theme/toggle";
import PropTypes from "prop-types";

function HeaderBar({ reactGa }) {
  return (
    <>
      <div className="flex justify-between">
        <div>
          <Logo />
        </div>
        <div>
          <Toggle reactGa={reactGa} />
        </div>
      </div>
    </>
  );
}

HeaderBar.propTypes = {
  reactGa: PropTypes.object.isRequired,
};

export default HeaderBar;
