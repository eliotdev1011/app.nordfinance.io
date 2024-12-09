import React, { useState, useEffect } from "react";
import axios from "axios";
import { displayCommaBalance } from "../components/inputValidation";
import USD from "../assets/images/usd-coin.svg";
import NordSvg from "../assets/images/nord-illustration.svg";
import { NordSmallIcon, Wallet } from "../components/icon/icon";
import Loading from "../assets/images/loading.svg";
import HeaderBar from "../components/HeaderBar";
import LoadingOverlay from "react-loading-overlay";
import { tvlStatisticsEndPoint } from "../config/config.js";
import PropTypes from "prop-types";

export default function HomePage({ reactGa }) {
  const tvlProperties = ["staking", "savings", "advisory"];
  const nordProperties = [
    { property: "price", name: "Price" },
    { property: "marketCap", name: "Market Cap" },
    { property: "circulatingSupply", name: "Circulating Supply" },
  ];
  const [homepage, setHomepage] = useState({
    connected: false,
    totalTvl: "",
    savings: {},
    advisory: {},
    staking: {},
    price: "",
    marketCap: "",
    circulatingSupply: "",
    isLoading: false,
  });

  useEffect(() => {
    let response;
    async function fetchTvlData() {
      try {
        response = await axios.get(tvlStatisticsEndPoint);
        setHomepage((prevHomepage) => {
          return {
            ...prevHomepage,
            totalTvl: response.data.tvl.totalTvl,
            staking: response.data.tvl.staking,
            savings: response.data.tvl.savings,
            advisory: response.data.tvl.advisory,
            price: response.data.nordCurrentPrice,
            marketCap: response.data.marketCap,
            circulatingSupply: response.data.circulatingSupply,
            isLoading: false,
          };
        });
      } catch (error) {
        setHomepage((prevHomepage) => {
          return {
            ...prevHomepage,
            totalTvl: "0",
            staking: { ethereum: "0", polygon: "0", totalStaking: "0" },
            savings: { ethereum: "0", polygon: "0", totalSavings: "0" },
            advisory: { ethereum: "0", polygon: "0", totalAdvisory: "0" },
            price: "0",
            marketCap: "0",
            circulatingSupply: "0",
            isLoading: false,
          };
        });
        console.error("fetchTvlData: ", error);
      }
    }
    setHomepage((prevHomepage) => {
      return {
        ...prevHomepage,
        isLoading: true,
      };
    });
    fetchTvlData();

    return () => {};
  }, []);

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  return (
    <>
      <LoadingOverlay
        active={homepage.isLoading}
        spinner={
          <div align="center">
            <img src={Loading} alt="" />
          </div>
        }
      >
        <div className="lg:px-32 sm:px-6 py-10">
          <HeaderBar reactGa={reactGa} />
        </div>

        <div className="coninter mx-auto lg:px-32 sm:px-6 ">
          <div
            className={
              homepage.connected === false
                ? "lg:grid lg:grid-cols-2 sm:block"
                : "lg:grid lg:grid-cols-2 sm:block"
            }
          >
            <div className="landing-value-container">
              <h1 className="sm:text-4xl lg:text-5xl text-primary dark:text-primary leading-relaxed font-bold sm:text-center sm:mt-4 lg:text-left">
                {"$ " + displayCommaBalance(Number(homepage.totalTvl), 2)}
              </h1>
              <p className="dark:text-primary text-xl text-primary leading-relaxed mb-8 sm:text-center lg:text-left">
                Total value Locked
              </p>
              <div className="sm:text-center lg:text-left">
                <a href="/dashboard">
                  <button
                    className="py-3 px-10 cursor-pointer focus:outline-none btn-green active:outline-none font-semibold nf-header-btn"
                    onClick={() =>
                      reactGa.event({
                        category: "HomePage",
                        action: "EnterDapp",
                      })
                    }
                  >
                    Enter Dapp
                  </button>
                </a>
              </div>
              <div className={homepage.connected === false ? "hide-data" : ""}>
                {homepage.connected === false ? (
                  ""
                ) : (
                  <div className="card py-10 px-8 sm:mt-6 lg:mt-6">
                    <div className="flex justify-between items-center mb-4 ">
                      <div className="">
                        <p className="text-secondary dark:text-secondary">
                          Welcome Back!
                        </p>
                        <h2 className="lg:text-3xl sm:text-l text-primary dark:text-primary font-bold">
                          Johan Duan
                        </h2>
                      </div>
                      <div>
                        <p className="lg:text-3xl sm:text-l text-green dark:text-green font-bold sm:text-right">
                          1231.45
                        </p>
                        <p className="text-secondary dark:text-secondary flex items-center gap-2  sm:text-right ">
                          <Wallet /> Wallet Balance
                        </p>
                      </div>
                    </div>
                    <hr></hr>
                    <div className="my-6 flex  justify-between">
                      <div>
                        <p className="text-primary dark:text-primary leading-relaxed font-bold text-xl">
                          0.99M
                        </p>
                        <p className="flex gap-2 text-sm text-secondary dark:text-secondary">
                          <img src={USD} alt="" className="h-5" /> USDC
                        </p>
                      </div>
                      <div>
                        <p className="text-primary dark:text-primary leading-relaxed font-bold text-xl">
                          1.1M
                        </p>
                        <p className="flex gap-2 text-sm text-secondary dark:text-secondary">
                          <img src={USD} alt="" className="h-5" /> USDC
                        </p>
                      </div>
                      <div>
                        <p className="text-primary dark:text-primary leading-relaxed font-bold text-xl">
                          0.92M
                        </p>
                        <p className="flex gap-2 text-sm text-secondary dark:text-secondary">
                          <img src={USD} alt="" className="h-5" /> USDC
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div
              className={
                homepage.connected === false ? "sm:my-2" : "lg:mx-2 sm:my-2"
              }
            >
              <img src={NordSvg} alt="nord" className="landing-illustration" />
            </div>
          </div>

          <div className="lg:my-12 sm:my-4">
            <div className="lg:grid lg:grid-cols-3 sm:block gap-4 ">
              {tvlProperties.map((property) => {
                return (
                  <div
                    key={property}
                    className="card lg:py-10 lg:px-8 sm:mb-4 lg:mb-0 sm:py-6 sm:px-4"
                  >
                    <h3 className="flex gap-2 text-3xl leading-relaxed font-bold sm:text-xl lg:justify-start sm:justify-center">
                      {property === "staking" ? (
                        <span className="py-1">
                          <NordSmallIcon />
                        </span>
                      ) : (
                        "$ "
                      )}
                      {displayCommaBalance(
                        Number(
                          homepage[property][
                            `total${capitalizeFirstLetter(property)}`
                          ]
                        ),
                        2
                      )}
                    </h3>
                    <p className="text-secondary dark:text-secondary font-semibold lg:text-left sm:text-center">
                      Total {capitalizeFirstLetter(property)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:my-12 sm:my-4">
            <div className="lg:grid lg:grid-cols-3 sm:block gap-4 ">
              {nordProperties.map(({ property, name }) => {
                return (
                  <div
                    key={property}
                    className="card lg:py-10 lg:px-8 sm:mb-4 lg:mb-0 sm:py-6 sm:px-4"
                  >
                    <h3 className="flex gap-2 text-3xl leading-relaxed font-bold sm:text-xl lg:justify-start sm:justify-center">
                      {property === "circulatingSupply" ? (
                        <span className="py-1">
                          <NordSmallIcon />
                        </span>
                      ) : (
                        "$ "
                      )}
                      {displayCommaBalance(Number(homepage[property]), 2)}
                    </h3>
                    <p className="text-secondary dark:text-secondary font-semibold lg:text-left sm:text-center">
                      {name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </LoadingOverlay>
    </>
  );
}

HomePage.propTypes = {
  reactGa: PropTypes.object.isRequired,
};
