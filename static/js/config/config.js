import Coin from "../assets/images/usd-coin.svg";
import Tether from "../assets/images/tether.svg";
import Dai from "../assets/images/dai.svg";
import Nord from "../assets/images/nordcon.svg";
import AAVE from "../assets/images/aave.png";
import BTC from "../assets/images/btc.svg";
import LINK from "../assets/images/chainlink.svg";
import UNI from "../assets/images/uniswap.svg";
import CRV from "../assets/images/crv.svg";
import FTT from "../assets/images/ftt.svg";
import { UniSwapSVG, NordBigIconStr, KridaSVG } from "../components/icon/icon";
import ETH from "../assets/images/eth.svg";
// import Bsc from "../assets/images/bia.svg";
import POLYGON from "../assets/images/polygon.svg";
import AVALANCHE from "../assets/images/avalanche.svg";
const vaultABI = require("../abi/vault.json");
const stakingVaultABI = require("../abi/stakingVault.json");
const savingsVaultwithStakingABI = require("../abi/savingsVaultwithStaking.json");
const chainlinkABI = require("../abi/chainlink.json");
const ercABI = require("../abi/ERC20.json");
const maticErcABI = require("../abi/Matic-ERC20.json");
const maticUSDCErcABI = require("../abi/Matic-USDC-ERC20.json");
// const uniswapStakingABI = require("../abi/uniswapStaking.json");
const NordStakingWithUnboundingDurationABI = require("../abi/nordStaking.json");
const nordStakingwithReinvest = require("../abi/nordStakingwithReinvest.json");
const nordStakingWithReinvestVariableAPY = require("../abi/nordStakingWithReinvestVariableAPY.json");
const ETHClaimABI = require("../abi/ETHClaimRewardProxy.json");
const updatedClaimABI = require("../abi/ClaimRewardProxy.json");
const uniswapPairABI = require("../abi/uniswapPair.json");
const FundDivisionStrategyABI = require("../abi/FundDivisionStrategy.json");
const ControllerABI = require("../abi/Controller.json");
const FeeManagerABI = require("../abi/FeeManager.json");
const nftLoanABI = require("../abi/nftLoan.json");
const erc721ABI = require("../abi/ERC721.json");
const erc1155ABI = require("../abi/ERC1155.json");
const timeBasedStakingABI = require("../abi/timeBasedStaking.json");

const BalanceUpdateInterval = 300;
const networkData = {
  networkName: {
    1: "Ethereum Mainnet",
    3: "Ethereum Ropsten Testnet",
    4: "Ethereum Rinkeby Testnet",
    5: "Ethereum Goerli Testnet",
    42: "Ethereum Kovan Testnet",
    56: "Binance Smart Chain",
    97: "Binance Smart Chain Testnet",
    137: "Polygon Mainnet",
    80001: "Polygon Mumbai Testnet",
    43114: "Avalanche Mainnet",
  },
  allowedNetworkID: [1, 137, 43114],
  networkIcon: { 1: ETH, 137: POLYGON, 43114: AVALANCHE },
  blockExplorer: {
    1: "https://etherscan.io/",
    4: "https://rinkeby.etherscan.io/",
    42: "https://kovan.etherscan.io/",
    137: "https://polygonscan.com/",
    80001: "https://explorer-mumbai.maticvigil.com/",
    43114: "https://snowtrace.io/",
    43113: "https://testnet.snowtrace.io/",
  },
  rpcURL: {
    1: "https://mainnet.infura.io/v3/" + process.env.REACT_APP_INFURA_ID,
    4: "https://rinkeby.infura.io/v3/" + process.env.REACT_APP_INFURA_ID,
    42: "https://kovan.infura.io/v3/" + process.env.REACT_APP_INFURA_ID,
    137:
      "https://polygon-mainnet.infura.io/v3/" + process.env.REACT_APP_INFURA_ID,
    80001: "https://rpc-mumbai.matic.today",
    43114: "https://api.avax.network/ext/bc/C/rpc",
    43113: "https://api.avax-test.network/ext/bc/C/rpc",
  },
  showSaving: {
    1: true,
    137: true,
    43114: true,
  },
  showStaking: {
    1: true,
    137: true,
    43114: true,
  },
  showAdvisory: {
    1: true,
    137: true,
    43114: false,
  },
  showNftLoans: {
    1: true,
    137: false,
    43114: false,
  },
};

