import React from "react";
import nftlanding from "../../../assets/images/nftlaanding.png";
import "./NftLanding.css";
import { nftLoansData, networkData } from "../../../config/config";
import { useDispatch, connect } from "react-redux";
import { NFT_MARKETPLACE_STATE } from "../../../redux/actions/index.action";
import sendGaEvent from "../../../components/functions/sendGaEvent";
import PropTypes from "prop-types";

function NftLanding({
  setShowComponent,
  accounts,
  displayNetworkErr,
  currentNetworkID,
  isCurrentNetworkUnsupported,
  reactGa,
}) {
  const dispatch = useDispatch();

  function goToLend() {
    dispatch({ type: NFT_MARKETPLACE_STATE, payload: "lend" });
    // goto NftMarketPlace
    setShowComponent(() => 1);
    sendGaEvent(reactGa, "NFTLoans", "GotoLend");
  }

  function goToBorrow() {
    dispatch({ type: NFT_MARKETPLACE_STATE, payload: "borrow" });
    // goto NftMarketPlace
    setShowComponent(() => 1);
    sendGaEvent(reactGa, "NFTLoans", "GotoBorrow");
  }

  return (
    <>
      {nftLoansData[currentNetworkID] ? (
        <div className="container mx-auto">
          <div className="flex flex-col-reverse md:flex-row gap-5 p-7">
            <div className="my-auto">
              <h4 className="text-xl md:text-2xl text-primary dark:text-primary ">
                Welcome to the
              </h4>
              <h2 className=" text-4xl md:text-5xl mt-3 text-primary dark:text-primary ">
                Loan Marketplace
              </h2>
              <h5 className="text-base mt-6 mb-8 md:mt-10 md:mb-14 text-primary dark:text-primary ">
                A P2P marketplace for loans on NFTs. Take loans against NFTs
                owned by you, and put bids on NFTs available on the market
              </h5>

              <div className="flex gap-5">
                <button
                  className={
                    isCurrentNetworkUnsupported
                      ? "btn-nft-gray py-2.5 px-16 cursor-not-allowed"
                      : "btn-nft-green py-2.5 px-16 cursor-pointer"
                  }
                  disabled={isCurrentNetworkUnsupported}
                  onClick={() => {
                    if (accounts[0] === undefined) {
                      displayNetworkErr(
                        `Please connect wallet to use this service`
                      );
                    } else {
                      goToLend();
                    }
                  }}
                >
                  Lend
                </button>
                <button
                  className={
                    isCurrentNetworkUnsupported
                      ? "btn-nft-gray py-2.5 px-16 cursor-not-allowed"
                      : "btn-nft-green py-2.5 px-16 cursor-pointer"
                  }
                  disabled={isCurrentNetworkUnsupported}
                  onClick={() => {
                    if (accounts[0] === undefined) {
                      displayNetworkErr(
                        `Please connect wallet to use this service`
                      );
                    } else {
                      goToBorrow();
                    }
                  }}
                >
                  Borrow
                </button>
              </div>
            </div>
            <div className="md:nft-landing-img-container overlay flex-none">
              <img src={nftlanding} alt="" className="" />
              <div className="overlay-main"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="unavailable ml-8">
            {networkData.showNftLoans[currentNetworkID]
              ? ""
              : "Coming soon on " + networkData.networkName[currentNetworkID]}
          </p>
        </>
      )}
    </>
  );
}

NftLanding.propTypes = {
  setShowComponent: PropTypes.func.isRequired,
  accounts: PropTypes.array.isRequired,
  displayNetworkErr: PropTypes.func.isRequired,
  currentNetworkID: PropTypes.number.isRequired,
  isCurrentNetworkUnsupported: PropTypes.bool.isRequired,
  reactGa: PropTypes.object.isRequired,
};

export default connect()(NftLanding);
