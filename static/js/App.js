import React, { useEffect } from "react";
import Routers from "./route/route";
import { ThemeProvider } from "./components/theme/themeContext";
import Background from "./components/theme/background";
import ReactGA from "react-ga4";
import { gaMeasurementID } from "./config/config.js";

export default function App() {
  useEffect(() => {
    ReactGA.initialize(gaMeasurementID, {
      gaOptions: { titleCase: false },
    });
    ReactGA.send("pageview");
    return () => {};
  }, []);

  return (
    <div>
      <ThemeProvider>
        <Background>
          <Routers reactGa={ReactGA} />
        </Background>
      </ThemeProvider>
    </div>
  );
}
