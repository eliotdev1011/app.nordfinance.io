import React from "react";
import Modal from "react-modal";
import PropTypes from "prop-types";

function EpnsConfirmationModal({
  isChangeEpnsModalOpen,
  customStyles,
  epnsSubscribe,
  setIsChangeEpnsModalOpen,
}) {
  return (
    <Modal
      isOpen={isChangeEpnsModalOpen}
      style={customStyles}
      appElement={document.getElementById("root") || undefined}
    >
      <div className="px-6 py-5 sm:px-1 sm:py-1 ">
        <p className="text-2xl text-primary pb-3">Please be informed:</p>
        <hr></hr>
        <p className="text-sm text-primary pt-3">
          You will be subscribed to the push notifications.
        </p>
        <p className="text-sm text-primary mt-2">
          To view all notifications click bell icon after subscription.
        </p>
        <p className="text-sm text-primary mt-2">Would you like to continue?</p>
      </div>
      <div className="flex pt-6 justify-start py-5 gap-6">
        <button
          className="flex py-2 px-6 btn-green cursor-pointer focus:outline-none"
          onClick={() => {
            setIsChangeEpnsModalOpen(false);
            epnsSubscribe();
          }}
        >
          Continue
        </button>
        <button
          className="flex py-2 px-6 btn-cancel cursor-pointer focus:outline-none"
          onClick={() => {
            setIsChangeEpnsModalOpen(false);
          }}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

EpnsConfirmationModal.propTypes = {
  isChangeEpnsModalOpen: PropTypes.bool.isRequired,
  customStyles: PropTypes.object.isRequired,
  epnsSubscribe: PropTypes.func.isRequired,
  setIsChangeEpnsModalOpen: PropTypes.func.isRequired,
};

export default EpnsConfirmationModal;