const tvlStatisticsEndPoint =
  process.env.REACT_APP_NORD_API_ENDPOINT + "/tvl/statistics";

const openSeaEndPoint = process.env.REACT_APP_OPENSEA_API_ENDPOINT;

const coingeckoPriceEndPoint = {
  savings:
    "https://api.coingecko.com/api/v3/simple/price?ids=nord-finance&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=true",
  staking:
    "https://api.coingecko.com/api/v3/simple/price?ids=nord-finance%2Cethereum&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=true",
  advisory:
    "https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin%2Cweth%2Cchainlink%2Cuniswap%2Caave%2Cwmatic%2Ccurve-dao-token%2Cusd-coin&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=true",
};

const chainLinkPriceFeeds = {
  1: {
    contractAddress: "0xf33045E835201CF2846aF9bEd9Dd672d3973d4c5",
    contractABI: chainlinkABI,
  },
  137: {
    contractAddress: "0xbb2146a2872c5d95db83c97a052464f2fffd429f",
    contractABI: chainlinkABI,
  },
  43114: {
    contractAddress: "0x6033AE917842531e2C4De2B4f9F88D69A287F9c2",
    contractABI: chainlinkABI,
  },
};

const nftLoansEndPoint =
  process.env.REACT_APP_NORD_NFT_LOANS_ENDPOINT + "/nft-loans";

const assetData = {
  wBTC: {
    icon: BTC,
    piechartColor: "#f2a900",
    name: "Wrapped BitCoin",
    subname: "wBTC",
    priceApiName: "wrapped-bitcoin",
    contractAddress: {
      1: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      137: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    },
    exchangeAdapterAddress: {
      1: "0x1b86B82a6cbfb585DE746984026eB993aB4E9013",
      137: "0x29943B1550e50cE7AA0e1018237d2426ffa6B450",
    },
    tokenABI: ercABI,
    precision: 8,
  },
  wETH: {
    icon: ETH,
    piechartColor: "#3c3c3d",
    name: "Wrapped Ethereum",
    subname: "wETH",
    priceApiName: "weth",
    contractAddress: {
      1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      137: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    },
    exchangeAdapterAddress: {
      1: "0x1b86B82a6cbfb585DE746984026eB993aB4E9013",
      137: "0x29943B1550e50cE7AA0e1018237d2426ffa6B450",
    },
    tokenABI: ercABI,
    precision: 18,
  },
  Link: {
    icon: LINK,
    piechartColor: "#375BD2",
    name: "ChainLink",
    subname: "LINK",
    priceApiName: "chainlink",
    contractAddress: {
      1: "0x514910771af9ca656af840dff83e8264ecf986ca",
      137: "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39",
    },
    exchangeAdapterAddress: {
      1: "0x521a08375a7f8aeda11f374e491fc316314e3bdd",
      137: "0x29943B1550e50cE7AA0e1018237d2426ffa6B450",
    },
    tokenABI: ercABI,
    precision: 18,
  },
  Uni: {
    icon: UNI,
    piechartColor: "#FF007A",
    name: "Uniswap",
    subname: "UNI",
    priceApiName: "uniswap",
    contractAddress: {
      1: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      137: "0xb33eaad8d922b1083446dc23f610c2567fb5180f",
    },
    exchangeAdapterAddress: {
      1: "0x1b86B82a6cbfb585DE746984026eB993aB4E9013",
      137: "0x29943B1550e50cE7AA0e1018237d2426ffa6B450",
    },
    tokenABI: ercABI,
    precision: 18,
  },
  AAVE: {
    icon: AAVE,
    piechartColor: "#B6509E",
    name: "Aave",
    subname: "AAVE",
    priceApiName: "aave",
    contractAddress: {
      1: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
      137: "0xd6df932a45c0f255f85145f286ea0b292b21c90b",
    },
    exchangeAdapterAddress: {
      1: "0x521a08375a7f8aeda11f374e491fc316314e3bdd",
      137: "0x29943B1550e50cE7AA0e1018237d2426ffa6B450",
    },
    tokenABI: ercABI,
    precision: 18,
  },
  wMatic: {
    icon: POLYGON,
    piechartColor: "#8247e5",
    name: "Wrapped Matic",
    subname: "wMatic",
    priceApiName: "wmatic",
    contractAddress: {
      1: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
      137: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    },
    exchangeAdapterAddress: {
      1: "0x1b86B82a6cbfb585DE746984026eB993aB4E9013",
      137: "0x29943B1550e50cE7AA0e1018237d2426ffa6B450",
    },
    tokenABI: ercABI,
    precision: 18,
  },
  CRV: {
    icon: CRV,
    piechartColor: "#a9fa4f",
    name: "Curve DAO Token",
    subname: "CRV",
    priceApiName: "curve-dao-token",
    contractAddress: { 1: "0xd533a949740bb3306d119cc777fa900ba034cd52" },
    exchangeAdapterAddress: {
      1: "0x521a08375a7f8aeda11f374e491fc316314e3bdd",
    },
    tokenABI: ercABI,
    precision: 18,
  },
  FTT: {
    icon: FTT,
    piechartColor: "#a9fa4f",
    name: "FTX Token",
    subname: "FTX",
    priceApiName: "ftx",
    contractAddress: { 1: "0x50D1c9771902476076eCFc8B2A83Ad6b9355a4c9" },
    exchangeAdapterAddress: {
      1: "0x521a08375a7f8aeda11f374e491fc316314e3bdd",
    },
    tokenABI: ercABI,
    precision: 18,
  },
};

