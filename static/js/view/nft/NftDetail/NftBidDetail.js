import React, { useState, useEffect, useMemo } from "react";
import "./NftDetail.css";
import Modal from "react-modal";
import { BackIcon, LinkIcon, ShipIcon } from "../../../components/icon/icon";
import getNetworkSubname from "../../../components/functions/getNetworkSubname";
import { useSelector, useDispatch } from "react-redux";
import fetchNonceRequest from "../../../redux/thunks/fetchNonceRequest.thunk.js";
import fetchOffersOnNftRequest from "../../../redux/thunks/fetchOffersOnNft.thunk.js";
import {
  openSeaEndPoint,
  openSeaApiKey,
  nftLoansEndPoint,
  nftLoansData,
  nftLoanStates,
  uint32ComplementOfZero,
} from "../../../config/config";
import { deregisterNft } from "../../../components/functions/deregisterNft";
import { selectBid } from "../../../components/functions/selectBid";
import { approveNft } from "../../../components/functions/approveNft";
import { checkLenderLiquidity } from "../../../components/functions/checkLenderLiquidity";
import sendGaEvent from "../../../components/functions/sendGaEvent";
import getTokenMap from "../../../components/functions/getTokenMap";
import NftMediaPlayer from "../../../components/NftMediaPlayer/NftMediaPlayer";
import NftName from "../../../components/NftName";
import numbro from "numbro";
import axios from "axios";
import { toChecksumAddress } from "ethereum-checksum-address";
import { useBeforeUnload } from "../../../hooks/useBeforeUnload";
import dummyNftImg from "../../../assets/images/placeholder-nft.png";
import { getBorrowerSignature } from "../../../components/functions/getBorrowerSignature";
import moment from "moment";
import PropTypes from "prop-types";

