import React from "react";
import Info from "../assets/images/info.svg";
import PropTypes from "prop-types";

function NftName({ nftName }) {
  return (
    <>
      {nftName === "Anonymous Owner" ? (
        <div className="flex justify-start">
          <h3 className="text-primary dark:text-primary text-base font-black">
            {nftName}
          </h3>
          <p>
            <div className="tooltip">
              <img
                src={Info}
                alt=""
                className="mb-1 ml-2 h-4 w-4 cursor-pointer"
              />
              <span
                className="tooltiptext"
                style={{ width: "10rem", left: "5rem" }}
              >
                An NFT with no name
              </span>
            </div>
          </p>
        </div>
      ) : (
        <h3 className="text-primary dark:text-primary text-base font-black">
          {nftName}
        </h3>
      )}
    </>
  );
}

export default NftName;

NftName.propTypes = {
  nftName: PropTypes.string,
};
