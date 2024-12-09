import React, { useEffect, useState, useReducer, useMemo } from "react";
import PropTypes from "prop-types";
import { fetchPayoffAmount } from "../functions/fetchPayoffAmount.js";
import axios from "axios";
import {
  nftLoansData,
  nftLoansEndPoint,
  nftLoanStates,
} from "../../config/config";
import TxnHashIcon from "../TxnHashIcon";
import NftName from "../NftName";
import secondsToDhms from "../functions/secondsToDhms";
import dhmReducer from "../functions/dhmReducer";
import getTokenMap from "../functions/getTokenMap";
import getNetworkSubname from "../functions/getNetworkSubname";
import getRelevantTxnHash from "../functions/getRelevantTxnHash";
import sendGaEvent from "../functions/sendGaEvent";
import { useBeforeUnload } from "../../hooks/useBeforeUnload";
import moment from "moment";
import numbro from "numbro";

function NftLoanCard({
  image,
  nftName,
  nftDate,
  traitCount,
  nftType,
  nftState,
  setDetailComponent,
  currentNetworkID,
  accounts,
  web3,
  nftIndex,
  setIsLoading,
  loanID,
  loanContractID,
  maxRepaymentAmount,
  loanDuration,
  loanInterestRate,
  loanERC20,
  interestIsProRated,
  setOverlayText,
  showSuccessMessage,
  showErrorMessage,
  loanStartDate,
  invertRetriggerFlag,
  txHashes,
  reactGa,
}) {
  const [payableAmount, setPayableAmount] = useState("");

  const [isContractCallInProgress, setIsContractCallInProgress] =
    useState(false);
  const [{ d, h, m, timeRemaining }, dhmDispatch] = useReducer(dhmReducer, {
    d: 0,
    h: 0,
    m: 0,
    timeRemaining: 0,
  });

  const nftLoanContract = new web3.eth.Contract(
    nftLoansData[currentNetworkID].nftLoanContractABI,
    nftLoansData[currentNetworkID]?.nftLoanContractAddress
  );

  const network = getNetworkSubname(currentNetworkID);

  const tokenMap = useMemo(() => getTokenMap(currentNetworkID));

  const txHash = useMemo(() => getRelevantTxnHash(nftState, txHashes));

  function sendSeizeNFTReactGaEvent(eventState) {
    sendGaEvent(
      reactGa,
      `LendNFT`,
      `SeizeNFT${eventState}`,
      `${nftName}: ${
        maxRepaymentAmount &&
        numbro(
          web3.utils.fromWei(
            maxRepaymentAmount,
            nftLoansData[currentNetworkID].supportedErc20Tokens[
              tokenMap.get(loanERC20)
            ].web3EquivalentPrecision
          )
        ).format({ mantissa: 2 })
      } ${
        nftLoansData[currentNetworkID].supportedErc20Tokens[
          tokenMap.get(loanERC20)
        ]?.subname
      }, ${loanDuration / 604800} weeks, ${loanInterestRate / 100}%`
    );
  }

  async function seizeNft(
    nftLoanContract,
    userAddress,
    loanID,
    loanContractID,
    showSuccessMessage,
    showErrorMessage
  ) {
    const result = { success: false };
    setIsContractCallInProgress(() => true);
    await nftLoanContract.methods
      .liquidateOverdueLoan(loanContractID)
      .send({ from: userAddress }, (error, transactionHash) => {
        if (error) {
          setIsContractCallInProgress(() => false);
          showErrorMessage(`NFT transfer from borrower failed!`);
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
        showSuccessMessage(`NFT transfer from borrower successful!`);
        result.receipt = receipt;
        result.success = true;
      })
      .catch((error) => console.log(error));

    return result;
  }

  async function updateNftSeized(loanID, transactionHash, tries = 0) {
    if (tries === 5) return sendSeizeNFTReactGaEvent("Failed");
    try {
      await axios.post(`${nftLoansEndPoint}/${network}/seize-nft`, {
        loan_id: loanID,
        transactionHash,
      });
      sendSeizeNFTReactGaEvent("Successful");
    } catch (err) {
      if (err?.response?.data?.includes("code=TIMEOUT")) {
        await updateNftSeized(loanID, transactionHash, tries + 1);
      } else {
        console.error("updateSeizeNft failed: ", err?.response?.data?.error);
        sendSeizeNFTReactGaEvent("Failed");
      }
    }
  }

  useEffect(() => {
    if (nftState === nftLoanStates.LOAN_STARTED) {
      const timeLapsed = moment(new Date().toUTCString()).diff(
        moment(loanStartDate),
        "seconds"
      );

      const timeRemaining = Number(loanDuration) - Number(timeLapsed);
      dhmDispatch({
        type: "timeRemaining",
        value: timeRemaining,
      });
      if (timeRemaining > 0) {
        const { d, h, m } = secondsToDhms(timeRemaining);
        dhmDispatch({ type: "d", value: d });
        dhmDispatch({ type: "h", value: h });
        dhmDispatch({ type: "m", value: m });
      }
    }

    if (nftType === "borrow" && nftState === nftLoanStates.LOAN_STARTED) {
      (async function () {
        try {
          const payoffAmount = await fetchPayoffAmount(
            nftLoanContract,
            loanContractID
          );
          setPayableAmount(() => payoffAmount);
        } catch (err) {
          console.error("error while fetching payoff amount");
        }
      })();
    }
  }, []);

  useBeforeUnload(isContractCallInProgress);

  return (
    <>
      <div className=" nft-card-container col-span-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-5">
            <div
              className={
                nftType === "borrow"
                  ? "nft-loan-inner-img-container nft-inner-img-pay-container"
                  : "nft-loan-inner-img-container nft-inner-img-edit-container"
              }
            >
              <img src={image} alt="" className="" />
            </div>
            <div className="grid grid-cols-1 gap-4 place-content-between py-2">
              <div className="">
                <NftName nftName={nftName} />
                <div className="flex gap-2">
                  <h5 className="text-secondary dark:text-secondary text-sm ">
                    {nftDate}
                  </h5>
                  <h5 className="text-secondary dark:text-secondary text-sm ">
                    •
                  </h5>
                  <h5 className="text-secondary dark:text-secondary text-sm ">
                    {traitCount} attribute{traitCount === 1 ? "" : "s"}
                  </h5>
                </div>
              </div>
              <div className="">
                <div className="flex-col gap-5">
                  {nftState === "REPAYMENT_DONE" ? (
                    <div className="flex gap-2">
                      <h3 className="text-lg nft-green font-black">
                        Repayment Done
                      </h3>
                      {
                        <TxnHashIcon
                          txHash={txHash}
                          currentNetworkID={currentNetworkID}
                          color={nftType === "lend" ? "gold" : "blue"}
                        />
                      }
                    </div>
                  ) : nftState === nftLoanStates.NFT_SEIZED ? (
                    <div className="flex gap-2">
                      <h3
                        className={
                          nftType === "lend"
                            ? "text-lg nft-green font-black"
                            : "text-lg tertiary-color font-black"
                        }
                      >
                        NFT Seized
                        {nftType === "lend" ? ` from borrower` : ``}{" "}
                      </h3>
                      {
                        <TxnHashIcon
                          txHash={txHash}
                          currentNetworkID={currentNetworkID}
                          color={nftType === "lend" ? "gold" : "blue"}
                        />
                      }
                    </div>
                  ) : (
                    <div className="flex gap-4 items-center">
                      <div className="flex gap-1 items-center">
                        <div className="">
                          <h4
                            className={
                              nftType === "borrow"
                                ? "nft-counter-timer-blue text-base font-black "
                                : "nft-counter-timer-gold text-base font-black "
                            }
                          >
                            {d}
                          </h4>
                          <h5
                            className={
                              nftType === "borrow"
                                ? "text-center nft-counter-timer-blue text-xs "
                                : "text-center nft-counter-timer-gold text-xs "
                            }
                          >
                            D
                          </h5>
                        </div>
                        <h4
                          className={
                            nftType === "borrow"
                              ? "nft-counter-timer-blue text-base font-black "
                              : "nft-counter-timer-gold text-base font-black "
                          }
                        >
                          :
                        </h4>
                        <div className="">
                          <h4
                            className={
                              nftType === "borrow"
                                ? "nft-counter-timer-blue text-base font-black "
                                : "nft-counter-timer-gold text-base font-black "
                            }
                          >
                            {h}
                          </h4>
                          <h5
                            className={
                              nftType === "borrow"
                                ? "text-center nft-counter-timer-blue text-xs "
                                : "text-center nft-counter-timer-gold text-xs "
                            }
                          >
                            H
                          </h5>
                        </div>
                        <h4
                          className={
                            nftType === "borrow"
                              ? "nft-counter-timer-blue text-base font-black "
                              : "nft-counter-timer-gold text-base font-black "
                          }
                        >
                          :
                        </h4>
                        <div className="">
                          <h4
                            className={
                              nftType === "borrow"
                                ? "nft-counter-timer-blue text-base font-black "
                                : "nft-counter-timer-gold text-base font-black "
                            }
                          >
                            {m}
                          </h4>
                          <h5
                            className={
                              nftType === "borrow"
                                ? "text-center nft-counter-timer-blue text-xs"
                                : "text-center nft-counter-timer-gold text-xs"
                            }
                          >
                            M
                          </h5>
                        </div>
                      </div>
                      {
                        <TxnHashIcon
                          txHash={txHash}
                          currentNetworkID={currentNetworkID}
                          color={nftType === "lend" ? "gold" : "blue"}
                        />
                      }
                    </div>
                  )}
                  {(timeRemaining < 0 &&
                    nftState === nftLoanStates.LOAN_STARTED) ||
                  nftState === "SEIZE_NFT" ? (
                    <h5 className="nft-counter-timer-gold text-sm ">
                      Duration expired
                    </h5>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-1 py-2 ">
            <div className="grid grid-cols-1 gap-4">
              {nftState !== "borrow" &&
              nftState !== nftLoanStates.ACCEPTING_BIDS ? (
                <div className="">
                  <h3 className="text-primary dark:text-primary text-base ">
                    {maxRepaymentAmount &&
                      numbro(
                        web3.utils.fromWei(
                          maxRepaymentAmount,
                          nftLoansData[currentNetworkID].supportedErc20Tokens[
                            tokenMap.get(loanERC20)
                          ].web3EquivalentPrecision
                        )
                      ).format({ mantissa: 2 })}{" "}
                    {
                      nftLoansData[currentNetworkID].supportedErc20Tokens[
                        tokenMap.get(loanERC20)
                      ]?.subname
                    }
                  </h3>
                  <h4 className="text-secondary dark:text-secondary text-sm ">
                    Max Loan Amount
                  </h4>
                </div>
              ) : (
                <></>
              )}
              <div className="">
                {nftType === "borrow" && nftState === "LOAN_STARTED" ? (
                  <div className="flex gap-4">
                    <div className="">
                      <h4 className="nft-counter-timer-blue text-base ">
                        {payableAmount &&
                          numbro(
                            web3.utils.fromWei(
                              payableAmount,
                              nftLoansData[currentNetworkID]
                                .supportedErc20Tokens[tokenMap.get(loanERC20)]
                                .web3EquivalentPrecision
                            )
                          ).format({ mantissa: 2 })}{" "}
                        {
                          nftLoansData[currentNetworkID].supportedErc20Tokens[
                            tokenMap.get(loanERC20)
                          ]?.subname
                        }
                      </h4>
                      <h5 className="nft-counter-timer-blue text-sm ">
                        Amount To Pay
                      </h5>
                    </div>
                    <div className="self-center">
                      <button
                        className="btn-nft-blue px-6 py-1 "
                        onClick={() => {
                          // goto NftLoanDetail
                          setDetailComponent(() => {
                            return { component: 3, nftIndex };
                          });
                          sendGaEvent(
                            reactGa,
                            "BorrowNFT",
                            "PayClick",
                            `${nftName}`
                          );
                        }}
                      >
                        Pay
                      </button>
                    </div>
                  </div>
                ) : nftState === "SEIZE_NFT" ? (
                  <button
                    className="btn-nft-blue px-6 py-1 my-2"
                    onClick={() => {
                      setIsLoading(() => true);
                      setOverlayText(() => {
                        return {
                          loadingMessage: "Seizing NFT from borrower...",
                          transactionHash: "",
                        };
                      });
                      sendSeizeNFTReactGaEvent("Initiated");
                      (async function () {
                        const seizeNftResult = await seizeNft(
                          nftLoanContract,
                          web3.utils.toChecksumAddress(accounts[0]),
                          loanID,
                          loanContractID,
                          showSuccessMessage,
                          showErrorMessage
                        );
                        setOverlayText(() => {
                          return {
                            loadingMessage: "seizing NFT from borrower...",
                            transactionHash: seizeNftResult.transactionHash,
                          };
                        });
                        if (seizeNftResult.success) {
                          await updateNftSeized(
                            loanID,
                            seizeNftResult.receipt.transactionHash
                          );
                          setIsContractCallInProgress(() => false);
                        } else {
                          sendSeizeNFTReactGaEvent("Failed");
                        }
                        setOverlayText(() => {
                          return {
                            loadingMessage: "",
                            transactionHash: "",
                          };
                        });
                        invertRetriggerFlag();
                        setIsLoading(() => false);
                      })();
                    }}
                  >
                    Seize NFT
                  </button>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
          {nftState !== nftLoanStates.ACCEPTING_BIDS ? (
            <>
              <div className="col-span-1 py-2">
                <h3 className="text-primary dark:text-primary text-base ">
                  {loanDuration / 604800} Week
                  {Number(loanDuration / 604800) === 1 ? "" : "s"}
                </h3>
                <h4 className="text-secondary dark:text-secondary text-sm ">
                  Loan Duration
                </h4>
              </div>
              <div className="col-span-1 py-2">
                <h3 className="text-primary dark:text-primary text-base ">
                  {loanInterestRate / 100}%
                  {` ${
                    interestIsProRated === "true" ? "(Pro-rata)" : "(Fixed)"
                  }`}
                </h3>
                <h4 className="text-secondary dark:text-secondary text-sm ">
                  Interest Rate
                </h4>
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  );
}

NftLoanCard.propTypes = {
  nftID: PropTypes.string.isRequired,
  nftContractAddress: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  nftName: PropTypes.string.isRequired,
  nftDate: PropTypes.string.isRequired,
  traitCount: PropTypes.number.isRequired,
  nftType: PropTypes.string.isRequired,
  nftState: PropTypes.string.isRequired,
  setDetailComponent: PropTypes.func.isRequired,
  currentNetworkID: PropTypes.number.isRequired,
  accounts: PropTypes.array.isRequired,
  web3: PropTypes.object.isRequired,
  nftIndex: PropTypes.number,
  setIsLoading: PropTypes.func,
  loanID: PropTypes.string.isRequired,
  loanContractID: PropTypes.string.isRequired,
  maxRepaymentAmount: PropTypes.string,
  loanDuration: PropTypes.string,
  loanInterestRate: PropTypes.string,
  loanERC20: PropTypes.string.isRequired,
  interestIsProRated: PropTypes.string,
  setOverlayText: PropTypes.func,
  showSuccessMessage: PropTypes.func,
  showErrorMessage: PropTypes.func,
  loanStartDate: PropTypes.string,
  invertRetriggerFlag: PropTypes.func.isRequired,
  txHashes: PropTypes.object.isRequired,
  reactGa: PropTypes.object.isRequired,
};

export default NftLoanCard;