const apyEndPoints = {
  1: {
    showVaultAPYData: true,
    showNordAPYData: false,
    savings: process.env.REACT_APP_NORD_API_ENDPOINT + "/ethereum/savings/apy",
    nord: process.env.REACT_APP_NORD_API_ENDPOINT + "/ethereum/nord/apy",
    advisory:
      process.env.REACT_APP_NORD_API_ENDPOINT + "/ethereum/advisory/vault/apy",
  },
  137: {
    showVaultAPYData: true,
    showNordAPYData: false,
    savings: process.env.REACT_APP_NORD_API_ENDPOINT + "/polygon/savings/apy",
    nord: process.env.REACT_APP_NORD_API_ENDPOINT + "/polygon/savings/apy",
    advisory:
      process.env.REACT_APP_NORD_API_ENDPOINT + "/polygon/advisory/vault/apy",
  },
  43114: {
    showVaultAPYData: true,
    showNordAPYData: false,
    savings: process.env.REACT_APP_NORD_API_ENDPOINT + "/avalanche/savings/apy",
    nord: process.env.REACT_APP_NORD_API_ENDPOINT + "/avalanche/savings/apy",
    advisory:
      process.env.REACT_APP_NORD_API_ENDPOINT + "/avalanche/advisory/vault/apy",
  },
};

const tierAPYBoostDetails = {
  137: {
    Bronze: 2,
    Silver: 4,
    Gold: 6,
    Platinum: 10,
    Titanium: 12.5,
  },
  43114: {
    Bronze: 3,
    Silver: 6,
    Gold: 9,
    Platinum: 15,
    Titanium: 18.75,
  },
};

