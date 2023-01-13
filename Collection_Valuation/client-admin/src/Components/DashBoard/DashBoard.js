import React, { useState, useEffect } from "react";
import axios from "axios";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Chart from "./Chart";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
  fixedHeight: {
    height: 240,
  },
  dashBoardData: {
    padding: theme.spacing(2),
    display: "flex",
    height: 260,
    overflow: "auto",
    flexDirection: "row",
  },
}));

export default function Dashboard() {
  const classes = useStyles();
  const [dashboardItems, setDashboardItems] = useState({});
  const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:3000/admin/dashboard");
      setDashboardItems(res.data.data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dashboardData = Object.keys(dashboardItems).map((item) => (
    <Grid item xs={12} sm={6} md={3} lg={3}>
      <Paper className={classes.fixedHeightPaper}>
        <Typography variant="h5" gutterBottom>
          Total {item}
        </Typography>
        <Typography variant="h4" gutterBottom>
          {dashboardItems[item]}
        </Typography>
      </Paper>
    </Grid>
  ));

  return (
    <div className={classes.root}>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        <Container maxWidth="lg" className={classes.container}>
          <Grid container spacing={2}>
            <Container></Container>
            <Grid container spacing={2} className={classes.dashBoardData}>
              {dashboardData}
            </Grid>
            {/* Chart */}
            <Grid item xs={12} md={8} lg={9}>
              <Paper className={fixedHeightPaper}>
                <Chart />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </main>
    </div>
  );
}
