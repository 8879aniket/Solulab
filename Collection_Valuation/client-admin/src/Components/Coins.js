import React, { useState, useEffect } from "react";
import axios from "axios";
import Table from "./Table";

export default function Coins() {
  const [coins, setCoins] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get("http://localhost:3000/admin/coins");
      setCoins(res.data.data);
    };
    fetchData();
  }, []);

  const column = [
    {
      Header: "id",
      accessor: "_id",
    },
    {
      Header: "History",
      accessor: "history",
    },
    {
      Header: "Price Range for Granded",
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
      <Table apidata={coins} column={column} />
    </div>
  );
}
