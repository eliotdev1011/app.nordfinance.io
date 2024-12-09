import React, { Component } from "react";
import Modal from "react-modal";
import Numbro from "numbro";
import Info from "../assets/images/info.svg";
import PropTypes from "prop-types";
import FixedDurationStakingTerms from "./FixedDurationStakingTerms";
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
    borderRadius: "10px",
    overflow: "none",
    color: "var(--color-text-primary)",
  },
};

class ConfirmModal extends Component {
  displayAmount = (amt) => {
    return Numbro(Math.trunc(Number(amt) * 10000) / 10000).format({
      thousandSeparated: true,
      trimMantissa: true,
      mantissa: 6,
      spaceSeparated: false,
    });
  };

  render() {
    return (
      <>
        <Modal
          isOpen={this.props.isConfirmPopupOpen}
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEsc={false}
          style={customStyles}
          contentLabel="Example Modal"
          appElement={document.getElementById("root") || undefined}
        >
          <div className="">
            <div className="flex mb-6">
              <p className="text-2xl">
                {"Confirm " + this.props.confirmPopupType + " Amount"}
              </p>
            </div>
            <hr></hr>
            <div className="flex py-4 justify-between gap-4">
              <p className="text-sm text-color pr-80 ">
                {this.props.secondLine[0]}
              </p>
              <p className="font-bold text-sm-right">
                {this.props.secondLine[1]}
              </p>
            </div>
            <hr></hr>
            <div>
              <div className="flex py-4 justify-between gap-4">
                <p className="text-sm text-color text-left ">
                  {this.props.confirmPopupType + " Amount"}
                </p>
                <p
                  className="font-bold text-sm-right text-right "
                  title={this.props.amount + " " + this.props.selectedToken}
                >
                  {this.displayAmount(this.props.amount) +
                    " " +
                    this.props.selectedToken}
                </p>
              </div>
              {this.props.secondLine[1] === "NORD (NXT)" ? (
                <>
                  <hr></hr>
                  <div className="flex py-4 justify-between gap-4">
                    <p className="text-sm text-color text-left ">
                      {this.props.confirmPopupType + " Duration"}
                    </p>
                    <p className="font-bold text-sm-right text-right ">
                      {`${this.props.duration} months`}
                    </p>
                  </div>
                  {this.props.confirmPopupType === "Stake" && (
                    <FixedDurationStakingTerms
                      unstakeDate={this.props.unstakeDate}
                      fixedStakingDuration={this.props.fixedStakingDuration}
                    />
                  )}
                </>
              ) : (
                <></>
              )}
              <hr></hr>
              <div
                className={
                  "flex py-4 justify-between gap-4 " +
                  (this.props.confirmPopupType === "Deposit" &&
                  this.props.secondLine[0] === "Vault"
                    ? ""
                    : "hide-data")
                }
              >
                <p className="text-sm text-color pr-80 ">
                  <a
                    href="https://docs.nordfinance.io/nord-savings-v1/nord.savings-faqs#is-there-any-fee-to-deposit-and-withdraw-stablecoins"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="secondary-color underline"
                  >
                    Protocol Fee
                  </a>{" "}
                  (0.5%)
                </p>
                <p
                  className="font-bold text-sm-right"
                  title={
                    0.005 * this.props.amount + " " + this.props.selectedToken
                  }
                >
                  {this.displayAmount(0.005 * this.props.amount) +
                    " " +
                    this.props.selectedToken}
                </p>
              </div>
              <hr></hr>
              <div
                className={
                  "flex py-4 justify-between gap-4 " +
                  (this.props.confirmPopupType === "Deposit" &&
                  this.props.secondLine[0] === "Fund"
                    ? ""
                    : "hide-data")
                }
              >
                <p className="text-sm text-color pr-80 ">Fees</p>
              </div>
              <div
                className={
                  "fees-card mb-6" +
                  (this.props.confirmPopupType === "Deposit" &&
                  this.props.secondLine[0] === "Fund"
                    ? ""
                    : " hide-data")
                }
              >
                <div className="grid lg:px-4 sm:px-0 gap-4">
                  <div className="flex justify-between gap-4">
                    <p>
                      Fund Management Fee
                      <div className="tooltip">
                        <img
                          src={Info}
                          alt=""
                          className="mb-1 ml-1 h-4 w-4 cursor-pointer"
                        />
                        <span className="tooltiptext">
                          Fund Management fee is collected on withdrawal
                        </span>
                      </div>
                    </p>
                    <p>{this.props.fundManagementFees}%</p>
                  </div>
                  <div className="flex justify-between gap-4">
                    <p>
                      Performance Fee
                      <div className="tooltip">
                        <img
                          src={Info}
                          alt=""
                          className="mb-1 ml-1 h-4 w-4 cursor-pointer"
                        />
                        <span className="tooltiptext">
                          Performance fee is calculated on your earnings and
                          collected monthly
                        </span>
                      </div>
                    </p>
                    <p>{this.props.performanceFees}%</p>
                  </div>
                </div>
              </div>
              <hr></hr>
              <div
                className={
                  "lg:grid pt-2 justify-between gap-4 " +
                  (this.props.confirmPopupType === "Withdrawal"
                    ? ""
                    : "hide-data")
                }
              >
                <div className="flex py-4 sm:block">
                  <div className="text-sm text-color lg:pr-80 sm:pr-2 sm:inline">
                    <a
                      href="https://docs.nordfinance.io/nord-savings-v1/nord.savings-faqs#is-there-any-fee-to-deposit-and-withdraw-stablecoins"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-color underline"
                    >
                      {this.props.secondLine[0] === "Vault"
                        ? "Total Fees"
                        : "Fund Management Fees"}
                    </a>{" "}
                    (
                    {this.props.secondLine[0] === "Vault"
                      ? "1"
                      : `${this.props.fundManagementFees}`}
                    %)
                    <div
                      className={
                        "feetooltip" +
                        (this.props.secondLine[0] === "Vault"
                          ? ""
                          : " hide-data")
                      }
                    >
                      <img
                        src={Info}
                        alt=""
                        className="mb-1 ml-1 h-4 w-4 cursor-pointer"
                      />
                      <span className="feetooltiptext">
                        <div className="flex pt-2 pl-2 pr-2 justify-between gap-4">
                          <p className="text-sm text-color text-left ">
                            {"Treasury Fee"}
                          </p>
                          <p className="font-bold text-sm-right text-right">
                            {"0.3%"}
                          </p>
                        </div>
                        <div className="flex pt-2 pl-2 pr-2 justify-between gap-4">
                          <p className="text-sm text-color text-left ">
                            {"NORD Redistribution Fee"}
                          </p>
                          <p className="font-bold text-sm-right text-right">
                            {"0.3%"}
                          </p>
                        </div>
                        <div className="flex pt-2 pl-2 pr-2 justify-between gap-4">
                          <p className="text-sm text-color text-left ">
                            {this.props.secondLine[1] + " Redistribution Fee"}
                          </p>
                          <p className="font-bold text-sm-right text-right">
                            {"0.4%"}
                          </p>
                        </div>
                        <div className="flex pt-2 pl-2 pr-2 justify-between gap-4">
                          <p className="text-sm text-color text-left ">
                            {"Withdrawal Fee"}
                          </p>
                          <p className="font-bold text-sm-right text-right">
                            {"0%"}
                          </p>
                        </div>
                        <div className="flex pt-2 pl-2 pr-2 justify-between gap-4">
                          <p className="text-sm text-color text-left ">
                            {"Performance Fee"}
                          </p>
                          <p className="font-bold text-sm-right text-right">
                            {"0%"}
                          </p>
                        </div>
                      </span>
                    </div>
                  </div>
                  <p
                    className="font-bold text-sm-right sm:float-right"
                    title={
                      this.props.withdrawFee +
                      " " +
                      (this.props.secondLine[2]
                        ? this.props.secondLine[2]
                        : this.props.secondLine[1])
                    }
                  >
                    {this.displayAmount(this.props.withdrawFee) +
                      " " +
                      (this.props.secondLine[2]
                        ? this.props.secondLine[2]
                        : this.props.secondLine[1])}
                  </p>
                </div>
                <div
                  className={
                    "fees-card" +
                    (this.props.secondLine[0] === "Vault" ? "" : " hide-data")
                  }
                >
                  <div className="grid px-4 gap-4">
                    <div className="flex justify-between gap-4">
                      <p>{"Treasury Fee"}</p>
                      <p>
                        {this.displayAmount(0.003 * this.props.amount) +
                          " " +
                          this.props.selectedToken}
                      </p>
                    </div>
                    <div className="flex justify-between gap-4">
                      <p>{"NORD Redistribution Fee"}</p>
                      <p>
                        {this.displayAmount(0.003 * this.props.amount) +
                          " " +
                          this.props.selectedToken}
                      </p>
                    </div>
                    <div className="flex justify-between gap-4">
                      <p>{this.props.secondLine[1] + " Redistribution Fee"}</p>
                      <p>
                        {this.displayAmount(0.004 * this.props.amount) +
                          " " +
                          this.props.selectedToken}
                      </p>
                    </div>
                    <div className="flex justify-between gap-4">
                      <p>{"Withdrawal Fee"}</p>
                      <p>
                        {this.displayAmount(0.0 * this.props.amount) +
                          " " +
                          this.props.selectedToken}
                      </p>
                    </div>
                    <div className="flex justify-between gap-4">
                      <p>{"Performance Fee"}</p>
                      <p>
                        {this.displayAmount(0.0 * this.props.amount) +
                          " " +
                          this.props.selectedToken}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={
                  (this.props.nordData[0] ? "" : "hide-data ") +
                  "flex py-4 justify-between gap-4"
                }
              >
                <p className="text-sm text-color text-left ">
                  {"NORD " + this.props.confirmPopupType + " Amount"}
                </p>
                <p
                  className="font-bold text-sm-right text-right "
                  title={this.props.nordData[0] + " NORD"}
                >
                  {this.displayAmount(this.props.nordData[0]) + " NORD"}
                </p>
              </div>
              {this.props.displayInfiniteSwitch.length ? <hr></hr> : <></>}
              {this.props.displayInfiniteSwitch.map((data, index) =>
                data ? (
                  <div className="flex py-4 justify-between gap-4" key={index}>
                    <p className="text-sm text-color">
                      {(index === 0 ? this.props.selectedToken : "NORD") +
                        " Infinite approval - Trust Contract forever"}
                      <div className="tooltip">
                        <img
                          src={Info}
                          alt=""
                          className="mb-1 ml-1 h-4 w-4 cursor-pointer"
                        />
                        <span className="tooltiptext">
                          {`By toggling this, You are agreeing to trust the contract to approve and spend infinite amount of ${
                            index === 0 ? this.props.selectedToken : "NORD"
                          } ,saving you any extra gas fee in subsequent ${
                            index === 0 ? this.props.selectedToken : "NORD"
                          } ${this.props.confirmPopupType} transactions`}
                        </span>
                      </div>
                    </p>
                    <div>
                      <label>
                        <input
                          id={"infiniteApproval" + index}
                          checked={
                            index === 0
                              ? this.props.infiniteApproval
                              : this.props.nordData[1]
                          }
                          value={
                            index === 0
                              ? this.props.infiniteApproval
                              : this.props.nordData[1]
                          }
                          onChange={() => this.props.handleChange(index === 0)}
                          className="switch"
                          type="checkbox"
                        />
                        <div>
                          <div></div>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <p key={index} />
                )
              )}
              <hr
                className={
                  "mt-2" +
                  (this.props.confirmPopupType === "Deposit" &&
                  this.props.secondLine[0] === "Fund"
                    ? ""
                    : " hide-data")
                }
              ></hr>
              <div
                className={
                  "mt-2" +
                  (this.props.confirmPopupType === "Deposit" &&
                  this.props.secondLine[0] === "Fund"
                    ? ""
                    : " hide-data")
                }
              >
                <p className="text-sm pt-4 tertiary-color hide-data">
                  Nord Advisory is still in public beta. All contracts are under
                  audit.
                </p>
              </div>
              <div className="flex mt-4 gap-6">
                <button
                  className=" flex py-2 px-6 btn-green cursor-pointer focus:outline-none"
                  onClick={() => {
                    this.props.handlePopupClose(true);
                  }}
                >
                  Yes and Continue
                </button>
                <button
                  className=" flex py-2 px-6 btn-cancel cursor-pointer focus:outline-none"
                  onClick={() => {
                    this.props.handlePopupClose(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </>
    );
  }
}

ConfirmModal.propTypes = {
  amount: PropTypes.string.isRequired,
  duration: PropTypes.number,
  isConfirmPopupOpen: PropTypes.bool.isRequired,
  confirmPopupType: PropTypes.string.isRequired,
  selectedToken: PropTypes.string.isRequired,
  secondLine: PropTypes.array.isRequired,
  nordData: PropTypes.array.isRequired,
  withdrawFee: PropTypes.string.isRequired,
  displayInfiniteSwitch: PropTypes.array.isRequired,
  infiniteApproval: PropTypes.bool.isRequired,
  handleChange: PropTypes.func,
  handlePopupClose: PropTypes.func,
  fundManagementFees: PropTypes.string,
  performanceFees: PropTypes.string,
  unstakeDate: PropTypes.string,
  fixedStakingDuration: PropTypes.string,
};

export default ConfirmModal;
