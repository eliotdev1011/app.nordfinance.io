import { useEffect } from "react";

function showPrompt(event) {
  event.preventDefault();
  event.returnValue = "";
}

function useBeforeUnload(isContractCallInProgress) {
  useEffect(() => {
    if (isContractCallInProgress) {
      window.addEventListener("beforeunload", showPrompt);
    }
    return () => {
      if (isContractCallInProgress) {
        window.removeEventListener("beforeunload", showPrompt);
      }
    };
  }, [isContractCallInProgress]);
}

export { useBeforeUnload };