const vaultData = [
  {
    icon: Coin,
    name: "USD Coin",
    priceApiName: "usd-coin",
    precision: 6,
    web3EquivalentPrecision: "picoether",
    subname: "USDC",
    ntokenname: "nUSDC",
    contractDetails: {
      1: {
        id: 0,
        vaultAddress: "0x53E1c9750014C7Cf8303D69A3CA06A555C739DD0",
        vaultABI: vaultABI,
        tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        tokenABI: ercABI,
      },
      137: {
        id: 0,
        eipVersion: "1",
        tokenName: "USD Coin (PoS)",
        enableBiconomy: true,
        nordAPY: "21.9",
        vaultAddress: "0x8a5Ae804Da4924081663D4C5DaB4DC9BB7092E2E",
        vaultABI: savingsVaultwithStakingABI,
        tokenAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        tokenABI: maticUSDCErcABI,
        vaultStakingAddress: "0x225114D156062692e1Cb625033Fb5aF639F1253c",
        vaultStakingABI: stakingVaultABI,
      },
      43114: {
        id: 1,
        eipVersion: "1",
        tokenName: "USD Coin (PoS)",
        enableBiconomy: false,
        nordAPY: "32.1",
        vaultAddress: "0xAA1110b6A39647f93dfBbc6345216912E1dee6FF",
        vaultABI: savingsVaultwithStakingABI,
        tokenAddress: "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664",
        tokenABI: maticErcABI,
        vaultStakingAddress: "0x5beE64DbC3A6A544dBe674244353Af4d4Bf00336",
        vaultStakingABI: stakingVaultABI,
      },
    },
  },
  {
    icon: Tether,
    id: 1,
    name: "Tether",
    priceApiName: "tether",
    precision: 6,
    web3EquivalentPrecision: "picoether",
    subname: "USDT",
    ntokenname: "nUSDT",
    contractDetails: {
      1: {
        id: 1,
        vaultAddress: "0xCD4F2844b11A4515398fD2201247Cf2ed411245f",
        vaultABI: vaultABI,
        tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        tokenABI: ercABI,
      },
      137: {
        id: 1,
        eipVersion: "1",
        tokenName: "(PoS) Tether USD",
        enableBiconomy: true,
        nordAPY: "21.9",
        vaultAddress: "0xa4dbb459fb9051b976947d2d8ab74477e1720a73",
        vaultABI: savingsVaultwithStakingABI,
        tokenAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        tokenABI: maticErcABI,
        vaultStakingAddress: "0x292d74Eb25df063A15A2F2aa1e68392f305C70C5",
        vaultStakingABI: stakingVaultABI,
      },
      43114: {
        id: 1,
        eipVersion: "1",
        tokenName: "(PoS) Tether USD",
        enableBiconomy: false,
        nordAPY: "32.1",
        vaultAddress: "0xFbb37792f98fd57AC1f2f20b151e2db5cceF7F11",
        vaultABI: savingsVaultwithStakingABI,
        tokenAddress: "0xc7198437980c041c805A1EDcbA50c1Ce5db95118",
        tokenABI: maticErcABI,
        vaultStakingAddress: "0x343F0E89B8acD31276b748a05158D9AA987f059a",
        vaultStakingABI: stakingVaultABI,
      },
    },
  },
  {
    icon: Dai,
    name: "DAI Stablecoin",
    priceApiName: "dai",
    precision: 18,
    web3EquivalentPrecision: "ether",
    subname: "DAI",
    ntokenname: "nDAI",
    contractDetails: {
      1: {
        id: 2,
        vaultAddress: "0x6Db6ABb2a55154C385e90d3fD05EE8ca46e3BA35",
        vaultABI: vaultABI,
        tokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        tokenABI: ercABI,
      },
      137: {
        id: 2,
        eipVersion: "1",
        tokenName: "(PoS) Dai Stablecoin",
        enableBiconomy: true,
        nordAPY: "21.9",
        vaultAddress: "0xeE2dEf710a8a0021DCbF99C4cD7f69Dc536fc57b",
        vaultABI: savingsVaultwithStakingABI,
        tokenAddress: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        tokenABI: maticErcABI,
        vaultStakingAddress: "0x86175F18E0B1bf372076bCC9E35FFEF72B1446B1",
        vaultStakingABI: stakingVaultABI,
      },
      43114: {
        id: 1,
        eipVersion: "1",
        tokenName: "(PoS) Dai Stablecoin",
        enableBiconomy: false,
        nordAPY: "32.1",
        vaultAddress: "0xaF3745feCEe0a79c5F19991291Cd60B716C4F698",
        vaultABI: savingsVaultwithStakingABI,
        tokenAddress: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
        tokenABI: maticErcABI,
        vaultStakingAddress: "0xcF2Aaba8845Dd28155Dd0F879B52A4a6994d241a",
        vaultStakingABI: stakingVaultABI,
      },
    },
  },
];

