import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Dashboard from "../view/DashBoard";
import Advisory from "../view/Advisory";
import Error from "../view/Error";
import HomePage from "../view/HomePage";
import PropTypes from "prop-types";

class PublicRoute extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <Router>
        <Switch>
          <Route exact path="/dashboard">
            <Dashboard reactGa={this.props.reactGa} />
          </Route>
          <Route exact path="/advisory" component={Advisory}></Route>
          <Route exact path="/">
            <HomePage reactGa={this.props.reactGa} />
          </Route>
          <Route component={Error} />
        </Switch>
      </Router>
    );
  }
}

PublicRoute.propTypes = {
  reactGa: PropTypes.object.isRequired,
};

export default PublicRoute;
