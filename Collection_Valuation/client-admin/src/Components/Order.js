import React, { useState, useEffect } from "react";
import axios from "axios";
import Table from "./Table";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get("http://localhost:3000/admin/orders");
      setOrders(res.data.data);
    };
    fetchData();
  }, []);

  const column = [
    {
      Header: "id",
      accessor: "_id",
    },
    {
      Header: "Buyer",
      accessor: "_buyer",
    },
    {
      Header: "Seller",
      accessor: "_seller",
    },
    {
      Header: "Coin Name",
      accessor: "_coin",
    },
    {
      Header: "Price",
      accessor: "price",
    },
  ];

  return (
    <div>
      <h5>Orders</h5>
      <Table apidata={orders} column={column} />
    </div>
  );
}
