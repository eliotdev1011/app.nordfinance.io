import React, { useState, useEffect, useReducer } from "react";
import NftCard from "../../../components/NftCard/NftCard";
import NftLoanCard from "../../../components/NftCard/NftLoanCard";
import NftDetail from "../NftDetail/NftDetail.js";
import NftBidDetail from "../NftDetail/NftBidDetail.js";
import NftLoanDetail from "../NftDetail/NftLoanDetail.js";
import "./NftMarketPlace.css";
import { NFT_MARKETPLACE_STATE } from "../../../redux/actions/index.action.js";
import fetchMarketPlaceRequest from "../../../redux/thunks/fetchMarketPlaceRequest.thunk.js";
import fetchUserNftRequest from "../../../redux/thunks/fetchUserNftRequest.thunk.js";
import fetchUserBidsRequest from "../../../redux/thunks/fetchUserBidsRequest.thunk.js";
import fetchBorrowerLoansRequest from "../../../redux/thunks/fetchBorrowerLoansRequest.thunk.js";
import { useDispatch, useSelector, connect } from "react-redux";
import setUserNfts from "../../../components/functions/setUserNfts";
import setMarketNfts from "../../../components/functions/setMarketNfts";
import getLenderLoans from "../../../components/functions/getLenderLoans";
import getLenderBids from "../../../components/functions/getLenderBids";
import tabReducer from "../../../components/functions/tabReducer";
import paginationReducer from "../../../components/functions/paginationReducer";
import getNetworkSubname from "../../../components/functions/getNetworkSubname";
import sendGaEvent from "../../../components/functions/sendGaEvent";
import { nftLoanStates, unitMapping } from "../../../config/config";
import moment from "moment";
import ReactPaginate from "react-paginate";
import PropTypes from "prop-types";
import numbro from "numbro";
import { EmptyNftIcon } from "../../../components/icon/icon";
import dummyNftImg from "../../../assets/images/placeholder-nft.png";

