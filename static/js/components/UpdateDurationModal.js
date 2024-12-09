import React from "react";
import { updateStakingDuration } from "./functions/updateStakingDuration";
import Modal from "react-modal";
import PropTypes from "prop-types";

function UpdateDurationModal({
  isUpdateDurationModalOpen,
  setIsUpdateDurationModalOpen,
  web3,
  tempkey,
  currentNetworkID,
  fixedStakingDuration,
  accounts,
  showSuccessMessage,
  showErrorMessage,
  setOverlay,
  stakedAmount,
  currentUnstakeDate,
  futureUnstakeDate,
}) {
  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      background: "var(--color-bg-primary)",
      border: "0",
      borderRadius: "10px",
      overflow: "none",
      color: "var(--color-text-primary)",
    },
  };
  return (
    <Modal
      isOpen={isUpdateDurationModalOpen}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      style={customStyles}
      contentLabel="update duration Modal"
      appElement={document.getElementById("root") || undefined}
    >
      <div className="">
        <div className="flex mb-6">
          <p className="text-2xl">Please be informed: </p>
        </div>
        <hr></hr>
        <div className="flex py-4 justify-between gap-4">
          <p className="text-sm text-color pr-10">Staked Amount</p>
          <p className="font-bold text-sm-right">{stakedAmount} NORD</p>
        </div>
        <hr></hr>
        <div className="flex py-4 justify-between gap-4">
          <p className="text-sm text-color pr-10">Current staking end time</p>
          <p className="font-bold text-sm-right">{currentUnstakeDate}</p>
        </div>
        <hr></hr>
        <div>
          <div className="flex py-4 justify-between gap-4">
            <p className="text-sm text-color pr-10">
              Staking end time after update
            </p>
            <p className="font-bold text-sm-right text-right ">
              {futureUnstakeDate}
            </p>
          </div>
          <hr></hr>
          <div className="flex mt-4 gap-6">
            <button
              className=" flex py-2 px-6 btn-green cursor-pointer focus:outline-none"
              onClick={async () => {
                await updateStakingDuration(
                  web3,
                  tempkey,
                  currentNetworkID,
                  fixedStakingDuration,
                  accounts,
                  showSuccessMessage,
                  showErrorMessage,
                  setOverlay
                );
                setIsUpdateDurationModalOpen(false);
              }}
            >
              Yes and Continue
            </button>
            <button
              className=" flex py-2 px-6 btn-cancel cursor-pointer focus:outline-none"
              onClick={() => {
                setIsUpdateDurationModalOpen(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

UpdateDurationModal.propTypes = {
  isUpdateDurationModalOpen: PropTypes.bool.isRequired,
  setIsUpdateDurationModalOpen: PropTypes.func.isRequired,
  web3: PropTypes.object.isRequired,
  tempkey: PropTypes.number,
  currentNetworkID: PropTypes.number.isRequired,
  fixedStakingDuration: PropTypes.number,
  accounts: PropTypes.array.isRequired,
  showSuccessMessage: PropTypes.func.isRequired,
  showErrorMessage: PropTypes.func.isRequired,
  setOverlay: PropTypes.func.isRequired,
  stakedAmount: PropTypes.string.isRequired,
  currentUnstakeDate: PropTypes.string.isRequired,
  futureUnstakeDate: PropTypes.string.isRequired,
};

export default UpdateDurationModal;
