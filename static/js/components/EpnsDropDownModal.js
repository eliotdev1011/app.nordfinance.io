import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import PropTypes from "prop-types";
import { api } from "@epnsproject/frontend-sdk";
import Loading from "../assets/images/loading.svg";
import { channelAddress } from "../config/config";
import "../../src/assets/style.css";

function EpnsDropDownModal({
  isDropDownModalOpen,
  account,
  epnsUnSubscribe,
  triggerFetchNotifs,
  setTriggerFetchNotifs,
  setIsDropDownModalOpen,
}) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const pageNumber = 1;
  const itemsPerPage = 20;

  useEffect(() => {
    if (!account) return;
    (async function () {
      if (triggerFetchNotifs) {
        setNotifications([]);
        setIsLoading(true);
        try {
          const notificationsData = await api.fetchNotifications(
            account,
            itemsPerPage,
            pageNumber
          );
          const { results } = notificationsData || { results: [] };
          setNotifications(results);
        } catch (err) {
          console.log("fetchNotifs: ", err);
        }
        setIsLoading(false);
        setTriggerFetchNotifs(false);
      }
    })();
  }, [triggerFetchNotifs]);

  return (
    <Modal
      isOpen={isDropDownModalOpen}
      className={
        notifications.length === 0 ? "Epnsmodal" : "Epnsmodal-overflow"
      }
      onRequestClose={() => setIsDropDownModalOpen(false)}
      appElement={document.getElementById("root") || undefined}
    >
      <div
        className="cursor-pointer grid grid-cols-2 gap-2 mb-1"
        style={{ padding: "5px" }}
      >
        <p className="text-primary text-lg py-2 px-2 md:flex-none">
          Notifications
        </p>
        <div className="flex justify-center items-center">
          <button
            className="sm:flex-end btn-cancel cursor-pointer focus:outline-none w-fit mx-auto px-3 py-1"
            onClick={() => epnsUnSubscribe()}
            style={{ fontWeight: "400" }}
          >
            Unsubscribe
          </button>
        </div>
      </div>
      <hr></hr>
      {isLoading ? (
        <div
          align="center"
          className="flex flex-col justify-center items-center h-full"
        >
          <img src={Loading} alt="" className="block w-32" />
        </div>
      ) : (
        <>
          {notifications.length === 0 ? (
            <>
              <div
                align="center"
                className="flex flex-col justify-center items-center h-full"
              >
                <p className="text-primary block w-full">
                  No notifications yet...
                </p>
              </div>
            </>
          ) : (
            notifications.map((oneNotification, i) => {
              return (
                oneNotification.channel === channelAddress && (
                  <a
                    href={oneNotification.payload.data.acta}
                    key={i}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="card-coin-notification w-11/12 m-auto cursor-pointer mt-3 justify-between lg:items-center">
                      <div className="flex-col divide-y pl-0">
                        <div className="flex pb-2">
                          <div className="flex-initial ml-4">
                            <p className="font-bold text-primary dark:text-primary">
                              {oneNotification.payload.data.asub !== ""
                                ? oneNotification.payload.data.asub
                                : "No Subject"}
                            </p>
                          </div>
                        </div>
                        <div className="pt-5 pl-5 pr-5">
                          {oneNotification.payload.data.aimg !== "" ? (
                            <img
                              src={oneNotification.payload.data.aimg}
                              alt=""
                              width={"100%"}
                              height={"100%"}
                            />
                          ) : null}
                          <p className="text-sm dark:text-primary mt-2">
                            {oneNotification.payload.data.amsg}
                          </p>
                        </div>
                      </div>

                      <div className="sm:flex sm:pt-4 lg:mt-0 sm:justify-end ">
                        <p className="text-sm text-primary dark:text-primary pr-8 pt-2 pb-2 pl-5 ">
                          {new Date(oneNotification.payload.data.epoch * 1000)
                            .toUTCString()
                            .split(" ")
                            .slice(0, 5)
                            .join(" ")}
                        </p>
                      </div>
                    </div>
                  </a>
                )
              );
            })
          )}
        </>
      )}
    </Modal>
  );
}

EpnsDropDownModal.propTypes = {
  isDropDownModalOpen: PropTypes.bool.isRequired,
  account: PropTypes.string,
  epnsUnSubscribe: PropTypes.func,
  triggerFetchNotifs: PropTypes.bool.isRequired,
  setTriggerFetchNotifs: PropTypes.func,
  setIsDropDownModalOpen: PropTypes.func,
};

export default EpnsDropDownModal;
