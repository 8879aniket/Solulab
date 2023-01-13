import SignIn from "./Components/SignIn";
import { useSelector } from "react-redux";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import "./app.css";
import { createTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/core";
import Dashboard from "./Components/DashBoard/DashBoard";
import Members from "./Components/Members";
import Layout from "./Components/Layout";
import Coins from "./Components/Coins";
import GradedCoins from "./Components/GradedCoins";
import Orders from "./Components/Order";
import Auctions from "./Components/Auction";

const theme = createTheme({
  typography: {
    fontFamily: "Quicksand",
    fontWeightLight: 400,
    fontWeightRegular: 500,
    fontWeightMedium: 600,
    fontWeightBold: 700,
  },
});

function App() {
  const authState = useSelector((state) => state.auth.value);
  if (authState) {
    return (
      <ThemeProvider theme={theme}>
        <Router>
          <Layout>
            <Switch>
              <Route exact path="/">
                <Dashboard />
              </Route>
              <Route path="/members">
                <Members />
              </Route>
              <Route path="/coins">
                <Coins />
              </Route>
              <Route path="/graded-coins">
                <GradedCoins />
              </Route>
              <Route path="/orders">
                <Orders />
              </Route>
              <Route path="/auctions">
                <Auctions />
              </Route>
            </Switch>
          </Layout>
        </Router>
      </ThemeProvider>
    );
  } else {
    return <SignIn />;
  }
}

export default App;
