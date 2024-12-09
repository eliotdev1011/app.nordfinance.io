function sendGaEvent(reactGa, category, action, label) {
  if (label === undefined) {
    reactGa.event({
      category,
      action,
    });
  } else {
    reactGa.event({
      category,
      action,
      label,
    });
  }
}

export default sendGaEvent;
