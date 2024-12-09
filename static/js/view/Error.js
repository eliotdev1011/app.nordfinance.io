import React from "react";
import Layout from "../Layout";
// import Sidebar from "../components/errorsidebar";
const Error = () => {
  return (
    <>
      <Layout>
        <div className="errorpage">
          <h1> 404 </h1>
          <h3> LOOKS LIKE YOU ARE LOST </h3>
          <br />
          <h5> The page you are looking for is not available </h5>
          <br />
          <a href="/"> Go to Home &#8594; </a>
        </div>
      </Layout>
    </>
  );
};
export default Error;
