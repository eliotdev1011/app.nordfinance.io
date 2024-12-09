import React from "react";
import "./NftCard.css";
import numbro from "numbro";
import NftMediaPlayer from "../NftMediaPlayer/NftMediaPlayer";
import NftName from "../NftName";
import Info from "../../assets/images/info.svg";
import Loading from "../../assets/images/loading.svg";
import sendGaEvent from "../functions/sendGaEvent";
import PropTypes from "prop-types";

function NftCard({
  nftName,
  nftDate,
  image,
  traitCount,
  price,
  nftType,
  nonCollateralTokenBalance,
  nftIndex,
  // loanName,
  setDetailComponent,
  paymentToken,
  animationURL,
  reactGa,
}) {
  return (
    <>
      <div className="nft-card-container">
        <div>
          <div
            className={
              nftType === "edit"
                ? "nft-inner-img-container nft-inner-img-edit-container relative"
                : "nft-inner-img-container relative"
            }
          >
            {animationURL ? (
              <NftMediaPlayer
                animationURL={animationURL}
                isThisDetailComponent={false}
              />
            ) : (
              <img src={image} alt="NFT image" className="" />
            )}
            {nonCollateralTokenBalance && (
              <div className="text-white border w-1/5 rounded-lg text-center absolute bottom-0 left-0 mb-2 ml-2 bg-black">
                {`${nonCollateralTokenBalance.nonCollateralTokenCount} / ${nonCollateralTokenBalance.totalTokenCount}`}
              </div>
            )}
            {/* {loanName && (
              <div
                className="tooltip"
                style={{ top: "0px", right: "0px", position: "absolute" }}
              >
                <p className="border text-white text-sm rounded-lg text-center bg-black px-1 py-0.5 mt-2 mr-2 cursor-pointer">
                  {loanName}
                </p>
                <span className="tooltiptext">
                  Auto-generated nickname to identify loans
                </span>
              </div>
            )} */}
          </div>
        </div>

        <div className="mt-2 p-3">
          <NftName nftName={nftName} />
          <div className="flex gap-2">
            <h5 className="dark:text-secondary text-secondary text-sm ">
              {nftDate}
            </h5>
            <h5 className="dark:text-secondary text-secondary text-sm ">•</h5>
            <h5 className="dark:text-secondary text-secondary text-sm ">
              {traitCount} attribute{traitCount === 1 ? "" : "s"}
            </h5>
          </div>
          <div className="mt-2 flex justify-between">
            <div className="">
              {nftType === "bid" ? (
                <div className="">
                  <h4 className="text-primary dark:text-primary text-base ">
                    {numbro(price).format({
                      average: true,
                      mantissa: 4,
                    })}{" "}
                    {paymentToken}
                  </h4>
                  <h5 className="text-primary dark:text-primary text-sm ">
                    Price
                  </h5>
                </div>
              ) : nftType === "edit" ? (
                price !== "NA" ? (
                  <div className="">
                    <h4 className="text-secondary dark:text-secondary text-base  ">
                      {numbro(price).format({
                        average: true,
                        mantissa: 4,
                      })}{" "}
                      {paymentToken}
                    </h4>
                    <h5 className="text-primary dark:text-primary text-sm ">
                      Price
                    </h5>
                  </div>
                ) : (
                  <></>
                )
              ) : nftType === "loan" ? (
                <div className="">
                  <h4 className="text-secondary dark:text-secondary text-base  ">
                    {numbro(price).format({
                      average: true,
                      mantissa: 4,
                    })}{" "}
                    {paymentToken}
                  </h4>
                  <h5 className="text-primary dark:text-primary text-sm ">
                    Price
                  </h5>
                </div>
              ) : nftType === "checkBids" ? (
                price !== "NA" ? (
                  <div className="">
                    <h4 className="text-secondary dark:text-secondary text-base  ">
                      {numbro(price).format({
                        average: true,
                        mantissa: 4,
                      })}{" "}
                      {paymentToken}
                    </h4>
                    <h5 className="text-primary dark:text-primary text-sm ">
                      Price
                    </h5>
                  </div>
                ) : (
                  <></>
                )
              ) : nftType === "disabled" ? (
                <div className="">
                  <h4 className="text-secondary dark:text-secondary text-base  ">
                    {numbro(price).format({
                      average: true,
                      mantissa: 4,
                    })}{" "}
                    {paymentToken}
                  </h4>
                  <h5 className="text-primary dark:text-primary text-sm ">
                    Price
                  </h5>
                </div>
              ) : (
                <></>
              )}
            </div>
            <div className="my-auto flex-none">
              {nftType === "bid" ? (
                <button
                  className="btn-nft-green px-6 py-1 "
                  onClick={() => {
                    // goto NftDetail
                    setDetailComponent(() => {
                      return { component: 1, nftIndex };
                    });
                    sendGaEvent(
                      reactGa,
                      "LendNFT",
                      "BidClick",
                      `${nftName}: ${price} ${paymentToken}`
                    );
                  }}
                >
                  Bid
                </button>
              ) : nftType === "edit" ? (
                <button
                  className="btn-nft-gold px-6 py-1 "
                  onClick={() => {
                    // goto NftDetail
                    setDetailComponent(() => {
                      return { component: 1, nftIndex };
                    });
                    sendGaEvent(reactGa, "LendNFT", "EditClick", `${nftName}`);
                  }}
                >
                  Edit
                </button>
              ) : nftType === "selected" ? (
                <p className="text-lg nft-green font-black">Bid selected</p>
              ) : nftType === "rejected" ? (
                <p className="text-lg nft-red font-black">Bid not selected</p>
              ) : nftType === "cancelled" ? (
                <p className="text-lg nft-red font-black">Bid cancelled</p>
              ) : nftType === "loan" ? (
                <button
                  className="btn-nft-green px-6 py-1 "
                  onClick={() => {
                    // goto NftBidDetail
                    setDetailComponent(() => {
                      return { component: 2, nftIndex };
                    });
                    sendGaEvent(
                      reactGa,
                      "BorrowNFT",
                      "+ LoanClick",
                      `${nftName}: ${price} ${paymentToken}`
                    );
                  }}
                >
                  + Loan
                </button>
              ) : nftType === "checkBids" ? (
                <button
                  className="btn-nft-gold px-6 py-1 "
                  onClick={() => {
                    // goto NftBidDetail
                    setDetailComponent(() => {
                      return { component: 2, nftIndex };
                    });
                    sendGaEvent(
                      reactGa,
                      "BorrowNFT",
                      "CheckBidsClick",
                      `${nftName}`
                    );
                  }}
                >
                  Check Bids
                </button>
              ) : nftType === "disabled" ? (
                <div className="flex justify-between">
                  <button
                    className="btn-nft-gray px-6 py-1 cursor-not-allowed"
                    disabled
                  >
                    Bid
                  </button>
                  <p>
                    <div className="tooltip">
                      <img
                        src={Info}
                        alt=""
                        className="mb-1 ml-1 h-4 w-4 cursor-pointer"
                      />
                      <span className="tooltiptext">
                        Borrowers can&apos;t bid on their own NFTs
                      </span>
                    </div>
                  </p>
                </div>
              ) : nftType === "loanStarted" ? (
                <div className="flex justify-between">
                  <p className="text-lg nft-green font-black">Loan started</p>
                  <div className="tooltip">
                    <img
                      src={Info}
                      alt=""
                      className="mb-1 ml-1 h-4 w-4 cursor-pointer"
                    />
                    <span className="tooltiptext">
                      This NFT has been transferred to escrow, it won&apos;t be
                      here after a short while
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div align="center">
                    <img src={Loading} alt="" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

NftCard.propTypes = {
  nftName: PropTypes.string,
  nftDate: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  traitCount: PropTypes.number.isRequired,
  price: PropTypes.string,
  nftType: PropTypes.string,
  nonCollateralTokenBalance: PropTypes.object,
  nftIndex: PropTypes.number.isRequired,
  loanName: PropTypes.string,
  setDetailComponent: PropTypes.func.isRequired,
  web3: PropTypes.object.isRequired,
  currentNetworkID: PropTypes.number.isRequired,
  paymentToken: PropTypes.string,
  animationURL: PropTypes.string,
  reactGa: PropTypes.object.isRequired,
};

export default NftCard;
