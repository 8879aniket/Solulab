import axios from "axios";
import React, { useState, useEffect } from "react";
import Table from "./Table";

export default function Members() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get("http://localhost:3000/admin/members");
      setUsers(res.data.data);
    };
    fetchData();
  }, []);

  const column = [
    {
      Header: "First name",
      accessor: "firstName",
    },
    {
      Header: "Email Address",
      accessor: "email",
    },
    {
      Header: "Number",
      accessor: "phone",
    },
    {
      Header: "status",
      accessor: "isDeleted",
    },
  ];

  return (
    <div>
      Members
      <Table apidata={users} column={column} />
    </div>
  );
}
