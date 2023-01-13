import React from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import DashboardIcon from "@material-ui/icons/Dashboard";
import ShoppingCartIcon from "@material-ui/icons/ShoppingCart";
import PeopleIcon from "@material-ui/icons/People";
import AssignmentIcon from "@material-ui/icons/Assignment";
import AttachMoneyIcon from "@material-ui/icons/AttachMoney";
import MoneyIcon from "@material-ui/icons/Money";
import MonetizationOnIcon from "@material-ui/icons/MonetizationOn";
import AccountBalanceIcon from "@material-ui/icons/AccountBalance";
import GavelIcon from "@material-ui/icons/Gavel";
import ReportIcon from "@material-ui/icons/Report";
import PageviewIcon from "@material-ui/icons/Pageview";
import { Link } from "react-router-dom";

export default function MainListItems() {
  return (
    <div>
      <Link to="/" style={{ color: "inherit", textDecoration: "inherit" }}>
        <ListItem button>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
      </Link>
      <Link
        to="/members"
        style={{ color: "inherit", textDecoration: "inherit" }}
      >
        <ListItem button>
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Members" />
        </ListItem>
      </Link>
      <Link to="/coins" style={{ color: "inherit", textDecoration: "inherit" }}>
        <ListItem button>
          <ListItemIcon>
            <AttachMoneyIcon />
          </ListItemIcon>
          <ListItemText primary="Coins" />
        </ListItem>
      </Link>
      <Link to="/" style={{ color: "inherit", textDecoration: "inherit" }}>
        <ListItem button>
          <ListItemIcon>
            <AccountBalanceIcon />
          </ListItemIcon>
          <ListItemText primary="Bank Note" />
        </ListItem>
      </Link>
      <Link
        to="/graded-coins"
        style={{ color: "inherit", textDecoration: "inherit" }}
      >
        <ListItem button>
          <ListItemIcon>
            <MonetizationOnIcon />
          </ListItemIcon>
          <ListItemText primary="Graded Coins" />
        </ListItem>
      </Link>
      <Link to="/" style={{ color: "inherit", textDecoration: "inherit" }}>
        <ListItem button>
          <ListItemIcon>
            <MoneyIcon />
          </ListItemIcon>
          <ListItemText primary="Graded Notes" />
        </ListItem>
      </Link>
      <Link
        to="/orders"
        style={{ color: "inherit", textDecoration: "inherit" }}
      >
        <ListItem button>
          <ListItemIcon>
            <ShoppingCartIcon />
          </ListItemIcon>
          <ListItemText primary="Orders" />
        </ListItem>
      </Link>
      <Link
        to="/auctions"
        style={{ color: "inherit", textDecoration: "inherit" }}
      >
        <ListItem button>
          <ListItemIcon>
            <GavelIcon />
          </ListItemIcon>
          <ListItemText primary="Auction" />
        </ListItem>
      </Link>
      <Link to="/" style={{ color: "inherit", textDecoration: "inherit" }}>
        <ListItem button>
          <ListItemIcon>
            <PageviewIcon />
          </ListItemIcon>
          <ListItemText primary="Verify KYC" />
        </ListItem>
      </Link>
      <Link to="/" style={{ color: "inherit", textDecoration: "inherit" }}>
        <ListItem button>
          <ListItemIcon>
            <ReportIcon />
          </ListItemIcon>
          <ListItemText primary="Dispute Request" />
        </ListItem>
      </Link>
      <Link to="/" style={{ color: "inherit", textDecoration: "inherit" }}>
        <ListItem button>
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText primary="CMS Pages" />
        </ListItem>
      </Link>
    </div>
  );
}
