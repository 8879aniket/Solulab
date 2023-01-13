import React, { useState, useEffect } from "react";
import axios from "axios";
import Table from "./Table";

export default function GradedCoins() {
  const [gradedCoins, setGradedCoins] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get("http://localhost:3000/admin/graded-coins");
      setGradedCoins(res.data.data);
    };
    fetchData();
  }, []);

  const column = [
    {
      Header: "id",
      accessor: "_id",
    },
    {
      Header: "Coin Name",
      accessor: "name",
    },
    {
      Header: "History",
      accessor: "history",
    },
    {
      Header: "Price",
      accessor: "price",
    },
    {
      Header: "Ruler",
      accessor: "ruler",
    },
    {
      Header: "Year",
      accessor: "age",
    },
  ];

  return (
    <div>
      <h5>Coins</h5>
      <Table apidata={gradedCoins} column={column} />
    </div>
  );
}
