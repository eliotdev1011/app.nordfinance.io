import React from "react";
import PropTypes from "prop-types";
import { networkData } from "../config/config";
import { TxnExternalLink } from "./icon/icon";
function TxnHashIcon({ txHash, currentNetworkID, color }) {
  return (
    <>
      {txHash && (
        <div className="flex mt-1">
          <a
            href={networkData.blockExplorer[currentNetworkID] + "tx/" + txHash}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div
              className={`p-0.5 border rounded-full
                ${
                  color === "gold"
                    ? `nft-loan-border-gold`
                    : `nft-loan-border-blue`
                } `}
            >
              <TxnExternalLink />
            </div>
          </a>
        </div>
      )}
    </>
  );
}

TxnHashIcon.propTypes = {
  txHash: PropTypes.string,
  currentNetworkID: PropTypes.number,
  color: PropTypes.string,
};

export default TxnHashIcon;
