import React, { Component } from "react";
import Footer from "../components/footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Numbro from "numbro";
import Dot from "../assets/images/dot.svg";
import Arrow from "../assets/images/forwardarrow.svg";
import Loading from "../assets/images/loading.svg";
import LeftArrow from "../assets/images/back.svg";
import Info from "../assets/images/info.svg";
import Sidebar from "../components/sidebar";
import Web3 from "web3";
import { Biconomy } from "@biconomy/mexa";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { toChecksumAddress } from "ethereum-checksum-address";
import {
  networkData,
  coingeckoPriceEndPoint,
  apyEndPoints,
  vaultData,
  chainLinkPriceFeeds,
  stakingData,
  advisoryData,
  nordGovernanceTokenData,
  BalanceUpdateInterval,
  infiniteAmtStr,
} from "../config/config";
import { bnDivision } from "../components/inputValidation";
import LoadingOverlay from "react-loading-overlay";
import {
  Refresh,
  WalletChange,
  Logout,
  MenuIcon,
  Logo,
} from "../components/icon/icon";
import Window from "../assets/images/window.png";
import Staking from "../view/Staking";
import SavingsWithStaking from "../view/savingsWithStaking";
import axios from "axios";
import Modal from "react-modal";
import Toggle from "../components/theme/toggle";
import Advisory from "./Advisory";
import NftRoot from "../view/nft/NftRoot";
import { slide as Menu } from "react-burger-menu";
import PropTypes from "prop-types";
import Epns from "../components/Epns.js";

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    background: "var(--color-bg-primary)",
    border: "0",
    borderRadius: "5px",
    color: "var(--color-text-primary)",
  },
};

