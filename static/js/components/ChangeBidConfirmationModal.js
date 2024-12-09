import React from "react";
import Modal from "react-modal";
import PropTypes from "prop-types";
import sendGaEvent from "./functions/sendGaEvent";
function ChangeBidConfirmationModal({
  isChangeBidModalOpen,
  customStyles,
  setIsBidModalOpen,
  setIsChangeBidModalOpen,
  reactGa,
  nftName,
}) {
  return (
    <Modal
      isOpen={isChangeBidModalOpen}
      style={customStyles}
      onRequestClose={() => {
        setIsBidModalOpen(false);
      }}
      appElement={document.getElementById("root") || undefined}
    >
      <div className="px-6 py-5">
        <h3 className="text-2xl nft-detail-green-color-text font-black ">
          Please be informed:
        </h3>
        <h5 className="text-primary  mt-2">
          Previously submitted bid will be cancelled, and gas will be charged.
        </h5>
        <h5 className="text-primary  mt-2">Would you like to continue?</h5>
      </div>
      <div className="px-6 py-5">
        <div className="gap-5 flex">
          <button
            className="btn-nft-gold px-12 py-2.5 mb-2"
            onClick={() => {
              setIsChangeBidModalOpen(false);
              sendGaEvent(reactGa, "LendNFT", "ChangeBidCancel", `${nftName}`);
            }}
          >
            Cancel
          </button>
          <button
            className="btn-nft-green px-12 py-2.5 mb-2"
            onClick={() => {
              setIsChangeBidModalOpen(false);
              setIsBidModalOpen(true);
              sendGaEvent(
                reactGa,
                "LendNFT",
                "ChangeBidContinue",
                `${nftName}`
              );
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </Modal>
  );
}

ChangeBidConfirmationModal.propTypes = {
  isChangeBidModalOpen: PropTypes.bool.isRequired,
  customStyles: PropTypes.object.isRequired,
  setIsBidModalOpen: PropTypes.func.isRequired,
  setIsChangeBidModalOpen: PropTypes.func.isRequired,
  reactGa: PropTypes.object.isRequired,
  nftName: PropTypes.string.isRequired,
};

export default ChangeBidConfirmationModal;
