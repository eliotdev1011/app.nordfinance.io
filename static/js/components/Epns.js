import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import BellIcon from "react-bell-icon";
import { channels } from "@epnsproject/frontend-sdk";
import { ethers } from "ethers";
import EpnsConfirmationModal from "./EpnsConfirmationModal";
import { channelAddress } from "../config/config";
import EpnsDropDownModal from "./EpnsDropDownModal";

function Epns({ account, chainId, showSuccessMessage, setOverlay, reactGa }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [etherProvider, setEtherProvider] = useState(null);
  const [isChangeEpnsModalOpen, setIsChangeEpnsModalOpen] = useState(false);
  const [isDropDownModalOpen, setIsDropDownModalOpen] = useState(false);
  const [triggerFetchNotifs, setTriggerFetchNotifs] = useState(false);

  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      background: "var(--color-bg-primary)",
      borderRadius: "10px",
      width: "xl:450px lg:450px md:350px sm:300px",
      border: "0px",
      overflow: "none",
      color: "var(--color-text-primary)",
    },
  };

  const handleToggleBell = (flag) => {
    if (flag) {
      setIsSubscribed(true);
      showSuccessMessage("You are now subscribed to NordFinance on EPNS");
    } else {
      setIsSubscribed(false);
      showSuccessMessage("You are now unsubscribed from NordFinance on EPNS");
    }
  };

  const epnsSubscribe = async () => {
    if (!isSubscribed) {
      setOverlay(true, "Subscribing to NordFinance on EPNS.");
      await channels.optIn(
        etherProvider.getSigner(account),
        channelAddress,
        chainId,
        account,
        {
          onSuccess: () => handleToggleBell(true),
        }
      );
      setOverlay(false);
      reactGa.event({
        category: "Epns",
        action: "Subscription",
        label: "Activated",
      });
    }
  };

  const epnsUnSubscribe = async () => {
    if (isSubscribed) {
      setOverlay(true, "Unsubscribing from NordFinance on EPNS.");
      await channels.optOut(
        etherProvider.getSigner(account),
        channelAddress,
        chainId,
        account,
        {
          onSuccess: () => handleToggleBell(false),
        }
      );
      setIsDropDownModalOpen(false);
      setOverlay(false);
      reactGa.event({
        category: "Epns",
        action: "Subscription",
        label: "Cancelled",
      });
    }
  };

  useEffect(() => {
    if (!account) return;
    const etherProvider = new ethers.providers.Web3Provider(
      web3.currentProvider
    );
    setEtherProvider(etherProvider);
    (async function () {
      try {
        const res = await channels.isUserSubscribed(account, channelAddress);
        setIsSubscribed(res);
      } catch (err) {
        console.log("isUserSubscribed: ", err);
      }
    })();
  }, [account]);

  return (
    <>
      {account && (
        <div
          style={{ cursor: "pointer", width: "30px" }}
          onClick={() => {
            if (isSubscribed) {
              setIsDropDownModalOpen(true);
              setTriggerFetchNotifs(true);
            } else {
              setIsChangeEpnsModalOpen(true);
            }
          }}
        >
          {isSubscribed ? (
            <BellIcon
              width="25"
              active={true}
              animate={false}
              color={"var(--color-area-chart)"}
            />
          ) : (
            <BellIcon
              width="25"
              active={false}
              animate={false}
              color={"var(--color-area-chart)"}
            />
          )}
        </div>
      )}
      <EpnsConfirmationModal
        isChangeEpnsModalOpen={isChangeEpnsModalOpen}
        customStyles={customStyles}
        epnsSubscribe={epnsSubscribe}
        setIsChangeEpnsModalOpen={setIsChangeEpnsModalOpen}
      />
      <EpnsDropDownModal
        isDropDownModalOpen={isDropDownModalOpen}
        account={account}
        epnsUnSubscribe={epnsUnSubscribe}
        triggerFetchNotifs={triggerFetchNotifs}
        setTriggerFetchNotifs={setTriggerFetchNotifs}
        setIsDropDownModalOpen={setIsDropDownModalOpen}
      />
    </>
  );
}

Epns.propTypes = {
  account: PropTypes.string,
  chainId: PropTypes.number,
  showSuccessMessage: PropTypes.func,
  setOverlay: PropTypes.func,
  reactGa: PropTypes.object.isRequired,
};
export default Epns;
