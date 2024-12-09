import React from "react";
import Light from "../../assets/images/light.svg";
import Dark from "../../assets/images/dark.svg";
import { ThemeContext } from "./themeContext";
import PropTypes from "prop-types";

function Toggle({ reactGa }) {
  const { theme, setTheme } = React.useContext(ThemeContext);
  return (
    <div className="transition duration-500 ease-in-out rounded-full p-2 flex gap-4 toggle flex">
      {/* {theme === "dark" ? ( */}
      <div>
        <img
          src={Light}
          alt="light"
          onClick={() => {
            if (theme === "dark") {
              reactGa.event({
                category: "NavBar",
                action: "ThemeToggle",
                label: theme === "light" ? "dark" : "light",
              });
            }
            theme === "light"
              ? setTheme("light")
              : setTheme(theme === "dark" ? "light" : "dark");
          }}
          className="text-gray-500 dark:text-gray-400 text-2xl cursor-pointer h-8"
        />
      </div>
      {/* ) : ( */}
      <div>
        <img
          src={Dark}
          alt="dark"
          onClick={() => {
            if (theme === "light") {
              reactGa.event({
                category: "NavBar",
                action: "ThemeToggle",
                label: theme === "light" ? "dark" : "light",
              });
            }
            theme === "dark"
              ? setTheme("dark")
              : setTheme(theme === "dark" ? "light" : "dark");
          }}
          className="text-gray-500 dark:text-gray-400 text-2xl cursor-pointer h-8"
        />
      </div>
      {/* )} */}
    </div>
  );
}

Toggle.propTypes = {
  reactGa: PropTypes.object.isRequired,
};

export default Toggle;
