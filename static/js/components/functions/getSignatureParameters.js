function getSignatureParameters(signature, web3) {
  const r = signature.slice(0, 66);
  const s = "0x".concat(signature.slice(66, 130));
  let v = "0x".concat(signature.slice(130, 132));
  v = web3.utils.hexToNumber(v);
  if (![27, 28].includes(v)) v += 27;
  return {
    r: r,
    s: s,
    v: v,
  };
}

export default getSignatureParameters;
