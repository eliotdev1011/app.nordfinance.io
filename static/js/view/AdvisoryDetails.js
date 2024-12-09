import React, { Component } from "react";
import ConfirmModal from "../components/ConfirmModal";
import LeftArrow from "../assets/images/back.svg";
import Info from "../assets/images/info.svg";
import {
  // LineChart,
  // Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  inputCheck,
  balanceCheck,
  amountFraction,
  displayBalance,
  displayCommaBalance,
  displayAverageBalance,
  getWeb3Precision,
  bnDivision,
} from "../components/inputValidation";
import {
  claimCheck,
  contractOperation,
  contractOperationWithBiconomy,
} from "../components/transactionOperations";
import { approveWithBiconomy } from "../components/biconomyApproval";
import { advisoryData } from "../config/config";
import PropTypes from "prop-types";
import { NordSmallIcon, Gasless } from "../components/icon/icon";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import axios from "axios";
import moment from "moment";

// this.state.isChecked is true for buy and false for sell
class AdvisoryDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      advisoryAmount: "",
      advisoryErr: "",
      isChecked: true,
      isGasless: true,
      displayInfiniteSwitch: false,
      infiniteApproval: true,
      isConfirmPopupOpen: false,
      priceData: [],
      advisoryId:
        advisoryData[this.props.tempkey].contractDetails[
          this.props.currentNetworkID
        ].id,
    };
  }

  amountValidation = async (event) => {
    const amt = await inputCheck(
      event,
      advisoryData[this.props.tempkey].precision
    );
    if (amt !== "invalid") {
      const bal = this.state.isChecked
        ? this.props.displayData.tokenBalances[this.state.advisoryId]
        : this.props.displayData.advisoryBalances[this.state.advisoryId];
      const error = await balanceCheck(
        amt,
        bal,
        this.state.isChecked
          ? advisoryData[this.props.tempkey].underlyingTokenName
          : advisoryData[this.props.tempkey].subname,
        advisoryData[this.props.tempkey].web3EquivalentPrecision,
        this.props.web3
      );
      this.setState(() => {
        return { advisoryAmount: amt, advisoryErr: error };
      });
    }
  };

  initiateOperation = async (inputType) => {
    let amt = this.state.advisoryAmount;
    let displaySwitch = false;
    const bal = this.state.isChecked
      ? this.props.displayData.tokenBalances[this.state.advisoryId]
      : this.props.displayData.advisoryBalances[this.state.advisoryId];
    let error = await balanceCheck(
      amt,
      bal,
      this.state.isChecked
        ? advisoryData[this.props.tempkey].underlyingTokenName
        : advisoryData[this.props.tempkey].subname,
      advisoryData[this.props.tempkey].web3EquivalentPrecision,
      this.props.web3
    );

    if (!error) {
      if (!Number(amt)) {
        error = "Please enter a valid " + inputType + " amount!!!";
      } else {
        amt =
          amt.substring(0, amt.length - 1) +
          amt.substring(amt.length - 1, amt.length).replace(".", "");
        if (this.state.isChecked) {
          if (
            advisoryData[this.props.tempkey].contractDetails[
              this.props.currentNetworkID
            ].enableMaxCap
          ) {
            error = balanceCheck(
              amt,
              this.props.displayData.depositCapRemaining[this.state.advisoryId],
              advisoryData[this.props.tempkey].underlyingTokenName,
              advisoryData[this.props.tempkey].web3EquivalentPrecision,
              this.props.web3
            );
          }
          if (!error) {
            const approve = new this.props.web3.eth.Contract(
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].underlyingTokenABI.abi,
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].underlyingTokenAddress
            );
            displaySwitch = await claimCheck(
              amt,
              approve,
              this.props.accounts[0],
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].vaultAddress,
              advisoryData[this.props.tempkey].web3EquivalentPrecision,
              this.props.web3
            );
          } else {
            error = this.props.displayData.depositCapRemaining[
              this.state.advisoryId
            ].isZero()
              ? "You have reached max deposit cap"
              : "You can not deposit more than " +
                displayBalance(
                  this.props.displayData.depositCapRemaining[
                    this.state.advisoryId
                  ],
                  advisoryData[this.props.tempkey].web3EquivalentPrecision,
                  this.props.web3,
                  6
                ) +
                " " +
                advisoryData[this.props.tempkey].underlyingTokenName;
          }
        }
      }
    }
    await this.setState(() => {
      return {
        advisoryAmount: amt,
        advisoryErr: error,
        displayInfiniteSwitch: displaySwitch,
      };
    });
    if (!this.state.advisoryErr) {
      this.openConfirmationPopup();
      this.props.reactGa.event({
        category: "Advisory",
        action: inputType + "TxnInitiated",
        label: `${amt} USDC ${this.props.currentNetworkID}`,
      });
    }
  };

  executeApproveOperation = async () => {
    let amt = this.props.web3.utils.toBN(
      this.props.web3.utils.toWei(
        this.state.advisoryAmount,
        advisoryData[this.props.tempkey].web3EquivalentPrecision
      )
    );
    let approveFlag = false;
    if (this.state.displayInfiniteSwitch) {
      const approveOperation = new (
        advisoryData[this.props.tempkey].contractDetails[
          this.props.currentNetworkID
        ].enableBiconomy && this.state.isGasless
          ? this.props.web3Biconomy
          : this.props.web3
      ).eth.Contract(
        advisoryData[this.props.tempkey].contractDetails[
          this.props.currentNetworkID
        ].underlyingTokenABI.abi,
        advisoryData[this.props.tempkey].contractDetails[
          this.props.currentNetworkID
        ].underlyingTokenAddress
      );
      if (this.state.infiniteApproval) {
        amt = this.props.web3.utils.toBN(
          "115792089237316195423570985008687907853269984665640564039457584007913129639935"
        );
        this.props.setOverlay(
          true,
          "Waiting for Infinite " +
            advisoryData[this.props.tempkey].underlyingTokenName +
            " Allowance Approval",
          ""
        );
        if (
          advisoryData[this.props.tempkey].contractDetails[
            this.props.currentNetworkID
          ].enableBiconomy &&
          this.state.isGasless
        ) {
          approveFlag = await approveWithBiconomy(
            this.props.setOverlay,
            approveOperation,
            [
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].underlyingTokenName,
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].underlyingTokenAddress,
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].eipVersion,
              this.props.currentNetworkID,
            ],
            this.props.accounts[0],
            this.props.web3Biconomy,
            [
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].vaultAddress,
              amt,
            ]
          );
        } else {
          approveFlag = await contractOperation(
            this.props.setOverlay,
            approveOperation,
            "approve",
            this.props.accounts[0],
            [
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].vaultAddress,
              amt,
            ]
          );
        }
        if (approveFlag) {
          this.props.showSuccessMessage(
            advisoryData[this.props.tempkey].subname +
              "Contract is trusted now for Advisory Deposits!"
          );
        } else {
          this.props.showErrorMessage(
            "Failed to trust " +
              advisoryData[this.props.tempkey].subname +
              "Advisory Contract"
          );
        }
      } else {
        this.props.setOverlay(
          true,
          "Waiting for allowance approval of " +
            displayCommaBalance(
              Math.trunc(Number(this.state.advisoryAmount) * 10000) / 10000,
              4
            ) +
            " " +
            advisoryData[this.props.tempkey].underlyingTokenName,
          ""
        );
        if (
          advisoryData[this.props.tempkey].contractDetails[
            this.props.currentNetworkID
          ].enableBiconomy &&
          this.state.isGasless
        ) {
          approveFlag = await approveWithBiconomy(
            this.props.setOverlay,
            approveOperation,
            [
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].underlyingTokenName,
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].underlyingTokenAddress,
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].eipVersion,
              this.props.currentNetworkID,
            ],
            this.props.accounts[0],
            this.props.web3Biconomy,
            [
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].vaultAddress,
              amt,
            ]
          );
        } else {
          approveFlag = await contractOperation(
            this.props.setOverlay,
            approveOperation,
            "approve",
            this.props.accounts[0],
            [
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].vaultAddress,
              amt,
            ]
          );
        }
        if (approveFlag) {
          this.props.showSuccessMessage(
            displayCommaBalance(
              Math.trunc(this.state.advisoryAmount * 10000) / 10000,
              4
            ) +
              " " +
              advisoryData[this.props.tempkey].underlyingTokenName +
              " has been successfully approved for Advisory Deposit transfer!"
          );
        } else {
          this.props.showErrorMessage(
            "Failed to approve transfer of " +
              displayCommaBalance(
                Math.trunc(this.state.advisoryAmount * 10000) / 10000,
                4
              ) +
              " " +
              advisoryData[this.props.tempkey].underlyingTokenName +
              "!"
          );
        }
      }
    } else {
      approveFlag = true;
      this.props.showSuccessMessage(
        displayCommaBalance(
          Math.trunc(this.state.advisoryAmount * 10000) / 10000,
          4
        ) +
          " " +
          advisoryData[this.props.tempkey].underlyingTokenName +
          " has already been pre-approved"
      );
    }
    if (approveFlag) {
      this.executeAdvisoryOperation("Deposit");
    }
  };

  executeAdvisoryOperation = async (inputType) => {
    let advisoryOperationFlag = false;
    const advisoryOperation = new (
      advisoryData[this.props.tempkey].contractDetails[
        this.props.currentNetworkID
      ].enableBiconomy && this.state.isGasless
        ? this.props.web3Biconomy
        : this.props.web3
    ).eth.Contract(
      advisoryData[this.props.tempkey].contractDetails[
        this.props.currentNetworkID
      ].vaultABI.abi,
      advisoryData[this.props.tempkey].contractDetails[
        this.props.currentNetworkID
      ].vaultAddress
    );
    this.props.setOverlay(true, inputType + "ing...", "");
    const amt = this.props.web3.utils.toBN(
      this.props.web3.utils.toWei(
        this.state.advisoryAmount,
        advisoryData[this.props.tempkey].web3EquivalentPrecision
      )
    );

    if (
      advisoryData[this.props.tempkey].contractDetails[
        this.props.currentNetworkID
      ].enableBiconomy &&
      this.state.isGasless
    ) {
      advisoryOperationFlag = await contractOperationWithBiconomy(
        this.props.setOverlay,
        advisoryOperation,
        inputType.toLowerCase(),
        this.props.accounts[0],
        this.props.biconomy,
        [amt]
      );
    } else {
      advisoryOperationFlag = await contractOperation(
        this.props.setOverlay,
        advisoryOperation,
        inputType.toLowerCase(),
        this.props.accounts[0],
        [amt]
      );
    }
    if (advisoryOperationFlag) {
      this.props.showSuccessMessage(
        this.state.advisoryAmount +
          " " +
          (this.state.isChecked
            ? advisoryData[this.props.tempkey].underlyingTokenName
            : advisoryData[this.props.tempkey].subname) +
          " has been successfully " +
          inputType.toLowerCase() +
          (inputType === "Withdraw" ? "n" : "ed")
      );
      this.resetInput();
      this.updateBalanceAfterTx();
      this.props.reactGa.event({
        category: "Advisory",
        action: inputType + "TxnSuccessful",
        label:
          this.state.advisoryAmount + " USDC " + this.props.currentNetworkID,
      });
    } else {
      this.props.showErrorMessage(
        "Failed to " +
          inputType.toLowerCase() +
          " " +
          this.state.advisoryAmount +
          " " +
          (this.state.isChecked
            ? advisoryData[this.props.tempkey].underlyingTokenName
            : advisoryData[this.props.tempkey].subname)
      );
      this.props.reactGa.event({
        category: "Advisory",
        action: inputType + "TxnFailed",
        label:
          this.state.advisoryAmount + " USDC " + this.props.currentNetworkID,
      });
    }
  };

  openConfirmationPopup = () => {
    this.setState({
      isConfirmPopupOpen: true,
    });
  };

  handlePopupClose = async (confirm) => {
    this.setState({
      isConfirmPopupOpen: false,
    });
    if (confirm) {
      if (!this.state.isChecked) {
        this.executeAdvisoryOperation("Withdraw");
      } else {
        this.executeApproveOperation();
      }
    } else {
      const orderType = this.state.isChecked ? "Deposit" : "Withdrawal";
      this.props.showErrorMessage(orderType + " Order Cancelled!");
      this.props.reactGa.event({
        category: "Advisory",
        action: orderType + "TxnCancelled",
        label:
          this.state.advisoryAmount + " USDC " + this.props.currentNetworkID,
      });
    }
  };

  resetInput = () => {
    this.setState({
      advisoryAmount: "",
      advisoryErr: "",
    });
  };

  updateBalanceAfterTx = async () => {
    this.props.setOverlay(true, "Updating Balance...", "");
    await this.props.updateBalance();
    this.props.setOverlay(false, "", "");
  };

  calculateReceivingAmount = (amount, isDisplay, isPortfolio, fee) => {
    const tokenName =
      fee >= 0
        ? ""
        : " " +
          (this.state.isChecked && !isPortfolio
            ? advisoryData[this.props.tempkey].subname
            : advisoryData[this.props.tempkey].underlyingTokenName);
    if (Number(amount)) {
      const receiveAmt = this.props.web3.utils
        .toBN(
          this.state.isChecked && !isPortfolio
            ? "1"
            : this.props.displayData.sharePrices[this.state.advisoryId]
        )
        .mul(
          this.props.web3.utils.toBN(
            this.props.web3.utils.toWei(
              amount,
              advisoryData[this.props.tempkey].web3EquivalentPrecision
            )
          )
        );
      const precision =
        this.state.isChecked && !isPortfolio
          ? this.props.web3.utils.toBN(
              this.props.displayData.sharePrices[this.state.advisoryId]
            )
          : this.props.web3.utils
              .toBN(10)
              .pow(
                this.props.web3.utils.toBN(
                  2 * advisoryData[this.props.tempkey].precision
                )
              );
      const displayAmt = bnDivision(
        fee >= 0
          ? receiveAmt.mul(this.props.web3.utils.toBN(fee * 100))
          : receiveAmt,
        fee >= 0 ? precision.mul(this.props.web3.utils.toBN(10000)) : precision,
        this.props.web3,
        advisoryData[this.props.tempkey].precision
      );
      if (isDisplay) {
        return (
          (Number(displayAmt) < 100000
            ? displayCommaBalance(displayAmt, 2)
            : displayAverageBalance(displayAmt, 2)) + tokenName
        );
      }
      return displayAmt + tokenName;
    }
    return "0" + tokenName;
  };

  _handlePercentageClick = async (numerator, denominator) => {
    if (
      Object.keys(this.props.displayData).length !== 0 &&
      this.props.displayData.isWhitelisted
    ) {
      const bal = this.state.isChecked
        ? this.props.displayData.tokenBalances[this.state.advisoryId]
        : this.props.displayData.advisoryBalances[this.state.advisoryId];
      const amt = await amountFraction(
        bal,
        numerator,
        denominator,
        advisoryData[this.props.tempkey].web3EquivalentPrecision,
        this.props.web3
      );
      this.setState(() => {
        return { advisoryAmount: amt, advisoryErr: "" };
      });
    }
  };

  _handleAdvisoryChange = () => {
    this.setState(
      {
        isChecked: !this.state.isChecked,
      },
      () => {
        const operation = this.state.isChecked ? "Deposit" : "Withdraw";
        this.props.reactGa.event({
          category: "Advisory",
          action: "Toggle",
          label: `${operation} ${this.props.currentNetworkID}`,
        });
      }
    );
    this.resetInput();
  };

  _handleBiconomyGaslessChange = () => {
    this.setState(
      {
        isGasless: !this.state.isGasless,
      },
      () => {
        const label = this.state.isGasless ? "Checked" : "Unchecked";
        this.props.reactGa.event({
          category: "Advisory",
          action: "GaslessCheckbox",
          label,
        });
      }
    );
  };

  _handleInfiniteApprovalChange = () => {
    this.setState(
      {
        infiniteApproval: !this.state.infiniteApproval,
      },
      () => {
        const label = this.state.infiniteApproval ? "Granted" : "Revoked";
        this.props.reactGa.event({
          category: "Advisory",
          action: "InfiniteApproval",
          label,
        });
      }
    );
  };

  addUnderlyingTokenIntoArray(array) {
    const newArray = array.slice();
    newArray.push({
      icon: advisoryData[this.props.tempkey].underlyingTokenIcon,
      piechartColor:
        advisoryData[this.props.tempkey].underlyingTokenPiechartColor,
      subname: advisoryData[this.props.tempkey].underlyingTokenName,
      precision: advisoryData[this.props.tempkey].precision,
      share: this.props.displayData.tokenShares[this.state.advisoryId],
    });
    return newArray;
  }

  async fetchPriceFeed() {
    let priceData = [];
    try {
      const pricesResponse = await axios.get(
        advisoryData[this.props.tempkey].contractDetails[
          this.props.currentNetworkID
        ].pricesEndpoint +
          advisoryData[this.props.tempkey].contractDetails[
            this.props.currentNetworkID
          ].vaultAddress +
          "/data"
      );
      priceData =
        pricesResponse.data?.length > 1000
          ? pricesResponse.data?.slice(-1000)
          : pricesResponse.data;
    } catch (err) {
      console.log(`Error occured while fetching price data : ${err}`);
    }
    return priceData;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.currentNetworkID !== nextProps.currentNetworkID) {
      this.props.handleOnBack();
    }
  }

  async componentDidMount() {
    try {
      const priceData = await this.fetchPriceFeed();
      if (priceData.length) {
        this.setState(() => {
          return { priceData };
        });
      }
    } catch (err) {
      console.log("fetchPriceFeed failed: ", err);
    }
  }

  render() {
    return (
      <>
        <div className="container mx-auto">
          <div className="lg:grid lg:grid-cols-3 gap-4 my-4">
            <div className="card-coin card-advisory col-span-2">
              <div className="flex gap-2 items-center">
                <img
                  src={LeftArrow}
                  alt=""
                  className="cursor-pointer h-6"
                  onClick={() => this.props.handleOnBack()}
                />
                <p
                  className="cursor-pointer back-label dark:text-primary font-bold"
                  onClick={() => this.props.handleOnBack()}
                >
                  Back
                </p>
              </div>
              <div className="lg:flex justify-between">
                <div className="flex gap-4 pt-4 pb-1 lg:pl-2 ">
                  <div className="my-auto">
                    <NordSmallIcon />
                  </div>
                  <div className="my-auto font-bold pr-6">
                    <p className="text-primary text-xl dark:text-primary">
                      {advisoryData[this.props.tempkey].name}
                    </p>
                  </div>
                </div>
                <div className="my-auto">
                  <h3 className="my-auto text-xl text-green font-bold sm:mt-4 lg:mt-0 sm:mb-4 lg:mb:0">
                    {" $"}
                    {Object.keys(this.props.displayData).length !== 0 &&
                    this.props.displayData.sharePrices.length
                      ? displayBalance(
                          this.props.displayData.sharePrices[
                            this.state.advisoryId
                          ].mul(
                            this.props.displayData.tokenPrices[
                              this.state.advisoryId
                            ]
                          ),
                          advisoryData[this.props.tempkey]
                            .web3EquivalentPrecision,
                          this.props.web3,
                          2,
                          100
                        )
                      : "0.00"}{" "}
                    <span>
                      (
                      <span
                        className={
                          Object.keys(this.props.displayData).length !== 0 &&
                          this.props.displayData.apyData[
                            this.state.advisoryId
                          ][0] === "-"
                            ? "tertiary-color"
                            : ""
                        }
                      >
                        {Object.keys(this.props.displayData).length !== 0
                          ? (this.props.displayData.apyData[
                              this.state.advisoryId
                            ][0] === "-"
                              ? ""
                              : "+") +
                            this.props.displayData.apyData[
                              this.state.advisoryId
                            ]
                          : "0.00"}
                        %
                      </span>
                      )
                    </span>{" "}
                  </h3>
                </div>
              </div>
              <div className="lg:flex justify-between">
                <div className="flex gap-4 pb-4 lg:pl-11 ">
                  <div className="my-auto pr-6">
                    <p className="text-sm text-secondary">
                      Portfolio :{" "}
                      {Object.keys(this.props.displayData).length !== 0
                        ? this.calculateReceivingAmount(
                            this.props.web3.utils
                              .fromWei(
                                this.props.displayData.advisoryBalances[
                                  this.state.advisoryId
                                ],
                                advisoryData[this.props.tempkey]
                                  .web3EquivalentPrecision
                              )
                              .toString(),
                            true,
                            true
                          )
                        : "0"}
                    </p>
                  </div>
                </div>
                <div className="my-auto">
                  <p className="text-sm text-secondary pb-4 lg:pl-11 sm:pl-0">
                    TVL :{" "}
                    {(Object.keys(this.props.displayData).length !== 0
                      ? displayCommaBalance(
                          this.props.displayData.tvl[this.state.advisoryId],
                          2
                        )
                      : "0") +
                      " " +
                      advisoryData[this.props.tempkey].underlyingTokenName}
                  </p>
                </div>
              </div>

              <div className="nord-advisory-line-chart-holder pt-4 ml-2">
                <div className="gap-3 flex pl-4 pb-4 nord-advisory-graph-btn-holder">
                  {/* <button className="btn-switch font-bold py-2 px-8 active">
                    TVL
                      </button> */}
                  <button className="btn-switch font-bold py-2 px-8">
                    Share Price
                  </button>
                </div>
                <ResponsiveContainer width="101%" height={315}>
                  <AreaChart
                    // width={630}
                    // height={315}
                    className="nord-advisory-line-chart"
                    data={this.state.priceData?.map(
                      ({
                        pricePerFullShareCurrent,
                        timestamp,
                        vaultTvlCurrent,
                      }) => {
                        return {
                          "Share Price": pricePerFullShareCurrent,
                          timestamp:
                            moment(timestamp).format("DD MMM YY h:mm:ss"),
                          TVL: vaultTvlCurrent,
                        };
                      }
                    )}
                    margin={{
                      top: 5,
                      right: 0,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-area-chart)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-area-chart)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <Area
                      dataKey="Share Price"
                      stroke="var(--color-area-chart)"
                      fill="url(#colorUv)"
                    />
                    <XAxis dataKey="timestamp" />
                    <YAxis
                      dataKey="Share Price"
                      tickCount={10}
                      orientation="right"
                      type="number"
                      domain={[
                        (dataMin) => Math.floor(dataMin - 1),
                        (dataMax) => Math.ceil(dataMax + 1),
                      ]}
                      padding={{ top: 0, bottom: 10 }}
                    />
                    <Tooltip /> {/* <Legend /> */}
                    {/* <Line
                      type="monotone"
                      dataKey="Share Price"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    /> */}
                    {/* <Line
                      type="monotone"
                      dataKey="TVL"
                      stroke="#82ca9d"
                    /> */}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card-coin card-advisory col-span-1">
              <h2 className="font-bold text-l mb-8">Invest</h2>
              <div className="flex gap-4 items-center pb-6 ">
                <p className="font-normal text-primary dark:text-primary">
                  Deposit
                </p>
                <div>
                  {" "}
                  <label>
                    <input
                      checked={!this.state.isChecked}
                      onChange={this._handleAdvisoryChange}
                      className="switch"
                      type="checkbox"
                    />
                    <div>
                      <div></div>
                    </div>
                  </label>
                </div>
                <p className="font-normal text-primary dark:text-primary">
                  Withdraw
                </p>
              </div>
              <div className="flex justify-between pb-2">
                <p className="text-sm text-primary dark:text-primary">
                  {"Available : " +
                    displayBalance(
                      this.state.isChecked
                        ? this.props.displayData.tokenBalances[
                            this.state.advisoryId
                          ]
                        : this.props.displayData.advisoryBalances[
                            this.state.advisoryId
                          ],
                      advisoryData[this.props.tempkey].web3EquivalentPrecision,
                      this.props.web3
                    ) +
                    " " +
                    (this.state.isChecked
                      ? advisoryData[this.props.tempkey].underlyingTokenName
                      : advisoryData[this.props.tempkey].subname)}
                </p>
              </div>
              <div>
                <input
                  className="py-3 px-4 rounded nord-card-input text-primary dark:text-primary"
                  id="advisory"
                  type="text"
                  autoFocus
                  placeholder={
                    "Enter " +
                    (this.state.isChecked
                      ? advisoryData[this.props.tempkey].underlyingTokenName
                      : advisoryData[this.props.tempkey].subname) +
                    " value"
                  }
                  value={this.state.advisoryAmount}
                  onChange={(e) => this.amountValidation(e)}
                  disabled={
                    Object.keys(this.props.displayData).length !== 0
                      ? !this.props.displayData.isWhitelisted
                      : false
                  }
                />
              </div>
              <div className={"show percentage-holder pb-1"}>
                <button
                  className="single-percentage-btn"
                  onClick={() => this._handlePercentageClick(25, 100)}
                >
                  25%
                </button>
                <button
                  className="single-percentage-btn"
                  onClick={() => this._handlePercentageClick(50, 100)}
                >
                  50%
                </button>
                <button
                  className="single-percentage-btn"
                  onClick={() => this._handlePercentageClick(75, 100)}
                >
                  75%
                </button>
                <button
                  className="single-percentage-btn"
                  onClick={() => this._handlePercentageClick(100, 100)}
                >
                  100%
                </button>
              </div>
              <div className="flex pl-2 pr-2 lg:justify-between gap-4 pb-7">
                <p
                  className={
                    "text-sm text-center pl-2 " +
                    (!(
                      Object.keys(this.props.displayData).length !== 0 &&
                      !this.props.displayData.isWhitelisted
                    ) && !this.state.advisoryErr
                      ? "hide"
                      : this.props.displayData.isWhitelisted
                      ? "tertiary-color"
                      : "text-green")
                  }
                >
                  {Object.keys(this.props.displayData).length !== 0 &&
                  !this.props.displayData.isWhitelisted
                    ? "Only whitelisted address is allowed to invest. To get access, Apply "
                    : this.state.advisoryErr
                    ? this.state.advisoryErr
                    : "Valid"}
                  <a
                    className={
                      this.props.displayData.isWhitelisted
                        ? "hide-data"
                        : "underline"
                    }
                    href="https://nordfinance.typeform.com/whitelist"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    here
                  </a>
                  .
                </p>
              </div>
              <div className="flex lg:justify-center pb-1">
                <h6 className="text-sm text-primary text-center dark:text-primary">
                  You Will Get
                </h6>
              </div>
              <div className="flex lg:justify-center pb-6">
                <h4 className="text-xl font-bold text-green dark:text-green">
                  {Object.keys(this.props.displayData).length !== 0 &&
                  this.props.tempkey !== null
                    ? this.calculateReceivingAmount(
                        this.state.advisoryAmount,
                        true
                      )
                    : "0"}
                </h4>
              </div>

              <div className="lg:justify-center">
                <p className="lg:justify-center lg:mx-auto flex button-tooltip-container">
                  <button
                    className=" py-2 px-10  btn-green cursor-pointer focus:outline-none"
                    onClick={() =>
                      this.initiateOperation(
                        this.state.isChecked ? "Deposit" : "Withdrawal"
                      )
                    }
                    disabled={
                      Object.keys(this.props.displayData).length !== 0
                        ? !this.props.displayData.isWhitelisted
                        : false
                    }
                  >
                    {this.state.isChecked ? "Deposit" : "Withdraw"}
                  </button>
                  {!this.state.isChecked &&
                  this.props.currentNetworkID === 1 ? (
                    <div className={"tooltip"}>
                      <img
                        src={Info}
                        alt=""
                        className="mb-1 ml-1 h-4 w-3 cursor-pointer"
                      />
                      <span className="tooltiptext">
                        <p className="mx-5 text-left text-primary dark:text-primary">
                          Due to Metamask gas calculation bug, you should
                          increase the Gas Limit to 2000000 or above to prevent
                          transaction failures. You will be charged as per the
                          actual used gas.
                        </p>
                      </span>
                    </div>
                  ) : (
                    <span></span>
                  )}
                </p>

                <div
                  className={
                    "pt-6 flex lg:pl-7 gap-2 items-center lg:justify-center lg:mx-auto " +
                    (advisoryData[this.props.tempkey].contractDetails[
                      this.props.currentNetworkID
                    ].enableBiconomy
                      ? ""
                      : "hide-data")
                  }
                >
                  <div className="flex gap-2">
                    <Gasless> </Gasless>
                    <p className="text-green">
                      Go Gasless
                      <div className={"tooltip"}>
                        <img
                          src={Info}
                          alt=""
                          className="mb-1 ml-1 h-4 w-3 cursor-pointer"
                        />
                        <span className="tooltiptext">
                          <p className="mx-5 text-left text-primary dark:text-primary ">
                            Check if you want to enable biconomy gasless
                            transaction. Users with hardware wallet should keep
                            this setting turned off.
                          </p>
                        </span>
                      </div>
                    </p>
                  </div>
                  <label className="container-label">
                    <input
                      type="checkbox"
                      className=""
                      checked={this.state.isGasless}
                      onChange={this._handleBiconomyGaslessChange}
                    />
                    <span className="checkmark"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="card-coin">
            <h4 className="font-bold text-primary dark:text-primary text-xl pb-4">
              Assets Allocation
            </h4>
            <hr></hr>
            <div className="lg:flex">
              <div className="vr-border lg:w-1/4 sm:w-full mt-4 sm:ml-12 lg:ml-0 items-center">
                <PieChart width={180} height={300}>
                  <Pie
                    data={this.addUnderlyingTokenIntoArray(
                      this.props.displayData.activeAssetsData
                    ).map((item) => {
                      return {
                        share: parseInt(item.share.toString()) / 100,
                        subname: item.subname,
                      };
                    })}
                    // cx={120}
                    // cy={200}
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={0}
                    dataKey="share"
                    // label={(data) => data.subname}
                  >
                    {this.props.currentNetworkID &&
                      advisoryData[this.props.tempkey].contractDetails[
                        this.props.currentNetworkID
                      ] &&
                      this.addUnderlyingTokenIntoArray(
                        advisoryData[this.props.tempkey].contractDetails[
                          this.props.currentNetworkID
                        ].activeAssets
                      ).map((data, index) => (
                        <Cell key={`cell-${index}`} fill={data.piechartColor} />
                      ))}
                    <Tooltip />
                  </Pie>
                </PieChart>
              </div>
              <div
                className="lg:grid lg:grid-cols-2 mt-4 items-center gap-4 px-6 md:m-4 sm:px-0"
                style={{ maxHeight: 300, overflowY: "auto", width: "100%" }}
              >
                {this.props.currentNetworkID &&
                  advisoryData[this.props.tempkey].contractDetails[
                    this.props.currentNetworkID
                  ] &&
                  this.addUnderlyingTokenIntoArray(
                    advisoryData[this.props.tempkey].contractDetails[
                      this.props.currentNetworkID
                    ].activeAssets
                  ).map((asset, index) => (
                    <div
                      className="items-center allocation-card flex justify-between"
                      key={index}
                    >
                      <div>
                        <p className="flex items-center gap-4 pb-2 font-bold">
                          <img src={asset.icon} alt="" className="h-5" />{" "}
                          {asset.subname}
                        </p>
                        {/* TODO : Fix formatting for wbtc with 8 decimals, fix display numbers */}
                        <p className="text-secondary text-sm">
                          {`${
                            displayBalance(
                              index ===
                                this.props.displayData.activeAssetsData.length
                                ? this.props.displayData.tokenFundBalances[0]
                                : this.props.displayData.activeAssetsData[index]
                                    .balance,
                              getWeb3Precision(asset.precision),
                              this.props.web3,
                              4,
                              asset.precision === 8 ? 100 : 1
                            ) +
                            " " +
                            asset.subname
                          } = ${
                            "$" +
                            displayBalance(
                              (index ===
                              this.props.displayData.activeAssetsData.length
                                ? this.props.displayData.tokenFundBalances[
                                    this.state.advisoryId
                                  ]
                                : this.props.displayData.activeAssetsData[index]
                                    .balance
                              ).mul(
                                index ===
                                  this.props.displayData.activeAssetsData.length
                                  ? this.props.displayData.tokenPrices[
                                      this.state.advisoryId
                                    ]
                                  : this.props.displayData.activeAssetsData[
                                      index
                                    ].price
                              ),
                              getWeb3Precision(asset.precision),
                              this.props.web3,
                              2,
                              asset.precision === 8 ? 10000 : 100
                            )
                          }`}
                        </p>
                      </div>
                      <div className="circular-progress-bar-holder">
                        <CircularProgressbar
                          value={bnDivision(
                            index ===
                              this.props.displayData.activeAssetsData.length
                              ? asset.share
                              : this.props.displayData.activeAssetsData[index]
                                  .share,
                            this.props.web3.utils.toBN("100"),
                            this.props.web3,
                            2
                          )}
                        />
                        <p className="circular-progress-value-nord text-sm text-green font-10">
                          {bnDivision(
                            index ===
                              this.props.displayData.activeAssetsData.length
                              ? asset.share
                              : this.props.displayData.activeAssetsData[index]
                                  .share,
                            this.props.web3.utils.toBN("100"),
                            this.props.web3,
                            2
                          )}
                          %
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <ConfirmModal
            amount={this.state.advisoryAmount}
            isConfirmPopupOpen={this.state.isConfirmPopupOpen}
            confirmPopupType={this.state.isChecked ? "Deposit" : "Withdrawal"}
            selectedToken={
              this.props.tempkey !== null
                ? this.state.isChecked
                  ? advisoryData[this.props.tempkey].underlyingTokenName
                  : advisoryData[this.props.tempkey].subname
                : ""
            }
            nordData={[]}
            withdrawFee={this.calculateReceivingAmount(
              this.state.advisoryAmount,
              false,
              false,
              Number(
                advisoryData[this.props.tempkey].contractDetails[
                  this.props.currentNetworkID
                ].FundManagementFees
              )
            )}
            secondLine={
              this.props.tempkey !== null
                ? [
                    "Fund",
                    advisoryData[this.props.tempkey].name,
                    advisoryData[this.props.tempkey].underlyingTokenName,
                  ]
                : []
            }
            displayInfiniteSwitch={[this.state.displayInfiniteSwitch]}
            infiniteApproval={this.state.infiniteApproval}
            handleChange={this._handleInfiniteApprovalChange}
            handlePopupClose={this.handlePopupClose}
            performanceFees={
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].PerformanceFees
            }
            fundManagementFees={
              advisoryData[this.props.tempkey].contractDetails[
                this.props.currentNetworkID
              ].FundManagementFees
            }
          />
        </div>
      </>
    );
  }
}

AdvisoryDetails.propTypes = {
  tempkey: PropTypes.number.isRequired,
  web3: PropTypes.object.isRequired,
  web3Biconomy: PropTypes.object.isRequired,
  biconomy: PropTypes.object.isRequired,
  accounts: PropTypes.array.isRequired,
  displayData: PropTypes.object.isRequired,
  currentNetworkID: PropTypes.number.isRequired,
  showErrorMessage: PropTypes.instanceOf(Promise),
  showSuccessMessage: PropTypes.instanceOf(Promise),
  setOverlay: PropTypes.instanceOf(Promise),
  updateBalance: PropTypes.instanceOf(Promise),
  handleOnBack: PropTypes.instanceOf(Promise),
};

AdvisoryDetails.propTypes = {
  reactGa: PropTypes.object.isRequired,
};

export default AdvisoryDetails;
