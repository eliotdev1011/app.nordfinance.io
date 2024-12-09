import React, { useState, useEffect } from "react";
import "./NftLanding/NftLanding.css";
import { useDispatch, connect } from "react-redux";
import NftLanding from "./NftLanding/NftLanding";
import PropTypes from "prop-types";
import NftMarketPlace from "./NftMarketPlace/NftMarketPlace";
import LoadingOverlay from "react-loading-overlay";
import Loading from "../../assets/images/loading.svg";
import { networkData } from "../../config/config";
import Window from "../../assets/images/window.png";
import getNetworkSubname from "../../components/functions/getNetworkSubname";
import { ToastContainer, toast } from "react-toastify";
import { WALLET_CHANGE } from "../../redux/actions/resetRedux.action.js";

function NftRoot({
  web3,
  displayData,
  currentNetworkID,
  accounts,
  showErrorMessage,
  showSuccessMessage,
  displayCardClickError,
  updateBalance,
  retriggerFlag,
  invertRetriggerFlag,
  isCurrentNetworkUnsupported,
  reactGa,
}) {
  const dispatch = useDispatch();
  const [showComponent, setShowComponent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [{ loadingMessage, transactionHash }, setOverlayText] = useState({
    loadingMessage: "",
    transactionHash: "",
  });

  function displayNetworkErr(message) {
    toast.warn(message, {
      containerId: "networkErr",
      position: "top-right",
      autoClose: false,
      hideProgressBar: true,
      closeOnClick: true,
      closeButton: true,
      pauseOnHover: true,
      draggable: false,
      progress: undefined,
    });
  }

  useEffect(() => {
    if (isCurrentNetworkUnsupported) {
      // redirect to NftLanding
      setShowComponent(() => 0);
    }
  }, [isCurrentNetworkUnsupported]);

  useEffect(() => {
    // redirect to NftLanding
    setShowComponent(() => 0);
  }, [currentNetworkID]);

  useEffect(() => {
    if (window.sessionStorage.getItem("walletAddress") === null && web3) {
      window.sessionStorage.setItem(
        "walletAddress",
        web3.utils.toChecksumAddress(accounts[0])
      );
    }

    if (
      window.sessionStorage.getItem("walletAddress") !== null &&
      web3 &&
      window.sessionStorage.getItem("walletAddress") !==
        web3.utils.toChecksumAddress(accounts[0])
    ) {
      // redirect to NftLanding
      dispatch({ type: WALLET_CHANGE });
      setShowComponent(() => 0);
      window.sessionStorage.setItem(
        "walletAddress",
        web3.utils.toChecksumAddress(accounts[0])
      );
    }
  }, [accounts]);

  return (
    <>
      <LoadingOverlay
        active={isLoading}
        spinner={
          <div align="center">
            <img src={Loading} alt="" />
          </div>
        }
        text={
          <div align="center">
            <div className="flex flex-row gap-2 justify-center">
              <p className="font-bold loading-message-text">{loadingMessage}</p>
              {transactionHash ? (
                <a
                  href={
                    networkData.blockExplorer[currentNetworkID] +
                    "tx/" +
                    transactionHash
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={Window}
                    alt="Etherscan"
                    className="h-4 mb-7 ml-1 inline cursor-pointer"
                  />
                </a>
              ) : (
                <></>
              )}
            </div>
            {transactionHash ? (
              <p>Please do not press the back button or refresh the page.</p>
            ) : (
              <></>
            )}
          </div>
        }
      >
        {showComponent === 0 ? (
          <NftLanding
            web3={web3}
            currentNetworkID={currentNetworkID}
            accounts={accounts}
            displayNetworkErr={displayNetworkErr}
            setShowComponent={setShowComponent}
            isCurrentNetworkUnsupported={isCurrentNetworkUnsupported}
            reactGa={reactGa}
          />
        ) : showComponent === 1 &&
          getNetworkSubname(currentNetworkID) === "eth" ? (
          <NftMarketPlace
            web3={web3}
            displayData={displayData}
            currentNetworkID={currentNetworkID}
            accounts={accounts}
            showErrorMessage={showErrorMessage}
            showSuccessMessage={showSuccessMessage}
            displayCardClickError={displayCardClickError}
            updateBalance={updateBalance}
            setShowComponent={setShowComponent}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setOverlayText={setOverlayText}
            retriggerFlag={retriggerFlag}
            invertRetriggerFlag={invertRetriggerFlag}
            reactGa={reactGa}
          />
        ) : (
          <></>
        )}
        <ToastContainer
          enableMultiContainer
          containerId={"walletWarn"}
          limit={1}
          position={toast.POSITION.TOP_LEFT}
        />
      </LoadingOverlay>
    </>
  );
}

NftRoot.propTypes = {
  web3: PropTypes.object.isRequired,
  accounts: PropTypes.array.isRequired,
  displayData: PropTypes.object.isRequired,
  nordBalance: PropTypes.string,
  currentNetworkID: PropTypes.number.isRequired,
  showErrorMessage: PropTypes.func,
  showSuccessMessage: PropTypes.func,
  displayCardClickError: PropTypes.func,
  updateBalance: PropTypes.func,
  retriggerFlag: PropTypes.bool.isRequired,
  invertRetriggerFlag: PropTypes.func.isRequired,
  isCurrentNetworkUnsupported: PropTypes.bool.isRequired,
  reactGa: PropTypes.object.isRequired,
};

export default connect()(NftRoot);
