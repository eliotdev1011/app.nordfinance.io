import React, { useState, useEffect, useReducer, useMemo } from "react";
import "./NftDetail.css";
import Modal from "react-modal";
import { BackIcon, LinkIcon, ShipIcon } from "../../../components/icon/icon";
import Info from "../../../assets/images/info.svg";
import { useDispatch, useSelector } from "react-redux";
import fetchNonceRequest from "../../../redux/thunks/fetchNonceRequest.thunk.js";
import fetchUserBidsRequest from "../../../redux/thunks/fetchUserBidsRequest.thunk.js";
import ChangeBidConfirmationModal from "../../../components/ChangeBidConfirmationModal";
import formBidDetailsReducer from "../../../components/functions/formBidDetailsReducer.js";
import resetBidDetails from "../../../components/functions/resetBidDetails";
import nftDetailReducer from "../../../components/functions/nftDetailReducer";
import getNetworkSubname from "../../../components/functions/getNetworkSubname";
import getLenderSignature from "../../../components/functions/getLenderSignature";
import { setAdminFee } from "../../../components/functions/setAdminFee";
import axios from "axios";
import { toChecksumAddress } from "ethereum-checksum-address";
import moment from "moment";
import {
  openSeaEndPoint,
  openSeaApiKey,
  nftLoansData,
  nftLoansEndPoint,
  unitMapping,
  networkData,
  infiniteAmtStr,
} from "../../../config/config";
import NftMediaPlayer from "../../../components/NftMediaPlayer/NftMediaPlayer";
import NftName from "../../../components/NftName";
import { inputCheck, balanceCheck } from "../../../components/inputValidation";
import { approveERC20 } from "../../../components/functions/approveERC20.js";
import { deregisterBid } from "../../../components/functions/deregisterBid";
import { fetchUserBalance } from "../../../components/functions/fetchUserBalance";
import sendGaEvent from "../../../components/functions/sendGaEvent";
import getTokenMap from "../../../components/functions/getTokenMap";
import numbro from "numbro";
import { useBeforeUnload } from "../../../hooks/useBeforeUnload";
import PropTypes from "prop-types";