const nordGovernanceTokenData = {
  precision: 18,
  web3EquivalentPrecision: "ether",
  contractDetails: {
    1: {
      nordTokenAddress: "0x6e9730ecffbed43fd876a264c982e254ef05a0de",
      nordTokenABI: ercABI,
      claimABI: ETHClaimABI,
      claimAddress: "0x663A861e10F7F8461363fe65987eda485d5466A6",
    },
    137: {
      eipVersion: "1",
      tokenName: "Nord Token (PoS)",
      nordTokenAddress: "0xf6f85b3f9fd581c2ee717c404f7684486f057f95",
      nordTokenABI: maticErcABI,
      claimABI: updatedClaimABI,
      claimAddress: "0xC8f5B4b7b266a604c3187B53Bf11551fbAD21c78",
    },
    43114: {
      eipVersion: "1",
      tokenName: "Nord Token",
      nordTokenAddress: "0x8965349fb649a33a30cbfda057d8ec2c48abe2a2",
      nordTokenABI: maticErcABI,
      claimABI: updatedClaimABI,
      claimAddress: "0x6dFd95175c47FaBD33aCe6A2dF45287321673f6f",
    },
  },
};

const percentages = [25, 50, 75, 100];

const stakingNameSet = new Set(["NORD", "KRIDA", "NORD (NXT)"]);

const stakingSubnameSet = new Set(["NORD", "KRIDA"]);

const stakingDurationOptions = {
  1: { short: "1 M", full: "1 month" },
  3: { short: "3 M", full: "3 months" },
  6: { short: "6 M", full: "6 months" },
  12: { short: "1 Y", full: "1 year" },
  24: { short: "2 Y", full: "2 years" },
  36: { short: "3 Y", full: "3 years" },
  48: { short: "4 Y", full: "4 years" },
};