class DashBoard extends Component {
  web3;
  web3Biconomy;
  biconomy;
  isBurgerMenuOpen = false;
  constructor(props) {
    super(props);
    this.state = {
      accounts: [],
      address: "",
      vaultSupply: [],
      totalSupply: null,
      balance: [],
      nordBalance: [],
      token: [],
      nTokenBalance: [],
      dAmount: "",
      wAmount: "",
      details: true,
      tempkey: null,
      infiniteApproval: true,
      isWaiting: false,
      isLoading: false,
      loadingMessage: "",
      depositErr: "",
      withdrawErr: "",
      isInitialLoading: true,
      transactionHash: "",
      apy_vaults: [],
      apy_nord: [],
      isConfirmPopupOpen: false,
      confirmPopupType: "",
      displayInfiniteSwitch: false,
      selectedToken: [],
      balanceUpdationTimeout: null,
      currentNetworkID: networkData.allowedNetworkID[0],
      showComponent: 0,
      nordPrice: 0,
      vaultUnclaimedBal: [],
      stakedNordInVault: [],
      earnedNordInVault: [],
      advisoryDisplayData: {},
      mobileMenu: false,
      isDeviceMobile: !!navigator.userAgent.match(/iPad|iPhone|Android/i),
      retriggerFlag: false,
      isCurrentNetworkUnsupported: false,
      isOpen: false,
    };
    this.initialState = this.state;
    this.web3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions: this.getProviderOptions(),
    });
    this._handleChange = this._handleChange.bind(this);
    this.updateBalance = this.updateBalance.bind(this);
  }

  getProviderOptions = () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.REACT_APP_INFURA_ID,
          rpc: {
            137: networkData.rpcURL[137],
          },
          qrcodeModalOptions: {
            mobileLinks: ["metamask", "walletconnect"],
          },
        },
        display: {
          description: "Scan with a wallet to connect",
        },
      },
    };
    return providerOptions;
  };

  async onConnect() {
    const provider = await this.web3Modal.connect();
    this.web3 = new Web3(provider);
    await this.subscribeProvider(provider);
    this.biconomy = new Biconomy(provider, {
      walletProvider: provider,
      apiKey: process.env.REACT_APP_BICONOMY_ID,
      debug: true,
    });
    this.web3Biconomy = new Web3(this.biconomy);
    await this.subscribeProvider(this.biconomy);
    const account = await this.web3.eth.getAccounts();
    const network = await this.web3.eth.getChainId();
    this.web3.eth.transactionPollingTimeout = 1000;
    if (account !== undefined && account !== null && account.length) {
      this.setState(() => {
        return {
          isInitialLoading: false,
          isLoading: true,
          accounts: account,
          address:
            account[0].substr(0, 6) +
            "..." +
            account[0].substr(account[0].length - 4),
        };
      });
      await this.networkCheck(network, false);
    } else {
      await this.logOut("automatic");
    }

    this.props.reactGa.event({
      category: "NavBar",
      action: "WalletConnect",
      label: `${toChecksumAddress(this.state.accounts[0]).split("0x")[1]}`,
    });
  }

  async onNewConnect() {
    if (this.web3 && this.state.address) {
      const currentProvider = this.web3.currentProvider;
      if (currentProvider.close) {
        await currentProvider.close();
      }
      if (currentProvider.disconnect) {
        await currentProvider.disconnect();
      }
      await this.web3Modal.clearCachedProvider();
      this.props.reactGa.event({
        category: "NavBar",
        action: "WalletChange",
        label: `${toChecksumAddress(this.state.accounts[0]).split("0x")[1]}`,
      });
      this.onConnect();
    } else {
      this.displayCardClickError();
    }
  }

  async componentDidMount() {
    if (this.web3Modal.cachedProvider) {
      this.onConnect();
    } else {
      await this.logOut("automatic");
    }
  }

  async logOut(logOutType) {
    if (this.web3) {
      const provider = this.web3.currentProvider;
      if (provider.close) {
        await provider.close();
      }
      if (provider.disconnect) {
        await provider.disconnect();
      }
      this.web3.currentProvider = null;
      this.web3Modal.clearCachedProvider();
      this.web3 = null;
    }
    const network = this.state.currentNetworkID;
    this.web3 = new Web3(networkData.rpcURL[network]);
    await this.setState(this.initialState);
    await this.setState(() => {
      return {
        isLoading: true,
        currentNetworkID: network,
      };
    });
    await this.updateBalance();
    await this.setState(() => {
      return {
        isLoading: false,
      };
    });

    if (logOutType === "manual") {
      this.props.reactGa.event({
        category: "NavBar",
        action: "LogOut",
      });
    }
  }

  displayCardClickError(message) {
    if (!message) {
      message = "Please connect your wallet to utilize this service.";
    }
    toast.warn(message, {
      containerId: "networkErr",
      position: "top-right",
      autoClose: 10000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      progress: undefined,
    });
  }

  displayNetworkError(desiredNetwork, isUnsupported) {
    this.setState(() => {
      return { networkError: false, isLoading: false, isWaiting: false };
    });
    toast.clearWaitingQueue();
    toast.dismiss();
    const warningMessage = isUnsupported
      ? `The selected network is not supported. Please switch to any of the supported Network in your provider.`
      : this.state.isDeviceMobile
      ? "Please switch to " +
        networkData.networkName[desiredNetwork] +
        " in your wallet provider, and connect again."
      : "You are currently connected to " +
        networkData.networkName[this.state.currentNetworkID] +
        ".\nPlease switch to " +
        networkData.networkName[desiredNetwork] +
        " in your wallet provider.";
    toast.warn(warningMessage, {
      containerId: "networkErr",
      position: "top-right",
      autoClose: false,
      hideProgressBar: true,
      closeOnClick: false,
      closeButton: !isUnsupported,
      pauseOnHover: true,
      draggable: false,
      progress: undefined,
    });
  }

  networkCheck = async (network, uiNetworkToggle) => {
    if (network === this.state.currentNetworkID) {
      toast.clearWaitingQueue();
      toast.dismiss();
      this.setState({
        networkError: false,
        isLoading: true,
      });
      this.updateBalance();
      this.setState({ isCurrentNetworkUnsupported: false });
    } else {
      if (networkData.allowedNetworkID.includes(network)) {
        if (!uiNetworkToggle) {
          this.setState({ isCurrentNetworkUnsupported: false });
          await this._handleNetworkToggle(network);
        } else {
          this.setState({ isCurrentNetworkUnsupported: false });
          this.displayNetworkError(network, false);
        }
      } else {
        this.setState({ isCurrentNetworkUnsupported: true });
        this.displayNetworkError(network, true);
      }
    }
  };

  handleNetworkToggleFromUI = async (desiredNetwork) => {
    if (this.web3 && this.state.address) {
      if (this.state.isDeviceMobile) {
        try {
          await this.logOut("automatic");
        } catch (error) {
          console.error("handleNetworkToggleFromUI for mobile: ", error);
        }
      }
      this.props.reactGa.event({
        category: "NavBar",
        action: "NetworkToggle",
      });
      this.networkCheck(Number(desiredNetwork), true);
    } else {
      this.displayCardClickError();
    }
  };

  async subscribeProvider(provider) {
    if (!this.state.isDeviceMobile) {
      provider.on("disconnect", this.handleProviderDisconnect);
      provider.on("accountsChanged", this.handleProviderAccountsChanged);
      provider.on("chainChanged", this.handleProviderChainChanged);
    }
  }

  handleProviderDisconnect = async (provider) => {
    if (provider.close) {
      await provider.close();
    }
    if (provider.disconnect) {
      await provider.disconnect();
    }
    await this.web3Modal.clearCachedProvider();
  };

  handleProviderAccountsChanged = async (account) => {
    if (account.length) {
      await this.setState({
        accounts: account,
        address:
          account[0].substr(0, 6) +
          "..." +
          account[0].substr(account[0].length - 4),
        isLoading: true,
        dAmount: "",
        wAmount: "",
        depositErr: "",
        withdrawErr: "",
      });
      this.updateBalance();
    } else {
      this.logOut("automatic");
    }
  };

  handleProviderChainChanged = async () => {
    const chainId = await this.web3.eth.getChainId();
    this.networkCheck(chainId, false);
  };

  // TODO : to use this whenever provider is updated
  async unsubscribeProvider(provider) {
    provider.removeListener("disconnect", this.handleProviderDisconnect);
    provider.removeListener(
      "accountsChanged",
      this.handleProviderAccountsChanged
    );
    provider.on("chainChanged", this.handleProviderChainChanged);
  }

  async getSavingAPY() {
    const vault_apy = [];
    const nord_apy = [];
    let price = 0;
    if (apyEndPoints[this.state.currentNetworkID]) {
      const apyResults = await Promise.allSettled([
        axios.get(apyEndPoints[this.state.currentNetworkID].savings),
        axios.get(apyEndPoints[this.state.currentNetworkID].nord),
        axios.get(coingeckoPriceEndPoint.savings),
      ]);
      const vaultAPYdata = this.isPromiseFullfilled(
        apyResults[0],
        "Savings APY"
      )
        ? apyResults[0].value
        : [];
      const nordAPYdata = this.isPromiseFullfilled(apyResults[1], "Nord APY")
        ? apyResults[1].value
        : [];
      price = this.isPromiseFullfilled(apyResults[2], "Nord coingecko price")
        ? apyResults[2].value.data["nord-finance"].usd
        : 0;
      for (const index in vaultAPYdata.data) {
        if (this.state.currentNetworkID === networkData.allowedNetworkID[0]) {
          vault_apy.push(
            Numbro(
              vaultAPYdata.data[index].apyOneDaySample +
                nordAPYdata.data[index].apy
            ).format({
              thousandSeparated: true,
              trimMantissa: true,
              mantissa: 2,
              spaceSeparated: false,
            })
          );
          nord_apy.push(
            Numbro(nordAPYdata.data[index].apy).format({
              thousandSeparated: true,
              trimMantissa: true,
              mantissa: 2,
              spaceSeparated: false,
            })
          );
        } else {
          vault_apy.push(
            Numbro(vaultAPYdata.data[index].apyOneDaySample).format({
              thousandSeparated: true,
              trimMantissa: true,
              mantissa: 2,
              spaceSeparated: false,
            })
          );
        }
      }
    }
    this.setState({
      apy_vaults: vault_apy,
      apy_nord: nord_apy,
      nordPrice: price,
    });
  }

  async updateNordBalance() {
    if (this.state.accounts) {
      const nordRewardsPrecision =
        nordGovernanceTokenData.web3EquivalentPrecision;
      const allPromises = [];
      const nordRewardsContract = new this.web3.eth.Contract(
        nordGovernanceTokenData.contractDetails[
          this.state.currentNetworkID
        ].nordTokenABI.abi,
        nordGovernanceTokenData.contractDetails[
          this.state.currentNetworkID
        ].nordTokenAddress
      );
      allPromises.push(
        nordRewardsContract.methods
          .balanceOf(this.state.accounts[0])
          .call({ from: this.state.accounts[0] })
      );
      if (
        nordGovernanceTokenData.contractDetails[this.state.currentNetworkID]
          .claimABI
      ) {
        const claimContract = new this.web3.eth.Contract(
          nordGovernanceTokenData.contractDetails[
            this.state.currentNetworkID
          ].claimABI.abi,
          nordGovernanceTokenData.contractDetails[
            this.state.currentNetworkID
          ].claimAddress
        );
        if (this.state.currentNetworkID === networkData.allowedNetworkID[0]) {
          allPromises.push(
            claimContract.methods
              .getTotalRewardBalance()
              .call({ from: this.state.accounts[0] })
          );
        } else {
          allPromises.push(
            claimContract.methods
              .getTotalRewardBalance(this.state.accounts[0])
              .call({ from: this.state.accounts[0] })
          );
        }
      } else {
        allPromises.push(Promise.reject(new Error("Empty promise")));
      }
      const promiseResults = await Promise.allSettled(allPromises);
      const bal = this.isPromiseFullfilled(promiseResults[0], "Nord Rewards")
        ? this.web3.utils.fromWei(promiseResults[0].value, nordRewardsPrecision)
        : "0";
      const unclaimedBal = this.isPromiseFullfilled(
        promiseResults[1],
        "Nord Unclaimed Rewards"
      )
        ? this.web3.utils.fromWei(promiseResults[1].value, nordRewardsPrecision)
        : 0;
      this.setState(() => {
        return {
          nTokenBalance: [bal, unclaimedBal],
        };
      });
    }
  }

  async updateStakingBalance() {
    const allPromises = [];
    allPromises.push(axios.get(coingeckoPriceEndPoint.staking));
    for (const x of stakingData) {
      if (x.contractDetails[this.state.currentNetworkID]) {
        const stakingContract = new this.web3.eth.Contract(
          x.contractDetails[this.state.currentNetworkID].stakingABI.abi,
          x.contractDetails[this.state.currentNetworkID].stakingAddress
        );
        const tokenContract = new this.web3.eth.Contract(
          x.contractDetails[this.state.currentNetworkID].tokenABI.abi,
          x.contractDetails[this.state.currentNetworkID].tokenAddress
        );
        if (this.state.address) {
          allPromises.push(
            tokenContract.methods.balanceOf(this.state.accounts[0]).call()
          );

          allPromises.push(
            stakingContract.methods[x.contractMethods.getBalance](
              this.state.accounts[0]
            ).call()
          );

          allPromises.push(
            stakingContract.methods.earned(this.state.accounts[0]).call()
          );
        } else {
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
        }

        if (x.name === "NORD (NXT)") {
          if (this.state.address) {
            allPromises.push(
              stakingContract.methods[x.contractMethods.getRewardRate](
                this.state.accounts[0]
              ).call()
            );
          } else {
            allPromises.push(Promise.reject(new Error("Empty promise")));
          }
        } else {
          allPromises.push(
            stakingContract.methods[x.contractMethods.getRewardRate]().call()
          );
        }

        allPromises.push(stakingContract.methods.totalSupply().call());
        if (x.subname !== "Uni-LP") {
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
          if (this.state.address) {
            allPromises.push(
              stakingContract.methods
                .totalUnstakedAmountReadyToClaim(this.state.accounts[0])
                .call()
            );
            allPromises.push(
              stakingContract.methods
                .totalUnstakedAmount(this.state.accounts[0])
                .call()
            );
            allPromises.push(
              stakingContract.methods
                .getUnboundingTime(this.state.accounts[0])
                .call()
            );
          } else {
            allPromises.push(Promise.reject(new Error("Empty promise")));
            allPromises.push(Promise.reject(new Error("Empty promise")));
            allPromises.push(Promise.reject(new Error("Empty promise")));
          }
        } else {
          allPromises.push(tokenContract.methods.getReserves().call());
          allPromises.push(tokenContract.methods.totalSupply().call());
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
        }
      } else {
        let i;
        for (i = 0; i < 10; i++) {
          allPromises.push(Promise.reject(new Error("Empty promise")));
        }
      }
    }
    if (this.state.address) {
      allPromises.push(this.updateNordBalance());
    }
    const results = await Promise.allSettled(allPromises);
    const balances = await this.processStakingResults(results, stakingData);
    this.setState(() => {
      return {
        stakingDisplayData: balances,
      };
    });
  }

  processStakingResults(results, stakes) {
    let index = 0;
    const indexMultiplier = 10;
    const balanceResults = {};
    balanceResults.tokenBalances = [];
    balanceResults.stakeBalances = [];
    balanceResults.earnBalances = [];
    balanceResults.unclaimedStakeBalances = [];
    balanceResults.unstakeBalances = [];
    balanceResults.unstakeTimeRemaining = [];
    balanceResults.tvl = [];
    balanceResults.apy = [];
    for (const stake of stakes) {
      const coingeckoData = this.isPromiseFullfilled(results[0], "coingecko")
        ? [
            this.web3.utils.toBN(
              Math.trunc(100 * results[0].value.data["nord-finance"].usd)
            ),
            this.web3.utils.toBN(
              Math.trunc(100 * results[0].value.data[stake.priceApiName].usd)
            ),
          ]
        : [this.web3.utils.toBN("0"), this.web3.utils.toBN("0")];
      balanceResults.tokenBalances.push(
        this.isPromiseFullfilled(
          results[index * indexMultiplier + 1],
          `${stake.subname}`
        )
          ? this.web3.utils.toBN(results[index * indexMultiplier + 1].value)
          : this.web3.utils.toBN("0")
      );
      balanceResults.stakeBalances.push(
        this.isPromiseFullfilled(
          results[index * indexMultiplier + 2],
          `${stake.subname} Stake Balance`
        )
          ? this.web3.utils.toBN(
              stake.name === "NORD" || stake.name === "NORD (NXT)"
                ? results[index * indexMultiplier + 2].value[0]
                : results[index * indexMultiplier + 2].value
            )
          : this.web3.utils.toBN("0")
      );
      balanceResults.earnBalances.push(
        this.isPromiseFullfilled(
          results[index * indexMultiplier + 3],
          `${stake.subname} Earn Balance`
        )
          ? this.web3.utils.toBN(results[index * indexMultiplier + 3].value)
          : this.web3.utils.toBN("0")
      );
      balanceResults.unclaimedStakeBalances.push(
        this.isPromiseFullfilled(
          results[index * indexMultiplier + 8],
          `${stake.subname} Unclaimed Stake Balance`
        )
          ? this.web3.utils.toBN(results[index * indexMultiplier + 8].value)
          : this.web3.utils.toBN("0")
      );
      balanceResults.unstakeBalances.push(
        this.isPromiseFullfilled(
          results[index * indexMultiplier + 9],
          `${stake.subname} Unstake Balance`
        )
          ? this.web3.utils.toBN(results[index * indexMultiplier + 9].value)
          : this.web3.utils.toBN("0")
      );
      balanceResults.unstakeTimeRemaining.push(
        this.isPromiseFullfilled(
          results[index * indexMultiplier + 10],
          `${stake.subname} stake Unbounding time left`
        )
          ? this.web3.utils.toBN(results[index * indexMultiplier + 10].value)
          : this.web3.utils.toBN("0")
      );
      let rewardRate = this.isPromiseFullfilled(
        results[index * indexMultiplier + 4],
        `${stake.subname} Reward Rate`
      )
        ? this.web3.utils.toBN(results[index * indexMultiplier + 4].value)
        : this.web3.utils.toBN("0");
      let totalStaking = this.isPromiseFullfilled(
        results[index * indexMultiplier + 5],
        `${stake.subname} total staking`
      )
        ? this.web3.utils.toBN(results[index * indexMultiplier + 5].value)
        : this.web3.utils.toBN("0");
      balanceResults.tvl.push(totalStaking);
      const totalSupply = this.isPromiseFullfilled(
        results[index * indexMultiplier + 7],
        `${stake.subname} total supply`
      )
        ? this.web3.utils.toBN(results[index * indexMultiplier + 7].value)
        : stake.subname !== "Uni-LP"
        ? this.web3.utils.toBN("1")
        : this.web3.utils.toBN("0");

      if (!rewardRate.isZero() || !totalSupply.isZero()) {
        const reserves = this.isPromiseFullfilled(
          results[index * indexMultiplier + 6],
          `${stake.subname} Reserves`
        )
          ? this.web3.utils
              .toBN(results[index * indexMultiplier + 6].value._reserve0)
              .mul(coingeckoData[0])
              .add(
                this.web3.utils
                  .toBN(results[index * indexMultiplier + 6].value._reserve1)
                  .mul(coingeckoData[1])
              )
          : stake.subname !== "Uni-LP"
          ? this.web3.utils.toBN("1")
          : this.web3.utils.toBN("0");
        if (stake.name !== "NORD" && stake.name !== "NORD (NXT)") {
          if (totalStaking.isZero() || reserves.isZero()) {
            let coingeckoPrecision = 2;
            if (stake.subname !== "Uni-LP") {
              coingeckoPrecision = 0;
            }
            totalStaking = this.web3.utils
              .toBN(10)
              .pow(this.web3.utils.toBN(stake.precision + coingeckoPrecision));
          } else {
            totalStaking = totalStaking.mul(reserves);
            rewardRate = rewardRate.mul(this.web3.utils.toBN(100));
          }
          if (stake.subname === "Uni-LP") {
            rewardRate = rewardRate.mul(coingeckoData[0]);
          }
          rewardRate = rewardRate
            .mul(this.web3.utils.toBN(365))
            .mul(this.web3.utils.toBN(86400));
        } else {
          totalStaking = this.web3.utils.toBN(100);
        }
        const apyData = rewardRate.mul(totalSupply);
        balanceResults.apy.push(
          bnDivision(apyData, totalStaking, this.web3, stake.precision)
        );
      } else {
        balanceResults.apy.push("0");
      }
      index++;
    }
    return balanceResults;
  }

  async updateAdvisoryBalance() {
    const allPromises = [];
    let contractExist = false;
    allPromises.push(axios.get(coingeckoPriceEndPoint.advisory));
    for (const x of advisoryData) {
      if (x.contractDetails[this.state.currentNetworkID]) {
        contractExist = true;
        const advisoryContract = new this.web3.eth.Contract(
          x.contractDetails[this.state.currentNetworkID].fundDivisionABI.abi,
          x.contractDetails[this.state.currentNetworkID].fundDivisionAddress
        );
        const vaultContract = new this.web3.eth.Contract(
          x.contractDetails[this.state.currentNetworkID].vaultABI.abi,
          x.contractDetails[this.state.currentNetworkID].vaultAddress
        );
        const tokenContract = new this.web3.eth.Contract(
          x.contractDetails[this.state.currentNetworkID].underlyingTokenABI.abi,
          x.contractDetails[this.state.currentNetworkID].underlyingTokenAddress
        );
        const controllerContract = new this.web3.eth.Contract(
          x.contractDetails[this.state.currentNetworkID].controllerABI.abi,
          x.contractDetails[this.state.currentNetworkID].controllerAddress
        );
        const feeManagerContract = new this.web3.eth.Contract(
          x.contractDetails[this.state.currentNetworkID].feeManagerABI.abi,
          x.contractDetails[this.state.currentNetworkID].feeManagerAddress
        );
        allPromises.push(vaultContract.methods.getPricePerFullShare().call());
        allPromises.push(
          vaultContract.methods.underlyingBalanceWithInvestment().call()
        );
        allPromises.push(
          controllerContract.methods.isDepositWhiteListActive().call()
        );
        if (this.state.address) {
          allPromises.push(
            advisoryContract.methods.fundManager(this.state.accounts[0]).call()
          );
          allPromises.push(
            tokenContract.methods
              .balanceOf(this.state.accounts[0])
              .call({ from: this.state.accounts[0] })
          );
          allPromises.push(
            vaultContract.methods
              .balanceOf(this.state.accounts[0])
              .call({ from: this.state.accounts[0] })
          );
          allPromises.push(
            controllerContract.methods
              .whiteListedDepositor(this.state.accounts[0])
              .call({ from: this.state.accounts[0] })
          );
          allPromises.push(
            axios.get(
              x.contractDetails[this.state.currentNetworkID].txHistoryEndpoint +
                "?useraddress=" +
                this.state.accounts[0] +
                "&vaultaddress=" +
                x.contractDetails[this.state.currentNetworkID].vaultAddress
            )
          );
          allPromises.push(
            feeManagerContract.methods
              .userUnderlyingBalance(this.state.accounts[0])
              .call({ from: this.state.accounts[0] })
          );
        } else {
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
        }
        allPromises.push(vaultContract.methods.maxDepositCap().call());
        allPromises.push(
          tokenContract.methods
            .balanceOf(
              x.contractDetails[this.state.currentNetworkID].fundDivisionAddress
            )
            .call()
        );

        for (const index in x.contractDetails[this.state.currentNetworkID]
          .activeAssets) {
          allPromises.push(
            advisoryContract.methods.investmentRatioNumerators(index).call()
          );
          const assetContract = new this.web3.eth.Contract(
            x.contractDetails[this.state.currentNetworkID].activeAssets[
              index
            ].tokenABI.abi,
            x.contractDetails[this.state.currentNetworkID].activeAssets[
              index
            ].contractAddress[this.state.currentNetworkID]
          );
          allPromises.push(
            assetContract.methods
              .balanceOf(
                x.contractDetails[this.state.currentNetworkID]
                  .fundDivisionAddress
              )
              .call()
          );
        }
      }
    }
    if (contractExist) {
      if (
        apyEndPoints[this.state.currentNetworkID] &&
        apyEndPoints[this.state.currentNetworkID].advisory
      ) {
        allPromises.push(
          axios.get(apyEndPoints[this.state.currentNetworkID].advisory)
        );
      } else {
        allPromises.push(Promise.reject(new Error("Empty promise")));
      }
      const results = await Promise.allSettled(allPromises);
      const balances = this.processAdvisoryBalanceResults(
        results,
        advisoryData
      );
      this.setState(() => {
        return {
          advisoryDisplayData: balances,
        };
      });
    } else {
      this.setState(() => {
        return {
          advisoryDisplayData: {},
        };
      });
    }
  }

  processAdvisoryBalanceResults(results, advisories) {
    let index = 0;
    const contractCallNumber = 11;
    const balanceResults = {};
    balanceResults.isfundManager = false;
    balanceResults.isWhitelisted = true;
    balanceResults.sharePrices = [];
    balanceResults.tvl = [];
    balanceResults.tokenBalances = [];
    balanceResults.tokenPrices = [];
    balanceResults.tokenShares = [];
    balanceResults.tokenFundBalances = [];
    balanceResults.advisoryBalances = [];
    balanceResults.activeAssetsData = [];
    balanceResults.apyData = [];
    balanceResults.txHistory = { admin: [], user: [] };
    balanceResults.depositCapRemaining = [];

    for (const advisory of advisories) {
      if (advisory.contractDetails[this.state.currentNetworkID]) {
        const indexMultiplier =
          advisory.contractDetails[this.state.currentNetworkID].activeAssets
            .length *
            2 +
          contractCallNumber;
        balanceResults.sharePrices.push(
          this.isPromiseFullfilled(
            results[index * indexMultiplier + 1],
            "SharePrice for Advisory"
          )
            ? this.web3.utils.toBN(results[index * indexMultiplier + 1].value)
            : this.web3.utils.toBN("0")
        );
        balanceResults.tvl.push(
          this.isPromiseFullfilled(
            results[index * indexMultiplier + 2],
            "TVL for Advisory"
          )
            ? this.web3.utils
                .fromWei(
                  this.web3.utils.toBN(
                    results[index * indexMultiplier + 2].value
                  ),
                  advisory.web3EquivalentPrecision
                )
                .toString()
            : "0"
        );
        const isWhitelistActive = this.isPromiseFullfilled(
          results[index * indexMultiplier + 3],
          "Whitelist check"
        )
          ? results[index * indexMultiplier + 3].value
          : false;
        balanceResults.isfundManager = this.isPromiseFullfilled(
          results[index * indexMultiplier + 4],
          "FundManager check"
        )
          ? results[index * indexMultiplier + 4].value
          : false;
        balanceResults.tokenBalances.push(
          this.isPromiseFullfilled(
            results[index * indexMultiplier + 5],
            `underlying token balance for advisory`
          )
            ? this.web3.utils.toBN(results[index * indexMultiplier + 5].value)
            : this.web3.utils.toBN("0")
        );
        balanceResults.advisoryBalances.push(
          this.isPromiseFullfilled(
            results[index * indexMultiplier + 6],
            `${advisory.subname} balance for advisory`
          )
            ? this.web3.utils.toBN(results[index * indexMultiplier + 6].value)
            : this.web3.utils.toBN("0")
        );
        if (isWhitelistActive) {
          balanceResults.isWhitelisted = this.isPromiseFullfilled(
            results[index * indexMultiplier + 7],
            "Whitlelist account check"
          )
            ? results[index * indexMultiplier + 7].value
            : false;
        }
        balanceResults.txHistory.user = this.isPromiseFullfilled(
          results[index * indexMultiplier + 8],
          "User transaction history"
        )
          ? results[index * indexMultiplier + 8].value.data.transactions
          : [];
        balanceResults.tokenPrices.push(
          this.isPromiseFullfilled(results[0], "Nord coingecko price")
            ? this.web3.utils.toBN(
                Math.trunc(
                  100 * results[0].value.data[advisory.priceApiName].usd
                )
              )
            : 0
        );
        const underlyingTokenDeposited = this.isPromiseFullfilled(
          results[index * indexMultiplier + 9],
          `${advisory.underlyingTokenName} already deposited`
        )
          ? this.web3.utils.toBN(results[index * indexMultiplier + 9].value)
          : this.web3.utils.toBN("0");
        balanceResults.depositCapRemaining.push(
          (this.isPromiseFullfilled(
            results[index * indexMultiplier + 10],
            "Max Deposit Cap"
          )
            ? this.web3.utils.toBN(results[index * indexMultiplier + 10].value)
            : this.web3.utils.toBN("0")
          ).sub(underlyingTokenDeposited)
        );
        balanceResults.tokenFundBalances.push(
          this.isPromiseFullfilled(
            results[index * indexMultiplier + 11],
            `${advisory.underlyingTokenName} fund balance for advisory`
          )
            ? this.web3.utils.toBN(results[index * indexMultiplier + 11].value)
            : this.web3.utils.toBN("0")
        );
        const tokenshare = this.web3.utils.toBN("10000");
        const activeAssets =
          advisory.contractDetails[this.state.currentNetworkID].activeAssets;
        for (let incrementor in activeAssets) {
          incrementor = parseInt(incrementor);
          balanceResults.activeAssetsData.push({
            share: this.isPromiseFullfilled(
              results[
                index * indexMultiplier +
                  contractCallNumber +
                  incrementor * 2 +
                  1
              ]
            )
              ? this.web3.utils.toBN(
                  results[
                    index * indexMultiplier +
                      contractCallNumber +
                      incrementor * 2 +
                      1
                  ].value
                )
              : this.web3.utils.toBN("0"),
            balance: this.isPromiseFullfilled(
              results[
                index * indexMultiplier +
                  contractCallNumber +
                  incrementor * 2 +
                  2
              ]
            )
              ? this.web3.utils.toBN(
                  results[
                    index * indexMultiplier +
                      contractCallNumber +
                      incrementor * 2 +
                      2
                  ].value
                )
              : this.web3.utils.toBN("0"),
            price: this.isPromiseFullfilled(results[0], "Nord coingecko price")
              ? this.web3.utils.toBN(
                  Math.trunc(
                    100 *
                      results[0].value.data[
                        activeAssets[incrementor].priceApiName
                      ].usd
                  )
                )
              : 0,
            name: activeAssets[incrementor].name,
            subname: activeAssets[incrementor].subname,
          });
          tokenshare.isub(
            this.isPromiseFullfilled(
              results[
                index * indexMultiplier +
                  contractCallNumber +
                  incrementor * 2 +
                  1
              ]
            )
              ? this.web3.utils.toBN(
                  results[
                    index * indexMultiplier +
                      contractCallNumber +
                      incrementor * 2 +
                      1
                  ].value
                )
              : this.web3.utils.toBN("0")
          );
        }
        balanceResults.tokenShares.push(tokenshare);
        balanceResults.apyData.push(
          this.isPromiseFullfilled(
            results[results.length - 1],
            "Advisory APY data from serverless"
          )
            ? Numbro(
                results[results.length - 1].value.data[index].apyOneDaySample
              ).format({
                thousandSeparated: true,
                trimMantissa: true,
                mantissa: 2,
                spaceSeparated: false,
              })
            : "0"
        );
        index++;
      }
    }
    return balanceResults;
  }

  async updateBalance() {
    if (!this.web3) {
      this.web3 = new Web3(networkData.rpcURL[this.state.currentNetworkID]);
    }
    if (this.state.balanceUpdationTimeout) {
      clearTimeout(this.state.balanceUpdationTimeout);
    }
    if (this.state.showComponent === 0) {
      await this.updateSavingBalance();
    } else if (this.state.showComponent === 1) {
      await this.updateStakingBalance();
    } else if (this.state.showComponent === 2) {
      await this.updateAdvisoryBalance();
    }
    const interval = setTimeout(
      this.updateBalance,
      BalanceUpdateInterval * 1000
    );
    this.setState(() => {
      return {
        isLoading: false,
        balanceUpdationTimeout: interval,
      };
    });
  }

  async updateSavingBalance() {
    const allPromises = [];
    for (const x of vaultData) {
      if (x.contractDetails[this.state.currentNetworkID]) {
        const vaultContract = new this.web3.eth.Contract(
          x.contractDetails[this.state.currentNetworkID].vaultABI.abi,
          x.contractDetails[this.state.currentNetworkID].vaultAddress
        );
        const tokenContract = new this.web3.eth.Contract(
          x.contractDetails[this.state.currentNetworkID].tokenABI.abi,
          x.contractDetails[this.state.currentNetworkID].tokenAddress
        );

        if (chainLinkPriceFeeds[this.state.currentNetworkID]) {
          const chainlinkContract = new this.web3.eth.Contract(
            chainLinkPriceFeeds[this.state.currentNetworkID].contractABI.abi,
            chainLinkPriceFeeds[this.state.currentNetworkID].contractAddress
          );
          allPromises.push(
            chainlinkContract.methods
              .getTotalValueLocked(
                x.subname.toLowerCase(),
                x.contractDetails[this.state.currentNetworkID].vaultAddress
              )
              .call()
          );
        } else {
          allPromises.push(Promise.reject(new Error("Empty promise")));
        }

        if (this.state.address) {
          if (this.state.currentNetworkID === networkData.allowedNetworkID[0]) {
            allPromises.push(
              vaultContract.methods
                .getPricePerFullShare()
                .call({ from: this.state.accounts[0] })
            );
          } else {
            allPromises.push(
              vaultContract.methods
                .getPricePerFullShareCheckpoint()
                .call({ from: this.state.accounts[0] })
            );
          }
          allPromises.push(
            tokenContract.methods
              .balanceOf(this.state.accounts[0])
              .call({ from: this.state.accounts[0] })
          );
          allPromises.push(
            vaultContract.methods
              .balanceOf(this.state.accounts[0])
              .call({ from: this.state.accounts[0] })
          );
          if (
            x.contractDetails[this.state.currentNetworkID].vaultStakingAddress
          ) {
            const vaultStaking = new this.web3.eth.Contract(
              x.contractDetails[
                this.state.currentNetworkID
              ].vaultStakingABI.abi,
              x.contractDetails[this.state.currentNetworkID].vaultStakingAddress
            );
            allPromises.push(
              vaultStaking.methods.userUnstake(this.state.accounts[0]).call()
            );
            allPromises.push(
              vaultStaking.methods.totalStakedFor(this.state.accounts[0]).call()
            );
            allPromises.push(
              vaultStaking.methods
                .getRewardBalance(this.state.accounts[0])
                .call()
            );
          } else {
            allPromises.push(Promise.reject(new Error("Empty promise")));
            allPromises.push(Promise.reject(new Error("Empty promise")));
            allPromises.push(Promise.reject(new Error("Empty promise")));
          }
        } else {
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
          allPromises.push(Promise.reject(new Error("Empty promise")));
        }
      }
    }
    allPromises.push(this.getSavingAPY());
    if (this.state.address) {
      allPromises.push(this.updateNordBalance());
    }

    const results = await Promise.allSettled(allPromises);
    const balances = this.processBalanceResults(results, vaultData);
    this.setState(() => {
      return {
        sharePrice: balances.sharePrices,
        balance: balances.tokenBalances,
        vaultSupply: balances.vaultBalances,
        token: balances.tokenDetails,
        totalSupply: balances.totalSupply,
        nordBalance: balances.nTokenBalances,
        vaultUnclaimedBal: balances.unclaimedBalance
          ? balances.unclaimedBalance
          : [],
        stakedNordInVault: balances.stakedNordInVault,
        earnedNordInVault: balances.earnedNordInVault,
      };
    });
  }

  processBalanceResults(results, vaults) {
    let index = 0;
    const indexMultiplier = 7;
    const balanceResults = {};
    balanceResults.totalSupply = 0;
    balanceResults.vaultBalances = [];
    balanceResults.tokenDetails = [];
    balanceResults.sharePrices = [];
    balanceResults.tokenBalances = [];
    balanceResults.nTokenBalances = [];
    balanceResults.unclaimedBalance = [];
    balanceResults.stakedNordInVault = [];
    balanceResults.earnedNordInVault = [];

    for (const vault of vaults) {
      if (vault.contractDetails[this.state.currentNetworkID]) {
        const vaultBalance = this.isPromiseFullfilled(
          results[index * indexMultiplier + 0],
          `${vault.subname}`
        )
          ? this.web3.utils.toBN(results[index * indexMultiplier + 0].value)
          : this.web3.utils.toBN("0");
        balanceResults.vaultBalances.push(
          this.web3.utils.fromWei(vaultBalance, vault.web3EquivalentPrecision) /
            Math.pow(10, 8)
        );
        balanceResults.totalSupply += balanceResults.vaultBalances[index];
        balanceResults.tokenDetails.push({
          name: vault.subname,
          icon: vault.icon,
        });
        if (this.state.address) {
          balanceResults.sharePrices.push(
            this.isPromiseFullfilled(results[index * indexMultiplier + 1])
              ? results[index * indexMultiplier + 1].value
              : this.web3.utils.toBN("0")
          );
          balanceResults.tokenBalances.push(
            this.isPromiseFullfilled(
              results[index * indexMultiplier + 2],
              `${vault.subname}`
            )
              ? this.web3.utils.toBN(results[index * indexMultiplier + 2].value)
              : this.web3.utils.toBN("0")
          );
          balanceResults.nTokenBalances.push(
            this.isPromiseFullfilled(
              results[index * indexMultiplier + 3],
              `${vault.subname}`
            )
              ? this.web3.utils.toBN(results[index * indexMultiplier + 3].value)
              : this.web3.utils.toBN("0")
          );
          balanceResults.unclaimedBalance.push(
            this.isPromiseFullfilled(
              results[index * indexMultiplier + 4],
              `vault staking unclaimed balance`
            )
              ? {
                  unstakingAmount: this.web3.utils
                    .fromWei(
                      this.web3.utils.toBN(
                        results[index * indexMultiplier + 4].value
                          .unstakingAmount
                      ),
                      nordGovernanceTokenData.web3EquivalentPrecision
                    )
                    .toString(),
                  unstakingTime: this.web3.utils.toBN(
                    results[index * indexMultiplier + 4].value.unstakingTime
                  ),
                }
              : {
                  unstakingAmount: "0",
                  unstakingTime: "0",
                }
          );
          balanceResults.stakedNordInVault.push(
            this.isPromiseFullfilled(
              results[index * indexMultiplier + 5],
              `staked balance in vault`
            )
              ? this.web3.utils.toBN(
                  results[index * indexMultiplier + 5].value[0]
                )
              : this.web3.utils.toBN("0")
          );
          balanceResults.earnedNordInVault.push(
            this.isPromiseFullfilled(
              results[index * indexMultiplier + 6],
              `earn nord balance in vault`
            )
              ? this.web3.utils
                  .fromWei(
                    this.web3.utils.toBN(
                      results[index * indexMultiplier + 6].value
                    ),
                    nordGovernanceTokenData.web3EquivalentPrecision
                  )
                  .toString()
              : "0"
          );
        }
        index++;
      }
    }
    return balanceResults;
  }

  isPromiseFullfilled(result, info) {
    if (result && result.status === "fulfilled") {
      return true;
    } else {
      console.log(
        `Error while resolving a promise: ${
          result ? result.reason : "No result"
        } ${info || ""}`
      );
      return false;
    }
  }

  async deposit() {
    const amt = this.web3.utils.toBN(
      this.web3.utils.toWei(
        this.state.dAmount,
        vaultData[this.state.tempkey].web3EquivalentPrecision
      )
    );
    let approveFlag = false;
    let approvedBalFlag = false;
    let depositFlag = false;
    const approve = new this.web3.eth.Contract(
      vaultData[this.state.tempkey].contractDetails[
        this.state.currentNetworkID
      ].tokenABI.abi,
      vaultData[this.state.tempkey].contractDetails[
        this.state.currentNetworkID
      ].tokenAddress
    );
    if (this.state.displayInfiniteSwitch) {
      if (this.state.infiniteApproval) {
        this.setState(() => {
          return {
            isWaiting: true,
            loadingMessage:
              "Waiting for " +
              vaultData[this.state.tempkey].subname +
              " allowance approval",
          };
        });
        const maxAmt = this.web3.utils.toBN(infiniteAmtStr);
        await approve.methods
          .approve(
            vaultData[this.state.tempkey].contractDetails[
              this.state.currentNetworkID
            ].vaultAddress,
            maxAmt
          )
          .send({ from: this.state.accounts[0] }, (error, tHash) => {
            if (error) {
              console.log(`Error while sending approve tx: ${error}`);
              return;
            }
            this.setState(() => {
              return { transactionHash: tHash };
            });
          })
          .then(function (receipt) {
            approveFlag = receipt.status;
            console.log(receipt);
          })
          .catch(function (err) {
            console.log(err);
          });
      } else {
        this.setState(() => {
          return {
            isWaiting: true,
            loadingMessage:
              "Waiting for allowance approval of " +
              Numbro(
                Math.trunc(Number(this.state.dAmount) * 10000) / 10000
              ).format({
                thousandSeparated: true,
                trimMantissa: true,
                mantissa: 4,
                spaceSeparated: false,
              }) +
              " " +
              vaultData[this.state.tempkey].subname,
          };
        });
        await approve.methods
          .approve(
            vaultData[this.state.tempkey].contractDetails[
              this.state.currentNetworkID
            ].vaultAddress,
            amt
          )
          .send({ from: this.state.accounts[0] }, (error, tHash) => {
            if (error) {
              console.log(`Error while sending approve tx: ${error}`);
              return;
            }
            this.setState(() => {
              return { transactionHash: tHash };
            });
          })
          .then(function (receipt) {
            approveFlag = receipt.status;
            console.log(receipt);
          })
          .catch(function (err) {
            console.log(err);
          });
      }
      this.setState(() => {
        return { isWaiting: false };
      });
    } else {
      approvedBalFlag = true;
      approveFlag = true;
      this.showSuccessMessage(
        Numbro(Math.trunc(this.state.dAmount * 10000) / 10000).format({
          thousandSeparated: true,
          trimMantissa: true,
          mantissa: 4,
          spaceSeparated: false,
        }) +
          " " +
          vaultData[this.state.tempkey].subname +
          " has already been pre-approved"
      );
    }
    if (approveFlag) {
      if (!approvedBalFlag) {
        if (this.state.infiniteApproval) {
          this.showSuccessMessage(
            vaultData[this.state.tempkey].ntokenname +
              " Contract is trusted now!"
          );
        } else {
          this.showSuccessMessage(
            Numbro(Math.trunc(this.state.dAmount * 10000) / 10000).format({
              thousandSeparated: true,
              trimMantissa: true,
              mantissa: 4,
              spaceSeparated: false,
            }) +
              " " +
              vaultData[this.state.tempkey].subname +
              " has been successfully approved for deposit transfer!"
          );
        }
      }
      const vaultDeposit = new this.web3.eth.Contract(
        vaultData[this.state.tempkey].contractDetails[
          this.state.currentNetworkID
        ].vaultABI.abi,
        vaultData[this.state.tempkey].contractDetails[
          this.state.currentNetworkID
        ].vaultAddress
      );
      vaultDeposit.transactionConfirmationBlocks = 48;
      this.setState(() => {
        return {
          isWaiting: true,
          loadingMessage: "Depositing...",
          transactionHash: "",
        };
      });
      await vaultDeposit.methods
        .deposit(amt)
        .send({ from: this.state.accounts[0] }, (error, tHash) => {
          if (error) {
            console.log(`Error while sending deposit tx: ${error}`);
            return;
          }
          this.setState(() => {
            return { transactionHash: tHash };
          });
        })
        .then(function (vreceipt) {
          console.log(vreceipt);
          depositFlag = vreceipt.status;
        })
        .catch(function (error) {
          depositFlag = false;
          console.log(error);
        });
      if (depositFlag) {
        this.showSuccessMessage(
          Numbro(Math.trunc(this.state.dAmount * 10000) / 10000).format({
            thousandSeparated: true,
            trimMantissa: true,
            mantissa: 4,
            spaceSeparated: false,
          }) +
            " " +
            vaultData[this.state.tempkey].subname +
            " has been successfully deposited!"
        );
        this.setState(() => {
          return {
            loadingMessage: "Updating Balance...",
            transactionHash: "",
          };
        });
        await this.updateBalance();
        this.setState(() => {
          return {
            isWaiting: false,
            dAmount: "",
            wAmount: "",
          };
        });
        this.props.reactGa.event({
          category: "Savings",
          action: "DepositTxnSuccessful",
          label: `${amt} ${vaultData[this.state.tempkey].subname} ${
            this.state.currentNetworkID
          }`,
        });
      } else {
        this.setState(() => {
          return {
            isWaiting: false,
          };
        });
        this.showErrorMessage(
          "Failed to deposit " +
            Numbro(Math.trunc(this.state.dAmount * 10000) / 10000).format({
              thousandSeparated: true,
              trimMantissa: true,
              mantissa: 4,
              spaceSeparated: false,
            }) +
            " " +
            vaultData[this.state.tempkey].subname +
            "!"
        );
        this.props.reactGa.event({
          category: "Savings",
          action: "DepositTxnFailed",
          label: `${amt} ${vaultData[this.state.tempkey].subname} ${
            this.state.currentNetworkID
          }`,
        });
      }
    } else {
      this.setState(() => {
        return {
          isWaiting: false,
        };
      });
      this.showErrorMessage(
        "Failed to approve transfer of " +
          Numbro(Math.trunc(this.state.dAmount * 10000) / 10000).format({
            thousandSeparated: true,
            trimMantissa: true,
            mantissa: 4,
            spaceSeparated: false,
          }) +
          " " +
          vaultData[this.state.tempkey].subname +
          "!"
      );
    }
    this.updateBalance();
  }

  async withdraw() {
    const amt = this.web3.utils.toBN(
      this.web3.utils.toWei(
        this.state.wAmount,
        vaultData[this.state.tempkey].web3EquivalentPrecision
      )
    );
    let withdrawFlag = false;
    const vaultWithdraw = new this.web3.eth.Contract(
      vaultData[this.state.tempkey].contractDetails[
        this.state.currentNetworkID
      ].vaultABI.abi,
      vaultData[this.state.tempkey].contractDetails[
        this.state.currentNetworkID
      ].vaultAddress
    );
    vaultWithdraw.transactionConfirmationBlocks = 48;
    this.setState(() => {
      return { isWaiting: true, loadingMessage: "Withdrawing..." };
    });
    await vaultWithdraw.methods
      .withdraw(amt)
      .send({ from: this.state.accounts[0] }, (error, tHash) => {
        if (error) {
          console.log(`Error while sending withdraw tx: ${error}`);
          return;
        }
        this.setState(() => {
          return { transactionHash: tHash };
        });
      })
      .then(function (receipt) {
        withdrawFlag = receipt.status;
        console.log(receipt);
      })
      .catch(function (error) {
        withdrawFlag = false;
        console.log(error);
      });
    if (withdrawFlag) {
      this.showSuccessMessage(
        this.state.wAmount +
          " " +
          vaultData[this.state.tempkey].ntokenname +
          " has been successfully withdrawn"
      );
      this.setState(() => {
        return {
          loadingMessage: "Updating Balance...",
          transactionHash: "",
        };
      });
      await this.updateBalance();
      this.setState(() => {
        return {
          isWaiting: false,
          dAmount: "",
          wAmount: "",
        };
      });
      this.props.reactGa.event({
        category: "Savings",
        action: "WithdrawalTxnSuccessful",
        label: `${amt} ${vaultData[this.state.tempkey].subname} ${
          this.state.currentNetworkID
        }`,
      });
    } else {
      this.setState(() => {
        return { isWaiting: false, transactionHash: "" };
      });
      this.showErrorMessage(
        "Failed to withdraw " +
          this.state.wAmount +
          " " +
          vaultData[this.state.tempkey].ntokenname
      );
      this.props.reactGa.event({
        category: "Savings",
        action: "WithdrawalTxnFailed",
        label: `${amt} ${vaultData[this.state.tempkey].subname} ${
          this.state.currentNetworkID
        }`,
      });
    }
    this.updateBalance();
  }

  showErrorMessage = (message) => {
    toast.error(message, {
      containerId: "Err",
      position: "bottom-left",
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  showSuccessMessage = (message) => {
    toast.success(message, {
      containerId: "Err",
      position: "bottom-left",
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      progress: undefined,
    });
  };

  setTransactionOverlay = (waiting, message, txHash) => {
    if (!message) {
      message = this.state.loadingMessage;
    }
    if (!waiting) {
      message = "";
      txHash = "";
    }
    this.setState(() => {
      return {
        isWaiting: waiting,
        loadingMessage: message,
        transactionHash: txHash,
      };
    });
  };

  claimReward = async () => {
    if (this.web3 && this.state.address) {
      if (this.state.nTokenBalance[1] > 0) {
        let claimFlag = false;
        const claimContract = new this.web3.eth.Contract(
          nordGovernanceTokenData.contractDetails[
            this.state.currentNetworkID
          ].claimABI.abi,
          nordGovernanceTokenData.contractDetails[
            this.state.currentNetworkID
          ].claimAddress
        );
        claimContract.transactionConfirmationBlocks = 48;
        this.setState(() => {
          return { isWaiting: true, loadingMessage: "Claiming Rewards..." };
        });

        await claimContract.methods
          .claimAggregatedRewards()
          .send({ from: this.state.accounts[0] }, (error, tHash) => {
            if (error) {
              console.log(`Error while claiming NORD rewards tx: ${error}`);
              return;
            }
            this.setState(() => {
              return { transactionHash: tHash };
            });
          })
          .then(function (receipt) {
            claimFlag = receipt.status;
            console.log(receipt);
          })
          .catch(function (error) {
            claimFlag = false;
            console.log(error);
          });
        this.setState(() => {
          return { isWaiting: false };
        });
        if (claimFlag) {
          this.showSuccessMessage("Nord Rewards has been successfully claimed");
        } else {
          this.showErrorMessage("Failed to claim Nord Rewards");
        }
      } else {
        this.showErrorMessage("No Unclaimed Balance Available");
      }
      await this.updateBalance();
    } else {
      this.displayCardClickError();
    }
  };

  handleCardClick = (index) => {
    if (this.web3 && this.state.address) {
      this.setState({
        tempkey: index,
        details: false,
      });
      this.props.reactGa.event({
        category: "Savings",
        action: "CardClicked",
        label: `${vaultData[index].subname} ${this.state.currentNetworkID}`,
      });
    } else {
      this.displayCardClickError();
    }
  };

  handleCardClose = () => {
    this.props.reactGa.event({
      category: "Savings",
      action: "CardClosed",
      label: `${vaultData[this.state.tempkey].subname} ${
        this.state.currentNetworkID
      }`,
    });
    this.setState({
      tempkey: null,
      details: true,
      dAmount: "",
      wAmount: "",
      depositErr: "",
      withdrawErr: "",
    });
  };

  calculateReceivingAmount = (vaultIndex, wAmount) => {
    const receiveAmt = this.web3.utils
      .toBN(
        this.state.sharePrice[
          vaultData[vaultIndex].contractDetails[this.state.currentNetworkID].id
        ]
      )
      .mul(
        this.web3.utils.toBN(
          this.web3.utils.toWei(
            wAmount,
            vaultData[vaultIndex].web3EquivalentPrecision
          )
        )
      );
    const precision = this.web3.utils
      .toBN(10)
      .pow(this.web3.utils.toBN(2 * vaultData[vaultIndex].precision));
    const displayAmt = bnDivision(
      receiveAmt,
      precision,
      this.web3,
      vaultData[vaultIndex].precision
    );
    return displayAmt;
  };

  handlePopupClose = async (confirm) => {
    const orderType = this.state.confirmPopupType;
    await this.setState({
      isConfirmPopupOpen: false,
      confirmPopupType: "",
    });
    if (confirm) {
      if (orderType === "Deposit") {
        this.deposit();
      } else {
        this.withdraw();
      }
    } else {
      this.showErrorMessage(orderType + " Order Cancelled!");
    }
  };

  openConfirmationPopup = (popupType) => {
    const tokens = [
      vaultData[this.state.tempkey].subname,
      vaultData[this.state.tempkey].ntokenname,
    ];
    this.setState({
      isConfirmPopupOpen: true,
      confirmPopupType: popupType,
      selectedToken: tokens,
    });
  };

  handleAmountChange = async (event, inputType) => {
    const clippedFormat = new RegExp(
      /* eslint-disable-next-line */
      "^\\d+(\\.\\d{0," + vaultData[this.state.tempkey].precision + "})?$"
    );
    if (clippedFormat.test(event.target.value) || !event.target.value) {
      if (inputType === "Deposit") {
        await this.setState(() => {
          return {
            dAmount: event.target.value,
            depositErr: "",
          };
        });
        this.handleBalanceCheck(
          this.state.dAmount,
          this.state.balance[
            vaultData[this.state.tempkey].contractDetails[
              this.state.currentNetworkID
            ].id
          ],
          "Deposit",
          false
        );
      } else if (inputType === "Withdrawal") {
        await this.setState(() => {
          return {
            wAmount: event.target.value,
            withdrawErr: "",
          };
        });
        this.handleBalanceCheck(
          this.state.wAmount,
          this.state.nordBalance[
            vaultData[this.state.tempkey].contractDetails[
              this.state.currentNetworkID
            ].id
          ],
          "Withdrawal",
          false
        );
      }
    }
  };

  handleBalanceCheck = async (amt, balance, inputType, buttonActionFlag) => {
    let amount = amt;
    let error = "";
    if (!Number(amount) && buttonActionFlag) {
      amount = amt;
      error = "Please enter a valid " + inputType + " amount!!!";
    } else if (
      Number(amount) &&
      this.web3.utils
        .toBN(
          this.web3.utils.toWei(
            amt,
            vaultData[this.state.tempkey].web3EquivalentPrecision
          )
        )
        .gt(this.web3.utils.toBN(balance))
    ) {
      amount = amt;
      if (inputType === "Deposit") {
        error =
          "Insufficient " +
          vaultData[this.state.tempkey].subname +
          " Balance!!!";
      } else if (inputType === "Withdrawal") {
        error =
          "Insufficient " +
          vaultData[this.state.tempkey].ntokenname +
          " Balance!!!";
      }
    } else {
      if (buttonActionFlag) {
        amount =
          amt.substring(0, amt.length - 1) +
          amt.substring(amt.length - 1, amt.length).replace(".", "");
      } else {
        amount = amt;
      }
      error = "";
    }

    if (inputType === "Deposit") {
      let showInfiniteSwitch = false;
      if (buttonActionFlag && !error) {
        const approve = new this.web3.eth.Contract(
          vaultData[this.state.tempkey].contractDetails[
            this.state.currentNetworkID
          ].tokenABI.abi,
          vaultData[this.state.tempkey].contractDetails[
            this.state.currentNetworkID
          ].tokenAddress
        );
        const approvedBal = this.web3.utils.toBN(
          await approve.methods
            .allowance(
              this.state.accounts[0],
              vaultData[this.state.tempkey].contractDetails[
                this.state.currentNetworkID
              ].vaultAddress
            )
            .call({ from: this.state.accounts[0] })
        );
        showInfiniteSwitch = this.web3.utils
          .toBN(
            this.web3.utils.toWei(
              amt,
              vaultData[this.state.tempkey].web3EquivalentPrecision
            )
          )
          .gt(approvedBal);
      }
      await this.setState({
        dAmount: amount,
        depositErr: error,
        displayInfiniteSwitch: showInfiniteSwitch,
      });
    } else if (inputType === "Withdrawal") {
      await this.setState({
        wAmount: amount,
        withdrawErr: error,
        displayInfiniteSwitch: false,
      });
    }
    if (buttonActionFlag && !error) {
      this.openConfirmationPopup(inputType);
      this.props.reactGa.event({
        category: "Savings",
        action: inputType + "TxnInitiated",
        label: `${amt} ${vaultData[this.state.tempkey].subname} ${
          this.state.currentNetworkID
        }`,
      });
    }
  };

  _handleChange = () => {
    this.setState({
      infiniteApproval: !this.state.infiniteApproval,
    });
  };

  _handleNetworkToggle = async (desiredNetwork) => {
    await this.setState({
      currentNetworkID: Number(desiredNetwork),
      dAmount: "",
      wAmount: "",
      depositErr: "",
      withdrawErr: "",
    });
    if (!this.state.address) {
      this.web3 = new Web3(networkData.rpcURL[desiredNetwork]);
    }
    const network = await this.web3.eth.getChainId();
    await this.networkCheck(network, true);
  };

  _onButtonClick = (value) => async () => {
    await this.setState({
      showComponent: value,
      isLoading: true,
    });

    const eventAction =
      value === 0
        ? "Savings"
        : value === 1
        ? "Staking"
        : value === "2"
        ? "Advisory"
        : "NFTLoans";
    this.props.reactGa.event({
      category: "NavBar",
      action: "NavigateTo" + eventAction,
    });

    this.updateBalance();
  };

  sendHomePageEvent = () => {
    this.props.reactGa.event({
      category: "NavBar",
      action: "NavigateToHomePage",
    });
  };

  sendBlockExplorerClick = ({ category }) => {
    this.props.reactGa.event({
      category,
      action: "BlockExplorerClicked",
    });
  };

  invertRetriggerFlag = () => {
    this.setState((prevState) => {
      return { ...prevState, retriggerFlag: !prevState.retriggerFlag };
    });
  };

  handleOpen = () => {
    this.setState({
      isOpen: true,
    });
    this.isBurgerMenuOpen = !this.isBurgerMenuOpen;
  };

  handleClose = () => {
    this.setState({
      isOpen: false,
    });
    this.isBurgerMenuOpen = false;
  };

  render() {
    return (
      <>
        <LoadingOverlay
          active={this.state.isWaiting}
          spinner={
            <div align="center">
              <img src={Loading} alt="" />
            </div>
          }
          // className="custom-loading-overlay"
          text={
            <div align="center">
              <p className="loading-message-text">
                <strong>{this.state.loadingMessage}</strong>
                {this.state.transactionHash ? (
                  <a
                    href={
                      networkData.blockExplorer[this.state.currentNetworkID] +
                      "tx/" +
                      this.state.transactionHash
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={Window}
                      alt="Etherscan"
                      className="h-4 mb-7 ml-1 inline cursor-pointer"
                    />
                  </a>
                ) : (
                  <p />
                )}
              </p>
              <p className="refresh-text">
                Please do not press the back button or refresh the page.
              </p>
            </div>
          }
        >
          <div className="border-b border-black">
            <div className="lg:flex container mx-auto px-4 justify-between sm:hidden">
              <div className="flex gap-8 items-center sm:mt-4">
                <div>
                  <a href="/">
                    <Logo onClick={this.sendHomePageEvent} />
                  </a>
                </div>

                <div className="flex gap-4 ">
                  <p
                    className={
                      this.state.showComponent === 0 ? "tab active" : "tab"
                    }
                    onClick={this._onButtonClick(0)}
                  >
                    Savings
                  </p>
                  <p
                    className={
                      this.state.showComponent === 1 ? "tab active" : "tab"
                    }
                    onClick={this._onButtonClick(1)}
                  >
                    Staking
                  </p>
                  <p
                    className={
                      this.state.showComponent === 2 ? "tab active" : "tab"
                    }
                    onClick={this._onButtonClick(2)}
                  >
                    Advisory
                  </p>
                  <p
                    className={
                      this.state.showComponent === 3 ? "tab active" : "tab"
                    }
                    onClick={this._onButtonClick(3)}
                  >
                    NFT Loans
                  </p>
                </div>
              </div>
              <div className="inline-flex gap-4 items-center mobile-sub-header">
                <div
                  className="tw-toggle"
                  onChange={(e) =>
                    this.handleNetworkToggleFromUI(e.target.value)
                  }
                >
                  {networkData.allowedNetworkID.map((data) => (
                    <>
                      <input
                        type="radio"
                        name="toggle"
                        value={data}
                        checked={this.state.currentNetworkID === data}
                        disabled={this.state.isLoading}
                        key={data}
                      />
                      <label>
                        <img
                          className={
                            "mx-1 my-1 h-12" +
                            (data === this.state.currentNetworkID
                              ? ""
                              : "inactive")
                          }
                          src={networkData.networkIcon[data]}
                          alt="icon"
                        />
                      </label>
                    </>
                  ))}
                  <span></span>
                </div>
                <Epns
                  account={this.state.accounts[0]}
                  chainId={this.state.currentNetworkID}
                  showSuccessMessage={this.showSuccessMessage}
                  setOverlay={this.setTransactionOverlay}
                  reactGa={this.props.reactGa}
                />
                <div
                  className="nf-header-refresh"
                  onClick={() => {
                    this.invertRetriggerFlag();
                    if (!this.state.isLoading) {
                      this.setState({
                        isLoading: true,
                      });
                      this.updateBalance();
                      this.props.reactGa.event({
                        category: "NavBar",
                        action: "Refresh",
                      });
                    }
                  }}
                  title="Refresh wallet balance and other required data"
                >
                  <Refresh />
                </div>
                {this.state.address ? (
                  <div className="nf-header-connect">
                    <a
                      href={
                        networkData.blockExplorer[this.state.currentNetworkID] +
                        "address/" +
                        this.state.accounts[0]
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button
                        className="py-3 px-6 flex gap-2 cursor-pointer your-wallet-card  focus:outline-none nf-header-btn"
                        onClick={() =>
                          this.sendBlockExplorerClick({ category: "NavBar" })
                        }
                      >
                        <img
                          src={Dot}
                          alt="dot"
                          className=""
                          style={{ marginTop: 6 }}
                        />
                        {this.state.address}
                      </button>
                    </a>
                  </div>
                ) : (
                  <button
                    className="py-3 px-10 cursor-pointer focus:outline-none btn-green active:outline-none font-semibold nf-header-btn"
                    onClick={async () => {
                      await this.onConnect();
                    }}
                  >
                    Connect
                  </button>
                )}
                <Toggle reactGa={this.props.reactGa} />
                {this.state.address ? (
                  <div className="gap-4 flex ">
                    <div
                      onClick={() => {
                        if (!this.state.isLoading) {
                          this.onNewConnect();
                        }
                      }}
                      title="Switch and connect website to a new wallet instance"
                    >
                      <WalletChange />
                    </div>
                    <div
                      onClick={() => {
                        if (this.state.address) {
                          this.logOut("manual");
                        }
                      }}
                      title="Disconnect wallet"
                    >
                      <Logout />
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>

          <div className="sm:flex lg:hidden container mx-auto justify-between items-center gap-4">
            <div className="my-4">
              <a href="/">
                <Logo onClick={this.sendHomePageEvent} />
              </a>
            </div>
            {this.state.address ? (
              <div className="mobile-menu-flex gap-4">
                <div className="nf-header-connect my-6">
                  <a
                    href={
                      networkData.blockExplorer[this.state.currentNetworkID] +
                      "address/" +
                      this.state.accounts[0]
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button
                      className="py-3 px-6 flex gap-2 cursor-pointer your-wallet-card  focus:outline-none nf-header-btn"
                      onClick={() =>
                        this.sendBlockExplorerClick({ category: "NavBar" })
                      }
                    >
                      <img
                        src={Dot}
                        alt="dot"
                        className=""
                        style={{ marginTop: 6 }}
                      />
                      {this.state.address}
                    </button>
                  </a>
                </div>
                <div
                  onClick={() => {
                    if (!this.state.isLoading) {
                      this.onNewConnect();
                    }
                  }}
                  title="Switch and connect website to a new wallet instance"
                >
                  <WalletChange />
                </div>
              </div>
            ) : (
              <button
                className="py-3 px-8 my-4 cursor-pointer focus:outline-none btn-green active:outline-none font-semibold nf-header-btn"
                onClick={async () => {
                  await this.onConnect();
                }}
              >
                Connect
              </button>
            )}
            <div
              onClick={() => {
                const eventAction = this.isBurgerMenuOpen
                  ? "BurgerMenuClosed"
                  : "BurgerMenuOpened";
                if (this.state.isDeviceMobile) {
                  this.props.reactGa.event({
                    category: "NavBar",
                    action: eventAction,
                  });
                }
                this.isBurgerMenuOpen = !this.isBurgerMenuOpen;
              }}
            >
              <Menu
                right
                width={300}
                customBurgerIcon={<MenuIcon />}
                pageWrapId={"page-wrap"}
                onOpen={this.handleOpen}
                onClose={this.handleClose}
                isOpen={this.state.isOpen}
              >
                <div className="gap-4 items-center " id="page-wrap">
                  <div
                    className="tw-toggle "
                    onChange={(e) =>
                      this.handleNetworkToggleFromUI(e.target.value)
                    }
                  >
                    {networkData.allowedNetworkID.map((data, index) => (
                      <>
                        <input
                          type="radio"
                          name="toggle2"
                          value={data}
                          checked={this.state.currentNetworkID === data}
                          disabled={this.state.isLoading}
                          key={`${data}${index}`}
                        />
                        <label>
                          <img
                            className={
                              "mx-1 my-1 h-12" +
                              (data === this.state.currentNetworkID
                                ? ""
                                : "inactive")
                            }
                            src={networkData.networkIcon[data]}
                            alt="icon"
                          />
                        </label>
                      </>
                    ))}
                    <span></span>
                  </div>
                  <div className="w-3/4 my-6" style={{ display: "flex" }}>
                    <Toggle />
                    <div
                      className="ml-10"
                      style={{ justifyContent: "right", float: "right" }}
                      onClick={() => {
                        this.setState({
                          isOpen: false,
                        });
                      }}
                    >
                      <Epns
                        account={this.state.accounts[0]}
                        chainId={this.state.currentNetworkID}
                        showSuccessMessage={this.showSuccessMessage}
                        setOverlay={this.setTransactionOverlay}
                        reactGa={this.props.reactGa}
                      />
                    </div>
                  </div>
                </div>
                <hr></hr>
                <div className="gap-4 my-4 mobile-menu-flex">
                  <div
                    className="nf-header-refresh flex gap-4"
                    onClick={() => {
                      if (!this.state.isLoading) {
                        this.setState({
                          isLoading: true,
                        });
                        this.updateBalance();
                        this.props.reactGa.event({
                          category: "NavBar",
                          action: "Refresh",
                        });
                      }
                    }}
                    title="Refresh wallet balance and other required data"
                  >
                    <Refresh />
                    <p className="text-primary dark:text-primary text-base">
                      {" "}
                      Refresh
                    </p>
                  </div>

                  {this.state.address ? (
                    <div className="flex gap-4">
                      <div
                        onClick={() => {
                          if (this.state.address) {
                            this.logOut("manual");
                          }
                        }}
                        title="Disconnect wallet"
                        className="flex gap-4"
                      >
                        <Logout />
                        <p className="text-primary dark:text-primary text-base">
                          Logout
                        </p>
                      </div>
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              </Menu>
            </div>
          </div>
          <div className="lg:hidden sm:block">
            <div className="flex gap-4 justify-between ">
              <hr></hr>
              <p
                className={
                  this.state.showComponent === 0
                    ? "tab active my-2"
                    : "tab my-2"
                }
                onClick={this._onButtonClick(0)}
              >
                Savings
              </p>
              <hr></hr>
              <p
                className={
                  this.state.showComponent === 1
                    ? "tab active my-2"
                    : "tab my-2"
                }
                onClick={this._onButtonClick(1)}
              >
                Staking
              </p>
              <hr></hr>
              <p
                className={
                  this.state.showComponent === 2
                    ? "tab active my-2"
                    : "tab my-2"
                }
                onClick={this._onButtonClick(2)}
              >
                Advisory
              </p>
              <hr></hr>
              <p
                className={
                  this.state.showComponent === 3
                    ? "tab active my-2"
                    : "tab my-2"
                }
                onClick={this._onButtonClick(3)}
              >
                NFT Loans
              </p>
              <hr></hr>
            </div>
          </div>

          <Sidebar
            tokens={this.state.token}
            vSupply={this.state.vaultSupply}
            tSupply={this.state.totalSupply}
            nBal={this.state.nTokenBalance}
            claim={this.claimReward}
            loading={this.state.isLoading}
            showSidebar={this.state.showComponent === 0}
            showUnclaimedBalance={
              this.state.currentNetworkID === networkData.allowedNetworkID[0]
            }
            showOverlay={this.state.isLoading || this.state.networkError}
            showSavings={networkData.showSaving[this.state.currentNetworkID]}
          />

          <LoadingOverlay
            active={this.state.isLoading || this.state.networkError}
            spinner={
              this.state.networkError ? (
                false
              ) : (
                <div align="center">
                  <img src={Loading} alt="" />
                </div>
              )
            }
            text={this.state.networkError ? "" : "Loading..."}
            fadeSpeed={0}
            styles={{
              overlay: {
                position: "absolute",
                height: "100%",
                width: "100%",
                top: "0px",
                left: "0px",
                display: "flex",
                textAlign: "center",
                fontSize: "1.2em",
                color: "#888888",
                background: "#e6e7ee",
                zIndex: 800,
              },
            }}
            className="sm:m-4"
          >
            {this.state.showComponent === 3 ? (
              <NftRoot
                web3={this.web3}
                displayData={this.state.advisoryDisplayData}
                currentNetworkID={this.state.currentNetworkID}
                accounts={this.state.accounts}
                showErrorMessage={this.showErrorMessage}
                showSuccessMessage={this.showSuccessMessage}
                displayCardClickError={this.displayCardClickError}
                setOverlay={this.setTransactionOverlay}
                updateBalance={this.updateBalance}
                retriggerFlag={this.state.retriggerFlag}
                invertRetriggerFlag={this.invertRetriggerFlag}
                isCurrentNetworkUnsupported={
                  this.state.isCurrentNetworkUnsupported
                }
                reactGa={this.props.reactGa}
              />
            ) : (
              <></>
            )}
            {this.state.showComponent === 2 ? (
              <Advisory
                web3={this.web3}
                web3Biconomy={this.web3Biconomy}
                biconomy={this.biconomy}
                displayData={this.state.advisoryDisplayData}
                currentNetworkID={this.state.currentNetworkID}
                accounts={this.state.accounts}
                showErrorMessage={this.showErrorMessage}
                showSuccessMessage={this.showSuccessMessage}
                displayCardClickError={this.displayCardClickError}
                setOverlay={this.setTransactionOverlay}
                updateBalance={this.updateBalance}
                reactGa={this.props.reactGa}
              />
            ) : (
              <></>
            )}
            {this.state.showComponent === 1 ? (
              <Staking
                web3={this.web3}
                web3Biconomy={this.web3Biconomy}
                biconomy={this.biconomy}
                displayData={this.state.stakingDisplayData}
                nordBalance={this.state.nTokenBalance[0]}
                currentNetworkID={this.state.currentNetworkID}
                accounts={this.state.accounts}
                showErrorMessage={this.showErrorMessage}
                showSuccessMessage={this.showSuccessMessage}
                displayCardClickError={this.displayCardClickError}
                setOverlay={this.setTransactionOverlay}
                updateBalance={this.updateBalance}
                reactGa={this.props.reactGa}
              />
            ) : this.state.showComponent === 0 ? (
              this.state.currentNetworkID ===
              networkData.allowedNetworkID[0] ? (
                <>
                  <div className="lg:grid container mx-auto lg:px-32 md:px-10">
                    {this.state.details ? (
                      <div>
                        {vaultData.map((data, index) =>
                          data.contractDetails[this.state.currentNetworkID] ? (
                            <div
                              className="card-coin cursor-pointer lg:flex  justify-between lg:items-center"
                              key={index}
                              onClick={() => this.handleCardClick(index)}
                            >
                              <div className="flex gap-6 lg:w-1/4 vr-border sm:items-center">
                                <img src={data.icon} alt="" className="" />
                                <p className="font-bold text-primary dark:text-primary">
                                  {data.name} <br></br>{" "}
                                  <span className="text-xs font-extralight text-primary dark:text-primary ">
                                    {data.subname}
                                  </span>
                                </p>
                              </div>

                              <div className="sm:flex sm:pt-4 lg:mt-0 sm:justify-between">
                                <p className="text-sm text-primary dark:text-primary pr-4">
                                  {apyEndPoints[this.state.currentNetworkID]
                                    .showVaultAPYData
                                    ? "Yield APY"
                                    : ""}{" "}
                                </p>
                                <p className="font-bold text-sm text-primary">
                                  {apyEndPoints[this.state.currentNetworkID]
                                    .showVaultAPYData
                                    ? (this.state.apy_vaults[
                                        data.contractDetails[
                                          this.state.currentNetworkID
                                        ].id
                                      ]
                                        ? this.state.apy_vaults[
                                            data.contractDetails[
                                              this.state.currentNetworkID
                                            ].id
                                          ]
                                        : "0") + " %"
                                    : ""}
                                </p>
                              </div>

                              <div
                                className={
                                  (apyEndPoints[this.state.currentNetworkID]
                                    .showNordAPYData
                                    ? "sm:mt-4 lg:mt-0"
                                    : "hide-data ") + ""
                                }
                              >
                                <p className="text-sm text-color pr-4 text-primary dark:text-primary">
                                  {apyEndPoints[this.state.currentNetworkID]
                                    .showNordAPYData
                                    ? "NORD APY"
                                    : ""}{" "}
                                </p>
                                <p className="font-bold text-sm text-primary dark:text-primary">
                                  {apyEndPoints[this.state.currentNetworkID]
                                    .showNordAPYData
                                    ? (this.state.apy_nord[
                                        data.contractDetails[
                                          this.state.currentNetworkID
                                        ].id
                                      ]
                                        ? this.state.apy_nord[
                                            data.contractDetails[
                                              this.state.currentNetworkID
                                            ].id
                                          ]
                                        : "0") + " %"
                                    : ""}
                                </p>
                              </div>
                              <div className="sm:flex sm:pt-4 lg:mt-0 sm:justify-between ">
                                <p className="text-sm pr-10 text-primary dark:text-primary">
                                  {data.subname}{" "}
                                </p>
                                <p className="font-bold text-sm text-primary dark:text-primary">
                                  {(this.state.balance[
                                    data.contractDetails[
                                      this.state.currentNetworkID
                                    ].id
                                  ]
                                    ? this.web3.utils
                                        .toBN(
                                          this.state.balance[
                                            data.contractDetails[
                                              this.state.currentNetworkID
                                            ].id
                                          ]
                                        )
                                        .lt(
                                          this.web3.utils.toBN(
                                            this.web3.utils.toWei(
                                              this.web3.utils.toBN(100000)
                                            ),
                                            vaultData[
                                              data.contractDetails[
                                                this.state.currentNetworkID
                                              ].id
                                            ].web3EquivalentPrecision
                                          )
                                        )
                                      ? Numbro(
                                          Math.trunc(
                                            this.web3.utils.fromWei(
                                              this.state.balance[
                                                data.contractDetails[
                                                  this.state.currentNetworkID
                                                ].id
                                              ],
                                              vaultData[
                                                data.contractDetails[
                                                  this.state.currentNetworkID
                                                ].id
                                              ].web3EquivalentPrecision
                                            ) * 100
                                          ) / 100
                                        ).format({
                                          thousandSeparated: true,
                                          trimMantissa: true,
                                          mantissa: 2,
                                          spaceSeparated: false,
                                        })
                                      : Numbro(
                                          Math.trunc(
                                            this.web3.utils.fromWei(
                                              this.state.balance[
                                                data.contractDetails[
                                                  this.state.currentNetworkID
                                                ].id
                                              ],
                                              vaultData[
                                                data.contractDetails[
                                                  this.state.currentNetworkID
                                                ].id
                                              ].web3EquivalentPrecision
                                            ) * 100
                                          ) / 100
                                        )
                                          .format({
                                            thousandSeparated: true,
                                            trimMantissa: true,
                                            mantissa: 2,
                                            average: true,
                                            spaceSeparated: false,
                                          })
                                          .toUpperCase()
                                    : "0") +
                                    " " +
                                    data.subname}
                                </p>
                              </div>
                              <div className="sm:flex sm:pt-2 lg:mt-0 sm:justify-between">
                                <p className="text-sm pr-8 text-primary">
                                  {data.ntokenname}{" "}
                                </p>
                                <p className="font-bold text-sm text-primary">
                                  {(this.state.nordBalance[
                                    data.contractDetails[
                                      this.state.currentNetworkID
                                    ].id
                                  ]
                                    ? this.web3.utils
                                        .toBN(
                                          this.state.nordBalance[
                                            data.contractDetails[
                                              this.state.currentNetworkID
                                            ].id
                                          ]
                                        )
                                        .lt(
                                          this.web3.utils.toBN(
                                            this.web3.utils.toWei(
                                              this.web3.utils.toBN(100000)
                                            ),
                                            vaultData[
                                              data.contractDetails[
                                                this.state.currentNetworkID
                                              ].id
                                            ].web3EquivalentPrecision
                                          )
                                        )
                                      ? Numbro(
                                          Math.trunc(
                                            this.web3.utils.fromWei(
                                              this.state.nordBalance[
                                                data.contractDetails[
                                                  this.state.currentNetworkID
                                                ].id
                                              ],
                                              vaultData[
                                                data.contractDetails[
                                                  this.state.currentNetworkID
                                                ].id
                                              ].web3EquivalentPrecision
                                            ) * 100
                                          ) / 100
                                        ).format({
                                          thousandSeparated: true,
                                          trimMantissa: true,
                                          mantissa: 2,
                                          spaceSeparated: false,
                                        })
                                      : Numbro(
                                          Math.trunc(
                                            this.web3.utils.fromWei(
                                              this.state.nordBalance[
                                                data.contractDetails[
                                                  this.state.currentNetworkID
                                                ].id
                                              ],
                                              vaultData[
                                                data.contractDetails[
                                                  this.state.currentNetworkID
                                                ].id
                                              ].web3EquivalentPrecision
                                            ) * 100
                                          ) / 100
                                        )
                                          .format({
                                            thousandSeparated: true,
                                            trimMantissa: true,
                                            mantissa: 2,
                                            average: true,
                                            spaceSeparated: false,
                                          })
                                          .toUpperCase()
                                    : "0") +
                                    " " +
                                    data.ntokenname}
                                </p>
                              </div>

                              <div className="sm:hidden lg:block">
                                <img src={Arrow} alt="" className="" />
                              </div>
                            </div>
                          ) : (
                            <></>
                          )
                        )}
                      </div>
                    ) : // <div>{vaultData[this.state.tempkey].name}</div>
                    vaultData[this.state.tempkey].contractDetails[
                        this.state.currentNetworkID
                      ] ? (
                      <div className="coin-card-expand">
                        <div className="">
                          <div
                            className="back-container"
                            onClick={() => this.handleCardClose()}
                          >
                            <img
                              src={LeftArrow}
                              alt=""
                              className="mb-8 ml-4 cursor-pointer h-6"
                            />
                            <p className="back-label dark:text-primary">Back</p>
                          </div>
                        </div>
                        <div className="lg:flex pb-6 gap-10">
                          <div className="flex gap-6 vr-border">
                            <img
                              src={vaultData[this.state.tempkey].icon}
                              alt=""
                              className="h-12"
                            />
                            <p className="font-bold text-primary dark:text-primary">
                              {vaultData[this.state.tempkey].name} <br></br>{" "}
                              <span className="text-xs font-extralight text-primary dark:text-primary ">
                                {vaultData[this.state.tempkey].subname}
                              </span>
                            </p>
                            {/* <img src={Close} alt="" className="mb-8 ml-24" /> */}
                          </div>
                          <div className="sm:flex sm:mt-4 lg:mt-0 sm:justify-between">
                            <p className="text-primary dark:text-primary pr-10">
                              {apyEndPoints[this.state.currentNetworkID]
                                .showVaultAPYData
                                ? "Yield APY"
                                : ""}{" "}
                            </p>
                            <p className="font-bold text-sm text-primary">
                              {apyEndPoints[this.state.currentNetworkID]
                                .showVaultAPYData
                                ? (this.state.apy_vaults[
                                    vaultData[this.state.tempkey]
                                      .contractDetails[
                                      this.state.currentNetworkID
                                    ].id
                                  ]
                                    ? this.state.apy_vaults[
                                        vaultData[this.state.tempkey]
                                          .contractDetails[
                                          this.state.currentNetworkID
                                        ].id
                                      ]
                                    : "0") + " %"
                                : ""}
                            </p>
                          </div>
                          <div className="">
                            <p className="text-primary dark:text-primary pr-4">
                              {apyEndPoints[this.state.currentNetworkID]
                                .showNordAPYData
                                ? "NORD APY"
                                : ""}{" "}
                            </p>
                            <p className="font-bold text-sm text-primary dark:text-primary">
                              {apyEndPoints[this.state.currentNetworkID]
                                .showNordAPYData
                                ? (this.state.apy_nord[
                                    vaultData[this.state.tempkey]
                                      .contractDetails[
                                      this.state.currentNetworkID
                                    ].id
                                  ]
                                    ? this.state.apy_nord[
                                        vaultData[this.state.tempkey]
                                          .contractDetails[
                                          this.state.currentNetworkID
                                        ].id
                                      ]
                                    : "0") + " %"
                                : ""}
                            </p>
                          </div>
                          <div className="sm:flex sm:mt-2 lg:mt-0 sm:justify-between">
                            <p className="text-primary dark:text-primary pr-10">
                              {vaultData[this.state.tempkey].subname}{" "}
                            </p>
                            <p
                              className="font-bold text-sm text-primary dark:text-primary"
                              title={
                                this.state.balance[
                                  vaultData[this.state.tempkey].contractDetails[
                                    this.state.currentNetworkID
                                  ].id
                                ]
                                  ? this.web3.utils
                                      .toBN(
                                        this.state.balance[
                                          vaultData[this.state.tempkey]
                                            .contractDetails[
                                            this.state.currentNetworkID
                                          ].id
                                        ]
                                      )
                                      .isZero()
                                    ? false
                                    : this.web3.utils.fromWei(
                                        this.state.balance[
                                          vaultData[this.state.tempkey]
                                            .contractDetails[
                                            this.state.currentNetworkID
                                          ].id
                                        ],
                                        vaultData[this.state.tempkey]
                                          .web3EquivalentPrecision
                                      ) +
                                      " " +
                                      vaultData[this.state.tempkey].subname
                                  : false
                              }
                            >
                              {(this.state.balance[
                                vaultData[this.state.tempkey].contractDetails[
                                  this.state.currentNetworkID
                                ].id
                              ]
                                ? this.web3.utils
                                    .toBN(
                                      this.state.balance[
                                        vaultData[this.state.tempkey]
                                          .contractDetails[
                                          this.state.currentNetworkID
                                        ].id
                                      ]
                                    )
                                    .lt(
                                      this.web3.utils.toBN(
                                        this.web3.utils.toWei(
                                          this.web3.utils.toBN(100000)
                                        ),
                                        vaultData[this.state.tempkey]
                                          .web3EquivalentPrecision
                                      )
                                    )
                                  ? Numbro(
                                      Math.trunc(
                                        this.web3.utils.fromWei(
                                          this.state.balance[
                                            vaultData[this.state.tempkey]
                                              .contractDetails[
                                              this.state.currentNetworkID
                                            ].id
                                          ],
                                          vaultData[this.state.tempkey]
                                            .web3EquivalentPrecision
                                        ) * 100
                                      ) / 100
                                    ).format({
                                      thousandSeparated: true,
                                      trimMantissa: true,
                                      mantissa: 2,
                                      spaceSeparated: false,
                                    })
                                  : Numbro(
                                      Math.trunc(
                                        this.web3.utils.fromWei(
                                          this.state.balance[
                                            vaultData[this.state.tempkey]
                                              .contractDetails[
                                              this.state.currentNetworkID
                                            ].id
                                          ],
                                          vaultData[this.state.tempkey]
                                            .web3EquivalentPrecision
                                        ) * 100
                                      ) / 100
                                    )
                                      .format({
                                        thousandSeparated: true,
                                        trimMantissa: true,
                                        mantissa: 2,
                                        average: true,
                                        spaceSeparated: false,
                                      })
                                      .toUpperCase()
                                : "0") +
                                " " +
                                vaultData[this.state.tempkey].subname}
                            </p>
                          </div>
                          <div className="sm:flex sm:mt-2 lg:mt-0 sm:justify-between">
                            <p className="text-primary dark:text-primary pr-8 ">
                              {vaultData[this.state.tempkey].ntokenname}{" "}
                            </p>
                            <p
                              className="font-bold text-sm text-primary dark:text-primary"
                              title={
                                this.state.nordBalance[
                                  vaultData[this.state.tempkey].contractDetails[
                                    this.state.currentNetworkID
                                  ].id
                                ]
                                  ? this.web3.utils
                                      .toBN(
                                        this.state.nordBalance[
                                          vaultData[this.state.tempkey]
                                            .contractDetails[
                                            this.state.currentNetworkID
                                          ].id
                                        ]
                                      )
                                      .isZero()
                                    ? false
                                    : this.web3.utils.fromWei(
                                        this.state.nordBalance[
                                          vaultData[this.state.tempkey]
                                            .contractDetails[
                                            this.state.currentNetworkID
                                          ].id
                                        ],
                                        vaultData[this.state.tempkey]
                                          .web3EquivalentPrecision
                                      ) +
                                      " " +
                                      vaultData[this.state.tempkey].ntokenname
                                  : false
                              }
                            >
                              {(this.state.nordBalance[
                                vaultData[this.state.tempkey].contractDetails[
                                  this.state.currentNetworkID
                                ].id
                              ]
                                ? this.web3.utils
                                    .toBN(
                                      this.state.nordBalance[
                                        vaultData[this.state.tempkey]
                                          .contractDetails[
                                          this.state.currentNetworkID
                                        ].id
                                      ]
                                    )
                                    .lt(
                                      this.web3.utils.toBN(
                                        this.web3.utils.toWei(
                                          this.web3.utils.toBN(100000)
                                        ),
                                        vaultData[this.state.tempkey]
                                          .web3EquivalentPrecision
                                      )
                                    )
                                  ? Numbro(
                                      Math.trunc(
                                        this.web3.utils.fromWei(
                                          this.state.nordBalance[
                                            vaultData[this.state.tempkey]
                                              .contractDetails[
                                              this.state.currentNetworkID
                                            ].id
                                          ],
                                          vaultData[this.state.tempkey]
                                            .web3EquivalentPrecision
                                        ) * 100
                                      ) / 100
                                    ).format({
                                      thousandSeparated: true,
                                      trimMantissa: true,
                                      mantissa: 2,
                                      spaceSeparated: false,
                                    })
                                  : Numbro(
                                      Math.trunc(
                                        this.web3.utils.fromWei(
                                          this.state.nordBalance[
                                            vaultData[this.state.tempkey]
                                              .contractDetails[
                                              this.state.currentNetworkID
                                            ].id
                                          ],
                                          vaultData[this.state.tempkey]
                                            .web3EquivalentPrecision
                                        ) * 100
                                      ) / 100
                                    )
                                      .format({
                                        thousandSeparated: true,
                                        trimMantissa: true,
                                        mantissa: 2,
                                        average: true,
                                        spaceSeparated: false,
                                      })
                                      .toUpperCase()
                                : "0") +
                                " " +
                                vaultData[this.state.tempkey].ntokenname}
                            </p>
                          </div>
                        </div>
                        <div className="lg:grid lg:grid-cols-2 gap-4">
                          <div className="inline-block sm:mb-4 lg:mb-0">
                            <input
                              className="py-3 px-4 rounded nord-card-input text-primary dark:text-primary"
                              id="deposit"
                              type="text"
                              autoFocus
                              placeholder={
                                "Enter " +
                                vaultData[this.state.tempkey].subname +
                                " deposit amount"
                              }
                              value={this.state.dAmount}
                              onChange={(e) =>
                                this.handleAmountChange(e, "Deposit")
                              }
                            />
                            <div className="percentage-holder">
                              <button
                                className="single-percentage-btn "
                                onClick={() => {
                                  const amt = this.web3.utils
                                    .toBN(
                                      this.state.balance[
                                        vaultData[this.state.tempkey]
                                          .contractDetails[
                                          this.state.currentNetworkID
                                        ].id
                                      ]
                                    )
                                    .div(this.web3.utils.toBN(4));
                                  this.setState({
                                    dAmount: this.web3.utils.fromWei(
                                      amt,
                                      vaultData[this.state.tempkey]
                                        .web3EquivalentPrecision
                                    ),
                                    depositErr: "",
                                  });
                                }}
                              >
                                25%
                              </button>
                              <button
                                className="single-percentage-btn"
                                onClick={() => {
                                  const amt = this.web3.utils
                                    .toBN(
                                      this.state.balance[
                                        vaultData[this.state.tempkey]
                                          .contractDetails[
                                          this.state.currentNetworkID
                                        ].id
                                      ]
                                    )
                                    .div(this.web3.utils.toBN(2));
                                  this.setState({
                                    dAmount: this.web3.utils.fromWei(
                                      amt,
                                      vaultData[this.state.tempkey]
                                        .web3EquivalentPrecision
                                    ),
                                    depositErr: "",
                                  });
                                }}
                              >
                                50%
                              </button>
                              <button
                                className="single-percentage-btn"
                                onClick={() => {
                                  const amt = this.web3.utils
                                    .toBN(
                                      this.state.balance[
                                        vaultData[this.state.tempkey]
                                          .contractDetails[
                                          this.state.currentNetworkID
                                        ].id
                                      ]
                                    )
                                    .mul(this.web3.utils.toBN(3))
                                    .div(this.web3.utils.toBN(4));
                                  this.setState({
                                    dAmount: this.web3.utils.fromWei(
                                      amt,
                                      vaultData[this.state.tempkey]
                                        .web3EquivalentPrecision
                                    ),
                                    depositErr: "",
                                  });
                                }}
                              >
                                75%
                              </button>
                              <button
                                className="single-percentage-btn"
                                onClick={() => {
                                  const amt = this.web3.utils.toBN(
                                    this.state.balance[
                                      vaultData[this.state.tempkey]
                                        .contractDetails[
                                        this.state.currentNetworkID
                                      ].id
                                    ]
                                  );
                                  this.setState({
                                    dAmount: this.web3.utils.fromWei(
                                      amt,
                                      vaultData[this.state.tempkey]
                                        .web3EquivalentPrecision
                                    ),
                                    depositErr: "",
                                  });
                                }}
                              >
                                100%
                              </button>
                            </div>
                            <div>
                              <p className="tertiary-color text-sm leading-9">
                                {this.state.depositErr ? (
                                  this.state.depositErr
                                ) : (
                                  <br />
                                )}
                              </p>
                            </div>
                            <div className="">
                              <button
                                className="py-3 px-10 btn-green cursor-pointer focus:outline-none"
                                onClick={() => {
                                  this.handleBalanceCheck(
                                    this.state.dAmount,
                                    this.state.balance[
                                      vaultData[this.state.tempkey]
                                        .contractDetails[
                                        this.state.currentNetworkID
                                      ].id
                                    ],
                                    "Deposit",
                                    true
                                  );
                                }}
                                disabled={this.state.depositErr}
                              >
                                DEPOSIT
                              </button>
                            </div>
                          </div>
                          <div className="inline-block ">
                            <div className="text-center">
                              <input
                                className="py-3 px-4 rounded nord-card-input text-primary dark:text-primary"
                                id="withdraw"
                                type="text"
                                autoFocus
                                placeholder={
                                  "Enter " +
                                  vaultData[this.state.tempkey].ntokenname +
                                  " withdraw amount"
                                }
                                value={this.state.wAmount}
                                onChange={(e) =>
                                  this.handleAmountChange(e, "Withdrawal")
                                }
                              />
                            </div>
                            <div className="percentage-holder">
                              <button
                                className="single-percentage-btn"
                                onClick={() => {
                                  const amt = this.web3.utils
                                    .toBN(
                                      this.state.nordBalance[
                                        vaultData[this.state.tempkey]
                                          .contractDetails[
                                          this.state.currentNetworkID
                                        ].id
                                      ]
                                    )
                                    .div(this.web3.utils.toBN(4));
                                  this.setState({
                                    wAmount: this.web3.utils.fromWei(
                                      amt,
                                      vaultData[this.state.tempkey]
                                        .web3EquivalentPrecision
                                    ),
                                    withdrawErr: "",
                                  });
                                }}
                              >
                                25%
                              </button>
                              <button
                                className="single-percentage-btn"
                                onClick={() => {
                                  const amt = this.web3.utils
                                    .toBN(
                                      this.state.nordBalance[
                                        vaultData[this.state.tempkey]
                                          .contractDetails[
                                          this.state.currentNetworkID
                                        ].id
                                      ]
                                    )
                                    .div(this.web3.utils.toBN(2));
                                  this.setState({
                                    wAmount: this.web3.utils.fromWei(
                                      amt,
                                      vaultData[this.state.tempkey]
                                        .web3EquivalentPrecision
                                    ),
                                    withdrawErr: "",
                                  });
                                }}
                              >
                                50%
                              </button>
                              <button
                                className="single-percentage-btn"
                                onClick={() => {
                                  const amt = this.web3.utils
                                    .toBN(
                                      this.state.nordBalance[
                                        vaultData[this.state.tempkey]
                                          .contractDetails[
                                          this.state.currentNetworkID
                                        ].id
                                      ]
                                    )
                                    .mul(this.web3.utils.toBN(3))
                                    .div(this.web3.utils.toBN(4));
                                  this.setState({
                                    wAmount: this.web3.utils.fromWei(
                                      amt,
                                      vaultData[this.state.tempkey]
                                        .web3EquivalentPrecision
                                    ),
                                    withdrawErr: "",
                                  });
                                }}
                              >
                                75%
                              </button>
                              <button
                                className="single-percentage-btn"
                                onClick={() => {
                                  const amt = this.web3.utils.toBN(
                                    this.state.nordBalance[
                                      vaultData[this.state.tempkey]
                                        .contractDetails[
                                        this.state.currentNetworkID
                                      ].id
                                    ]
                                  );
                                  this.setState({
                                    wAmount: this.web3.utils.fromWei(
                                      amt,
                                      vaultData[this.state.tempkey]
                                        .web3EquivalentPrecision
                                    ),
                                    withdrawErr: "",
                                  });
                                }}
                              >
                                100%
                              </button>
                            </div>
                            <div>
                              <p
                                className={
                                  this.state.withdrawErr
                                    ? "tertiary-color text-sm leading-9"
                                    : "secondary-color text-sm leading-9"
                                }
                                title={
                                  this.state.withdrawErr
                                    ? false
                                    : this.state.wAmount
                                    ? this.calculateReceivingAmount(
                                        this.state.tempkey,
                                        this.state.wAmount
                                      )
                                    : false
                                }
                              >
                                {this.state.withdrawErr ? (
                                  this.state.withdrawErr
                                ) : Number(this.state.wAmount) ? (
                                  "You will receive " +
                                  Numbro(
                                    Math.trunc(
                                      this.state.wAmount *
                                        100 *
                                        this.web3.utils.fromWei(
                                          this.state.sharePrice[
                                            vaultData[this.state.tempkey]
                                              .contractDetails[
                                              this.state.currentNetworkID
                                            ].id
                                          ],
                                          vaultData[this.state.tempkey]
                                            .web3EquivalentPrecision
                                        )
                                    ) / 100
                                  ).format({
                                    thousandSeparated: true,
                                    trimMantissa: true,
                                    mantissa: 2,
                                    spaceSeparated: false,
                                  }) +
                                  " " +
                                  vaultData[this.state.tempkey].subname
                                ) : (
                                  <br />
                                )}
                              </p>
                            </div>
                            <div className="">
                              <button
                                className="z-50 py-3 px-10 btn-green cursor-pointer focus:outline-none"
                                onClick={() => {
                                  this.handleBalanceCheck(
                                    this.state.wAmount,
                                    this.state.nordBalance[
                                      vaultData[this.state.tempkey]
                                        .contractDetails[
                                        this.state.currentNetworkID
                                      ].id
                                    ],
                                    "Withdrawal",
                                    true
                                  );
                                }}
                                disabled={this.state.withdrawErr}
                              >
                                WITHDRAW
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
                  </div>
                </>
              ) : networkData.showSaving[this.state.currentNetworkID] ? (
                <SavingsWithStaking
                  web3={this.web3}
                  web3Biconomy={this.web3Biconomy}
                  biconomy={this.biconomy}
                  depositBalance={this.state.balance}
                  withdrawBalance={this.state.nordBalance}
                  reactGa={this.props.reactGa}
                  nordBalance={this.web3.utils.toBN(
                    this.web3.utils.toWei(
                      this.state.nTokenBalance[0]
                        ? this.state.nTokenBalance[0].toString()
                        : "0",
                      nordGovernanceTokenData.web3EquivalentPrecision
                    )
                  )}
                  vaultApy={this.state.apy_vaults}
                  currentNetworkID={this.state.currentNetworkID}
                  accounts={this.state.accounts}
                  showErrorMessage={this.showErrorMessage}
                  showSuccessMessage={this.showSuccessMessage}
                  displayCardClickError={this.displayCardClickError}
                  setOverlay={this.setTransactionOverlay}
                  updateBalance={this.updateBalance}
                  nordPrice={this.state.nordPrice}
                  unclaimedBal={this.state.vaultUnclaimedBal}
                  stakedNordInVault={this.state.stakedNordInVault}
                  earnedNordInVault={this.state.earnedNordInVault}
                  calculateReceivingAmount={this.calculateReceivingAmount}
                />
              ) : (
                <p className="unavailable ml-8">
                  {networkData.showSaving[this.state.currentNetworkID]
                    ? ""
                    : "Coming soon on " +
                      networkData.networkName[this.state.currentNetworkID]}
                </p>
              )
            ) : (
              <></>
            )}
          </LoadingOverlay>

          <div
            className={
              (this.state.address
                ? "hide"
                : this.state.showComponent === 2
                ? "show with-fixed"
                : "show") +
              " lg:pt-10 sm:pt-0 pb-6 inset-x-0 bottom-0 sm:bottom-0 md:bottom-0"
            }
          >
            <Footer />
          </div>
          <ToastContainer
            enableMultiContainer
            containerId={"networkErr"}
            limit={1}
            position={toast.POSITION.TOP_LEFT}
          />
          <ToastContainer
            enableMultiContainer
            containerId={"Err"}
            position={toast.POSITION.BOTTOM_RIGHT}
          />
          <Modal
            isOpen={this.state.isConfirmPopupOpen}
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
            style={customStyles}
            contentLabel="Example Modal"
          >
            <div className="">
              <div className="flex mb-6">
                <p className="text-2xl">
                  {"Confirm " + this.state.confirmPopupType + " Amount"}
                </p>
              </div>
              <hr></hr>
              <div>
                <div className="flex py-4 justify-between gap-4">
                  <p className="text-sm text-color text-left ">
                    {this.state.confirmPopupType + " Amount"}
                  </p>
                  <p
                    className="font-bold text-sm-right text-right "
                    claim={
                      this.state.confirmPopupType === "Deposit"
                        ? this.state.dAmount + " " + this.state.selectedToken[0]
                        : this.state.wAmount + " " + this.state.selectedToken[1]
                    }
                  >
                    {this.state.confirmPopupType === "Deposit"
                      ? (this.state.dAmount &&
                        this.state.dAmount.indexOf(".") !== -1
                          ? this.state.dAmount.substring(
                              0,
                              this.state.dAmount.indexOf(".")
                            ) +
                            this.state.dAmount.substring(
                              this.state.dAmount.indexOf("."),
                              this.state.dAmount.indexOf(".") + 7
                            )
                          : this.state.dAmount) +
                        " " +
                        this.state.selectedToken[0]
                      : (this.state.wAmount &&
                        this.state.wAmount.indexOf(".") !== -1
                          ? this.state.wAmount.substring(
                              0,
                              this.state.wAmount.indexOf(".")
                            ) +
                            this.state.wAmount.substring(
                              this.state.wAmount.indexOf("."),
                              this.state.wAmount.indexOf(".") + 7
                            )
                          : this.state.wAmount) +
                        " " +
                        this.state.selectedToken[1]}
                  </p>
                </div>
                <hr></hr>
                <div className="flex py-4 justify-between gap-4">
                  <p className="text-sm text-color pr-80 ">Vault</p>
                  <p className="font-bold text-sm-right">
                    {this.state.selectedToken[1]}
                  </p>
                </div>
                <hr></hr>
                {this.state.displayInfiniteSwitch ? (
                  <div className="flex py-4 justify-between gap-4">
                    <p className="text-sm text-color">
                      {"Infinite approval - Trust " + " Contract forever"}
                      <div className="tooltip">
                        <img
                          src={Info}
                          alt=""
                          className="mb-1 ml-1 h-4 w-4 cursor-pointer"
                        />
                        <span className="tooltiptext">
                          {"By toggling this, You are agreeing to trust the contract to approve and spend infinite amount of " +
                            this.state.selectedToken[0] +
                            ",saving you any extra gas fee in subsequent " +
                            this.state.selectedToken[0] +
                            " deposit transaction"}
                        </span>
                      </div>
                    </p>
                    <div>
                      <label>
                        <input
                          id="infiniteApproval"
                          checked={this.state.infiniteApproval}
                          value={this.state.infiniteApproval}
                          onChange={this._handleChange}
                          className="switch"
                          type="checkbox"
                          onClick={() => {
                            const label = this.state.infiniteApproval
                              ? "Revoked"
                              : "Granted";
                            this.props.reactGa.event({
                              category: "Savings",
                              action: "InfiniteApproval",
                              label,
                            });
                          }}
                        />
                        <div>
                          <div></div>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <p />
                )}
                <div className="flex mt-10 gap-6">
                  <button
                    className=" flex py-2 px-6 btn-green cursor-pointer focus:outline-none"
                    onClick={() => {
                      this.handlePopupClose(true);
                      this.props.reactGa.event({
                        category: "Savings",
                        action: this.state.confirmPopupType + "TxnContinued",
                        label: `${vaultData[this.state.tempkey].subname}${
                          this.state.currentNetworkID
                        }`,
                      });
                    }}
                  >
                    Yes and Continue
                  </button>
                  <button
                    className=" flex py-2 px-6 btn-cancel cursor-pointer focus:outline-none"
                    onClick={() => {
                      this.handlePopupClose(false);
                      this.props.reactGa.event({
                        category: "Savings",
                        action: this.state.confirmPopupType + "TxnCancelled",
                        label: `${vaultData[this.state.tempkey].subname}${
                          this.state.currentNetworkID
                        }`,
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        </LoadingOverlay>
      </>
    );
  }
}

DashBoard.propTypes = {
  reactGa: PropTypes.object.isRequired,
};

export default DashBoard;