function NftDetail({
  web3,
  accounts,
  nftID,
  nftContractAddress,
  loanID,
  assetID,
  nftType,
  nftName,
  nftDate,
  traits,
  collectionName,
  image,
  setDetailComponent,
  currentNetworkID,
  setIsLoading,
  setOverlayText,
  showSuccessMessage,
  showErrorMessage,
  invertRetriggerFlag,
  animationURL,
  reactGa,
}) {
  const dispatch = useDispatch();
  const lenderNonce = useSelector((state) => state.fetchNonceReducer);
  const lenderBids = useSelector((state) => state.fetchUserBidsReducer);

  const [bidDetails, setBidDetails] = useState({
    loanDuration: "",
    loanDurationErr: "",
    tokenIndex: 0,
    roi: "",
    roiErr: "",
    isInterestProRated: true,
    principalAmount: "",
    principalAmountErr: "",
    maxRepaymentAmount: "",
    adminFee: "",
    assetLenderNonce: "",
    bidID: "",
  });

  const [
    {
      fLoanDuration,
      fLoanDurationErr,
      fTokenIndex,
      fRoi,
      fRoiErr,
      fIsInterestProRated,
      fPrincipalAmount,
      fPrincipalAmountErr,
      fIsApprovalInfinite,
      fMaxRepaymentAmount,
      fAdminFee,
    },
    formBidDetailsDispatch,
  ] = useReducer(formBidDetailsReducer, {
    fLoanDuration: "",
    fLoanDurationErr: "",
    fTokenIndex: 0,
    fRoi: "",
    fRoiErr: "",
    fIsInterestProRated: true,
    fPrincipalAmount: "",
    fPrincipalAmountErr: "",
    fIsApprovalInfinite: false,
    fMaxRepaymentAmount: "",
    fAdminFee: "",
  });

  const [
    {
      isBidModalOpen,
      isChangeBidModalOpen,
      hasUserBid,
      isUserChangingBid,
      isContractCallInProgress,
      wasBidSubmissionInitiated,
      nftTxns,
      userBalance,
    },
    nftDetailDispatch,
  ] = useReducer(nftDetailReducer, {
    isBidModalOpen: false,
    isChangeBidModalOpen: false,
    hasUserBid: nftType === "edit",
    isUserChangingBid: false,
    isContractCallInProgress: false,
    wasBidSubmissionInitiated: false,
    nftTxns: [],
    userBalance: 0,
  });

  const network = getNetworkSubname(currentNetworkID);

  const nftLoanContract = new web3.eth.Contract(
    nftLoansData[currentNetworkID].nftLoanContractABI,
    nftLoansData[currentNetworkID].nftLoanContractAddress
  );

  const erc20Contract = new web3.eth.Contract(
    nftLoansData[currentNetworkID].supportedErc20Tokens[
      fTokenIndex
    ].tokenABI.abi,
    nftLoansData[currentNetworkID].supportedErc20Tokens[
      fTokenIndex
    ].tokenAddress
  );

  const customStyles = {
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
      width: "450px",
      border: "0px",
    },
  };

  const tokenMap = useMemo(() => getTokenMap(currentNetworkID));

  function setIsBidModalOpen(valueToSet) {
    nftDetailDispatch({ type: "bidModal", value: valueToSet });
  }

  function setIsChangeBidModalOpen(valueToSet) {
    nftDetailDispatch({ type: "changeBidModal", value: valueToSet });
  }

  function sendCancelBidReactGaEvent(eventState) {
    sendGaEvent(
      reactGa,
      "LendNFT",
      isUserChangingBid
        ? `CancelPreviousBid${eventState}`
        : `CancelBid${eventState}`,
      `${nftName}: ${
        bidDetails?.principalAmount &&
        numbro(
          web3.utils.fromWei(
            bidDetails?.principalAmount,
            nftLoansData[currentNetworkID].supportedErc20Tokens[
              bidDetails.tokenIndex
            ].web3EquivalentPrecision
          )
        ).format({ mantissa: 2 })
      } ${
        nftLoansData[currentNetworkID].supportedErc20Tokens[
          bidDetails.tokenIndex
        ]?.subname
      }, ${bidDetails.loanDuration / 604800} weeks, ${bidDetails.roi / 100}%`
    );
  }

  function sendSubmitBidReactGaEvent(eventState) {
    sendGaEvent(
      reactGa,
      "LendNFT",
      isUserChangingBid ? `ChangeBid${eventState}` : `Bid${eventState}`,
      `${nftName}: ${fPrincipalAmount} ${nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]?.subname}, ${fLoanDuration} weeks, ${fRoi}%`
    );
  }

  async function cancelBidProcess(isUserChangingBid) {
    const finalResult = { success: false };
    setIsLoading(() => true);
    sendCancelBidReactGaEvent("Initiated");
    setOverlayText(() => {
      return {
        loadingMessage: isUserChangingBid
          ? "Cancelling previous bid..."
          : "Cancelling bid...",
        transactionHash: "",
      };
    });
    const cancelBidResult = await cancelBidCommitment(
      bidDetails.assetLenderNonce,
      nftLoanContract,
      web3.utils.toChecksumAddress(accounts[0]),
      web3,
      showSuccessMessage,
      showErrorMessage,
      isUserChangingBid
    );

    if (cancelBidResult.success) {
      const deregBidResult = await deregisterBid(network, bidDetails?.bidID);

      nftDetailDispatch({ type: "contractCall", value: false });
      if (deregBidResult.success) {
        resetBidDetails(setBidDetails);
        nftDetailDispatch({ type: "hasUserBid", value: false });
        finalResult.success = true;
        sendCancelBidReactGaEvent("Successful");
      } else {
        sendCancelBidReactGaEvent("Failed");
      }
    } else {
      sendCancelBidReactGaEvent("Failed");
    }
    setOverlayText(() => {
      return {
        loadingMessage: "",
        transactionHash: "",
      };
    });
    setIsLoading(false);
    return finalResult;
  }

  async function registerBid(
    lenderAddress,
    lenderNonce,
    loanDuration,
    denomination,
    roi,
    fIsInterestProRated,
    principalAmount,
    signedMessage,
    nftContractAddress,
    nftID,
    adminFee,
    maxRepaymentAmount,
    loanID,
    assetID,
    showSuccessMessage,
    showErrorMessage
  ) {
    try {
      await axios.post(`${nftLoansEndPoint}/${network}/register-bid`, {
        nftID: nftID.toString(),
        contractAddress: nftContractAddress.toString(),
        lenderAddress: lenderAddress.toString(),
        signedMessage: signedMessage.toString(),
        lenderNonce: lenderNonce.nonce.toString(),
        loanDuration: loanDuration.toString(),
        loanERC20:
          nftLoansData[currentNetworkID].supportedErc20Tokens[
            fTokenIndex
          ].tokenAddress.toString(),
        loanInterestRate: roi.toString(),
        loanPrincipalAmount: principalAmount.toString(),
        interestIsProRated: fIsInterestProRated.toString(),
        maxRepaymentAmount: maxRepaymentAmount.toString(),
        loan_id: loanID,
        asset_id: assetID,
      });
      showSuccessMessage(
        `Bid of ${web3.utils.fromWei(
          principalAmount,
          nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]
            .web3EquivalentPrecision
        )} ${
          nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]
            ?.subname
        }  submitted successfully!`
      );
      return { success: true };
    } catch (err) {
      showErrorMessage("Bid submission failed!");
      return { success: false };
    }
  }

  async function putBid(
    lenderAddress,
    network,
    maxRepaymentAmount,
    loanID,
    assetID,
    setOverlayText,
    showSuccessMessage,
    showErrorMessage
  ) {
    const loanAmount =
      Number(fPrincipalAmount) &&
      web3.utils.toWei(
        fPrincipalAmount,
        nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]
          .web3EquivalentPrecision
      );

    const loanDurationSeconds = Math.round(Number(fLoanDuration) * 604800);

    // roi in % converted to basis points (1% = 100 basis points)
    const roiBasis = Math.round(Number(fRoi) * 100);

    if (lenderNonce.success) {
      setOverlayText(() => {
        return {
          loadingMessage: "Awaiting user signature for bid submission",
          transactionHash: "",
        };
      });
      const lenderSignedMessage = await getLenderSignature(
        web3,
        loanAmount,
        nftID,
        loanDurationSeconds,
        roiBasis,
        fAdminFee,
        lenderNonce.nonce,
        nftContractAddress,
        lenderAddress,
        maxRepaymentAmount,
        fIsInterestProRated,
        fTokenIndex,
        currentNetworkID,
        showSuccessMessage,
        showErrorMessage
      );

      if (lenderSignedMessage !== "error") {
        setOverlayText(() => {
          return {
            loadingMessage: "Submitting bid...",
            transactionHash: "",
          };
        });
        const regBidResult = await registerBid(
          toChecksumAddress(lenderAddress),
          lenderNonce,
          loanDurationSeconds,
          nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]
            .tokenAddress,
          roiBasis,
          fIsInterestProRated,
          loanAmount,
          lenderSignedMessage,
          toChecksumAddress(nftContractAddress),
          nftID,
          fAdminFee,
          maxRepaymentAmount,
          loanID,
          assetID,
          showSuccessMessage,
          showErrorMessage
        );

        if (regBidResult.success) {
          return { success: true };
        } else {
          return { success: false };
        }
      } else {
        return { success: false };
      }
    } else {
      return { success: false };
    }
  }

  async function cancelBidCommitment(
    assetLenderNonce,
    nftLoanContract,
    userAddress,
    web3,
    showSuccessMessage,
    showErrorMessage,
    isUserChangingBid
  ) {
    const result = { success: false };

    nftDetailDispatch({ type: "contractCall", value: true });
    await nftLoanContract.methods
      .cancelLoanCommitmentBeforeLoanHasBegun(web3.utils.toBN(assetLenderNonce))
      .send({ from: userAddress }, (error, transactionHash) => {
        if (error) {
          result.success = false;
          nftDetailDispatch({ type: "contractCall", value: false });
          showErrorMessage(`Bid cancellation failed!`);
          return;
        }
        setOverlayText(() => {
          return {
            loadingMessage: isUserChangingBid
              ? "Cancelling previous bid..."
              : "Cancelling bid...",
            transactionHash: transactionHash,
          };
        });
      })
      .then(function (receipt) {
        showSuccessMessage(`Bid cancellation successful!`);
        result.receipt = receipt;
        result.success = true;
      })
      .catch(function (err) {
        console.log(err);
        result.success = false;
      });
    setOverlayText(() => {
      return {
        loadingMessage: "",
        transactionHash: "",
      };
    });
    return result;
  }

  function getMaxRepaymentAmount(principalAmount, roi, loanDuration) {
    if (principalAmount && roi && loanDuration) {
      return web3.utils
        .toBN(principalAmount)
        .mul(
          web3.utils.toBN(315360000000).add(web3.utils.toBN(roi * loanDuration))
        )
        .div(web3.utils.toBN(315360000000))
        .toString();
    } else {
      return "0";
    }
  }

  function setValidInterest(event) {
    const interest = inputCheck(event, 2);
    if (interest !== "invalid") {
      const interestErr =
        interest < 0 || interest > 100
          ? "Interest should be between 0-100%"
          : "";

      formBidDetailsDispatch({
        type: "fRoi",
        value: interest,
      });
      formBidDetailsDispatch({ type: "fRoiErr", value: interestErr });
    }
  }

  function setValidDuration(event) {
    const duration = inputCheck(event, 0);
    if (duration !== "invalid") {
      const durationErr =
        Number(duration) < 1 || Number(duration) > 12
          ? "Duration should be between 1-12 weeks"
          : "";

      formBidDetailsDispatch({
        type: "fLoanDuration",
        value: duration,
      });
      formBidDetailsDispatch({ type: "fLoanDurationErr", value: durationErr });
    }
  }

  function setValidAmount(event) {
    const amt = inputCheck(
      event,
      nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex].precision
    );
    if (amt !== "invalid") {
      const bal = web3.utils.toBN(userBalance);
      const balanceError = balanceCheck(
        amt,
        bal,
        nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]
          ?.subname,
        nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]
          .web3EquivalentPrecision,
        web3
      );

      formBidDetailsDispatch({
        type: "fPrincipalAmount",
        value: amt,
      });
      formBidDetailsDispatch({
        type: "fPrincipalAmountErr",
        value: balanceError,
      });
    }
  }

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
          `${openSeaEndPoint}/events?asset_contract_address=${toChecksumAddress(
            nftContractAddress
          )}&token_id=${nftID}&event_type=successful`,
          config
        );

        nftDetailDispatch({ type: "nftTxns", value: response.data });
      } catch (err) {
        console.error("fetch nft txns failed:", err);
      }
    })();
  }, []);

  useEffect(() => {
    const promises = [
      fetchUserBalance(erc20Contract, accounts[0]),
      setAdminFee(
        nftLoanContract,
        web3,
        nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]
          .tokenAddress,
        formBidDetailsDispatch
      ),
    ];

    (async function () {
      if (isBidModalOpen) {
        const response = await Promise.allSettled(promises);

        nftDetailDispatch({
          type: "userBalance",
          value: response[0].status === "fulfilled" ? response[0].value : "0",
        });
      }
    })();
  }, [fTokenIndex, isBidModalOpen]);

  useEffect(() => {
    setIsLoading(true);

    if (hasUserBid) {
      dispatch(
        fetchUserBidsRequest(network, web3.utils.toChecksumAddress(accounts[0]))
      );
    }
    setIsLoading(false);
  }, [hasUserBid]);

  useEffect(() => {
    if (lenderBids?.success && lenderBids?.userBids?.length) {
      const bidsOnNft = lenderBids.userBids.find(
        // TODO: to show cancelled bids, adapt isActive
        (item) => item.isActive && item.loan_id === loanID
      );
      const itemBidDetails = bidsOnNft?.bidDetails;

      let tokenIndex = tokenMap.get(itemBidDetails?.loanERC20);
      tokenIndex = tokenIndex === undefined ? 0 : tokenIndex;

      setBidDetails((prevBidDetails) => {
        return {
          ...prevBidDetails,
          maxRepaymentAmount: itemBidDetails?.maxRepaymentAmount,
          principalAmount: itemBidDetails?.loanPrincipalAmount,
          loanDuration: Number(itemBidDetails?.loanDuration),
          assetLenderNonce: bidsOnNft?.lenderSignature?.lenderNonce,
          roi: itemBidDetails?.loanInterestRate,
          bidID: bidsOnNft?.bid_id,
          isInterestProRated: itemBidDetails?.interestIsProRated,
          tokenIndex,
        };
      });
    }
  }, [lenderBids]);

  useEffect(() => {
    if (!fPrincipalAmountErr && !fLoanDurationErr && !fRoiErr) {
      const loanAmount =
        Number(fPrincipalAmount) &&
        web3.utils.toWei(
          fPrincipalAmount,
          nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]
            .web3EquivalentPrecision
        );

      const loanDurationSeconds = Math.round(Number(fLoanDuration) * 604800);

      // roi in % converted to basis points (1% = 100 basis points)
      const roiBasis = Math.round(Number(fRoi) * 100);
      const maxRepaymentAmount = getMaxRepaymentAmount(
        loanAmount,
        loanDurationSeconds,
        roiBasis
      );
      if (maxRepaymentAmount !== fMaxRepaymentAmount) {
        formBidDetailsDispatch({
          type: "fMaxRepaymentAmount",
          value: maxRepaymentAmount,
        });
      }
    }
  }, [fPrincipalAmount, fLoanDuration, fRoi]);

  useEffect(() => {
    if (wasBidSubmissionInitiated && lenderNonce.success) {
      const loanAmount = fIsApprovalInfinite
        ? web3.utils.toBN(infiniteAmtStr)
        : Number(fPrincipalAmount) &&
          web3.utils.toWei(
            fPrincipalAmount,
            nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]
              .web3EquivalentPrecision
          );
      setIsLoading(true);
      sendSubmitBidReactGaEvent("Initiated");
      (async function () {
        setIsBidModalOpen(false);
        let cancelBidProcessResult;
        if (isUserChangingBid) {
          cancelBidProcessResult = await cancelBidProcess(isUserChangingBid);
        }
        if (
          (isUserChangingBid && cancelBidProcessResult.success) ||
          !isUserChangingBid
        ) {
          setIsLoading(true);
          setOverlayText(() => {
            return {
              loadingMessage:
                "Waiting for " +
                nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]
                  ?.subname +
                " allowance approval",
              transactionHash: "",
            };
          });
          const approveResult = await approveERC20(
            currentNetworkID,
            erc20Contract,
            web3.utils.toChecksumAddress(accounts[0]),
            loanAmount,
            nftLoansData[currentNetworkID].nftLoanContractAddress,
            showSuccessMessage,
            showErrorMessage,
            web3,
            setOverlayText,
            fTokenIndex
          );
          if (approveResult.success) {
            const putBidResult = await putBid(
              web3.utils.toChecksumAddress(accounts[0]),
              network,
              fMaxRepaymentAmount,
              loanID,
              assetID,
              setOverlayText,
              showSuccessMessage,
              showErrorMessage
            );

            if (putBidResult.success) {
              nftDetailDispatch({ type: "hasUserBid", value: true });
              sendSubmitBidReactGaEvent("Successful");
            } else {
              sendSubmitBidReactGaEvent("Failed");
            }
          } else {
            sendSubmitBidReactGaEvent("Failed");
          }
          formBidDetailsDispatch({
            type: "resetFormBidDetails",
            value: "",
          });
          setOverlayText(() => {
            return {
              loadingMessage: "",
              transactionHash: "",
            };
          });
        }
        nftDetailDispatch({ type: "changeBid", value: false });
        nftDetailDispatch({ type: "bidSubmission", value: false });
        setIsLoading(() => false);
      })();
    }
  }, [lenderNonce, wasBidSubmissionInitiated]);

  useBeforeUnload(isContractCallInProgress);

  return (
    <>
      <div className="container mx-auto">
        <div className="p-3 lg:p-7">
          <div className="flex gap-3">
            <div
              className="my-auto cursor-pointer"
              onClick={() => {
                // goto NftMarketPlace
                setDetailComponent(() => {
                  return { component: 0, nftIndex: 0 };
                });
                invertRetriggerFlag();
                sendGaEvent(reactGa, "LendNFT", "GotoMarketplace");
              }}
            >
              <BackIcon />
            </div>
            <h4 className=" text-lg dark:text-secondary text-secondary font-bold">
              Back To Marketplace
            </h4>
          </div>
          <div className="nft-card-container mt-5">
            <div className="flex gap-5 flex-col md:flex-row">
              <div className="nft-detail-img-container flex-none">
                {animationURL ? (
                  <NftMediaPlayer
                    animationURL={animationURL}
                    isThisDetailComponent={true}
                  />
                ) : (
                  <img src={image} alt="NFT image" className="" />
                )}
              </div>
              <div className="p-3 w-full grid grid-cols-1 gap-2">
                <div className="flex justify-between flex-col md:flex-row">
                  <div className="my-auto">
                    <NftName nftName={nftName} />
                    <div className="flex gap-2 my-2">
                      <h5 className="dark:text-secondary text-secondary text-sm ">
                        {moment(nftDate).format("DD/MMM/YYYY")}
                      </h5>
                      <h5 className="dark:text-secondary text-secondary text-sm ">
                        •
                      </h5>
                      <h5 className="dark:text-secondary text-secondary text-sm ">
                        {traits?.length} attribute
                        {traits?.length === 1 ? "" : "s"}
                      </h5>
                    </div>
                  </div>
                  <div className="my-auto">
                    {hasUserBid ? (
                      <button
                        className="btn-nft-gold px-9 py-2"
                        onClick={() => {
                          cancelBidProcess(isUserChangingBid);
                        }}
                      >
                        Cancel Bid
                      </button>
                    ) : (
                      <button
                        className="btn-nft-green px-9 py-2"
                        onClick={() => {
                          setIsBidModalOpen(true);
                          sendGaEvent(reactGa, "LendNFT", "BidForLoanClick");
                        }}
                      >
                        Bid For Loan
                      </button>
                    )}
                  </div>
                </div>
                <hr className="my-auto" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="my-auto">
                    <h5 className="dark:text-secondary text-secondary text-sm ">
                      Collection
                    </h5>
                    <h4 className="text-primary dark:primary text-base  font-bold">
                      {collectionName}
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
                      href={`https://opensea.io/assets/${nftContractAddress}/${nftID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LinkIcon />
                    </a>
                  </div>
                </div>
                <hr className="my-auto" />
                <div className="">
                  <h4 className="text-secondary dark:text-secondary text-lg font-bold ">
                    Attributes
                  </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 attribute-section">
                  {traits?.map((item, index) => (
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
          <div className={hasUserBid ? "nft-card-container mt-5" : "hidden"}>
            <div className="flex gap-5 justify-between flex-col md:flex-row px-5 py-2">
              <h4 className="my-auto text-xl font-black cursor-pointer nft-detail-green-color-text ">
                Bid Details
              </h4>
              <button
                className="btn-nft-green px-9 py-2"
                onClick={() => {
                  setIsChangeBidModalOpen(true);
                  nftDetailDispatch({ type: "changeBid", value: true });
                  sendGaEvent(
                    reactGa,
                    "LendNFT",
                    "ChangeBidClick",
                    `${nftName}`
                  );
                }}
              >
                Change Bid
              </button>
            </div>
            <hr className="" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 px-5 py-3 mt-3 text-center">
              <div className="">
                <h5 className="dark:text-secondary text-secondary text-sm ">
                  Max. Repayment Amount
                </h5>
                <h4 className="text-primary dark:primary text-base  font-bold">
                  {bidDetails?.maxRepaymentAmount &&
                    numbro(
                      web3.utils.fromWei(
                        bidDetails?.maxRepaymentAmount,
                        nftLoansData[currentNetworkID].supportedErc20Tokens[
                          bidDetails?.tokenIndex
                        ].web3EquivalentPrecision
                      )
                    ).format({ mantissa: 2 })}{" "}
                  {
                    nftLoansData[currentNetworkID].supportedErc20Tokens[
                      bidDetails?.tokenIndex
                    ]?.subname
                  }
                </h4>
              </div>
              <div className="">
                <h5 className="dark:text-secondary text-secondary text-sm ">
                  Loan Amount
                </h5>
                <h4 className="text-primary dark:primary text-base font-bold">
                  {bidDetails?.principalAmount &&
                    numbro(
                      web3.utils.fromWei(
                        bidDetails?.principalAmount,
                        nftLoansData[currentNetworkID].supportedErc20Tokens[
                          bidDetails?.tokenIndex
                        ].web3EquivalentPrecision
                      )
                    ).format({ mantissa: 2 })}{" "}
                  {
                    nftLoansData[currentNetworkID].supportedErc20Tokens[
                      bidDetails?.tokenIndex
                    ]?.subname
                  }
                </h4>
              </div>
              <div className="">
                <h5 className="dark:text-secondary text-secondary text-sm ">
                  Loan Duration
                </h5>
                <h4 className="text-primary dark:primary text-base  font-bold">
                  {Number(bidDetails?.loanDuration) / 604800} Week
                  {Number(bidDetails?.loanDuration / 604800) === 1 ? "" : "s"}
                </h4>
              </div>
              <div className="">
                <h5 className="dark:text-secondary text-secondary text-sm ">
                  Interest Rate
                </h5>
                <h4 className="text-primary dark:primary text-base  font-bold">
                  {bidDetails?.roi / 100}%
                  {bidDetails.isInterestProRated === "true"
                    ? ` (Pro-rata)`
                    : ` (Fixed)`}
                </h4>
              </div>
            </div>
          </div>
          <div className="nft-card-container divide-y divide-primary mt-5 overflow-x-auto">
            <div className="flex gap-10 p-5">
              <h3 className="text-xl font-black cursor-pointer nft-detail-green-color-text ">
                NFT Transactions
              </h3>
            </div>
            {nftTxns?.asset_events?.length ? (
              <table className=" divide-y overflow-x-auto divide-primary table-auto w-full">
                <thead>
                  <tr className="">
                    <th className="text-left pl-5 py-3">
                      <h4 className="text-base text-primary dark:primary ">
                        From
                      </h4>
                    </th>
                    <th className="text-left py-3">
                      <h4 className="text-base text-primary dark:primary ">
                        To
                      </h4>
                    </th>
                    <th className="text-left py-3">
                      <h4 className="text-base text-primary dark:primary ">
                        Amount
                      </h4>
                    </th>
                    <th className="text-left pr-5 py-3">
                      <h4 className="text-base text-primary dark:primary font-black ">
                        Date
                      </h4>
                    </th>
                    <th className="text-left pr-5 py-3">
                      <h4 className="text-base text-primary dark:primary font-black ">
                        Tx Hash
                      </h4>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nftTxns.asset_events.map((item) => (
                    <tr key={item.id}>
                      <td className="text-left pl-5 py-3">
                        <h5 className="text-sm text-secondary dark:text-secondary ">
                          {item.transaction.from_account.address.substr(0, 6) +
                            "...." +
                            item?.transaction.from_account.address.substr(
                              item?.transaction.from_account.address.length - 4
                            )}
                        </h5>
                      </td>
                      <td className="text-left py-3">
                        <h5 className="text-sm text-secondary dark:text-secondary ">
                          {item?.transaction.to_account.address.substr(0, 6) +
                            "...." +
                            item?.transaction.to_account.address.substr(
                              item?.transaction.to_account.address.length - 4
                            )}
                        </h5>
                      </td>
                      <td className="text-left py-3">
                        <h5 className="text-sm text-secondary dark:text-secondary ">
                          {web3.utils.fromWei(
                            item?.total_price,
                            unitMapping[item.payment_token.decimals]
                          )}{" "}
                          {item?.payment_token.symbol}
                        </h5>
                      </td>
                      <td className="text-left pr-5 py-3">
                        <h5 className="text-sm text-secondary dark:text-secondary ">
                          {moment(item?.transaction.timestamp).format(
                            "DD/MMM/YYYY"
                          )}
                        </h5>
                      </td>
                      <td className="text-left pr-5 py-3">
                        <h5 className="text-sm nft-green font-bold ">
                          <a
                            href={
                              networkData.blockExplorer[currentNetworkID] +
                              "tx/" +
                              item?.transaction?.transaction_hash
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.transaction.transaction_hash.substr(0, 6) +
                              "...." +
                              item?.transaction.transaction_hash.substr(
                                item?.transaction.transaction_hash.length - 4
                              )}
                          </a>
                        </h5>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <>
                <div className="text-base text-primary dark:primary  p-2 text-center">
                  No transactions have occured for this NFT
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={isBidModalOpen}
        style={customStyles}
        onRequestClose={() => {
          setIsBidModalOpen(false);
        }}
        appElement={document.getElementById("root") || undefined}
      >
        <div className="px-6 py-5">
          <h3 className="text-2xl nft-detail-green-color-text font-black ">
            {hasUserBid ? "Change Bid" : "Bid For Loan"}
          </h3>
          <h5 className="dark:text-secondary text-secondary text-sm">
            Please enter your bid proposal details
          </h5>
        </div>
        <hr />
        <div className="">
          <div className="relative">
            <div className="px-6 py-3">
              <div className="flex justify-between">
                <label className="dark:text-secondary text-secondary text-sm">
                  Loan Amount
                </label>
                <p className="dark:text-secondary text-secondary text-sm">
                  Bal:{" "}
                  {userBalance &&
                    numbro(
                      web3.utils.fromWei(
                        userBalance,
                        nftLoansData[currentNetworkID].supportedErc20Tokens[
                          fTokenIndex
                        ].web3EquivalentPrecision
                      )
                    ).format({ mantissa: 4 })}
                </p>
              </div>
              <input
                className="nft-detail-input w-full px-4 py-2 text-primary dark:primary mt-2"
                type="number"
                placeholder="00.00"
                onChange={(e) => setValidAmount(e)}
                value={fPrincipalAmount || ""}
              />
              <div className="flex justify-end pr-3">
                <h5 className="absolute text-left -mt-7 text-sm dark:text-secondary text-secondary">
                  <select
                    name="tokens"
                    id="tokens"
                    className="token-select"
                    value={fTokenIndex}
                    onChange={(e) =>
                      formBidDetailsDispatch({
                        type: "fTokenIndex",
                        value: e.target.value,
                      })
                    }
                  >
                    {nftLoansData[currentNetworkID].supportedErc20Tokens.map(
                      (token, index) => (
                        <option
                          value={index}
                          key={
                            nftLoansData[currentNetworkID].supportedErc20Tokens[
                              index
                            ]?.subname
                          }
                        >
                          {
                            nftLoansData[currentNetworkID].supportedErc20Tokens[
                              index
                            ]?.subname
                          }
                        </option>
                      )
                    )}
                  </select>
                </h5>
              </div>
              <div
                className="tertiary-color text-sm "
                style={{ height: "0.8rem" }}
              >
                {fPrincipalAmountErr}
              </div>
            </div>
            <hr />
          </div>
          <div className="px-6 py-3 flex w-full justify-between">
            <div className="my-auto">
              <label className="text-sm dark:text-secondary text-secondary ">
                Infinite Loan Amount Approval
              </label>
              <div className="tooltip">
                <img
                  src={Info}
                  alt=""
                  className="mb-1 ml-1 h-4 w-4 cursor-pointer"
                />
                <span
                  className="tooltiptext"
                  style={{ top: "100%", left: "325%", width: "200px" }}
                >
                  {`By toggling this, you are agreeing to trust the contract to
                  approve, and spend infinite amount of ${nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]?.subname}, saving you any extra gas fee, and avoiding approval issues
                  in subsequent ${nftLoansData[currentNetworkID].supportedErc20Tokens[fTokenIndex]?.subname} bids`}
                </span>
              </div>
            </div>
            <div className="flex">
              <label className="mt-2">
                <input
                  id="infiniteApproval"
                  checked={fIsApprovalInfinite}
                  value={fIsApprovalInfinite}
                  onChange={() =>
                    formBidDetailsDispatch({
                      type: "fIsApprovalInfinite",
                      value: !fIsApprovalInfinite,
                    })
                  }
                  className="switch"
                  type="checkbox"
                />
                <div>
                  <div></div>
                </div>
              </label>
            </div>
          </div>
          <hr />
          <div className="px-6 py-3">
            <div className="mt-2 relative">
              <label className="text-sm dark:text-secondary text-secondary ">
                Loan Duration
              </label>
              <br />
              <input
                className="nft-detail-input w-full px-4 py-2 text-primary dark:primary mt-2"
                type="number"
                placeholder="2"
                value={fLoanDuration || ""}
                onChange={(e) => setValidDuration(e)}
              />
              <div className="flex justify-end pr-3">
                <h5 className="absolute text-left -mt-7  text-sm dark:text-secondary text-secondary ">
                  in Weeks
                </h5>
              </div>
              <div
                className="tertiary-color text-sm "
                style={{ height: "0.8rem" }}
              >
                {fLoanDurationErr}
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between items-center">
                <label
                  className="text-sm dark:text-secondary text-secondary"
                  htmlFor="interest-input-field"
                >
                  Interest Rate
                </label>
                <div className="flex gap-2 items-center">
                  <label
                    className="container-label"
                    style={{ paddingLeft: "15px" }}
                  >
                    <input
                      type="checkbox"
                      className=""
                      checked={!fIsInterestProRated}
                      onChange={() => {
                        formBidDetailsDispatch({
                          type: "fIsInterestProRated",
                          value: !fIsInterestProRated,
                        });
                      }}
                    />
                    <span className="checkmark"></span>
                  </label>
                  <div className="flex gap-2 sm:mt-4 lg:mt-0">
                    <label className="text-sm dark:text-secondary text-secondary">
                      Fixed
                      <div className="tooltip ">
                        <img
                          src={Info}
                          alt="info-icon"
                          className="mb-1 ml-1 h-4 w-3 cursor-pointer"
                        />
                        <span
                          className="tooltiptext"
                          style={{ width: "200px", marginLeft: "-190px" }}
                        >
                          Check if you want the interest to be fixed. The
                          interest is pro-rata by default.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <input
                className="nft-detail-input w-full px-4 py-2 text-primary dark:primary mt-2"
                type="number"
                id="interest-input-field"
                placeholder="10"
                value={fRoi || ""}
                onChange={(e) => {
                  setValidInterest(e);
                }}
              />
              <div className="flex justify-end pr-3">
                <h5 className="absolute text-left -mt-7  text-sm dark:text-secondary text-secondary ">
                  in %
                </h5>
              </div>
              <div
                className="tertiary-color text-sm "
                style={{ height: "0.8rem" }}
              >
                {fRoiErr}
              </div>
            </div>
            <div className="mt-4 mb-3">
              <div className="flex">
                <h5 className="text-sm dark:text-secondary text-secondary ">
                  Maximum Repayment Amount:{" "}
                  {fMaxRepaymentAmount &&
                    numbro(
                      web3.utils.fromWei(
                        fMaxRepaymentAmount,
                        nftLoansData[currentNetworkID].supportedErc20Tokens[
                          fTokenIndex
                        ].web3EquivalentPrecision
                      )
                    ).format({ mantissa: 4 })}
                </h5>
                <div className="tooltip">
                  <img
                    src={Info}
                    alt=""
                    className="my-0.5 ml-1 h-4 w-4 cursor-pointer"
                  />
                  <span className="tooltiptext" style={{ width: "200px" }}>
                    {fAdminFee && Number(fAdminFee) / 100}% platform fee is
                    charged on interest
                  </span>
                </div>
              </div>
            </div>
            <div className="gap-5 flex">
              <button
                className="btn-nft-gold w-1/2 px-10 py-2.5 mb-2"
                onClick={() => {
                  formBidDetailsDispatch({ type: "resetFormBidDetails" });
                  setIsBidModalOpen(false);
                  sendGaEvent(
                    reactGa,
                    "LendNFT",
                    "BidSubmissionCancelled",
                    `${nftName}`
                  );
                }}
              >
                Cancel
              </button>
              <button
                className={
                  Boolean(fPrincipalAmountErr || fLoanDurationErr || fRoiErr) ||
                  Boolean(
                    Number(fPrincipalAmount) === 0 ||
                      Number(fLoanDuration) === 0 ||
                      Number(fRoi) === 0
                  )
                    ? `btn-nft-gray w-1/2 px-10 py-2.5 mb-2 cursor-not-allowed`
                    : `btn-nft-green w-1/2 px-10 py-2.5 mb-2`
                }
                onClick={() => {
                  dispatch(fetchNonceRequest(accounts[0], network));
                  nftDetailDispatch({ type: "bidSubmission", value: true });
                }}
                disabled={
                  Boolean(fPrincipalAmountErr || fLoanDurationErr || fRoiErr) ||
                  Boolean(
                    Number(fPrincipalAmount) === 0 ||
                      Number(fLoanDuration) === 0 ||
                      Number(fRoi) === 0
                  )
                }
              >
                Submit Bid
              </button>
            </div>
          </div>
        </div>
      </Modal>
      <ChangeBidConfirmationModal
        isChangeBidModalOpen={isChangeBidModalOpen}
        customStyles={customStyles}
        setIsBidModalOpen={setIsBidModalOpen}
        setIsChangeBidModalOpen={setIsChangeBidModalOpen}
        reactGa={reactGa}
        nftName={nftName}
      />
    </>
  );
}

NftDetail.propTypes = {
  web3: PropTypes.object.isRequired,
  accounts: PropTypes.array.isRequired,
  nftID: PropTypes.string.isRequired,
  nftContractAddress: PropTypes.string.isRequired,
  loanID: PropTypes.string.isRequired,
  assetID: PropTypes.string.isRequired,
  nftType: PropTypes.string.isRequired,
  nftName: PropTypes.string.isRequired,
  nftDate: PropTypes.string.isRequired,
  traits: PropTypes.array.isRequired,
  collectionName: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  setDetailComponent: PropTypes.func.isRequired,
  currentNetworkID: PropTypes.number.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  setOverlayText: PropTypes.func,
  showSuccessMessage: PropTypes.func.isRequired,
  showErrorMessage: PropTypes.func.isRequired,
  invertRetriggerFlag: PropTypes.func.isRequired,
  animationURL: PropTypes.string,
  reactGa: PropTypes.object.isRequired,
};

export default NftDetail;
