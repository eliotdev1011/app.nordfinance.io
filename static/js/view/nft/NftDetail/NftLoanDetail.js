import React, { useState, useEffect, useReducer, useMemo } from "react";
import "./NftDetail.css";
import Modal from "react-modal";
import { BackIcon, LinkIcon, ShipIcon } from "../../../components/icon/icon";
import { nftLoansData } from "../../../config/config";
import { approveERC20 } from "../../../components/functions/approveERC20.js";
import { fetchPayoffAmount } from "../../../components/functions/fetchPayoffAmount.js";
import PropTypes from "prop-types";
import moment from "moment";
import numbro from "numbro";
import NftMediaPlayer from "../../../components/NftMediaPlayer/NftMediaPlayer";
import NftName from "../../../components/NftName";
import secondsToDhms from "../../../components/functions/secondsToDhms";
import sendGaEvent from "../../../components/functions/sendGaEvent";
import getNetworkSubname from "../../../components/functions/getNetworkSubname";
import dhmReducer from "../../../components/functions/dhmReducer";
import getTokenMap from "../../../components/functions/getTokenMap";
import { useBeforeUnload } from "../../../hooks/useBeforeUnload";
import { updateLoanPaid } from "../../../components/functions/updateLoanPaid";
import { fetchUserBalance } from "../../../components/functions/fetchUserBalance";

