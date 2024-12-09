function secondsToDhms(seconds) {
  const sec = Number(seconds);
  const d = Math.floor(sec / (3600 * 24));
  const h = Math.floor((sec % (3600 * 24)) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return { d, h, m };
}

export default secondsToDhms;