function NftBidDetail({
  nftID,
  contractAddress,
  setDetailComponent,
  currentNetworkID,
  loanID,
  isFungible,
  accounts,
  web3,
  setIsLoading,
  setOverlayText,
  showSuccessMessage,
  showErrorMessage,
  invertRetriggerFlag,
  setMarketState,
  price,
  paymentToken,
  paginationDispatch,
  reactGa,
}) {
  const dispatch = useDispatch();
  const borrowerNonce = useSelector((state) => state.fetchNonceReducer);

  const offersResponse = useSelector((state) => state.fetchOffersOnNftReducer);
  const offers = offersResponse?.offers?.offers;

  const [nftToShow, setNftToShow] = useState({});

  const [isAcceptBidModalOpen, setIsAcceptBidModalOpen] = useState(false);

  const [isLoanCreated, setIsLoanCreated] = useState(false);
  const [offerIndex, setOfferIndex] = useState(0);
  const [isLoanRequested, setIsLoanRequested] = useState(false);
  const [isContractCallInProgress, setIsContractCallInProgress] =
    useState(false);
  const [currentLoanID, setCurrentLoanID] = useState(loanID);

  const [loanInfo, setLoanInfo] = useState({});

  const network = getNetworkSubname(currentNetworkID);

  const nftLoanContract = new web3.eth.Contract(
    nftLoansData[currentNetworkID].nftLoanContractABI,
    nftLoansData[currentNetworkID].nftLoanContractAddress
  );

  const nftContract =
    isFungible === "true"
      ? new web3.eth.Contract(
          nftLoansData[currentNetworkID].nft1155ContractABI,
          contractAddress
        )
      : new web3.eth.Contract(
          nftLoansData[currentNetworkID].nft721ContractABI,
          contractAddress
        );

  const tokenMap = useMemo(() => getTokenMap(currentNetworkID));

  function resetPagination() {
    Promise.resolve().then(() =>
      paginationDispatch({ type: "resetPagination" })
    );
  }

  function exitDetailComponent() {
    Promise.resolve().then(() =>
      setDetailComponent({ component: 0, nftIndex: 0 })
    );
  }

  function sendBidAcceptanceReactGaEvent(eventState) {
    sendGaEvent(
      reactGa,
      "BorrowNFT",
      `BidAcceptance${eventState}`,
      `${nftToShow?.name}: ${
        offers?.length &&
        web3.utils.fromWei(
          offers[offerIndex]?.bidDetails?.loanPrincipalAmount,
          nftLoansData[currentNetworkID].supportedErc20Tokens[
            tokenMap.get(offers[offerIndex]?.bidDetails?.loanERC20)
          ].web3EquivalentPrecision
        )
      } ${
        nftLoansData[currentNetworkID].supportedErc20Tokens[
          tokenMap.get(offers[offerIndex]?.bidDetails?.loanERC20)
        ]?.subname
      }, ${
        offers?.length &&
        numbro(offers[offerIndex]?.bidDetails?.loanDuration / 604800).format({
          average: true,
          mantissa: 4,
        })
      } weeks, ${
        offers?.length && offers[offerIndex]?.bidDetails?.loanInterestRate / 100
      }%`
    );
  }

  async function registerNft(
    nftID,
    nftContractAddress,
    borrowerAddress,
    borrowerSignedMessage,
    isFungible,
    network,
    price,
    paymentToken,
    showSuccessMessage,
    showErrorMessage,
    asset,
    borrowerNonce
  ) {
    try {
      const response = await axios.post(
        `${nftLoansEndPoint}/${network}/register-nft`,
        {
          nftID,
          contractAddress: nftContractAddress,
          borrowerAddress: borrowerAddress,
          signedMessage: borrowerSignedMessage,
          price,
          paymentToken,
          asset,
          borrowerNonce,
          isFungible,
        }
      );
      showSuccessMessage(`NFT successfully put as collateral`);
      return {
        success: response.data.currentState === nftLoanStates.ACCEPTING_BIDS,
        newLoanID: response.data.loan_id,
      };
    } catch (err) {
      showErrorMessage(`Failure while putting NFT as collateral`);
      return { success: false };
    }
  }

  async function putNftAsCollateral(
    web3,
    nftID,
    borrowerNonce,
    isFungible,
    contractAddress,
    borrowerAddress,
    setOverlayText,
    showSuccessMessage,
    showErrorMessage
  ) {
    if (borrowerNonce.success) {
      setOverlayText(() => {
        return {
          loadingMessage: "Awaiting user signature to put up NFT as collateral",
          transactionHash: "",
        };
      });
      const borrowerSignedMessage = await getBorrowerSignature(
        web3,
        nftID,
        borrowerNonce.nonce,
        contractAddress,
        borrowerAddress,
        currentNetworkID,
        showSuccessMessage,
        showErrorMessage
      );

      setOverlayText(() => {
        return {
          loadingMessage: "",
          transactionHash: "",
        };
      });
      if (borrowerSignedMessage !== "error") {
        setOverlayText(() => {
          return {
            loadingMessage: "Putting up NFT as collateral...",
            transactionHash: "",
          };
        });

        const imageURL =
          nftToShow?.image_url !== "/static/media/placeholder-nft.4cdd2d41.png"
            ? nftToShow?.image_url
            : undefined;

        const assetObject = {
          name: nftToShow?.name,
          originalImageURL: nftToShow?.image_original_url,
          description: nftToShow?.asset_contract?.description,
          traits: nftToShow?.traits,
          collection: nftToShow?.collection?.name,
          imageURL,
          animationURL: nftToShow?.animation_url,
          price: price || "0",
          paymentToken: paymentToken,
          isFungible: isFungible.toString(),
        };
        const regNftResult = await registerNft(
          nftID,
          contractAddress,
          borrowerAddress,
          borrowerSignedMessage,
          isFungible,
          network,
          price,
          paymentToken,
          showSuccessMessage,
          showErrorMessage,
          assetObject,
          borrowerNonce.nonce
        );

        if (regNftResult.success) {
          setCurrentLoanID(() => regNftResult?.newLoanID);
          setIsLoanCreated(() => true);
        } else {
          throw new Error("error while registering NFT");
        }
      } else {
        throw new Error("error while getting user signature");
      }
    }
    setIsLoanRequested(() => false);
    setOverlayText(() => {
      return {
        loadingMessage: "",
        transactionHash: "",
      };
    });
  }

  async function cancelLoanOnNft(
    assetBorrowerNonce,
    nftLoanContract,
    userAddress,
    web3,
    showSuccessMessage,
    showErrorMessage
  ) {
    const result = { success: false };
    setIsContractCallInProgress(() => true);
    await nftLoanContract.methods
      .cancelLoanCommitmentBeforeLoanHasBegun(
        web3.utils.toBN(assetBorrowerNonce)
      )
      .send({ from: userAddress }, (error, transactionHash) => {
        if (error) {
          result.success = false;
          showErrorMessage(`Cancellation of loan against NFT failed!`);
          setIsContractCallInProgress(() => false);
          setOverlayText(() => {
            return {
              loadingMessage: "",
              transactionHash: "",
            };
          });
        }
        setOverlayText(() => {
          return {
            loadingMessage: "Cancelling loan on NFT...",
            transactionHash,
          };
        });
      })
      .then(function (receipt) {
        showSuccessMessage(`Loan against NFT cancelled!`);
        result.receipt = receipt;
        result.success = true;
      })
      .catch((error) => {
        console.error(error);
      });
    setOverlayText(() => {
      return {
        loadingMessage: "",
        transactionHash: "",
      };
    });
    return result;
  }

  async function beginLoan(
    nftLoanContract,
    userAddress,
    loanPrincipalAmount,
    maxRepaymentAmount,
    nftCollateralId,
    loanDuration,
    roiInBasisPoints,
    adminFeeInBasisPoints,
    borrowerAndLenderNonces,
    nftCollateralContract,
    loanERC20Denomination,
    lender,
    borrowerSignature,
    lenderSignature,
    interestIsProRated,
    showSuccessMessage,
    showErrorMessage
  ) {
    const result = { success: false };
    setIsContractCallInProgress(() => true);
    const roiForContract =
      interestIsProRated === "true" ? roiInBasisPoints : uint32ComplementOfZero;
    await nftLoanContract.methods
      .beginLoan(
        loanPrincipalAmount,
        maxRepaymentAmount,
        nftCollateralId,
        loanDuration,
        roiForContract,
        adminFeeInBasisPoints,
        borrowerAndLenderNonces,
        nftCollateralContract,
        loanERC20Denomination,
        lender,
        borrowerSignature,
        lenderSignature
      )
      .send({ from: userAddress }, (error, transactionHash) => {
        if (error) {
          setIsContractCallInProgress(() => false);
          showErrorMessage(`Loan initiation failed!`);
          setOverlayText(() => {
            return {
              loadingMessage: "",
              transactionHash: "",
            };
          });
        }
        setOverlayText((prevOverlay) => {
          return {
            loadingMessage: prevOverlay.loadingMessage,
            transactionHash,
          };
        });
      })
      .then(function (receipt) {
        showSuccessMessage(`Loan initiation successful!`);
        result.receipt = receipt;
        result.success = true;
      })
      .catch((error) => {
        console.error("beginLoan error: ", error);
      });
    return result;
  }

  const customStyles2 = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      padding: "0px",
      background: "var(--color-bg-primary)",
      boxShadow:
        "inset -5px -5px 10px var(--color-bg-neumorphismsecondary), inset 5px 5px 10px var(--color-bg-neumorphismprimary)",
      borderRadius: "15px",
      width: "550px",
      border: "0px",
    },
  };

  useEffect(() => {
    (async function () {
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
          },
        };

        axios.defaults.headers.common = {
          "X-API-Key": openSeaApiKey,
        };
        const response = await axios.get(
          `${openSeaEndPoint}/asset/${toChecksumAddress(
            contractAddress
          )}/${nftID}`,
          config
        );
        if (
          response.data.image_url === null ||
          response.data.image_url === ""
        ) {
          response.data.image_url = dummyNftImg;
        }
        if (response.data.name === null || response.data.name === "") {
          response.data.name = "Anonymous Owner";
        }
        setNftToShow(() => response.data);
      } catch (err) {
        console.error("fetch asset failed:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (borrowerNonce.success && isLoanRequested && !isLoanCreated) {
      (async function () {
        try {
          await putNftAsCollateral(
            web3,
            nftID,
            borrowerNonce,
            isFungible || false,
            web3.utils.toChecksumAddress(contractAddress),
            web3.utils.toChecksumAddress(accounts[0]),
            setOverlayText,
            showSuccessMessage,
            showErrorMessage
          );
          sendGaEvent(
            reactGa,
            "BorrowNFT",
            "CreateLoanSuccessful",
            `${nftToShow?.name}: ${price} ${paymentToken}`
          );
        } catch (error) {
          sendGaEvent(
            reactGa,
            "BorrowNFT",
            "CreateLoanFailed",
            `${nftToShow?.name}: ${price} ${paymentToken}`
          );
        }
        setIsLoading(() => false);
      })();
    }
  }, [isLoanRequested, borrowerNonce]);

  useEffect(() => {
    setIsLoading(true);

    if (isLoanCreated) {
      dispatch(fetchOffersOnNftRequest(currentLoanID, network));
    }

    (async function () {
      try {
        const response = await axios.get(
          `${nftLoansEndPoint}/${network}/loan?loan_id=${currentLoanID}`
        );
        setLoanInfo(() => response.data);
        if (response.data.currentState === nftLoanStates.ACCEPTING_BIDS) {
          setIsLoanCreated(() => true);
        }
      } catch (err) {
        console.log("fetch loan failed: ", err);
      }

      setIsLoading(false);
    })();
  }, [isLoanCreated]);

  useBeforeUnload(isContractCallInProgress);

  return (
    <>
      <div className="container mx-auto">
        <div className="p-3 lg:p-7">
          <div className="flex gap-3">
            <div
              className="my-auto cursor-pointer"
              onClick={() => {
                setDetailComponent({ component: 0, nftIndex: 0 });
                invertRetriggerFlag();
                sendGaEvent(reactGa, "BorrowNFT", "GotoMyNFTs");
              }}
            >
              <BackIcon />
            </div>
            <h4 className=" text-lg dark:text-secondary text-secondary font-bold">
              Back To My NFTs
            </h4>
          </div>
          <div className="nft-card-container mt-5">
            <div className="flex gap-5 flex-col md:flex-row">
              <div
                className={
                  nftToShow?.animation_url
                    ? "nft-detail-img-container flex-none relative"
                    : "nft-detail-img-container flex-none"
                }
              >
                {nftToShow?.animation_url ? (
                  <NftMediaPlayer
                    animationURL={nftToShow?.animation_url}
                    isThisDetailComponent={true}
                  />
                ) : (
                  <img
                    src={nftToShow?.image_url}
                    alt="NFT image"
                    className=""
                  />
                )}
              </div>
              <div className="p-3 w-full grid grid-cols-1 gap-2">
                <div className="flex justify-between flex-col md:flex-row">
                  <div className="my-auto">
                    <NftName nftName={nftToShow?.name} />
                    <div className="flex gap-2 my-2">
                      <h5 className="text-sm text-secondary dark:text-secondary ">
                        {moment(nftToShow?.asset_contract?.created_date).format(
                          "DD/MMM/YYYY"
                        )}
                      </h5>
                      <h5 className="text-sm text-secondary dark:text-secondary ">
                        •
                      </h5>
                      <h5 className="text-sm text-secondary dark:text-secondary ">
                        {nftToShow?.traits?.length} attribute
                        {nftToShow?.traits?.length === 1 ? "" : "s"}
                      </h5>
                    </div>
                  </div>
                  <div className="my-auto">
                    {isLoanCreated ? (
                      <button
                        className="btn-nft-gold px-9 py-2"
                        onClick={() => {
                          setIsLoading(true);
                          (async function () {
                            setOverlayText(() => {
                              return {
                                loadingMessage: "Cancelling loan on NFT...",
                                transactionHash: "",
                              };
                            });
                            sendGaEvent(
                              reactGa,
                              "BorrowNFT",
                              "CancelLoanInitiated",
                              `${nftToShow?.name}: ${price} ${paymentToken}`
                            );
                            const cancelLoanResult = await cancelLoanOnNft(
                              loanInfo?.borrowerSignature?.borrowerNonce,
                              nftLoanContract,
                              web3.utils.toChecksumAddress(accounts[0]),
                              web3,
                              showSuccessMessage,
                              showErrorMessage
                            );
                            if (cancelLoanResult.success) {
                              const deregNftResult = await deregisterNft(
                                network,
                                currentLoanID
                              );
                              setIsContractCallInProgress(() => false);
                              if (deregNftResult.success) {
                                setIsLoanCreated(() => false);
                                sendGaEvent(
                                  reactGa,
                                  "BorrowNFT",
                                  "CancelLoanSuccessful",
                                  `${nftToShow?.name}: ${price} ${paymentToken}`
                                );
                              } else {
                                sendGaEvent(
                                  reactGa,
                                  "BorrowNFT",
                                  "CancelLoanFailed",
                                  `${nftToShow?.name}: ${price} ${paymentToken}`
                                );
                              }
                            } else {
                              sendGaEvent(
                                reactGa,
                                "BorrowNFT",
                                "CancelLoanFailed",
                                `${nftToShow?.name}: ${price} ${paymentToken}`
                              );
                            }
                            setOverlayText(() => {
                              return {
                                loadingMessage: "",
                                transactionHash: "",
                              };
                            });
                            setIsLoading(false);
                          })();
                        }}
                      >
                        Cancel Loan
                      </button>
                    ) : (
                      <button
                        className="btn-nft-green px-9 py-2"
                        onClick={() => {
                          dispatch(fetchNonceRequest(accounts[0], network));
                          setIsLoading(() => true);
                          setIsLoanRequested(true);
                          sendGaEvent(
                            reactGa,
                            "BorrowNFT",
                            "CreateLoanInitiated",
                            `${nftToShow?.name}: ${price} ${paymentToken}`
                          );
                        }}
                      >
                        Create Loan
                      </button>
                    )}
                  </div>
                </div>
                <hr className="my-auto" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="my-auto">
                    <h5 className="dark:text-secondary text-secondary text-sm font-black ">
                      Collection
                    </h5>
                    <h4 className="text-primary dark:primary text-base font-black ">
                      {nftToShow?.collection?.name}
                    </h4>
                  </div>
                  <div className="flex gap-3 md:justify-end items-center">
                    <div className="">
                      <ShipIcon />
                    </div>
                    <h5 className=" text-base font-black  nft-detail-green-color-text">
                      Open Sea
                    </h5>
                    <a
                      className=" cursor-pointer"
                      href={`https://opensea.io/assets/${contractAddress}/${nftID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LinkIcon />
                    </a>
                  </div>
                </div>
                <hr className="my-auto" />
                <div className="">
                  <h4 className="dark:text-secondary text-secondary text-lg font-black  ">
                    Attribute{nftToShow?.traits?.length === 1 ? "" : "s"}
                  </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 attribute-section">
                  {nftToShow?.traits?.map((item, index) => (
                    <div className="" key={index}>
                      <h5 className="dark:text-secondary text-secondary text-sm font-black  ">
                        {item.trait_type}
                      </h5>
                      <h4 className="text-primary dark:primary text-base font-black ">
                        {item.value}
                      </h4>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div
            className={
              isLoanCreated
                ? "nft-card-container divide-y divide-primary mt-5 overflow-x-auto"
                : "hidden"
            }
          >
            <div className="flex gap-10 p-5">
              <h3 className="text-xl font-black nft-detail-green-color-text ">
                Top Bid Details
              </h3>
            </div>{" "}
            {offers?.length ? (
              <table className="divide-y divide-primary overflow-x-auto table-fixed w-full">
                <thead>
                  <tr className="">
                    <th className="text-left pl-5 py-3 w-1/4">
                      <h4 className="text-base dark:text-secondary text-secondary font-black  ">
                        Loan Amount
                      </h4>
                    </th>
                    <th className="text-left py-3 w-1/4">
                      <h4 className="text-base dark:text-secondary text-secondary font-black  ">
                        Max. Repayment Amount
                      </h4>
                    </th>
                    <th className="text-left py-3 w-1/6">
                      <h4 className="text-base dark:text-secondary text-secondary font-black  ">
                        Loan Duration
                      </h4>
                    </th>
                    <th className="text-left py-3 w-1/6">
                      <h4 className="text-base dark:text-secondary text-secondary font-black  ">
                        Interest Rate
                      </h4>
                    </th>
                    <th className="text-left pr-5 py-3 w-1/6">
                      <h4 className="text-base dark:text-secondary text-secondary font-black  ">
                        Action
                      </h4>
                    </th>
                  </tr>
                </thead>
                <tbody className="">
                  {offers?.map((item, index) => {
                    // NOTE: to show cancelled bids, adapt isActive
                    return item?.isActive ? (
                      <tr className="" key={index}>
                        <td className="text-left pl-5 py-3">
                          <h4 className="text-sm text-primary dark:primary font-black ">
                            {item.bidDetails.loanPrincipalAmount &&
                              numbro(
                                web3.utils.fromWei(
                                  item.bidDetails.loanPrincipalAmount,
                                  nftLoansData[currentNetworkID]
                                    .supportedErc20Tokens[
                                    tokenMap.get(item?.bidDetails?.loanERC20)
                                  ].web3EquivalentPrecision
                                )
                              ).format({ mantissa: 2 })}{" "}
                            {
                              nftLoansData[currentNetworkID]
                                .supportedErc20Tokens[
                                tokenMap.get(item?.bidDetails?.loanERC20)
                              ].subname
                            }
                          </h4>
                        </td>
                        <td className="text-left pl-5 py-3">
                          <h4 className="text-sm text-primary dark:primary font-black ">
                            {item.bidDetails.maxRepaymentAmount &&
                              numbro(
                                web3.utils.fromWei(
                                  item.bidDetails.maxRepaymentAmount,
                                  nftLoansData[currentNetworkID]
                                    .supportedErc20Tokens[
                                    tokenMap.get(item?.bidDetails?.loanERC20)
                                  ].web3EquivalentPrecision
                                )
                              ).format({ mantissa: 2 })}{" "}
                            {
                              nftLoansData[currentNetworkID]
                                .supportedErc20Tokens[
                                tokenMap.get(item?.bidDetails?.loanERC20)
                              ].subname
                            }
                          </h4>
                        </td>
                        <td className="text-left py-3">
                          <h4 className="text-sm text-primary dark:primary font-black ">
                            {numbro(
                              item.bidDetails.loanDuration / 604800
                            ).format({
                              mantissa: 2,
                            })}{" "}
                            Week
                            {item.bidDetails.loanDuration / 604800 === 1
                              ? ""
                              : "s"}
                          </h4>
                        </td>
                        <td className="text-left  py-3">
                          <h4 className="text-sm text-primary dark:primary font-black ">
                            {item.bidDetails?.loanInterestRate / 100}%
                            {` ${
                              item.bidDetails?.interestIsProRated === "true"
                                ? "(Pro-rata)"
                                : "(Fixed)"
                            }`}
                          </h4>
                        </td>
                        <td className="text-left pr-5 py-3">
                          <button
                            className="btn-nft-green px-10 py-1"
                            onClick={() => {
                              setIsAcceptBidModalOpen(true);
                              setOfferIndex(index);
                              sendGaEvent(
                                reactGa,
                                "BorrowNFT",
                                "AcceptBidClick",
                                `${nftToShow?.nftName}`
                              );
                            }}
                          >
                            Accept
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <>{/* TODO: to show cancelled bids */}</>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <>
                <p className="text-base text-primary dark:primary  p-2 text-center">
                  No Bids on your NFT yet...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={isAcceptBidModalOpen}
        style={customStyles2}
        onRequestClose={() => {
          setIsAcceptBidModalOpen(false);
        }}
        appElement={document.getElementById("root") || undefined}
      >
        <div className="px-6 py-5">
          <h3 className="text-2xl nft-detail-green-color-text font-black ">
            Bid Acceptance
          </h3>
        </div>
        <hr />
        <div className="px-6 py-5">
          <div className="flex gap-5">
            <div className="nft-detail-bid-img-container flex-none">
              <img
                src={nftToShow?.image_url || dummyNftImg}
                alt=""
                className=""
              />
            </div>
            <div className="grid grid-cols-2 gap-5 w-full">
              <div className="col-span-2">
                <h3 className="text-primary dark:text-primary text-base font-black ">
                  {nftToShow?.name || "Anonymous Owner"}
                </h3>
                <div className="flex gap-2">
                  <h5 className="dark:text-secondary text-secondary text-sm font-black  ">
                    {moment(nftToShow?.asset_contract?.created_date).format(
                      "DD/MMM/YYYY"
                    )}
                  </h5>
                  <h5 className="dark:text-secondary text-secondary text-sm font-black  ">
                    •
                  </h5>
                  <h5 className="dark:text-secondary text-secondary text-sm font-black  ">
                    {nftToShow?.traits?.length} attribute
                    {nftToShow?.traits?.length === 1 ? "" : "s"}
                  </h5>
                </div>
              </div>
              <div className="col-span-1">
                <div className="flex gap-2">
                  <h4 className="text-base font-black  text-primary dark:text-primary">
                    {offers?.length &&
                      web3.utils.fromWei(
                        offers[offerIndex]?.bidDetails?.loanPrincipalAmount,
                        nftLoansData[currentNetworkID].supportedErc20Tokens[
                          tokenMap.get(
                            offers[offerIndex]?.bidDetails?.loanERC20
                          )
                        ].web3EquivalentPrecision
                      )}{" "}
                    {offers?.length &&
                      nftLoansData[currentNetworkID].supportedErc20Tokens[
                        tokenMap.get(offers[offerIndex]?.bidDetails?.loanERC20)
                      ].subname}
                  </h4>
                </div>
                <h5 className="text-xs  dark:text-secondary text-secondary">
                  Loan Amount
                </h5>
              </div>
              <div className="col-span-1">
                <div className="flex gap-2">
                  <h4 className="text-base font-black  text-primary dark:text-primary">
                    {offers?.length &&
                      numbro(
                        offers[offerIndex]?.bidDetails?.loanDuration / 604800
                      ).format({ average: true, mantissa: 4 })}{" "}
                    weeks
                  </h4>
                </div>
                <h5 className="text-xs  dark:text-secondary text-secondary">
                  Loan Duration
                </h5>
              </div>
              <div className="col-span-1">
                <div className="flex gap-2">
                  <h4 className="text-base font-black  text-primary dark:text-primary">
                    {offers?.length &&
                      offers[offerIndex]?.bidDetails?.loanInterestRate /
                        100}{" "}
                    %
                    {offers?.length &&
                    offers[offerIndex]?.bidDetails?.interestIsProRated ===
                      "true"
                      ? " (Pro-rata)"
                      : " (Fixed)"}
                  </h4>
                </div>
                <h5 className="text-xs  dark:text-secondary text-secondary">
                  Interest Rate
                </h5>
              </div>
              <div className="col-span-1">
                <div className="flex gap-2">
                  <h4 className="text-base font-black  nft-detail-green-color-text">
                    {offers?.length &&
                      numbro(
                        web3.utils.fromWei(
                          offers[offerIndex]?.bidDetails?.maxRepaymentAmount,
                          nftLoansData[currentNetworkID].supportedErc20Tokens[
                            tokenMap.get(
                              offers[offerIndex]?.bidDetails?.loanERC20
                            )
                          ].web3EquivalentPrecision
                        )
                      ).format({
                        average: true,
                        mantissa: 4,
                      })}{" "}
                    {offers?.length &&
                      nftLoansData[currentNetworkID].supportedErc20Tokens[
                        tokenMap.get(offers[offerIndex]?.bidDetails?.loanERC20)
                      ].subname}
                  </h4>
                </div>
                <h5 className="text-xs  nft-detail-green-color-text ">
                  Max. Repayment Amount
                </h5>
              </div>
            </div>
          </div>
        </div>
        <hr />
        <div className="px-6 py-5 flex gap-5">
          <button
            className="btn-nft-gold px-6 py-2"
            onClick={() => {
              setIsAcceptBidModalOpen(false);
              sendGaEvent(
                reactGa,
                "BorrowNFT",
                "BackToMyNFTClick",
                `${nftToShow?.name}`
              );
            }}
          >
            Back To My NFT
          </button>
          <button
            className="btn-nft-green px-6 py-2"
            onClick={() => {
              setIsAcceptBidModalOpen(false);
              setIsLoading(true);
              setOverlayText(() => {
                return {
                  loadingMessage: "Getting user approval for NFT transfer...",
                  transactionHash: "",
                };
              });
              sendBidAcceptanceReactGaEvent("Initiated");
              (async function () {
                const doesLenderHaveLiquidity = await checkLenderLiquidity(
                  web3,
                  currentNetworkID,
                  offers[offerIndex]?.bidDetails?.loanERC20,
                  offers[offerIndex]?.bidDetails?.loanPrincipalAmount,
                  offers[offerIndex]?.lenderAddress,
                  showSuccessMessage,
                  showErrorMessage
                );

                const approveNftResult = await approveNft(
                  isFungible,
                  nftContract,
                  nftLoansData[currentNetworkID].nftLoanContractAddress,
                  web3.utils.toChecksumAddress(accounts[0]),
                  nftID,
                  showSuccessMessage,
                  showErrorMessage,
                  setOverlayText
                );

                if (doesLenderHaveLiquidity && approveNftResult.success) {
                  setOverlayText(() => {
                    return {
                      loadingMessage: "Starting loan...",
                      transactionHash: "",
                    };
                  });
                  const [nftCollateralId, nftCollateralContract] =
                    offers[offerIndex]?.nftKey.split("0x");

                  const beginLoanResult = await beginLoan(
                    nftLoanContract,
                    web3.utils.toChecksumAddress(accounts[0]),
                    offers[offerIndex]?.bidDetails?.loanPrincipalAmount,
                    offers[offerIndex]?.bidDetails?.maxRepaymentAmount,
                    nftCollateralId,
                    offers[offerIndex]?.bidDetails?.loanDuration,
                    offers[offerIndex]?.bidDetails?.loanInterestRate,
                    offers[offerIndex]?.bidDetails?.adminFeeInBasisPoints,
                    [
                      loanInfo?.borrowerSignature?.borrowerNonce,
                      offers[offerIndex]?.lenderSignature?.lenderNonce,
                    ],
                    `0x${nftCollateralContract}`,
                    offers[offerIndex]?.bidDetails?.loanERC20,
                    offers[offerIndex]?.lenderAddress,
                    loanInfo?.borrowerSignature?.signedMessage,
                    offers[offerIndex]?.lenderSignature?.signedMessage,
                    offers[offerIndex]?.bidDetails?.interestIsProRated,
                    showSuccessMessage,
                    showErrorMessage
                  );
                  if (beginLoanResult.success) {
                    setOverlayText(() => {
                      return {
                        loadingMessage: "starting loan...",
                        transactionHash:
                          beginLoanResult.receipt.transactionHash,
                      };
                    });
                    await selectBid(
                      currentLoanID,
                      offers[offerIndex]?.bid_id,
                      beginLoanResult.receipt.transactionHash,
                      network,
                      showSuccessMessage,
                      showErrorMessage
                    );
                    setIsContractCallInProgress(() => false);
                    // goto my loans
                    await resetPagination();
                    await exitDetailComponent();
                    setMarketState("borrowloan");
                    invertRetriggerFlag();
                    sendBidAcceptanceReactGaEvent("Successful");
                  } else {
                    sendBidAcceptanceReactGaEvent("Failed");
                  }
                } else {
                  sendBidAcceptanceReactGaEvent("Failed");
                }
                setOverlayText(() => {
                  return {
                    loadingMessage: "",
                    transactionHash: "",
                  };
                });
                setIsLoading(false);
              })();
            }}
          >
            Confirm
          </button>
        </div>
      </Modal>
    </>
  );
}

NftBidDetail.propTypes = {
  nftID: PropTypes.string.isRequired,
  contractAddress: PropTypes.string.isRequired,
  setDetailComponent: PropTypes.func.isRequired,
  accounts: PropTypes.array.isRequired,
  loanID: PropTypes.string,
  isFungible: PropTypes.string,
  currentNetworkID: PropTypes.number.isRequired,
  web3: PropTypes.object.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  setOverlayText: PropTypes.func,
  showSuccessMessage: PropTypes.func.isRequired,
  showErrorMessage: PropTypes.func.isRequired,
  invertRetriggerFlag: PropTypes.func.isRequired,
  setMarketState: PropTypes.func.isRequired,
  price: PropTypes.string.isRequired,
  paymentToken: PropTypes.string.isRequired,
  paginationDispatch: PropTypes.func.isRequired,
  reactGa: PropTypes.object.isRequired,
};

export default NftBidDetail;