const stakingData = [
  {
    icon: NordBigIconStr,
    name: "NORD (NXT)",
    subname: "NORD",
    precision: 18,
    web3EquivalentPrecision: "ether",
    priceApiName: "nord-finance",
    contractMethods: {
      getBalance: "getUserData",
      getRewardRate: "getMonthlyAPRforUser",
    },
    isActive: true,
    contractDetails: {
      1: {
        id: 0,
        stakingAddress: "0xBF2e485845Cf710EfFbadDf8926c479BE025Fab9",
        stakingABI: timeBasedStakingABI,
        tokenAddress:
          nordGovernanceTokenData.contractDetails[1].nordTokenAddress,
        tokenABI: nordGovernanceTokenData.contractDetails[1].nordTokenABI,
      },
      137: {
        id: 0,
        enableBiconomy: true,
        stakingAddress: "0x53af8D0c753Cd136762c706841b96213021A5a3A",
        stakingABI: timeBasedStakingABI,
        tokenAddress:
          nordGovernanceTokenData.contractDetails[137].nordTokenAddress,
        tokenABI: nordGovernanceTokenData.contractDetails[137].nordTokenABI,
        tokenName: nordGovernanceTokenData.contractDetails[137].tokenName,
        eipVersion: nordGovernanceTokenData.contractDetails[137].eipVersion,
      },
      43114: {
        id: 0,
        stakingAddress: "0x535d8A5415fD1599d0Ec2E483Fe91E6aBBB3d7e3",
        stakingABI: timeBasedStakingABI,
        tokenAddress:
          nordGovernanceTokenData.contractDetails[43114].nordTokenAddress,
        tokenABI: nordGovernanceTokenData.contractDetails[43114].nordTokenABI,
      },
    },
  },
  {
    icon: NordBigIconStr,
    name: "NORD",
    subname: "NORD",
    precision: 18,
    web3EquivalentPrecision: "ether",
    priceApiName: "nord-finance",
    contractMethods: {
      getBalance: "getUserData",
      getRewardRate: "rewardPercent",
    },
    isActive: false,
    contractDetails: {
      1: {
        id: 0,
        enableBiconomy: false,
        endTime: new Date(1656684000000),
        stakingAddress: "0x2b9a023415f0feeb88597c1a7d09fdefa0ef5614",
        stakingABI: nordStakingwithReinvest,
        tokenAddress:
          nordGovernanceTokenData.contractDetails[1].nordTokenAddress,
        tokenABI: nordGovernanceTokenData.contractDetails[1].nordTokenABI,
      },
      137: {
        id: 0,
        enableBiconomy: true,
        endTime: new Date(1656684000000),
        stakingAddress: "0xf0882a08D855ec8Ad3f25087dE3FB311A5344b20",
        stakingABI: nordStakingwithReinvest,
        tokenAddress:
          nordGovernanceTokenData.contractDetails[137].nordTokenAddress,
        tokenABI: nordGovernanceTokenData.contractDetails[137].nordTokenABI,
        tokenName: nordGovernanceTokenData.contractDetails[137].tokenName,
        eipVersion: nordGovernanceTokenData.contractDetails[137].eipVersion,
      },
      43114: {
        id: 0,
        enableBiconomy: false,
        endTime: new Date(1656684000000),
        stakingAddress: "0x1929aED2175688252C9388df11B162F7303ff926",
        stakingABI: nordStakingwithReinvest,
        tokenAddress:
          nordGovernanceTokenData.contractDetails[43114].nordTokenAddress,
        tokenABI: nordGovernanceTokenData.contractDetails[43114].nordTokenABI,
        tokenName: nordGovernanceTokenData.contractDetails[43114].tokenName,
        eipVersion: nordGovernanceTokenData.contractDetails[43114].eipVersion,
      },
    },
  },
  {
    icon: KridaSVG,
    name: "KRIDA",
    subname: "KRIDA",
    precision: 18,
    web3EquivalentPrecision: "ether",
    priceApiName: "nord-finance",
    contractMethods: {
      getBalance: "balanceOf",
      getRewardRate: "rewardRate",
    },
    isActive: false,
    contractDetails: {
      137: {
        id: 0,
        enableBiconomy: false,
        startTime: new Date(1643650200000),
        stakingPeriodInDays: 90,
        unboundingPeriod: "7 days",
        stakingAddress: "0xeE716de554A35643f2DA36f1fA7bE8a014dd0472",
        stakingABI: nordStakingWithReinvestVariableAPY,
        tokenAddress: "0x3c5a5885f6ee4acc2597069fe3c19f49c6efba96",
        tokenABI: nordGovernanceTokenData.contractDetails[137].nordTokenABI,
        tokenName: "KRIDA",
        eipVersion: nordGovernanceTokenData.contractDetails[137].eipVersion,
      },
    },
  },
  {
    icon: NordBigIconStr,
    name: "NORD (Old)",
    subname: "NORD",
    precision: 18,
    web3EquivalentPrecision: "ether",
    priceApiName: "nord-finance",
    contractMethods: {
      getBalance: "balanceOf",
      getRewardRate: "rewardRate",
    },
    isActive: false,
    contractDetails: {
      137: {
        id: 1,
        enableBiconomy: false,
        startTime: new Date(1626444000000),
        unboundingPeriod: "0 hours",
        stakingPeriodInDays: 32,
        stakingAddress: "0x9b2311c6D57EA5a65B29223C87C50C59E1D9cF13",
        stakingABI: NordStakingWithUnboundingDurationABI,
        tokenAddress:
          nordGovernanceTokenData.contractDetails[137].nordTokenAddress,
        tokenABI: nordGovernanceTokenData.contractDetails[137].nordTokenABI,
        tokenName: nordGovernanceTokenData.contractDetails[137].tokenName,
        eipVersion: nordGovernanceTokenData.contractDetails[137].eipVersion,
      },
    },
  },
  {
    icon: UniSwapSVG,
    name: "NORD-ETH UNI-V2",
    subname: "Uni-LP",
    precision: 18,
    web3EquivalentPrecision: "ether",
    priceApiName: "ethereum",
    contractMethods: {
      getBalance: "balanceOf",
      getRewardRate: "rewardRate",
    },
    isActive: false,
    contractDetails: {
      1: {
        id: 0,
        startTime: new Date(1630074576000),
        stakingPeriodInDays: 92,
        stakingAddress: "0x8c043C37a5f16440A1d6919C7F60aBaEd0592b31",
        stakingABI: NordStakingWithUnboundingDurationABI,
        tokenAddress: "0x5239873C892376799B6Cb49a3CFB1146d4A260b8",
        tokenABI: uniswapPairABI,
      },
    },
  },
];

