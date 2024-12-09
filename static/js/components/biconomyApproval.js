import getMessageSignature from "./functions/getMessageSignature";
import getSignatureParameters from "./functions/getSignatureParameters";
const approveWithBiconomy = async (
  setOverlay,
  contract,
  domainRequirements,
  accountAddress,
  web3,
  parameters
) => {
  const domainType = [
    {
      name: "name",
      type: "string",
    },
    {
      name: "version",
      type: "string",
    },
    {
      name: "verifyingContract",
      type: "address",
    },
    {
      name: "salt",
      type: "bytes32",
    },
  ];
  const metaTransactionType = [
    { name: "nonce", type: "uint256" },
    { name: "from", type: "address" },
    { name: "functionSignature", type: "bytes" },
  ];
  let nonce = "";
  const domainData = {
    name: domainRequirements[0],
    version: domainRequirements[2],
    verifyingContract: domainRequirements[1],
    salt: "0x" + domainRequirements[3].toString(16).padStart(64, "0"),
  };

  if (domainRequirements[0] === "USD Coin (PoS)") {
    nonce = await contract.methods.nonces(accountAddress).call();
  } else {
    nonce = await contract.methods.getNonce(accountAddress).call();
  }
  const functionSignature = await contract.methods
    .approve(...parameters)
    .encodeABI();
  const message = {};
  message.nonce = parseInt(nonce);
  message.from = accountAddress;
  message.functionSignature = functionSignature;
  let approveFlag = false;
  const dataToSign = JSON.stringify({
    types: {
      EIP712Domain: domainType,
      MetaTransaction: metaTransactionType,
    },
    domain: domainData,
    primaryType: "MetaTransaction",
    message: message,
  });
  try {
    const response = await getMessageSignature(
      [accountAddress, dataToSign],
      web3
    );
    const { r, s, v } = getSignatureParameters(response.result, web3);
    approveFlag = await sendTransaction(
      accountAddress,
      functionSignature,
      r,
      s,
      v,
      contract,
      setOverlay
    );
  } catch (err) {
    console.log(err);
    approveFlag = false;
  }
  setOverlay(false, "", "");
  return approveFlag;
};

const sendTransaction = async (
  accountAddress,
  functionData,
  r,
  s,
  v,
  contract,
  setOverlay
) => {
  let operationFlag = false;
  if (contract) {
    await contract.methods
      .executeMetaTransaction(accountAddress, functionData, r, s, v)
      .send({ from: accountAddress }, (error, tHash) => {
        if (error) {
          console.log(
            `Error while sending executeMetaTransaction tx: ${error}`
          );
          operationFlag = false;
          return;
        }
        setOverlay(true, "", tHash);
      })
      .then(function (receipt) {
        operationFlag = receipt.status;
        console.log(receipt);
      })
      .catch(function (err) {
        console.log(err);
        operationFlag = false;
      });
  }
  return operationFlag;
};

export { approveWithBiconomy };