function NftLoanDetail({
  setDetailComponent,
  currentNetworkID,
  nftID,
  nftContractAddress,
  accounts,
  web3,
  maxRepaymentAmount,
  loanPrincipalAmount,
  loanDuration,
  loanInterestRate,
  loanERC20,
  interestIsProRated,
  loanID,
  loanContractID,
  setIsLoading,
  nftName,
  image,
  traits,
  collectionName,
  setOverlayText,
  showSuccessMessage,
  showErrorMessage,
  loanStartDate,
  invertRetriggerFlag,
  animationURL,
  reactGa,
}) {
  const network = getNetworkSubname(currentNetworkID);

  const [isPaybackModalOpen, setIsPaybackModalOpen] = useState(false);
  const [payableAmount, setPayableAmount] = useState("");
  const [{ d, h, m, timeRemaining }, dhmDispatch] = useReducer(dhmReducer, {
    d: 0,
    h: 0,
    m: 0,
    timeRemaining: 0,
  });
  const [userBalance, setUserBalance] = useState("0");

  const [isContractCallInProgress, setIsContractCallInProgress] =
    useState(false);

  const tokenMap = useMemo(() => getTokenMap(currentNetworkID));

  const nftLoanContract = new web3.eth.Contract(
    nftLoansData[currentNetworkID].nftLoanContractABI,
    nftLoansData[currentNetworkID].nftLoanContractAddress
  );

  const erc20Contract = new web3.eth.Contract(
    nftLoansData[currentNetworkID].supportedErc20Tokens[
      tokenMap.get(loanERC20)
    ].tokenABI.abi,
    nftLoansData[currentNetworkID].supportedErc20Tokens[
      tokenMap.get(loanERC20)
    ].tokenAddress
  );

  function sendPaybackReactGaEvent(eventState) {
    sendGaEvent(
      reactGa,
      "BorrowNFT",
      `Payback${eventState}`,
      `${nftName}: loanAmount: ${web3.utils.fromWei(
        loanPrincipalAmount,
        nftLoansData[currentNetworkID].supportedErc20Tokens[
          tokenMap.get(loanERC20)
        ].web3EquivalentPrecision
      )} ${
        nftLoansData[currentNetworkID].supportedErc20Tokens[
          tokenMap.get(loanERC20)
        ]?.subname
      }, ${loanDuration / 604800} weeks , ${
        loanInterestRate / 100
      }%, payoffAmount: ${numbro(
        web3.utils.fromWei(
          payableAmount,
          nftLoansData[currentNetworkID].supportedErc20Tokens[
            tokenMap.get(loanERC20)
          ].web3EquivalentPrecision
        )
      ).format({ mantissa: 4 })} ${
        nftLoansData[currentNetworkID].supportedErc20Tokens[
          tokenMap.get(loanERC20)
        ]?.subname
      }`
    );
  }

  async function paybackLoanOperation() {
    // check if user balance >= payableAmount
    const payableAmt = web3.utils.toBN(payableAmount);
    const balance = web3.utils.toBN(userBalance);
    let balanceError = "";
    if (payableAmt.gt(balance)) {
      balanceError = `Insufficient ${
        nftLoansData[currentNetworkID].supportedErc20Tokens[
          tokenMap.get(loanERC20)
        ]?.subname
      } Balance!!!`;
      showErrorMessage(balanceError);
      sendPaybackReactGaEvent("Failed");
    } else {
      setOverlayText(() => {
        return {
          loadingMessage:
            "Waiting for " +
            nftLoansData[currentNetworkID].supportedErc20Tokens[
              tokenMap.get(loanERC20)
            ]?.subname +
            " allowance approval",
          transactionHash: "",
        };
      });
      const tokenIndex = tokenMap.get(loanERC20);
      const approveResult = await approveERC20(
        currentNetworkID,
        erc20Contract,
        web3.utils.toChecksumAddress(accounts[0]),
        maxRepaymentAmount,
        nftLoansData[currentNetworkID].nftLoanContractAddress,
        showSuccessMessage,
        showErrorMessage,
        web3,
        setOverlayText,
        tokenIndex
      );
      if (approveResult.success) {
        setOverlayText(() => {
          return {
            loadingMessage: "Paying off loan...",
            transactionHash: "",
          };
        });
        const paybackResult = await paybackLoan(
          nftLoanContract,
          loanContractID,
          web3.utils.toChecksumAddress(accounts[0]),
          showSuccessMessage,
          showErrorMessage,
          payableAmount
        );
        setOverlayText(() => {
          return {
            loadingMessage: "Paying off loan...",
            transactionHash: "",
          };
        });
        if (paybackResult.success) {
          await updateLoanPaid(network, loanID, paybackResult.transactionHash);
          setIsContractCallInProgress(() => false);
          setOverlayText(() => {
            return {
              loadingMessage: "",
              transactionHash: "",
            };
          });
          sendPaybackReactGaEvent("Successful");
        } else {
          sendPaybackReactGaEvent("Failed");
        }
      } else {
        sendPaybackReactGaEvent("Failed");
      }
      setIsPaybackModalOpen(false);
    }
    // goto my loans
    invertRetriggerFlag();
    setDetailComponent(() => {
      return { component: 0, nftIndex: 0 };
    });
    setIsLoading(false);
  }

  async function paybackLoan(
    nftLoanContract,
    loanContractID,
    userAddress,
    showSuccessMessage,
    showErrorMessage,
    payableAmount
  ) {
    const result = { success: false };
    setIsContractCallInProgress(() => true);
    await nftLoanContract.methods
      .payBackLoan(loanContractID)
      .send({ from: userAddress }, (error, transactionHash) => {
        if (error) {
          setIsContractCallInProgress(() => false);
          showErrorMessage(`Loan payback failed!`);
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
        const amt = numbro(
          web3.utils.fromWei(
            payableAmount,
            nftLoansData[currentNetworkID].supportedErc20Tokens[
              tokenMap.get(loanERC20)
            ].web3EquivalentPrecision
          )
        ).format({ mantissa: 2 });
        showSuccessMessage(
          `Loan of ${amt} ${
            nftLoansData[currentNetworkID].supportedErc20Tokens[
              tokenMap.get(loanERC20)
            ]?.subname
          } paid back successfully!`
        );
        result.transactionHash = receipt.transactionHash;
        result.success = true;
      })
      .catch((error) => console.log(error));
    return result;
  }

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
      width: "400px",
      border: "0px",
    },
  };

  useEffect(() => {
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

    (async function () {
      try {
        const payoffAmount = await fetchPayoffAmount(
          nftLoanContract,
          loanContractID
        );
        setPayableAmount(() => payoffAmount);
      } catch (err) {
        console.error("fetching payoff amount: ", err);
      }
    })();

    (async function () {
      const userBal = await fetchUserBalance(
        erc20Contract,
        web3.utils.toChecksumAddress(accounts[0])
      );
      setUserBalance(() => userBal);
    })();
  }, []);

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
                      <h5 className="dark:text-secondary text-secondary text-sm font-black  ">
                        {moment(loanStartDate).format("DD/MMM/YYYY")}
                      </h5>
                      <h5 className="dark:text-secondary text-secondary text-sm font-black  ">
                        •
                      </h5>
                      <h5 className="dark:text-secondary text-secondary text-sm font-black  ">
                        {traits?.length} attribute
                        {traits?.length === 1 ? "" : "s"}
                      </h5>
                    </div>
                  </div>
                  <div className="my-auto">
                    <div className="flex gap-2">
                      <div className="">
                        <h4 className="nft-detail-blue-color-text text-base font-black ">
                          {d}
                        </h4>
                        <h5 className="nft-detail-blue-color-text text-base font-black ">
                          D
                        </h5>
                      </div>
                      <h4 className="nft-detail-blue-color-text text-base font-black ">
                        :
                      </h4>
                      <div className="">
                        <h4 className="nft-detail-blue-color-text text-base font-black ">
                          {h}
                        </h4>
                        <h5 className="nft-detail-blue-color-text text-base font-black ">
                          H
                        </h5>
                      </div>
                      <h4 className="nft-detail-blue-color-text text-base font-black ">
                        :
                      </h4>
                      <div className="">
                        <h4 className="nft-detail-blue-color-text text-base font-black ">
                          {m}
                        </h4>
                        <h5 className="nft-detail-blue-color-text text-base font-black ">
                          M
                        </h5>
                      </div>
                    </div>
                    {timeRemaining > 0 ? (
                      <></>
                    ) : (
                      <h5 className="nft-counter-timer-gold text-sm ">
                        Duration Expired
                      </h5>
                    )}
                  </div>
                </div>
                <hr className="my-auto" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="my-auto">
                    <h5 className="dark:text-secondary text-secondary text-sm font-black  ">
                      Collection
                    </h5>
                    <h4 className="text-primary dark:text-primary text-base font-black ">
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
          <div className="nft-card-container mt-5">
            <div className="flex gap-5 justify-between px-5 py-2 flex-col md:flex-row">
              <h4 className="my-auto text-xl font-black nft-detail-green-color-text ">
                Loan Details
              </h4>
              <button
                className="btn-nft-green px-9 py-2"
                onClick={() => {
                  setIsPaybackModalOpen(true);
                  sendGaEvent(
                    reactGa,
                    "BorrowNFT",
                    "OpenPayLoanModal",
                    `${nftName}`
                  );
                }}
              >
                Pay Loan
              </button>
            </div>
            <hr className="" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 px-5 py-3 mt-3">
              <div className="">
                <h5 className="dark:text-secondary text-secondary text-sm font-black  ">
                  Max Loan Amount
                </h5>
                <h4 className="text-primary dark:text-primary text-base font-black ">
                  {web3.utils.fromWei(
                    maxRepaymentAmount,
                    nftLoansData[currentNetworkID].supportedErc20Tokens[
                      tokenMap.get(loanERC20)
                    ].web3EquivalentPrecision
                  )}
                </h4>
              </div>
              <div className="">
                <h5 className="dark:text-secondary text-secondary text-sm font-black  ">
                  Loan Duration
                </h5>
                <h4 className="text-primary dark:text-primary text-base font-black ">
                  {loanDuration / 604800} Week
                  {loanDuration / 604800 === 1 ? "" : "s"}
                </h4>
              </div>
              <div className="">
                <h5 className="dark:text-secondary text-secondary text-sm font-black  ">
                  Interest Rate
                </h5>
                <h4 className="text-primary dark:text-primary text-base font-black ">
                  {loanInterestRate / 100}%
                  {interestIsProRated === "true" ? " (Pro-rata)" : " (Fixed)"}
                </h4>
              </div>
              <div className="">
                <h5 className="dark:text-secondary text-secondary text-sm font-black  ">
                  Payable Amount
                </h5>
                <h4 className=" text-lg font-black nft-detail-green-color-text ">
                  {numbro(
                    web3.utils.fromWei(
                      payableAmount,
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
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        isOpen={isPaybackModalOpen}
        style={customStyles}
        onRequestClose={() => {
          setIsPaybackModalOpen(false);
        }}
        appElement={document.getElementById("root") || undefined}
      >
        <div className="px-6 py-5">
          <h3 className="text-2xl nft-detail-green-color-text font-black ">
            Amount Breakdown
          </h3>
        </div>
        <hr />
        <div className="px-6 pb-5">
          <div className="flex py-4 justify-between">
            <h5 className="text-sm dark:text-secondary text-secondary ">
              Loan Amount
            </h5>
            <h5 className="text-sm text-primary dark:text-primary ">
              {numbro(
                web3.utils.fromWei(
                  loanPrincipalAmount,
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
            </h5>
          </div>
          <hr className="" />{" "}
          <div className="flex py-4 justify-between">
            <h5 className="text-sm dark:text-secondary text-secondary ">
              Interest({loanInterestRate / 100}%)
            </h5>
            <h5 className="text-sm text-primary dark:text-primary ">
              {numbro(
                web3.utils.fromWei(
                  web3.utils
                    .toBN(payableAmount)
                    .sub(web3.utils.toBN(loanPrincipalAmount)),
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
            </h5>
          </div>
          <hr className="" />
          <div className="nft-detail-input py-3 px-5 flex justify-between mt-5">
            <h5 className="text-sm dark:text-secondary text-secondary ">
              Net Payable Amount
            </h5>
            <h5 className="text-sm nft-detail-green-color-text ">
              {numbro(
                web3.utils.fromWei(
                  payableAmount,
                  nftLoansData[currentNetworkID].supportedErc20Tokens[
                    tokenMap.get(loanERC20)
                  ].web3EquivalentPrecision
                )
              ).format({ mantissa: 4 })}{" "}
              {
                nftLoansData[currentNetworkID].supportedErc20Tokens[
                  tokenMap.get(loanERC20)
                ]?.subname
              }
            </h5>
          </div>
          <div className="text-center mt-5 flex gap-5">
            <button
              className="btn-nft-gold px-9 py-2 mb-2 "
              onClick={() => {
                setIsPaybackModalOpen(false);
                sendGaEvent(
                  reactGa,
                  "BorrowNFT",
                  "PaybackCancel",
                  `${nftName}`
                );
              }}
            >
              Back
            </button>
            <button
              className="btn-nft-green px-9 py-2 mb-2 "
              onClick={() => {
                setIsLoading(true);
                paybackLoanOperation();
                sendPaybackReactGaEvent("Initiated");
              }}
            >
              Continue to Pay
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

NftLoanDetail.propTypes = {
  setShowComponent: PropTypes.func.isRequired,
  setDetailComponent: PropTypes.func.isRequired,
  currentNetworkID: PropTypes.number.isRequired,
  nftID: PropTypes.string.isRequired,
  nftContractAddress: PropTypes.string.isRequired,
  accounts: PropTypes.array.isRequired,
  web3: PropTypes.object.isRequired,
  maxRepaymentAmount: PropTypes.string.isRequired,
  loanPrincipalAmount: PropTypes.string.isRequired,
  loanDuration: PropTypes.string.isRequired,
  loanInterestRate: PropTypes.string.isRequired,
  loanERC20: PropTypes.string.isRequired,
  interestIsProRated: PropTypes.string.isRequired,
  loanAddedDate: PropTypes.string.isRequired,
  loanID: PropTypes.string.isRequired,
  loanContractID: PropTypes.string.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  nftName: PropTypes.string,
  image: PropTypes.string,
  traits: PropTypes.array.isRequired,
  collectionName: PropTypes.string.isRequired,
  setOverlayText: PropTypes.func,
  showSuccessMessage: PropTypes.func.isRequired,
  showErrorMessage: PropTypes.func.isRequired,
  loanStartDate: PropTypes.string,
  invertRetriggerFlag: PropTypes.func.isRequired,
  animationURL: PropTypes.string,
  reactGa: PropTypes.object.isRequired,
};

export default NftLoanDetail;