const timeBasedStakingAprToApy = {
  0: { apy: 0 },
  2: { apy: 2 },
  3: { apy: 3.04 },
  7: { apy: 7.23 },
  10: { apy: 10.47 },
  12: { apy: 12.68 },
  24: { apy: 26.82 },
  36: { apy: 42.58 },
};

const advisoryData = [
  {
    icon: Nord,
    underlyingTokenPiechartColor: "#2775CA",
    name: "NORD Quant Fund",
    subname: "nQNTS",
    underlyingTokenIcon: Coin,
    underlyingTokenName: "USDC",
    precision: 6,
    web3EquivalentPrecision: "picoether",
    priceApiName: "usd-coin",
    fundManagedBy: "Solidum Capital",
    contractDetails: {
      137: {
        id: 0,
        eipVersion: "1",
        underlyingTokenName: "USD Coin (PoS)",
        enableBiconomy: true,
        enableMaxCap: true,
        activeAssets: [
          assetData.wBTC,
          assetData.wETH,
          assetData.Link,
          assetData.Uni,
          assetData.AAVE,
          assetData.wMatic,
        ],
        FundManagementFees: "2",
        PerformanceFees: "20",
        underlyingTokenAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        underlyingTokenABI: maticUSDCErcABI,
        fundDivisionAddress: "0x014fD6Db604b55eF900704ed5c25F9Ef61e8B225",
        fundDivisionABI: FundDivisionStrategyABI,
        controllerAddress: "0x6df16257f1E79a7dbe7F5B2bE6B1AdE51964fC38",
        controllerABI: ControllerABI,
        feeManagerAddress: "0x39CC8eaB745035cf4467AC27dd5769C73C92D14D",
        feeManagerABI: FeeManagerABI,
        vaultAddress: "0xa10105C9BFaB2942b542aacBc3835fe4615A8191",
        vaultABI: vaultABI,
        pricesEndpoint:
          process.env.REACT_APP_NORD_API_ENDPOINT + "/polygon/advisory/vault/",
        txHistoryEndpoint:
          process.env.REACT_APP_NORD_API_ENDPOINT +
          "/polygon/advisory/vaults/transactions",
      },
    },
  },
  {
    icon: Nord,
    underlyingTokenPiechartColor: "#2775CA",
    name: "NORD Crypto Major Index",
    subname: "nCMI",
    underlyingTokenIcon: Coin,
    underlyingTokenName: "USDC",
    precision: 6,
    web3EquivalentPrecision: "picoether",
    priceApiName: "usd-coin",
    fundManagedBy: "TeraSurge Capital",
    contractDetails: {
      1: {
        id: 0,
        eipVersion: "1",
        underlyingTokenName: "USD Coin (PoS)",
        enableBiconomy: false,
        enableMaxCap: true,
        activeAssets: [
          assetData.wBTC,
          assetData.wETH,
          assetData.wMatic,
          assetData.AAVE,
          assetData.CRV,
          assetData.Uni,
        ],
        FundManagementFees: "0",
        PerformanceFees: "15",
        underlyingTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        underlyingTokenABI: maticUSDCErcABI,
        fundDivisionAddress: "0xD824fDFEdbE9b99F0B27e911Ad963Ec4544dF2Dc",
        fundDivisionABI: FundDivisionStrategyABI,
        controllerAddress: "0x07CBC8CA2159fA1B2B0a392dfCbb71Ac379CAE6D",
        controllerABI: ControllerABI,
        feeManagerAddress: "0x9b745efc08ee1bb132d64a607501e2a3af8cdd44",
        feeManagerABI: FeeManagerABI,
        vaultAddress: "0xA55D00D18E2f82B7588F1Ffb3597c3A958f7d545",
        vaultABI: vaultABI,
        pricesEndpoint:
          process.env.REACT_APP_NORD_API_ENDPOINT + "/ethereum/advisory/vault/",
        txHistoryEndpoint:
          process.env.REACT_APP_NORD_API_ENDPOINT +
          "/ethereum/advisory/vaults/transactions",
      },
    },
  },
];

