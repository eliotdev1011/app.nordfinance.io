import React, { Component } from "react";
import Arrow from "../assets/images/arrow.svg";
import Info from "../assets/images/info.svg";
import Close from "../assets/images/back.svg";
import { NordBigIcon, Gasless } from "../components/icon/icon";
import ConfirmModal from "../components/ConfirmModal";
import CountdownTimer from "../components/countdownTimer";
import {
  percentages,
  stakingDurationOptions,
  stakingData,
  networkData,
  stakingNameSet,
  stakingSubnameSet,
  infiniteAmtStr,
  timeBasedStakingAprToApy,
} from "../config/config";
import ReactHtmlParser from "react-html-parser";
import {
  inputCheck,
  balanceCheck,
  amountFraction,
  displayBalance,
  displayCommaBalance,
  displayAverageBalance,
} from "../components/inputValidation";
import {
  claimCheck,
  contractOperation,
  contractOperationWithBiconomy,
  claimOperation,
  claimOperationWithBiconomy,
} from "../components/transactionOperations";
import { approveWithBiconomy } from "../components/biconomyApproval";
import { getUserData } from "../components/functions/getUserData";
import { getMonthylApr } from "../components/functions/getMonthlyApr";
import PropTypes from "prop-types";
import PercentButton from "../components/PercentButton";
import DurationButton from "../components/DurationButton";
import UpdateDurationModal from "../components/UpdateDurationModal";
import moment from "moment";