function NftMarketPlace({
  web3,
  currentNetworkID,
  accounts,
  showErrorMessage,
  showSuccessMessage,
  setShowComponent,
  isLoading,
  setIsLoading,
  setOverlayText,
  retriggerFlag,
  invertRetriggerFlag,
  reactGa,
}) {
  const passedState = useSelector((state) => state.nftMarketplaceState);

  const marketNft = useSelector((state) => state.fetchMarketPlaceReducer);

  const userNft = useSelector((state) => state.fetchUserNftReducer);

  const userBids = useSelector((state) => state.fetchUserBidsReducer);

  const borrowerLoans = useSelector((state) => state.fetchBorrowerLoansReducer);

  const [userNftsWithTypes, setUserNftsWithTypes] = useState([]);

  const [marketNftsWithTypes, setMarketNftsWithTypes] = useState([]);

  const [marketState, setMarketState] = useState(
    passedState === "borrow" ? "nfts" : "market"
  );

  const [detailComponent, setDetailComponent] = useState({
    component: 0,
    nftIndex: 0,
  });

  const [{ bCollaterals, bStartedLoans, lBids, lLoans }, tabDispatch] =
    useReducer(tabReducer, {
      bCollaterals: [],
      bStartedLoans: [],
      lBids: [],
      lLoans: [],
    });

  const itemsPerPage =
    marketState === "borrowloan" || marketState === "lendloan" ? 4 : 8;
  const [{ items, currentItems, pageCount, itemOffset }, paginationDispatch] =
    useReducer(paginationReducer, {
      items: [],
      currentItems: [],
      pageCount: 0,
      itemOffset: 0,
    });

  const network = getNetworkSubname(currentNetworkID);

  const dispatch = useDispatch();

  function handlePageClick(event, items) {
    const newOffset = (event.selected * itemsPerPage) % items.length;
    paginationDispatch({ type: "itemOffset", value: newOffset });
  }

  useEffect(() => {
    switch (marketState) {
      case "market":
        setIsLoading(() => true);
        dispatch(
          fetchUserBidsRequest(
            network,
            web3.utils.toChecksumAddress(accounts[0])
          )
        );
        dispatch(fetchMarketPlaceRequest(network));
        break;
      case "nfts":
        setIsLoading(() => true);
        dispatch(
          fetchUserNftRequest(
            web3.utils.toChecksumAddress(accounts[0]),
            network
          )
        );
        break;
      case "bids":
      case "lendloan":
        setIsLoading(() => true);
        dispatch(
          fetchUserBidsRequest(
            network,
            web3.utils.toChecksumAddress(accounts[0])
          )
        );
        break;
      case "collaterals":
      case "borrowloan":
        setIsLoading(() => true);
        dispatch(
          fetchBorrowerLoansRequest(
            network,
            web3.utils.toChecksumAddress(accounts[0])
          )
        );
        break;
      default:
        break;
    }
  }, [marketState, retriggerFlag]);

  useEffect(() => {
    if (marketNft.success && marketState === "market" && userBids.success) {
      setMarketNfts(
        marketNft?.marketNft,
        accounts,
        network,
        setMarketNftsWithTypes,
        userBids.userBids
      );
    }
    if (marketNft.length === 0) {
      setIsLoading(false);
    }
  }, [marketNft, userBids]);

  useEffect(() => {
    if (userNft?.userNft.length) {
      setUserNfts([...userNft.userNft], setUserNftsWithTypes, web3);
    } else {
      setIsLoading(false);
    }
  }, [userNft]);

  useEffect(() => {
    if (borrowerLoans?.success) {
      switch (marketState) {
        case "collaterals":
          {
            // filter out NFTs which are in ACCEPTING_BIDS state
            const borrowerCollaterals = [];

            borrowerLoans?.borrowerLoans?.forEach((asset) => {
              if (asset.currentState === nftLoanStates.ACCEPTING_BIDS) {
                const [nftID, nftContractAddress] = asset.nftKey.split("0x");
                borrowerCollaterals.push({
                  ...asset,
                  nftID,
                  nftContractAddress: `0x${nftContractAddress}`,
                });
              }
            });

            tabDispatch({ type: "collaterals", value: borrowerCollaterals });
          }
          break;
        case "borrowloan":
          {
            const borrowerStartedLoans = [];
            borrowerLoans?.borrowerLoans?.forEach((loan) => {
              const [nftID, nftContractAddress] = loan.nftKey.split("0x");
              if (
                loan.currentState !== nftLoanStates.ACCEPTING_BIDS &&
                loan.currentState !== nftLoanStates.DEREGISTERED
              ) {
                borrowerStartedLoans.push({
                  ...loan,
                  nftID,
                  nftContractAddress: `0x${nftContractAddress}`,
                });
              }
            });
            tabDispatch({ type: "borrowloan", value: borrowerStartedLoans });
          }
          break;
        default:
          break;
      }
    }
  }, [borrowerLoans]);

  useEffect(() => {
    if (userBids?.success) {
      switch (marketState) {
        case "bids":
          {
            const lenderBids = getLenderBids(userBids?.userBids);
            tabDispatch({ type: "bids", value: lenderBids });
          }
          break;
        case "lendloan":
          {
            const lenderLoans = getLenderLoans(userBids?.userBids);
            tabDispatch({ type: "lendloan", value: lenderLoans });
          }
          break;
        default:
          break;
      }
    }
  }, [userBids]);

  useEffect(() => {
    switch (marketState) {
      case "nfts":
        paginationDispatch({ type: "items", value: userNftsWithTypes });
        break;
      case "collaterals":
        paginationDispatch({ type: "items", value: bCollaterals });
        break;
      case "borrowloan":
        paginationDispatch({ type: "items", value: bStartedLoans });
        break;
      case "market":
        paginationDispatch({ type: "items", value: [...marketNftsWithTypes] });
        break;
      case "bids":
        paginationDispatch({ type: "items", value: lBids });
        break;
      case "lendloan":
        paginationDispatch({ type: "items", value: lLoans });
        break;
      default:
        break;
    }
  }, [
    itemOffset,
    userNftsWithTypes,
    bCollaterals,
    bStartedLoans,
    marketNftsWithTypes,
    lBids,
    lLoans,
  ]);

  useEffect(() => {
    const endOffset = itemOffset + itemsPerPage;
    paginationDispatch({
      type: "currentItems",
      value: items.slice(itemOffset, endOffset),
    });
    paginationDispatch({
      type: "pageCount",
      value: Math.ceil(items.length / itemsPerPage),
    });

    if (isLoading) {
      setIsLoading(() => false);
    }
  }, [itemOffset, items]);

  return (
    <>
      <div className="container mx-auto">
        <div className="px-3 py-5 md:p-7">
          <div className="flex flex-col-reverse gap-3 md:flex-row justify-between">
            {passedState === "lend" ? (
              <div className="flex gap-7 justify-center my-auto">
                <div className="">
                  <h4
                    className={
                      marketState === "market"
                        ? "nft-market-state-active text-base md:text-xl font-bold cursor-pointer"
                        : "text-base md:text-xl text-primary dark:text-primary font-bold cursor-pointer"
                    }
                    onClick={() => {
                      paginationDispatch({ type: "resetPagination" });
                      setDetailComponent(() => {
                        return { component: 0, nftIndex: 0 };
                      });
                      setMarketState(() => "market");
                      sendGaEvent(reactGa, "LendNFT", "GotoMarketplace");
                    }}
                  >
                    Marketplace
                  </h4>
                </div>
                <div className="">
                  <h4
                    className={
                      marketState === "bids"
                        ? "nft-market-state-active text-base md:text-xl font-bold cursor-pointer"
                        : "text-base md:text-xl text-primary dark:text-primary font-bold cursor-pointer"
                    }
                    onClick={() => {
                      paginationDispatch({ type: "resetPagination" });
                      setDetailComponent(() => {
                        return { component: 0, nftIndex: 0 };
                      });
                      setMarketState(() => "bids");
                      sendGaEvent(reactGa, "LendNFT", "GotoMyBids");
                    }}
                  >
                    My Bids
                  </h4>
                </div>
                <div className="">
                  <h4
                    className={
                      marketState === "lendloan"
                        ? "nft-market-state-active text-base md:text-xl font-bold cursor-pointer"
                        : "text-base md:text-xl text-primary dark:text-primary font-bold cursor-pointer"
                    }
                    onClick={() => {
                      paginationDispatch({ type: "resetPagination" });
                      setDetailComponent(() => {
                        return { component: 0, nftIndex: 0 };
                      });
                      setMarketState(() => "lendloan");
                      sendGaEvent(reactGa, "LendNFT", "GotoMyLoans");
                    }}
                  >
                    My Loans
                  </h4>
                </div>
              </div>
            ) : (
              <div className="flex gap-7 justify-center my-auto">
                <h4
                  className={
                    marketState === "nfts"
                      ? "nft-market-state-active text-xl font-bold cursor-pointer"
                      : "text-xl text-primary dark:text-primary font-bold cursor-pointer"
                  }
                  onClick={() => {
                    paginationDispatch({ type: "resetPagination" });
                    setDetailComponent(() => {
                      return { component: 0, nftIndex: 0 };
                    });
                    setMarketState(() => "nfts");
                    sendGaEvent(reactGa, "BorrowNFT", "GotoMyNFTs");
                  }}
                >
                  My NFTs
                </h4>
                <h4
                  className={
                    marketState === "collaterals"
                      ? "nft-market-state-active text-xl font-bold cursor-pointer"
                      : "text-xl text-primary dark:text-primary font-bold cursor-pointer"
                  }
                  onClick={() => {
                    paginationDispatch({ type: "resetPagination" });
                    setDetailComponent(() => {
                      return { component: 0, nftIndex: 0 };
                    });
                    setMarketState(() => "collaterals");
                    sendGaEvent(reactGa, "BorrowNFT", "GotoMyCollaterals");
                  }}
                >
                  My collaterals
                </h4>
                <h4
                  className={
                    marketState === "borrowloan"
                      ? "nft-market-state-active text-xl font-bold cursor-pointer"
                      : "text-xl text-primary dark:text-primary font-bold cursor-pointer"
                  }
                  onClick={() => {
                    paginationDispatch({ type: "resetPagination" });
                    setDetailComponent(() => {
                      return { component: 0, nftIndex: 0 };
                    });
                    setMarketState(() => "borrowloan");
                    sendGaEvent(reactGa, "BorrowNFT", "GotoMyLoans");
                  }}
                >
                  My Loans
                </h4>
              </div>
            )}
            <div className="flex gap-5 justify-center">
              <div className="">
                <h4
                  className={
                    passedState === "lend"
                      ? "nft-lend-active text-xl py-2 px-5 font-bold cursor-pointer"
                      : "text-xl py-2 px-5 text-primary dark:text-primary cursor-pointer border border-transparent"
                  }
                  onClick={() => {
                    dispatch({ type: NFT_MARKETPLACE_STATE, payload: "lend" });

                    paginationDispatch({ type: "resetPagination" });
                    setDetailComponent(() => {
                      return { component: 0, nftIndex: 0 };
                    });
                    setMarketState(() => "market");
                    sendGaEvent(reactGa, "NFTLoans", "GotoLend");
                  }}
                >
                  Lend
                </h4>
              </div>
              <div className="">
                <h4
                  className={
                    passedState === "borrow"
                      ? "nft-lend-active text-xl py-2 px-5 font-bold cursor-pointer"
                      : "text-xl py-2 px-5 text-primary dark:text-primary font-bold cursor-pointer border border-transparent"
                  }
                  onClick={() => {
                    dispatch({
                      type: NFT_MARKETPLACE_STATE,
                      payload: "borrow",
                    });
                    paginationDispatch({ type: "resetPagination" });
                    setDetailComponent(() => {
                      return { component: 0, nftIndex: 0 };
                    });
                    setMarketState(() => "nfts");
                    sendGaEvent(reactGa, "NFTLoans", "GotoBorrow");
                  }}
                >
                  Borrow
                </h4>
              </div>
            </div>
          </div>
          {detailComponent.component === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
              {marketState === "market" ? (
                currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <NftCard
                      nftName={item.asset?.asset?.name || "Anonymous Owner"}
                      traitCount={item.asset?.asset?.traits?.length}
                      image={item.asset?.asset?.imageURL || dummyNftImg}
                      nftDate={moment(item.loanAddedDate).format("DD/MMM/YYYY")}
                      price={item.price || "0"}
                      nftType={item.nftType}
                      nftIndex={index}
                      key={index}
                      loanName={item?.loanName}
                      setDetailComponent={setDetailComponent}
                      web3={web3}
                      currentNetworkID={currentNetworkID}
                      paymentToken={item.paymentToken || "USD"}
                      animationURL={item?.asset?.asset?.animationURL}
                      reactGa={reactGa}
                    />
                  ))
                ) : (
                  <>
                    <div className="grid col-span-1 md:col-span-2 lg:col-span-4 mx-auto mt-10 justify-items-center">
                      <EmptyNftIcon />
                      <h4 className="text-xl text-primary font-bold">
                        Oops! No NFTs found in the Marketplace{" "}
                      </h4>
                    </div>
                  </>
                )
              ) : marketState === "bids" ? (
                currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <NftCard
                      nftName={item.asset?.asset?.name || "Anonymous Owner"}
                      nftDate={moment(item.offerDate).format("DD/MMM/YYYY")}
                      image={item.asset.asset?.imageURL || dummyNftImg}
                      traitCount={item.asset?.asset?.traits?.length}
                      price={"NA"}
                      nftType={item.nftType}
                      nftIndex={index}
                      key={item._id}
                      loanName={item?.loans?.loanName}
                      setDetailComponent={setDetailComponent}
                      web3={web3}
                      currentNetworkID={currentNetworkID}
                      animationURL={item?.asset?.asset?.animationURL}
                      reactGa={reactGa}
                    />
                  ))
                ) : (
                  <>
                    <div className="grid col-span-1 md:col-span-2 lg:col-span-4 mx-auto mt-10 justify-items-center">
                      <EmptyNftIcon />
                      <h4 className="text-xl text-primary font-bold">
                        Oops! No Bids found{" "}
                      </h4>
                    </div>
                  </>
                )
              ) : marketState === "nfts" ? (
                currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <NftCard
                      nftName={item.nftName || "Anonymous Owner"}
                      traitCount={item?.traits?.length}
                      image={item.imageURL || dummyNftImg}
                      nftDate={moment(item.nftDate).format("DD/MMM/YYYY")}
                      price={item.price}
                      nftType={item.nftType}
                      nonCollateralTokenBalance={
                        item?.nonCollateralTokenBalance || undefined
                      }
                      nftIndex={index}
                      key={index}
                      loanName={item?.loanName}
                      setDetailComponent={setDetailComponent}
                      web3={web3}
                      currentNetworkID={currentNetworkID}
                      paymentToken={item?.paymentToken || "USD"}
                      animationURL={item?.animationURL}
                      reactGa={reactGa}
                    />
                  ))
                ) : (
                  <>
                    <div className="grid col-span-1 md:col-span-2 lg:col-span-4 mx-auto mt-10 justify-items-center">
                      <EmptyNftIcon />
                      <h4 className="text-xl text-primary font-bold">
                        Oops! No supported NFTs found{" "}
                      </h4>
                    </div>
                  </>
                )
              ) : marketState === "lendloan" ? (
                currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <NftLoanCard
                      key={item?.loan_id}
                      nftID={item?.nftID}
                      nftContractAddress={item?.nftContractAddress}
                      image={item?.asset?.asset?.imageURL || dummyNftImg}
                      nftName={item?.asset?.asset?.name || "Anonymous Owner"}
                      nftDate={moment(item?.loans?.loanStartDate).format(
                        "DD/MMM/YYYY"
                      )}
                      traitCount={item?.asset?.asset?.traits?.length}
                      nftType="lend"
                      nftState={item?.loanState}
                      setDetailComponent={setDetailComponent}
                      currentNetworkID={currentNetworkID}
                      accounts={accounts}
                      web3={web3}
                      setIsLoading={setIsLoading}
                      loanID={item?.loan_id}
                      loanContractID={item?.loans?.loanContractID}
                      maxRepaymentAmount={item?.bidDetails?.maxRepaymentAmount}
                      loanDuration={item?.bidDetails?.loanDuration}
                      loanInterestRate={item?.bidDetails?.loanInterestRate.toString()}
                      loanERC20={item?.bidDetails?.loanERC20}
                      interestIsProRated={item?.bidDetails?.interestIsProRated?.toString()}
                      setOverlayText={setOverlayText}
                      showSuccessMessage={showSuccessMessage}
                      showErrorMessage={showErrorMessage}
                      loanStartDate={item?.loans?.loanStartDate}
                      invertRetriggerFlag={invertRetriggerFlag}
                      txHashes={item?.loans?.txhashes}
                      reactGa={reactGa}
                    />
                  ))
                ) : (
                  <>
                    <div className="grid col-span-1 md:col-span-2 lg:col-span-4 mx-auto mt-10 justify-items-center">
                      <EmptyNftIcon />
                      <h4 className="text-xl text-primary font-bold">
                        Oops! No Loans by you{" "}
                      </h4>
                    </div>
                  </>
                )
              ) : marketState === "collaterals" ? (
                currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <NftCard
                      nftName={item?.asset?.asset?.name || "Anonymous Owner"}
                      traitCount={item?.asset?.asset?.traits?.length}
                      image={item?.asset?.asset?.imageURL || dummyNftImg}
                      nftDate={moment(item?.loanAddedDate).format(
                        "DD/MMM/YYYY"
                      )}
                      price={"NA"}
                      nftType="checkBids"
                      nftIndex={index}
                      key={item?.loan_id}
                      loanName={item?.loanName}
                      setDetailComponent={setDetailComponent}
                      web3={web3}
                      currentNetworkID={currentNetworkID}
                      animationURL={item?.asset?.asset?.animationURL}
                      reactGa={reactGa}
                    />
                  ))
                ) : (
                  <div className="grid col-span-1 md:col-span-2 lg:col-span-4 mx-auto mt-10 justify-items-center">
                    <EmptyNftIcon />
                    <h4 className="text-xl text-primary font-bold">
                      Oops! No collateralised NFTs found{" "}
                    </h4>
                  </div>
                )
              ) : marketState === "borrowloan" ? (
                currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <NftLoanCard
                      key={item?.loan_id}
                      nftID={item?.nftID}
                      nftContractAddress={item?.nftContractAddress}
                      image={item?.asset?.asset?.imageURL || dummyNftImg}
                      nftName={item?.asset?.asset?.name || "Anonymous Owner"}
                      nftDate={moment(item?.loanAddedDate).format(
                        "DD/MMM/YYYY"
                      )}
                      traitCount={item?.asset?.asset?.traits?.length}
                      nftType="borrow"
                      nftState={item?.currentState}
                      setDetailComponent={setDetailComponent}
                      currentNetworkID={currentNetworkID}
                      accounts={accounts}
                      web3={web3}
                      nftIndex={index}
                      loanID={item?.loan_id}
                      loanContractID={item?.loanContractID}
                      maxRepaymentAmount={
                        item?.selectedBid?.bidDetails?.maxRepaymentAmount
                      }
                      loanDuration={item?.selectedBid?.bidDetails?.loanDuration}
                      loanInterestRate={
                        item?.selectedBid?.bidDetails?.loanInterestRate
                      }
                      loanERC20={item?.selectedBid?.bidDetails?.loanERC20}
                      interestIsProRated={item?.selectedBid?.bidDetails?.interestIsProRated?.toString()}
                      loanStartDate={item?.loanStartDate}
                      invertRetriggerFlag={invertRetriggerFlag}
                      txHashes={item?.txhashes}
                      reactGa={reactGa}
                    />
                  ))
                ) : (
                  <>
                    <div className="grid col-span-1 md:col-span-2 lg:col-span-4 mx-auto mt-10 justify-items-center">
                      <EmptyNftIcon />
                      <h4 className="text-xl text-primary font-bold">
                        Oops! No Loans started on collateralized NFTs{" "}
                      </h4>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div className="grid col-span-1 md:col-span-2 lg:col-span-4 mx-auto mt-10 justify-items-center">
                    <EmptyNftIcon />
                    <h4 className="text-xl text-primary font-bold">
                      Oops! NFTs Not Found
                    </h4>
                  </div>
                </>
              )}
            </div>
          ) : detailComponent.component === 1 ? (
            <NftDetail
              web3={web3}
              accounts={accounts}
              nftID={currentItems[detailComponent.nftIndex]?.asset?.nftId}
              nftContractAddress={
                currentItems[detailComponent.nftIndex]?.asset
                  ?.nftContractAddress
              }
              loanID={currentItems[detailComponent.nftIndex]?.loan_id}
              assetID={currentItems[detailComponent.nftIndex]?.asset_id}
              nftType={currentItems[detailComponent.nftIndex]?.nftType}
              nftName={
                currentItems[detailComponent?.nftIndex]?.asset?.asset?.name ||
                "Anonymous Owner"
              }
              nftDate={currentItems[detailComponent?.nftIndex]?.loanAddedDate}
              traits={
                currentItems[detailComponent?.nftIndex]?.asset?.asset?.traits
              }
              collectionName={
                currentItems[detailComponent.nftIndex]?.asset?.asset?.collection
              }
              image={
                currentItems[detailComponent?.nftIndex]?.asset.asset
                  ?.imageURL || dummyNftImg
              }
              setDetailComponent={setDetailComponent}
              setShowComponent={setShowComponent}
              currentNetworkID={currentNetworkID}
              setIsLoading={setIsLoading}
              setOverlayText={setOverlayText}
              showSuccessMessage={showSuccessMessage}
              showErrorMessage={showErrorMessage}
              invertRetriggerFlag={invertRetriggerFlag}
              animationURL={
                currentItems[detailComponent.nftIndex]?.asset?.asset
                  ?.animationURL
              }
              reactGa={reactGa}
            />
          ) : detailComponent.component === 2 ? (
            <NftBidDetail
              nftID={currentItems[detailComponent.nftIndex]?.nftID}
              contractAddress={
                currentItems[detailComponent?.nftIndex]?.nftContractAddress
              }
              loanID={
                marketState === "collaterals"
                  ? currentItems[detailComponent.nftIndex]?.loan_id
                  : currentItems[detailComponent.nftIndex]?.loanID
              }
              isFungible={
                currentItems[detailComponent.nftIndex]?.isFungible === undefined
                  ? currentItems[
                      detailComponent.nftIndex
                    ]?.asset?.asset?.isFungible?.toString()
                  : currentItems[
                      detailComponent.nftIndex
                    ]?.isFungible?.toString()
              }
              setDetailComponent={setDetailComponent}
              currentNetworkID={currentNetworkID}
              accounts={accounts}
              web3={web3}
              setIsLoading={setIsLoading}
              setOverlayText={setOverlayText}
              showSuccessMessage={showSuccessMessage}
              showErrorMessage={showErrorMessage}
              invertRetriggerFlag={invertRetriggerFlag}
              setMarketState={setMarketState}
              price={
                currentItems[detailComponent.nftIndex]?.rawPrice
                  ? numbro(
                      web3.utils
                        .fromWei(
                          currentItems[detailComponent.nftIndex]?.rawPrice,
                          unitMapping[
                            currentItems[detailComponent.nftIndex]
                              ?.priceDecimals
                          ]
                        )
                        .toString()
                    ).format({ mantissa: 4 })
                  : "0"
              }
              paymentToken={
                currentItems[detailComponent?.nftIndex]?.paymentToken || "USD"
              }
              paginationDispatch={paginationDispatch}
              reactGa={reactGa}
            />
          ) : detailComponent.component === 3 ? (
            <NftLoanDetail
              setShowComponent={setShowComponent}
              setDetailComponent={setDetailComponent}
              currentNetworkID={currentNetworkID}
              nftID={currentItems?.[detailComponent?.nftIndex]?.nftID}
              nftContractAddress={
                currentItems?.[detailComponent?.nftIndex]?.nftContractAddress
              }
              accounts={accounts}
              web3={web3}
              maxRepaymentAmount={
                currentItems?.[detailComponent?.nftIndex]?.selectedBid
                  ?.bidDetails?.maxRepaymentAmount
              }
              loanPrincipalAmount={
                currentItems?.[detailComponent?.nftIndex]?.selectedBid
                  ?.bidDetails?.loanPrincipalAmount
              }
              loanDuration={
                currentItems?.[detailComponent?.nftIndex]?.selectedBid
                  ?.bidDetails?.loanDuration
              }
              loanInterestRate={currentItems?.[
                detailComponent?.nftIndex
              ]?.selectedBid?.bidDetails?.loanInterestRate.toString()}
              loanERC20={
                currentItems?.[detailComponent?.nftIndex]?.selectedBid
                  ?.bidDetails?.loanERC20
              }
              interestIsProRated={currentItems?.[
                detailComponent?.nftIndex
              ]?.selectedBid?.bidDetails?.interestIsProRated.toString()}
              loanAddedDate={
                currentItems?.[detailComponent?.nftIndex]?.loanAddedDate
              }
              loanID={currentItems?.[detailComponent?.nftIndex]?.loan_id}
              loanContractID={
                currentItems?.[detailComponent?.nftIndex]?.loanContractID
              }
              setIsLoading={setIsLoading}
              nftName={
                currentItems?.[detailComponent?.nftIndex]?.asset?.asset?.name ||
                "Anonymous Owner"
              }
              image={
                currentItems?.[detailComponent?.nftIndex]?.asset.asset
                  ?.imageURL || dummyNftImg
              }
              traits={
                currentItems?.[detailComponent?.nftIndex]?.asset.asset?.traits
              }
              collectionName={
                currentItems?.[detailComponent?.nftIndex]?.asset.asset
                  ?.collection
              }
              setOverlayText={setOverlayText}
              showSuccessMessage={showSuccessMessage}
              showErrorMessage={showErrorMessage}
              loanStartDate={
                currentItems?.[detailComponent?.nftIndex]?.loanStartDate
              }
              invertRetriggerFlag={invertRetriggerFlag}
              animationURL={
                currentItems?.[detailComponent?.nftIndex]?.asset?.animationURL
              }
              reactGa={reactGa}
            />
          ) : (
            <></>
          )}
          {detailComponent.component === 0 ? (
            pageCount > 1 ? (
              <nav>
                <ReactPaginate
                  className="flex text-xl text-primary my-5"
                  breakLabel="..."
                  breakClassName="pagination-container px-3 py-2"
                  nextLabel="Next"
                  nextClassName="rounded-r-full pagination-button px-7 py-2"
                  onPageChange={(event) => handlePageClick(event, items)}
                  pageRangeDisplayed={1}
                  pageCount={pageCount}
                  previousLabel="Previous"
                  previousClassName="rounded-l-full pagination-button px-7 py-2"
                  renderOnZeroPageCount={null}
                  containerClassName="pagination-container"
                  pageClassName="pagination-container px-3 py-2"
                  activeClassName="active-page"
                />
              </nav>
            ) : (
              <></>
            )
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  );
}

NftMarketPlace.propTypes = {
  web3: PropTypes.object.isRequired,
  accounts: PropTypes.array.isRequired,
  currentNetworkID: PropTypes.number.isRequired,
  showErrorMessage: PropTypes.func.isRequired,
  showSuccessMessage: PropTypes.func.isRequired,
  setShowComponent: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  setOverlayText: PropTypes.func.isRequired,
  retriggerFlag: PropTypes.bool.isRequired,
  invertRetriggerFlag: PropTypes.func.isRequired,
  reactGa: PropTypes.object.isRequired,
};

export default connect()(NftMarketPlace);