const nftLoansData = {
  1: {
    nftLoanContractAddress: "0xD238Bf6567E37FF14848CF45ccFb560180461265",
    nftLoanContractABI: nftLoanABI,
    nft721ContractABI: erc721ABI,
    nft1155ContractABI: erc1155ABI,
    supportedErc20Tokens: [
      {
        name: "NORD Token",
        subname: "NORD",
        tokenAddress: "0x6e9730ecffbed43fd876a264c982e254ef05a0de",
        tokenABI: ercABI,
        precision: 18,
        web3EquivalentPrecision: "ether",
      },
      {
        name: "USD Coin",
        subname: "USDC",
        tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        tokenABI: ercABI,
        precision: 6,
        web3EquivalentPrecision: "picoether",
      },
      {
        name: "Tether USD",
        subname: "USDT",
        tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        tokenABI: ercABI,
        precision: 6,
        web3EquivalentPrecision: "picoether",
      },
      {
        name: "DAI Stablecoin",
        subname: "DAI",
        tokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        tokenABI: ercABI,
        precision: 18,
        web3EquivalentPrecision: "ether",
      },
    ],
  },
};

const nftLoanStates = {
  ACCEPTING_BIDS: "ACCEPTING_BIDS",
  LOAN_STARTED: "LOAN_STARTED",
  REPAYMENT_DONE: "REPAYMENT_DONE",
  NFT_SEIZED: "NFT_SEIZED",
  SEIZE_NFT: "SEIZE_NFT",
  DEREGISTERED: "DEREGISTERED",
};

const openSeaApiKey = process.env.REACT_APP_OPENSEA_API_KEY;

const gaMeasurementID = process.env.REACT_APP_GA_MEASUREMENT_ID;

const channelAddress = "0x72252a31fD67D2FACBE6D189F5861C5553474447";

const unitMapping = {
  0: "noether",
  1: "wei",
  3: "kwei",
  6: "mwei",
  9: "gwei",
  12: "microether",
  15: "milliether",
  18: "ether",
  21: "kether",
  24: "mether",
  27: "tether",
};

const infiniteAmtStr =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

const uint32ComplementOfZero = "4294967295";

export {
  networkData,
  assetData,
  tvlStatisticsEndPoint,
  openSeaEndPoint,
  coingeckoPriceEndPoint,
  apyEndPoints,
  tierAPYBoostDetails,
  channelAddress,
  vaultData,
  chainLinkPriceFeeds,
  percentages,
  timeBasedStakingAprToApy,
  stakingData,
  stakingNameSet,
  stakingSubnameSet,
  stakingDurationOptions,
  advisoryData,
  nordGovernanceTokenData,
  BalanceUpdateInterval,
  openSeaApiKey,
  nftLoansEndPoint,
  nftLoansData,
  nftLoanStates,
  gaMeasurementID,
  unitMapping,
  infiniteAmtStr,
  uint32ComplementOfZero,
};