class Staking extends Component {
  nordNxtIndex;
  fixedDurationNordStakingContract = null;
  constructor(props) {
    super(props);
    this.state = {
      stakingAmount: "",
      stakingErr: "",
      displayInfiniteSwitch: false,
      infiniteApproval: true,
      isConfirmPopupOpen: false,
      details: true,
      tempkey: null,
      isChecked: false,
      isGasless: true,
      fixedStakingDuration: 48,
      currentStakingDuration: 0,
      estimatedApy: timeBasedStakingAprToApy[36].apy,
      fixedDurationUnstakeTime: null,
      isUpdateDurationModalOpen: false,
      showArchivedStaking: false,
    };
    this.selectDuration = this.selectDuration.bind(this);
    this.setIsUpdateDurationModalOpen =
      this.setIsUpdateDurationModalOpen.bind(this);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      this.state.tempkey !== null &&
      this.props.currentNetworkID !== nextProps.currentNetworkID
    ) {
      this.handleCardClose();
    }
  }

  amountValidation = async (event) => {
    const amt = await inputCheck(event, stakingData[0].precision);
    if (amt !== "invalid") {
      const bal = this.state.isChecked
        ? this.props.displayData.stakeBalances[this.state.tempkey]
        : this.props.displayData.tokenBalances[this.state.tempkey];
      const error = await balanceCheck(
        amt,
        bal,
        stakingData[this.state.tempkey].subname,
        stakingData[this.state.tempkey].web3EquivalentPrecision,
        this.props.web3
      );
      this.setState(() => {
        return { stakingAmount: amt, stakingErr: error };
      });
    }
  };

  initiateOperation = async (inputType) => {
    if (
      inputType === "Unstake" &&
      stakingData[this.state.tempkey].name === "NORD (Old)"
    ) {
      await this._handlePercentageClick(100, 100);
    }
    let amt = this.state.stakingAmount;
    let displaySwitch = false;
    const bal = this.state.isChecked
      ? this.props.displayData.stakeBalances[this.state.tempkey]
      : this.props.displayData.tokenBalances[this.state.tempkey];
    let error = await balanceCheck(
      amt,
      bal,
      stakingData[this.state.tempkey].subname,
      stakingData[this.state.tempkey].web3EquivalentPrecision,
      this.props.web3
    );
    if (!error) {
      if (
        !Number(amt) &&
        inputType === "Unstake" &&
        stakingData[this.state.tempkey].name === "NORD (Old)"
      ) {
        error = "There is no amount to unstake!!!";
      } else if (!Number(amt)) {
        error = "Please enter a valid " + inputType + " amount!!!";
      } else {
        amt =
          amt.substring(0, amt.length - 1) +
          amt.substring(amt.length - 1, amt.length).replace(".", "");
        if (!this.state.isChecked) {
          const approve = new this.props.web3.eth.Contract(
            stakingData[this.state.tempkey].contractDetails[
              this.props.currentNetworkID
            ].tokenABI.abi,
            stakingData[this.state.tempkey].contractDetails[
              this.props.currentNetworkID
            ].tokenAddress
          );
          displaySwitch = await claimCheck(
            amt,
            approve,
            this.props.accounts[0],
            stakingData[this.state.tempkey].contractDetails[
              this.props.currentNetworkID
            ].stakingAddress,
            stakingData[this.state.tempkey].web3EquivalentPrecision,
            this.props.web3
          );
        }
      }
    }
    await this.setState(() => {
      return {
        stakingAmount: amt,
        stakingErr: error,
        displayInfiniteSwitch: displaySwitch,
      };
    });
    if (!this.state.stakingErr) {
      this.openConfirmationPopup();
      this.props.reactGa.event({
        category: "Staking",
        action: inputType + "TxnInitiated",
        label: `${amt} ${stakingData[this.state.tempkey].subname} ${
          this.props.currentNetworkID
        }`,
      });
    }
  };

  executeApproveOperation = async () => {
    let amt = this.props.web3.utils.toBN(
      this.props.web3.utils.toWei(
        this.state.stakingAmount,
        stakingData[this.state.tempkey].web3EquivalentPrecision
      )
    );
    let approveFlag = false;
    if (this.state.displayInfiniteSwitch) {
      const approveOperation = new (
        stakingData[this.state.tempkey].contractDetails[
          this.props.currentNetworkID
        ].enableBiconomy && this.state.isGasless
          ? this.props.web3Biconomy
          : this.props.web3
      ).eth.Contract(
        stakingData[this.state.tempkey].contractDetails[
          this.props.currentNetworkID
        ].tokenABI.abi,
        stakingData[this.state.tempkey].contractDetails[
          this.props.currentNetworkID
        ].tokenAddress
      );
      if (this.state.infiniteApproval) {
        amt = this.props.web3.utils.toBN(infiniteAmtStr);
        this.props.setOverlay(
          true,
          "Waiting for Infinite " +
            stakingData[this.state.tempkey].subname +
            " Allowance Approval",
          ""
        );
        if (
          stakingData[this.state.tempkey].contractDetails[
            this.props.currentNetworkID
          ].enableBiconomy &&
          this.state.isGasless
        ) {
          approveFlag = await approveWithBiconomy(
            this.props.setOverlay,
            approveOperation,
            [
              stakingData[this.state.tempkey].contractDetails[
                this.props.currentNetworkID
              ].tokenName,
              stakingData[this.state.tempkey].contractDetails[
                this.props.currentNetworkID
              ].tokenAddress,
              stakingData[this.state.tempkey].contractDetails[
                this.props.currentNetworkID
              ].eipVersion,
              this.props.currentNetworkID,
            ],
            this.props.accounts[0],
            this.props.web3Biconomy,
            [
              stakingData[this.state.tempkey].contractDetails[
                this.props.currentNetworkID
              ].stakingAddress,
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
              stakingData[this.state.tempkey].contractDetails[
                this.props.currentNetworkID
              ].stakingAddress,
              amt,
            ]
          );
        }
        if (approveFlag) {
          const rewardTokenName =
            stakingData[this.state.tempkey].subname === "KRIDA"
              ? "KRIDA"
              : "NORD";
          this.props.showSuccessMessage(
            `${
              stakingData[this.state.tempkey].subname
            }-${rewardTokenName} Staking Contract is trusted now!`
          );
        } else {
          const rewardTokenName =
            stakingData[this.state.tempkey].subname === "KRIDA"
              ? "KRIDA"
              : "NORD";
          this.props.showErrorMessage(
            `Failed to trust " +
              ${
                stakingData[this.state.tempkey].subname
              }-${rewardTokenName} Staking Contract`
          );
        }
      } else {
        this.props.setOverlay(
          true,
          "Waiting for allowance approval of " +
            displayCommaBalance(
              Math.trunc(Number(this.state.stakingAmount) * 10000) / 10000,
              4
            ) +
            " " +
            stakingData[this.state.tempkey].subname,
          ""
        );
        if (
          stakingData[this.state.tempkey].contractDetails[
            this.props.currentNetworkID
          ].enableBiconomy &&
          this.state.isGasless
        ) {
          approveFlag = await approveWithBiconomy(
            this.props.setOverlay,
            approveOperation,
            [
              stakingData[this.state.tempkey].contractDetails[
                this.props.currentNetworkID
              ].tokenName,
              stakingData[this.state.tempkey].contractDetails[
                this.props.currentNetworkID
              ].tokenAddress,
              stakingData[this.state.tempkey].contractDetails[
                this.props.currentNetworkID
              ].eipVersion,
              this.props.currentNetworkID,
            ],
            this.props.accounts[0],
            this.props.web3Biconomy,
            [
              stakingData[this.state.tempkey].contractDetails[
                this.props.currentNetworkID
              ].stakingAddress,
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
              stakingData[this.state.tempkey].contractDetails[
                this.props.currentNetworkID
              ].stakingAddress,
              amt,
            ]
          );
        }
        if (approveFlag) {
          this.props.showSuccessMessage(
            displayCommaBalance(
              Math.trunc(this.state.stakingAmount * 10000) / 10000,
              4
            ) +
              " " +
              stakingData[this.state.tempkey].subname +
              " has been successfully approved for stake transfer!"
          );
        } else {
          this.props.showErrorMessage(
            "Failed to approve transfer of " +
              displayCommaBalance(
                Math.trunc(this.state.stakingAmount * 10000) / 10000,
                4
              ) +
              " " +
              stakingData[this.state.tempkey].subname +
              "!"
          );
        }
      }
    } else {
      approveFlag = true;
      this.props.showSuccessMessage(
        displayCommaBalance(
          Math.trunc(this.state.stakingAmount * 10000) / 10000,
          4
        ) +
          " " +
          stakingData[this.state.tempkey].subname +
          " has already been pre-approved"
      );
    }
    if (approveFlag) {
      this.executeStakingOperation("Stake");
    }
  };

  executeStakingOperation = async (inputType) => {
    let stakeOperationFlag = false;
    const stakingOperation = new (
      stakingData[this.state.tempkey].contractDetails[
        this.props.currentNetworkID
      ].enableBiconomy && this.state.isGasless
        ? this.props.web3Biconomy
        : this.props.web3
    ).eth.Contract(
      stakingData[this.state.tempkey].contractDetails[
        this.props.currentNetworkID
      ].stakingABI.abi,
      stakingData[this.state.tempkey].contractDetails[
        this.props.currentNetworkID
      ].stakingAddress
    );

    this.props.setOverlay(
      true,
      inputType.substring(0, inputType.length - 1) +
        inputType
          .substring(inputType.length - 1, inputType.length)
          .replace("e", "ing") +
        "...",
      ""
    );
    if (
      inputType === "Unstake" &&
      stakingData[this.state.tempkey].name === "NORD (Old)"
    ) {
      if (
        stakingData[this.state.tempkey].contractDetails[
          this.props.currentNetworkID
        ].enableBiconomy &&
        this.state.isGasless
      ) {
        stakeOperationFlag = await claimOperationWithBiconomy(
          this.props.setOverlay,
          stakingOperation,
          "exit",
          this.props.accounts[0],
          this.props.biconomy
        );
      } else {
        stakeOperationFlag = await claimOperation(
          this.props.setOverlay,
          stakingOperation,
          "exit",
          this.props.accounts[0]
        );
      }
    } else {
      const amt = this.props.web3.utils.toBN(
        this.props.web3.utils.toWei(
          this.state.stakingAmount,
          stakingData[this.state.tempkey].web3EquivalentPrecision
        )
      );
      if (
        stakingData[this.state.tempkey].contractDetails[
          this.props.currentNetworkID
        ].enableBiconomy &&
        this.state.isGasless
      ) {
        const params =
          inputType === "Stake" &&
          stakingData[this.state.tempkey].name === "NORD (NXT)"
            ? [amt, this.state.fixedStakingDuration]
            : [amt];
        stakeOperationFlag = await contractOperationWithBiconomy(
          this.props.setOverlay,
          stakingOperation,
          inputType.toLowerCase(),
          this.props.accounts[0],
          this.props.biconomy,
          params
        );
      } else {
        const params =
          inputType === "Stake" &&
          stakingData[this.state.tempkey].name === "NORD (NXT)"
            ? [amt, this.state.fixedStakingDuration]
            : [amt];

        stakeOperationFlag = await contractOperation(
          this.props.setOverlay,
          stakingOperation,
          inputType.toLowerCase(),
          this.props.accounts[0],
          params
        );
      }
    }
    if (stakeOperationFlag) {
      this.props.showSuccessMessage(
        this.state.stakingAmount +
          " " +
          stakingData[this.state.tempkey].subname +
          " has been successfully " +
          inputType.toLowerCase() +
          "d"
      );
      this.resetInput();
      this.updateBalanceAfterTx();
      this.props.reactGa.event({
        category: "Staking",
        action: inputType + "TxnSuccessful",
        label: `${this.state.stakingAmount} ${
          stakingData[this.state.tempkey].subname
        } ${this.props.currentNetworkID}`,
      });
    } else {
      this.props.showErrorMessage(
        "Failed to " +
          inputType.toLowerCase() +
          " " +
          this.state.stakingAmount +
          " " +
          stakingData[this.state.tempkey].subname
      );
      this.props.reactGa.event({
        category: "Staking",
        action: inputType + "TxnFailed",
        label: `${this.state.stakingAmount} ${
          stakingData[this.state.tempkey].subname
        } ${this.props.currentNetworkID}`,
      });
    }
  };

  executeRewardOperation = async (claimType) => {
    const claim = claimType !== "Reinvest" ? "Claim" : claimType;

    if (
      (!this.props.displayData.earnBalances[this.state.tempkey].isZero() &&
        (claimType === "Earnings Reward" || claimType === "Reinvest")) ||
      (!this.props.displayData.unclaimedStakeBalances[
        this.state.tempkey
      ].isZero() &&
        claimType === "Stake")
    ) {
      let claimOperationFlag = false;
      const stakingOperation = new (
        stakingData[this.state.tempkey].contractDetails[
          this.props.currentNetworkID
        ].enableBiconomy && this.state.isGasless
          ? this.props.web3Biconomy
          : this.props.web3
      ).eth.Contract(
        stakingData[this.state.tempkey].contractDetails[
          this.props.currentNetworkID
        ].stakingABI.abi,
        stakingData[this.state.tempkey].contractDetails[
          this.props.currentNetworkID
        ].stakingAddress
      );
      this.props.setOverlay(
        true,
        claimType === "Stake"
          ? "Claiming Staking Amount..."
          : (claimType === "Earnings Reward" ? "Claiming" : claimType + "ing") +
              " Staking Rewards...",
        ""
      );
      if (
        stakingData[this.state.tempkey].contractDetails[
          this.props.currentNetworkID
        ].enableBiconomy &&
        this.state.isGasless
      ) {
        claimOperationFlag = await claimOperationWithBiconomy(
          this.props.setOverlay,
          stakingOperation,
          claimType === "Stake"
            ? "claimUnstakedAmount"
            : claimType === "Earnings Reward"
            ? "getReward"
            : claimType.toLowerCase(),
          this.props.accounts[0],
          this.props.biconomy
        );
      } else {
        claimOperationFlag = await claimOperation(
          this.props.setOverlay,
          stakingOperation,
          claimType === "Stake"
            ? "claimUnstakedAmount"
            : claimType === "Earnings Reward"
            ? "getReward"
            : claimType.toLowerCase(),
          this.props.accounts[0]
        );
      }
      if (claimOperationFlag) {
        this.props.showSuccessMessage(
          claimType === "Reinvest"
            ? `Successfully reinvested ${
                stakingData[this.state.tempkey].subname
              } Rewards`
            : `Successfully claimed ${
                stakingData[this.state.tempkey].subname
              } ${claimType}`
        );
        this.updateBalanceAfterTx();
        this.props.reactGa.event({
          category: "Staking",
          action: claim + "Successful",
          label: `${stakingData[this.state.tempkey].subname} ${
            this.props.currentNetworkID
          }`,
        });
      } else {
        this.props.showErrorMessage(
          claimType === "Reinvest"
            ? `Failed to reinvest ${
                stakingData[this.state.tempkey].subname
              } Rewards`
            : `Failed to claim ${
                stakingData[this.state.tempkey].subname
              } ${claimType}`
        );
        this.props.reactGa.event({
          category: "Staking",
          action: claim + "Failed",
          label: `${stakingData[this.state.tempkey].subname} ${
            this.props.currentNetworkID
          }`,
        });
      }
    } else {
      this.props.showErrorMessage(
        claimType === "Reinvest"
          ? `No Unclaimed ${
              stakingData[this.state.tempkey].subname
            } Reward Available for Reinvesting`
          : `No Unclaimed ${
              stakingData[this.state.tempkey].subname
            } ${claimType} Available`
      );
      this.props.reactGa.event({
        category: "Staking",
        action: claim + "TxnNotInitiated",
        label: `${this.state.stakingAmount} ${
          stakingData[this.state.tempkey].subname
        } InsufficientBalance ${this.props.currentNetworkID}`,
      });
    }
  };

  updateBalanceAfterTx = async () => {
    this.props.setOverlay(true, "Updating Balance...", "");
    await this.props.updateBalance();
    this.props.setOverlay(false, "", "");
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
    const orderType = this.state.isChecked ? "Unstake" : "Stake";

    if (confirm) {
      this.props.reactGa.event({
        category: "Staking",
        action: orderType + "TxnContinued",
        label: `${this.state.stakingAmount} ${
          stakingData[this.state.tempkey].subname
        } ${this.props.currentNetworkID}`,
      });
      if (this.state.isChecked) {
        this.executeStakingOperation("Unstake");
      } else {
        this.executeApproveOperation();
      }
    } else {
      this.props.showErrorMessage(orderType + " Order Cancelled!");
      this.props.reactGa.event({
        category: "Staking",
        action: orderType + "TxnCancelled",
        label: `${this.state.stakingAmount} ${
          stakingData[this.state.tempkey].subname
        } ${this.props.currentNetworkID}`,
      });
    }
  };

  handleCardClick = async (index) => {
    if (
      stakingData[index].contractDetails[this.props.currentNetworkID]
        .startTime &&
      new Date().getTime() <
        stakingData[index].contractDetails[
          this.props.currentNetworkID
        ].startTime.getTime()
    ) {
      this.props.displayCardClickError(
        "Please wait for the staking period to start."
      );
    } else if (!this.props.accounts[0]) {
      this.props.displayCardClickError();
    } else {
      this.setState(
        {
          tempkey: index,
          details: false,
        },
        () => {
          this.props.reactGa.event({
            category: "Staking",
            action: "CardClicked",
            label: `${stakingData[this.state.tempkey].subname} ${
              this.props.currentNetworkID
            }`,
          });
        }
      );
    }
  };

  handleCardClose = () => {
    this.props.reactGa.event({
      category: "Staking",
      action: "CardClosed",
      label:
        stakingData[this.state.tempkey].subname +
        " " +
        this.props.currentNetworkID,
    });
    this.setState({
      tempkey: null,
      details: true,
      isChecked: false,
    });
    this.resetInput();
  };

  resetInput = () => {
    this.setState({
      stakingAmount: "",
      stakingErr: "",
    });
  };

  _handleStakingChange = () => {
    this.setState(
      {
        isChecked: !this.state.isChecked,
      },
      () => {
        const label = this.state.isChecked ? "Unstake" : "Stake";
        this.props.reactGa.event({
          category: "Staking",
          action: "Toggle",
          label,
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
          category: "Staking",
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
          category: "Staking",
          action: "InfiniteApproval",
          label,
        });
      }
    );
  };

  _handlePercentageClick = async (numerator, denominator) => {
    if (
      !(!this.state.isChecked && this.displayEndDate(this.state.tempkey, true))
    ) {
      const bal = this.state.isChecked
        ? this.props.displayData.stakeBalances[this.state.tempkey]
        : this.props.displayData.tokenBalances[this.state.tempkey];
      const amt = await amountFraction(
        bal,
        numerator,
        denominator,
        stakingData[this.state.tempkey].web3EquivalentPrecision,
        this.props.web3
      );
      this.setState(() => {
        return { stakingAmount: amt, stakingErr: "" };
      });
    }
  };

  displayEndDate = (date, stakingPeriodCheck) => {
    if (Number.isInteger(date)) {
      const id = date;
      if (
        stakingData[id].contractDetails[this.props.currentNetworkID].startTime
      ) {
        date = new Date(
          stakingData[id].contractDetails[
            this.props.currentNetworkID
          ].startTime.getTime()
        );
        date.setDate(
          date.getDate() +
            stakingData[id].contractDetails[this.props.currentNetworkID]
              .stakingPeriodInDays
        );
        if (stakingPeriodCheck) {
          return new Date().getTime() > date.getTime();
        }
        date = date.toUTCString();
      } else if (stakingData[id].name === "NORD") {
        date = new Date(
          stakingData[id].contractDetails[
            this.props.currentNetworkID
          ].endTime.getTime()
        ).toUTCString();
      } else return false;
    }
    date = date.split(" ");
    return date[1] + " " + date[2] + " " + date[3] + " " + date[4];
  };

  selectDuration(duration) {
    this.setState({ fixedStakingDuration: duration });
  }

  shouldButtonBeDisabled() {
    if (
      this.state.tempkey !== null &&
      stakingData[this.state.tempkey].name === "NORD (NXT)"
    ) {
      if (
        // stake btn: selected duration < current duration
        (!this.state.isChecked &&
          this.state.fixedStakingDuration <
            this.state.currentStakingDuration) ||
        // unstake btn: unstake time <= current time
        (this.state.isChecked &&
          new Date(this.state.fixedDurationUnstakeTime * 1000) >= Date.now())
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      // stake and reinvest btns
      if (
        !this.state.isChecked &&
        this.displayEndDate(this.state.tempkey, true)
      ) {
        return true;
      } else {
        return false;
      }
    }
  }

  shouldUpdateDurBtnBeDisabled() {
    if (
      this.state.fixedStakingDuration <= this.state.currentStakingDuration ||
      this.state.currentStakingDuration === 48
    ) {
      return true;
    } else {
      return false;
    }
  }

  setIsUpdateDurationModalOpen(modalStatus) {
    this.setState({ isUpdateDurationModalOpen: modalStatus });
  }

  hasUserStakedToken(tokenIndex) {
    const stakedBalance = this.props.displayData
      ? this.props.web3.utils.toBN(
          this.props.displayData.stakeBalances[tokenIndex]
        )
      : this.props.web3.utils.toBN("0");
    return stakedBalance.gt(this.props.web3.utils.toBN("0"));
  }

  getStakingPeriod(stakedToken, index) {
    if (stakedToken.name === "NORD (NXT)") {
      // staked amt > 0
      if (this.hasUserStakedToken(index)) {
        return stakingDurationOptions[this.state?.currentStakingDuration]?.full;
      }
      // stake amt === 0
      else {
        return `Upto ${stakingDurationOptions[48].full}`;
      }
    } else {
      if (stakedToken.name === "NORD") {
        return "Completed";
      } else {
        return stakedToken.contractDetails[this.props.currentNetworkID]
          .stakingPeriodInDays
          ? stakedToken.contractDetails[this.props.currentNetworkID]
              .stakingPeriodInDays + " Days"
          : "Unlimited";
      }
    }
  }

  getUnstakeTime(stakingTime, currentStakingDuration) {
    // staking time
    const date = new Date(Number(stakingTime) * 1000);
    // staking time + stakingDuration
    date.setDate(date.getDate() + parseInt(currentStakingDuration * 30));
    return Math.floor(date.getTime() / 1000);
  }

  isFixedDurationUnstakeDateClose() {
    // return true if fixedDurationUnstakeTime is <= 7 days away from current time
    const unstakeDateMoment = moment(
      new Date(Number(this.state.fixedDurationUnstakeTime) * 1000)
    );

    const diffInDays = moment(unstakeDateMoment).diff(moment(), "days");
    return diffInDays <= 7;
  }

  renderUnstakeDateOrCountDown(stakedToken) {
    if (stakedToken.name === "NORD (NXT)") {
      if (this.isFixedDurationUnstakeDateClose()) {
        return (
          this.state.fixedDurationUnstakeTime && (
            <CountdownTimer
              key={this.state.fixedDurationUnstakeTime.toString()}
              unstakeTimeRemaining={this.state.fixedDurationUnstakeTime.toString()}
              isStakingDurationFixed={true}
            />
          )
        );
      } else {
        return (
          <p className="text-primary">
            You can unstake after:{" "}
            {moment(
              new Date(Number(this.state.fixedDurationUnstakeTime) * 1000)
            ).format("MMMM DD YYYY")}
          </p>
        );
      }
    } else {
      return <></>;
    }
  }

  renderEndTime(stakedToken, index) {
    let endTime = "";
    let divClassname = "";
    if (stakedToken.name === "NORD (NXT)") {
      if (this.hasUserStakedToken(index)) {
        endTime = moment(
          new Date(Number(this.state.fixedDurationUnstakeTime) * 1000)
        ).format("MMMM DD YYYY");
      } else {
        divClassname = "hide";
      }
    } else {
      endTime =
        stakedToken.contractDetails[this.props.currentNetworkID].startTime ||
        stakedToken.contractDetails[this.props.currentNetworkID].endTime
          ? this.displayEndDate(index)
          : "Unlimited";
    }
    return (
      <div className={divClassname}>
        <p className="text-color staking-key-width text-primary dark:text-primary ">
          {"End Time (UTC)"}
        </p>
        <p className="font-bold text-sm text-primary dark:text-primary">
          {endTime}
        </p>
      </div>
    );
  }

  renderAprOrApy(stakedToken, index) {
    let title = stakedToken.subname === "NORD" ? "APR" : "APY";
    let content =
      this.props.displayData && !this.displayEndDate(index, true)
        ? displayCommaBalance(this.props.displayData.apy[index], 2)
        : "0";
    let toShowToolTip = false;
    let tooltipContent = "";

    if (stakedToken.name === "NORD (NXT)") {
      title = "APY";
      toShowToolTip =
        this.props.displayData && !this.displayEndDate(index, true);
      content = timeBasedStakingAprToApy[content].apy;

      tooltipContent =
        toShowToolTip &&
        `Earn upto ${
          timeBasedStakingAprToApy[36].apy -
          Number(this.props.displayData.apy[index])
        }% additional APY by staking for 4 years!`;

      if (!this.hasUserStakedToken(index)) {
        content = `${timeBasedStakingAprToApy[36].apy}`;
        tooltipContent = `Estimated APY subject to monthly reinvestment`;
      }
    }

    return (
      <div className="">
        <p className="text-sm text-primary dark:text-primary staking-key-width">
          {`${title} (%)`}
        </p>
        <div className="font-bold text-sm text-green dark:text-green ">
          {`${content} %`}
          {toShowToolTip && (
            <span className="tooltip">
              <img
                src={Info}
                alt="info"
                className="ml-2 mt-1 h-3.5 w-3.5 cursor-pointer"
              />
              <span
                className="tooltiptext font-normal"
                style={{ width: "12rem", left: "5rem" }}
              >
                {tooltipContent}
              </span>
            </span>
          )}
        </div>
      </div>
    );
  }

  renderStakingCards(stakingDataArr, programType) {
    if (stakingDataArr.length === 0) {
      console.log("empty");
      return (
        <h5 className="unavailable px-16">{`No staking program ${
          programType === "active" ? "active" : "archived"
        }`}</h5>
      );
    }
    return (
      <>
        {stakingDataArr.map((data) => {
          if (data.contractDetails[this.props.currentNetworkID]) {
            return (
              <div
                className="card-coin cursor-pointer mt-10"
                key={data.name}
                onClick={() => this.handleCardClick(data.actualIndex)}
              >
                <div className="lg:flex">
                  <div className="lg:grid lg:w-1/4 md:flex md:w-full vr-border">
                    <div className="flex gap-4">
                      <div className="lg:h-12 md:h-10">
                        {" "}
                        {ReactHtmlParser(data.icon)}{" "}
                      </div>
                      <div className="">
                        <p className="lg:text-base md:text-sm text-primary dark:text-primary">
                          Stake{" "}
                          <span className="text-green dark:text-green">
                            {data.name}
                          </span>
                          <br></br>
                          to get
                          <span className="text-green dark:text-green">
                            {" "}
                            {data.name === "KRIDA" ? "KRIDA" : "NORD"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-3/4 md:full lg:pl-6 sm:pl-0 md:mt-12 lg:mt-0">
                    <div className="grid lg:grid-cols-4 gap-4 lg:pb-8 sm:pb-4 sm:mt-6">
                      {this.renderAprOrApy(data, data.actualIndex)}
                      <div className="sm:hidden lg:block">
                        <p className="text-sm text-primary dark:text-primary staking-key-width">
                          TVL
                        </p>
                        <p className="font-bold text-sm text-primary dark:text-primary ">
                          {(this.props.displayData
                            ? displayBalance(
                                this.props.displayData.tvl[data.actualIndex],
                                data.web3EquivalentPrecision,
                                this.props.web3
                              )
                            : "0") +
                            " " +
                            data.subname}
                        </p>
                      </div>
                      <div className="">
                        <p className="text-sm text-primary dark:text-primary staking-key-width">
                          Staking Period
                        </p>
                        <p className="font-bold text-sm text-primary dark:text-primary">
                          {this.getStakingPeriod(data, data.actualIndex)}
                        </p>
                      </div>
                      {this.renderEndTime(data, data.actualIndex)}
                    </div>
                    <div className="grid lg:grid-cols-4 gap-6">
                      <div className="">
                        <p className="text-sm text-color staking-key-width text-primary dark:text-primary">
                          {data.subname === "KRIDA" ? "KRIDA" : "NORD"} Earned
                        </p>
                        <p className="font-bold text-sm text-green dark:text-green">
                          {(this.props.displayData
                            ? displayBalance(
                                this.props.displayData.earnBalances[
                                  data.actualIndex
                                ],
                                data.web3EquivalentPrecision,
                                this.props.web3
                              )
                            : "0") +
                            ` ${
                              data.subname === "Uni-LP" ? "LP" : data.subname
                            }`}
                        </p>
                      </div>
                      <div className="sm:hidden lg:block">
                        <p className="text-sm text-color staking-key-width text-primary dark:text-primary">
                          {(data.subname === "Uni-LP" ? "LP" : data.subname) +
                            " Balance"}
                        </p>
                        <p className="font-bold text-sm text-primary dark:text-primary">
                          {(this.props.displayData
                            ? displayBalance(
                                this.props.displayData.tokenBalances[
                                  data.actualIndex
                                ],
                                data.web3EquivalentPrecision,
                                this.props.web3
                              )
                            : "0") +
                            " " +
                            data.subname}
                        </p>
                      </div>
                      <div className="sm:hidden lg:block">
                        <p className="text-sm text-color staking-key-width text-primary dark:text-primary">
                          {(data.subname === "Uni-LP" ? "LP" : data.subname) +
                            " Staked"}
                        </p>
                        <p className="font-bold text-sm text-primary dark:text-primary">
                          {(this.props.displayData
                            ? displayBalance(
                                this.props.displayData.stakeBalances[
                                  data.actualIndex
                                ],
                                data.web3EquivalentPrecision,
                                this.props.web3
                              )
                            : "0") +
                            " " +
                            data.subname}
                        </p>
                      </div>
                      <div></div>
                    </div>
                  </div>
                  <img
                    src={Arrow}
                    alt=""
                    className="pl-6 md:hidden sm:hidden lg:block"
                  />
                </div>
              </div>
            );
          } else {
            return <></>;
          }
        })}
      </>
    );
  }

  renderAllStakingCards() {
    const activeStakingData = [];
    const archivedStakingData = [];
    for (let counter = 0; counter < stakingData.length; counter++) {
      if (
        stakingData[counter].isActive &&
        stakingData[counter].contractDetails[this.props.currentNetworkID]
      ) {
        activeStakingData.push({
          ...stakingData[counter],
          actualIndex: counter,
        });
      } else if (
        !stakingData[counter].isActive &&
        stakingData[counter].contractDetails[this.props.currentNetworkID]
      ) {
        archivedStakingData.push({
          ...stakingData[counter],
          actualIndex: counter,
        });
      }
    }
    return (
      <>
        {this.state.showArchivedStaking
          ? this.renderStakingCards(archivedStakingData, "archive")
          : this.renderStakingCards(activeStakingData, "active")}
      </>
    );
  }

  async componentDidUpdate(prevProps, prevState) {
    // change contract instance on account or network change
    if (
      this.props.accounts[0] !== prevProps.accounts[0] ||
      this.props.currentNetworkID !== prevProps.currentNetworkID ||
      this.fixedDurationNordStakingContract === null
    ) {
      this.nordNxtIndex = stakingData.findIndex(
        (token) => token.name === "NORD (NXT)"
      );
      this.fixedDurationNordStakingContract = new this.props.web3.eth.Contract(
        stakingData[this.nordNxtIndex].contractDetails[
          this.props.currentNetworkID
        ].stakingABI.abi,
        stakingData[this.nordNxtIndex].contractDetails[
          this.props.currentNetworkID
        ].stakingAddress
      );

      if (this.state.fixedStakingDuration !== 48) {
        this.setState({ fixedStakingDuration: 48 });
      }
    }
    // !detailCardClicked & staked NORD (NXT) > 0
    if (
      this.state.tempkey === null &&
      this.hasUserStakedToken(this.nordNxtIndex) &&
      this.state.fixedDurationUnstakeTime === null
    ) {
      const userData = await getUserData(
        this.fixedDurationNordStakingContract,
        this.props.accounts
      );

      this.setState({
        currentStakingDuration: parseInt(userData[3]),
        fixedDurationUnstakeTime: this.getUnstakeTime(userData[4], userData[3]),
      });
    }

    if (
      this.state.tempkey !== null &&
      stakingData[this.state.tempkey].name === "NORD (NXT)"
    ) {
      const userData = await getUserData(
        this.fixedDurationNordStakingContract,
        this.props.accounts
      );

      if (this.state.currentStakingDuration !== parseInt(userData[3])) {
        this.setState({
          // staking time + stakingDuration unix timestamp
          fixedDurationUnstakeTime: this.getUnstakeTime(
            userData[4],
            userData[3]
          ),
          currentStakingDuration: parseInt(userData[3]),
        });
      }

      if (this.state.fixedStakingDuration !== prevState.fixedStakingDuration) {
        // fetch when fixedStakingDuration is changed
        const estimatedApr = await getMonthylApr(
          this.fixedDurationNordStakingContract,
          this.state.fixedStakingDuration
        );
        this.setState({
          estimatedApy:
            timeBasedStakingAprToApy[parseInt(estimatedApr) / 100].apy,
        });
      }
    }
  }

  render() {
    return (
      <>
        <div className="lg:grid lg:px-32 md:px-4 container mx-auto">
          <div className="flex gap-7 pb-7 my-auto">
            <h4
              className={
                this.state.showArchivedStaking
                  ? " text-primary font-bold cursor-pointer"
                  : " tab-active font-bold cursor-pointer"
              }
              onClick={() => {
                this.setState({ showArchivedStaking: false });
                this.state.tempkey !== null && this.handleCardClose();
              }}
            >
              Active
            </h4>
            <h4
              className={
                this.state.showArchivedStaking
                  ? "text-base tab-active font-bold cursor-pointer"
                  : "text-base text-primary font-bold cursor-pointer"
              }
              onClick={() => {
                this.setState({ showArchivedStaking: true });
                this.state.tempkey !== null && this.handleCardClose();
              }}
            >
              Archived
            </h4>
          </div>
          {this.state.details ? (
            this.renderAllStakingCards()
          ) : stakingData[this.state.tempkey].contractDetails[
              this.props.currentNetworkID
            ] ? (
            <div className="">
              <div className="coin-card-staking-expand">
                <div className="">
                  <div
                    className="back-container items-center"
                    onClick={() => this.handleCardClose()}
                  >
                    <img
                      src={Close}
                      alt=""
                      className="ml-4 cursor-pointer h-6"
                    />
                    <p className="back-label dark:text-primary">Back</p>
                  </div>
                </div>
                <div className="lg:flex items-center gap-6 justify-between px-4 mt-4">
                  <div className="flex items-center pt-2">
                    <div className="pr-6">
                      {" "}
                      {ReactHtmlParser(
                        stakingData[this.state.tempkey].icon
                      )}{" "}
                    </div>
                    <p className="pr-8 font-bold text-primary dark:text-primary">
                      {stakingData[this.state.tempkey].name} <br></br>{" "}
                    </p>
                  </div>
                  {this.renderAprOrApy(
                    stakingData[this.state.tempkey],
                    this.state.tempkey
                  )}
                  {/* <div className="lg:block sm:flex sm:pt-4 lg:pt-0">
                    <p className="text-sm text-primary dark:text-primary staking-key-width">
                      {stakingData[this.state.tempkey].subname === "NORD"
                        ? "APR"
                        : "APY"}{" "}
                      (%)
                    </p>
                    <p className="font-bold text-sm text-primary dark:text-primary">
                      {(this.props.displayData.apy[this.state.tempkey] &&
                      !this.displayEndDate(this.state.tempkey, true)
                        ? displayCommaBalance(
                            this.props.displayData.apy[this.state.tempkey],
                            2
                          )
                        : "0") + "%"}
                    </p>
                  </div> */}
                  <div className="lg:block sm:flex sm:pt-4 lg:pt-0">
                    <p className="text-sm text-primary dark:text-primary staking-key-width">
                      {(stakingData[this.state.tempkey].subname === "Uni-LP"
                        ? "LP"
                        : stakingData[this.state.tempkey].subname) + " Balance"}
                    </p>
                    <p
                      className="font-bold text-sm text-primary dark:text-primary"
                      title={
                        this.props.web3.utils
                          .toBN(
                            this.props.displayData.tokenBalances[
                              this.state.tempkey
                            ]
                          )
                          .isZero()
                          ? false
                          : this.props.web3.utils.fromWei(
                              this.props.displayData.tokenBalances[
                                this.state.tempkey
                              ],
                              stakingData[this.state.tempkey]
                                .web3EquivalentPrecision
                            ) +
                            " " +
                            stakingData[this.state.tempkey].subname
                      }
                    >
                      {(this.props.displayData.tokenBalances[this.state.tempkey]
                        ? displayBalance(
                            this.props.displayData.tokenBalances[
                              this.state.tempkey
                            ],
                            stakingData[this.state.tempkey]
                              .web3EquivalentPrecision,
                            this.props.web3
                          )
                        : "0") +
                        " " +
                        stakingData[this.state.tempkey].subname}
                    </p>
                  </div>
                  <div className="lg:block sm:flex sm:pt-4 lg:pt-0">
                    <p className="text-sm text-primary dark:text-primary staking-key-width">
                      {(stakingData[this.state.tempkey].subname === "Uni-LP"
                        ? "LP"
                        : stakingData[this.state.tempkey].subname) + " Staked"}
                    </p>
                    <p
                      className="font-bold text-sm text-primary dark:text-primary"
                      title={
                        this.props.web3.utils
                          .toBN(
                            this.props.displayData.stakeBalances[
                              this.state.tempkey
                            ]
                          )
                          .isZero()
                          ? false
                          : this.props.web3.utils.fromWei(
                              this.props.displayData.stakeBalances[
                                this.state.tempkey
                              ],
                              stakingData[this.state.tempkey]
                                .web3EquivalentPrecision
                            ) +
                            " " +
                            stakingData[this.state.tempkey].subname
                      }
                    >
                      {(this.props.displayData.stakeBalances[this.state.tempkey]
                        ? displayBalance(
                            this.props.displayData.stakeBalances[
                              this.state.tempkey
                            ],
                            stakingData[this.state.tempkey]
                              .web3EquivalentPrecision,
                            this.props.web3
                          )
                        : "0") +
                        " " +
                        stakingData[this.state.tempkey].subname}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:grid lg:grid-cols-2 coin-card-staking-expand">
                <div className="col-span-1">
                  <div className="flex gap-4 items-center pb-4 ">
                    <p className="font-bold text-primary dark:text-primary">
                      Stake
                    </p>
                    <div>
                      {" "}
                      <label>
                        <input
                          checked={this.state.isChecked}
                          onChange={this._handleStakingChange}
                          className="switch"
                          type="checkbox"
                        />
                        <div>
                          <div></div>
                        </div>
                      </label>
                    </div>
                    <p className="font-bold text-primary dark:text-primary">
                      Unstake
                    </p>
                  </div>

                  <div className="lg:flex justify-between pb-2">
                    <p className="text-sm text-primary dark:text-primary sm:pb-4 lg:pb-0">
                      {stakingData[this.state.tempkey].subname === "Uni-LP"
                        ? "LP"
                        : stakingData[this.state.tempkey].subname}{" "}
                      Stake Value
                    </p>
                    <p
                      className={
                        "text-sm " +
                        ((!this.state.isChecked &&
                          this.displayEndDate(this.state.tempkey, true)) ||
                        this.state.stakingErr
                          ? "tertiary-color lg:pl-7"
                          : "text-primary dark:text-primary lg:pl-5")
                      }
                    >
                      {!this.state.isChecked &&
                      this.displayEndDate(this.state.tempkey, true)
                        ? "The staking period has ended!!!"
                        : this.state.stakingErr
                        ? this.state.stakingErr
                        : "Available " +
                          (stakingData[this.state.tempkey].subname === "Uni-LP"
                            ? "LP"
                            : stakingData[this.state.tempkey].subname) +
                          " : " +
                          (this.state.isChecked
                            ? this.props.displayData.stakeBalances[
                                this.state.tempkey
                              ]
                              ? displayBalance(
                                  this.props.displayData.stakeBalances[
                                    this.state.tempkey
                                  ],
                                  stakingData[this.state.tempkey]
                                    .web3EquivalentPrecision,
                                  this.props.web3,
                                  6
                                )
                              : "0"
                            : this.props.displayData.tokenBalances[
                                this.state.tempkey
                              ]
                            ? displayBalance(
                                this.props.displayData.tokenBalances[
                                  this.state.tempkey
                                ],
                                stakingData[this.state.tempkey]
                                  .web3EquivalentPrecision,
                                this.props.web3,
                                6
                              )
                            : "0") +
                          " " +
                          stakingData[this.state.tempkey].subname}
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      className="py-3 px-4 rounded nord-card-input text-primary dark:text-primary"
                      id="staking"
                      type="text"
                      autoFocus
                      placeholder={
                        "Enter " +
                        (this.state.isChecked ? "Unstake" : "Stake") +
                        " value"
                      }
                      value={
                        stakingData[this.state.tempkey].name === "NORD (Old)" &&
                        this.state.isChecked
                          ? this.props.web3.utils.fromWei(
                              this.props.displayData.stakeBalances[
                                this.state.tempkey
                              ],
                              stakingData[this.state.tempkey]
                                .web3EquivalentPrecision
                            )
                          : this.state.stakingAmount
                      }
                      onChange={(e) => this.amountValidation(e)}
                      disabled={
                        (!this.state.isChecked &&
                          this.displayEndDate(this.state.tempkey, true)) ||
                        (stakingData[this.state.tempkey].name ===
                          "NORD (Old)" &&
                          this.state.isChecked)
                      }
                    />
                    <p
                      className={
                        (stakingData[this.state.tempkey].name === "NORD (NXT)"
                          ? ""
                          : "hide") +
                        " absolute top-3.5 right-2.5 primary-color underline cursor-pointer"
                      }
                      onClick={() => {
                        this._handlePercentageClick(100, 100);
                      }}
                    >
                      Max
                    </p>
                  </div>
                  <div
                    className={
                      (stakingData[this.state.tempkey].name === "NORD (Old)" &&
                      this.state.isChecked
                        ? "hide"
                        : "show") + " percentage-holder"
                    }
                  >
                    {stakingData[this.state.tempkey].name === "NORD (NXT)"
                      ? !this.state.isChecked &&
                        Object.keys(stakingDurationOptions).map((duration) => (
                          <DurationButton
                            key={stakingDurationOptions[duration].short}
                            duration={parseInt(duration)}
                            selectDuration={this.selectDuration}
                            fixedStakingDuration={
                              this.state.fixedStakingDuration
                            }
                          ></DurationButton>
                        ))
                      : percentages.map((percent) => (
                          <PercentButton
                            key={percent}
                            percent={percent}
                            handlePercentageClick={this._handlePercentageClick}
                          ></PercentButton>
                        ))}
                  </div>
                  {stakingData[this.state.tempkey].name === "NORD (NXT)" &&
                    !this.state.isChecked && (
                      <div className="flex justify-between">
                        <div
                          className={
                            (!this.state.isChecked ? "" : "hide ") +
                            "text-primary"
                          }
                        >
                          <div className="text-sm">
                            Estimated APY: {this.state.estimatedApy}%
                            <div className={"tooltip"}>
                              <img
                                src={Info}
                                alt=""
                                className="mb-1 ml-1 h-4 w-4 cursor-pointer"
                              />
                              <span
                                className="tooltiptext"
                                style={{ width: "10rem", left: "5rem" }}
                              >
                                <p className="mx-2 text-left text-primary">
                                  Estimated APY subject to monthly reinvestment
                                </p>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  <div className="flex gap-2 pt-2">
                    <button
                      className={`flex py-2 px-10 justify-between cursor-pointer focus:outline-none ${
                        this.shouldButtonBeDisabled()
                          ? "btn-gray cursor-not-allowed"
                          : "btn-green"
                      }`}
                      onClick={() =>
                        this.initiateOperation(
                          this.state.isChecked ? "Unstake" : "Stake"
                        )
                      }
                      disabled={this.shouldButtonBeDisabled()}
                    >
                      {this.state.isChecked ? "Unstake" : "Stake"}
                    </button>
                    {!this.state.isChecked &&
                    stakingData[this.state.tempkey].name === "NORD (NXT)" &&
                    this.props.web3.utils
                      .toBN(
                        this.props.displayData.stakeBalances[this.state.tempkey]
                      )
                      .gt(this.props.web3.utils.toBN("0")) ? (
                      <button
                        className={`py-1 px-5 cursor-pointer focus:outline-none ${
                          this.shouldUpdateDurBtnBeDisabled()
                            ? "btn-gray cursor-not-allowed"
                            : "btn-green"
                        }`}
                        onClick={() => {
                          this.setIsUpdateDurationModalOpen(true);
                        }}
                        disabled={this.shouldUpdateDurBtnBeDisabled()}
                      >
                        Update duration
                      </button>
                    ) : (
                      <></>
                    )}
                  </div>
                  <p
                    className={
                      (stakingData[this.state.tempkey].contractDetails[
                        this.props.currentNetworkID
                      ].unboundingPeriod
                        ? "show text-sm"
                        : "hide") + " tertiary-color pt-2"
                    }
                  >
                    {`There is an unbounding period of ${
                      stakingData[this.state.tempkey].contractDetails[
                        this.props.currentNetworkID
                      ].unboundingPeriod
                    }`}
                  </p>
                  <p
                    className={
                      (stakingData[this.state.tempkey].name === "NORD (NXT)" &&
                      !this.state.isChecked
                        ? "show text-sm"
                        : "hide") + " tertiary-color pt-2"
                    }
                  >
                    {this.state.fixedStakingDuration <
                    this.state.currentStakingDuration
                      ? `Duration should be greater than or equal to ${
                          stakingDurationOptions[
                            this.state.currentStakingDuration
                          ].full
                        } !!!`
                      : ``}
                  </p>
                  <p className="text-sm dark:text-primary pt-2">
                    {stakingData[this.state.tempkey].name === "NORD (NXT)" &&
                      this.state.currentStakingDuration > 0 &&
                      `Current staking duration: ${
                        stakingDurationOptions[
                          this.state.currentStakingDuration
                        ].full
                      }`}
                  </p>
                </div>

                <div className="col-span-1 lg:ml-12">
                  <div
                    className={
                      "flex gap-2 items-center lg:justify-end sm:mt-4 lg:mt-0 " +
                      (stakingData[this.state.tempkey].contractDetails[
                        this.props.currentNetworkID
                      ].enableBiconomy
                        ? ""
                        : "hide-data")
                    }
                  >
                    <div className="flex gap-2">
                      <Gasless> </Gasless>
                      <div className="text-green">
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
                              transaction. Users with hardware wallet should
                              keep this setting turned off.
                            </p>
                          </span>
                        </div>
                      </div>
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
                  <div className="flex gap-4 py-4 ">
                    {stakingData[this.state.tempkey].subname === "KRIDA" ? (
                      <>
                        {ReactHtmlParser(stakingData[this.state.tempkey].icon)}
                      </>
                    ) : (
                      <NordBigIcon />
                    )}
                    <div
                      className={`font-bold pr-6 ${
                        stakingData[this.state.tempkey].subname === "KRIDA"
                          ? "pt-5"
                          : "pt-4"
                      }`}
                    >
                      <p className="text-primary dark:text-primary">
                        {stakingData[this.state.tempkey].subname === "KRIDA"
                          ? "KRIDA"
                          : "NORD"}
                      </p>
                    </div>
                  </div>
                  {this.state.tempkey !== null &&
                    this.state.isChecked &&
                    this.hasUserStakedToken(this.nordNxtIndex) &&
                    this.renderUnstakeDateOrCountDown(
                      stakingData[this.state.tempkey]
                    )}
                  <div
                    className={
                      ((stakingSubnameSet.has(
                        stakingData[this.state.tempkey].subname
                      ) &&
                        !this.state.isChecked) ||
                      stakingData[this.state.tempkey].name === "NORD (NXT)"
                        ? "hide "
                        : "") +
                      (stakingSubnameSet.has(
                        stakingData[this.state.tempkey].subname
                      )
                        ? "flex gap-8 py-1 pt-2"
                        : "flex gap-16 py-1 pt-2")
                    }
                  >
                    <p className="text-sm text-primary dark:text-primary">
                      {stakingSubnameSet.has(
                        stakingData[this.state.tempkey].subname
                      ) && this.state.isChecked
                        ? "Unstaked Balance"
                        : "NORD Balance"}
                    </p>
                    <p
                      className={
                        (stakingSubnameSet.has(
                          stakingData[this.state.tempkey].subname
                        ) && this.state.isChecked
                          ? "hide-data "
                          : "") +
                        "text-sm font-bold text-primary dark:text-primary"
                      }
                      title={
                        this.props.nordBalance === "0"
                          ? false
                          : this.props.nordBalance + " NORD"
                      }
                    >
                      {(this.props.nordBalance
                        ? Number(this.props.nordBalance) < 100000
                          ? displayCommaBalance(this.props.nordBalance, 2)
                          : displayAverageBalance(this.props.nordBalance, 2)
                        : "0") + " NORD"}
                    </p>
                    <p
                      className={
                        (stakingSubnameSet.has(
                          stakingData[this.state.tempkey].subname
                        ) && this.state.isChecked
                          ? ""
                          : "hide-data ") +
                        "text-sm font-bold text-primary dark:text-primary"
                      }
                      title={
                        this.props.web3.utils
                          .toBN(
                            this.props.displayData.unstakeBalances[
                              this.state.tempkey
                            ]
                          )
                          .isZero()
                          ? false
                          : this.props.web3.utils.fromWei(
                              this.props.displayData.unstakeBalances[
                                this.state.tempkey
                              ],
                              stakingData[this.state.tempkey]
                                .web3EquivalentPrecision
                            ) +
                            ` ${
                              stakingData[this.state.tempkey].subname ===
                              "Uni-LP"
                                ? "LP"
                                : stakingData[this.state.tempkey].subname
                            }`
                      }
                    >
                      {(this.props.displayData.unstakeBalances[
                        this.state.tempkey
                      ]
                        ? displayBalance(
                            this.props.displayData.unstakeBalances[
                              this.state.tempkey
                            ],
                            stakingData[this.state.tempkey]
                              .web3EquivalentPrecision,
                            this.props.web3
                          )
                        : "0") +
                        ` ${
                          stakingData[this.state.tempkey].subname === "Uni-LP"
                            ? "LP"
                            : stakingData[this.state.tempkey].subname
                        }`}
                    </p>
                  </div>
                  <div
                    className={
                      stakingData[this.state.tempkey].name === "NORD (NXT)" &&
                      this.state.isChecked
                        ? "hide "
                        : "" + "flex gap-10 py-1 pt-2"
                    }
                  >
                    <p className="text-sm text-primary dark:text-primary">
                      {stakingSubnameSet.has(
                        stakingData[this.state.tempkey].subname
                      ) && this.state.isChecked
                        ? "Unclaimed Stake"
                        : "Unclaimed Reward"}
                    </p>
                    <p
                      className={
                        (stakingSubnameSet.has(
                          stakingData[this.state.tempkey].subname
                        ) && this.state.isChecked
                          ? "hide-data "
                          : "") +
                        "text-sm font-bold text-primary dark:text-primary"
                      }
                      title={
                        this.props.web3.utils
                          .toBN(
                            this.props.displayData.earnBalances[
                              this.state.tempkey
                            ]
                          )
                          .isZero()
                          ? false
                          : this.props.web3.utils.fromWei(
                              this.props.displayData.earnBalances[
                                this.state.tempkey
                              ],
                              stakingData[this.state.tempkey]
                                .web3EquivalentPrecision
                            ) +
                            ` ${
                              stakingData[this.state.tempkey].subname ===
                              "Uni-LP"
                                ? "LP"
                                : stakingData[this.state.tempkey].subname
                            }`
                      }
                    >
                      {(this.props.displayData.earnBalances[this.state.tempkey]
                        ? displayBalance(
                            this.props.displayData.earnBalances[
                              this.state.tempkey
                            ],
                            stakingData[this.state.tempkey]
                              .web3EquivalentPrecision,
                            this.props.web3
                          )
                        : "0") +
                        ` ${
                          stakingData[this.state.tempkey].subname === "Uni-LP"
                            ? "LP"
                            : stakingData[this.state.tempkey].subname
                        }`}
                    </p>
                    <p
                      className={
                        (stakingSubnameSet.has(
                          stakingData[this.state.tempkey].subname
                        ) && this.state.isChecked
                          ? ""
                          : "hide-data ") +
                        "text-sm font-bold text-primary dark:text-primary"
                      }
                      title={
                        this.props.web3.utils
                          .toBN(
                            this.props.displayData.unclaimedStakeBalances[
                              this.state.tempkey
                            ]
                          )
                          .isZero()
                          ? false
                          : this.props.web3.utils.fromWei(
                              this.props.displayData.unclaimedStakeBalances[
                                this.state.tempkey
                              ],
                              stakingData[this.state.tempkey]
                                .web3EquivalentPrecision
                            ) +
                            ` ${
                              stakingData[this.state.tempkey].subname ===
                              "Uni-LP"
                                ? "LP"
                                : stakingData[this.state.tempkey].subname
                            }`
                      }
                    >
                      {(this.props.displayData.unclaimedStakeBalances[
                        this.state.tempkey
                      ]
                        ? displayBalance(
                            this.props.displayData.unclaimedStakeBalances[
                              this.state.tempkey
                            ],
                            stakingData[this.state.tempkey]
                              .web3EquivalentPrecision,
                            this.props.web3
                          )
                        : "0") +
                        ` ${
                          stakingData[this.state.tempkey].subname === "Uni-LP"
                            ? "LP"
                            : stakingData[this.state.tempkey].subname
                        }`}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      className={
                        stakingData[this.state.tempkey].name === "NORD (NXT)" &&
                        this.state.isChecked
                          ? "hide"
                          : "" +
                            "py-2 px-10 btn-green cursor-pointer focus:outline-none"
                      }
                      onClick={() =>
                        this.executeRewardOperation(
                          stakingSubnameSet.has(
                            stakingData[this.state.tempkey].subname
                          ) && this.state.isChecked
                            ? "Stake"
                            : "Earnings Reward"
                        )
                      }
                    >
                      Claim
                    </button>
                    <button
                      className={
                        "py-2 px-7 focus:outline-none" +
                        (this.shouldButtonBeDisabled()
                          ? " btn-gray cursor-not-allowed"
                          : " btn-green cursor-pointer") +
                        (stakingNameSet.has(
                          stakingData[this.state.tempkey].name
                        ) && !this.state.isChecked
                          ? ""
                          : " hide-data")
                      }
                      onClick={() => this.executeRewardOperation("Reinvest")}
                      disabled={this.shouldButtonBeDisabled()}
                    >
                      Reinvest
                    </button>
                  </div>
                  <div
                    className={
                      this.state.isChecked ? "show pr-4 pt-3" : "hide-data"
                    }
                  >
                    {stakingData[this.state.tempkey].name !== "NORD (NXT)" && (
                      <CountdownTimer
                        key={this.props.displayData.unstakeTimeRemaining[
                          this.state.tempkey
                        ].toString()}
                        unstakeTimeRemaining={this.props.displayData.unstakeTimeRemaining[
                          this.state.tempkey
                        ].toString()}
                        isStakingDurationFixed={false}
                      />
                    )}
                  </div>
                  {/* NORD-NORD 60% unlimited staking  */}
                  <p className="tertiary-color pt-2">
                    {this.displayEndDate(this.state.tempkey, true) &&
                      stakingData[this.state.tempkey].name === "NORD" &&
                      "Staking is no longer active. You can claim rewards and unstake the staked $NORD. Shift to $NORD NXT staking and start staking again."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}

          <ConfirmModal
            amount={this.state.stakingAmount}
            duration={
              this.state.isChecked
                ? this.state.currentStakingDuration
                : this.state.fixedStakingDuration
            }
            isConfirmPopupOpen={this.state.isConfirmPopupOpen}
            confirmPopupType={this.state.isChecked ? "Unstake" : "Stake"}
            selectedToken={
              this.state.tempkey !== null
                ? stakingData[this.state.tempkey].subname
                : ""
            }
            nordData={[]}
            withdrawFee={"0"}
            secondLine={
              this.state.tempkey !== null
                ? ["Staking Token", stakingData[this.state.tempkey].name]
                : []
            }
            displayInfiniteSwitch={[this.state.displayInfiniteSwitch]}
            infiniteApproval={this.state.infiniteApproval}
            handleChange={this._handleInfiniteApprovalChange}
            handlePopupClose={this.handlePopupClose}
            unstakeDate={
              this.state.tempkey !== null &&
              stakingData[this.state.tempkey].name === "NORD (NXT)"
                ? moment(
                    new Date(
                      new Date().setDate(
                        new Date().getDate() +
                          this.state.fixedStakingDuration * 30
                      )
                    )
                  ).format("MMMM DD YYYY")
                : ""
            }
            fixedStakingDuration={
              stakingDurationOptions[this.state.fixedStakingDuration].full
            }
          />
        </div>
        <p className="unavailable ml-8">
          {networkData.showStaking[this.props.currentNetworkID]
            ? ""
            : "Coming soon on " +
              networkData.networkName[this.props.currentNetworkID]}
        </p>
        <UpdateDurationModal
          isUpdateDurationModalOpen={this.state.isUpdateDurationModalOpen}
          setIsUpdateDurationModalOpen={this.setIsUpdateDurationModalOpen}
          web3={this.props.web3}
          tempkey={this.state.tempkey}
          currentNetworkID={this.props.currentNetworkID}
          fixedStakingDuration={this.state.fixedStakingDuration}
          accounts={this.props.accounts}
          showSuccessMessage={this.props.showSuccessMessage}
          showErrorMessage={this.props.showErrorMessage}
          setOverlay={this.props.setOverlay}
          stakedAmount={
            (this.state.tempkey !== null &&
              displayBalance(
                this.props.displayData.stakeBalances[this.state.tempkey],
                stakingData[this.state.tempkey].web3EquivalentPrecision,
                this.props.web3,
                6
              )) ||
            "0"
          }
          currentUnstakeDate={
            this.state.tempkey !== null &&
            stakingData[this.state.tempkey].name === "NORD (NXT)"
              ? moment(
                  new Date(Number(this.state.fixedDurationUnstakeTime) * 1000)
                ).format("MMMM DD YYYY")
              : ""
          }
          futureUnstakeDate={
            this.state.tempkey !== null &&
            stakingData[this.state.tempkey].name === "NORD (NXT)"
              ? moment(
                  new Date(
                    new Date().setDate(
                      new Date().getDate() +
                        this.state.fixedStakingDuration * 30
                    )
                  )
                ).format("MMMM DD YYYY")
              : ""
          }
        />
      </>
    );
  }
}
Staking.propTypes = {
  web3: PropTypes.object.isRequired,
  web3Biconomy: PropTypes.object.isRequired,
  biconomy: PropTypes.object.isRequired,
  accounts: PropTypes.array.isRequired,
  displayData: PropTypes.object,
  nordBalance: PropTypes.string.isRequired,
  currentNetworkID: PropTypes.number.isRequired,
  showErrorMessage: PropTypes.func,
  showSuccessMessage: PropTypes.func,
  displayCardClickError: PropTypes.func,
  setOverlay: PropTypes.func,
  updateBalance: PropTypes.func,
  reactGa: PropTypes.object.isRequired,
};

export default Staking;
