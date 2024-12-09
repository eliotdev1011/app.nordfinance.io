/*
  @param params: an array with userAddress and dataToSign
  @param web3: web3 provider object
  @return promise object which resolves on response and rejects on error
*/

function getMessageSignature(params, web3) {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(
      {
        jsonrpc: "2.0",
        id: 999999999999,
        method: "eth_signTypedData_v4",
        params: params,
      },
      (error, response) => {
        console.info(`User signature is ${response.result}`);
        if (error || (response && response.error)) {
          return reject(error);
        } else if (response && response.result) {
          return resolve(response);
        }
      }
    );
  });
}

export default getMessageSignature;
