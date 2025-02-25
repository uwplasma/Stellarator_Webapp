import React, { useState, useEffect } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";

function StellaratorTable() {
  const [configs, setConfigs] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100
  });

  const [filterModel, setFilterModel] = useState({
    items: []
  });

  useEffect(() => {
    const { page, pageSize } = paginationModel;

    let filterValue = "";
    let filterField = "";

    if (filterModel.items.length > 0) {
      filterValue = filterModel.items[0].value || "";
      filterField = filterModel.items[0].columnField || "";
    }

    axios
      .get("http://127.0.0.1:5000/api/configs", {
        params: {
          page: page + 1,
          limit: pageSize,
          filter: filterValue,
          filter_field: filterField
        }
      })
      .then(response => {
        setConfigs(response.data.configs || []);
        setTotalRows(response.data.count || 0);
      })
      .catch(error => console.error(error));
  }, [paginationModel, filterModel]);

  // Define the columns for your data
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "rc1", headerName: "rc1", width: 130 },
    { field: "rc2", headerName: "rc2", width: 130 },
    { field: "rc3", headerName: "rc3", width: 130 },
    { field: "zs1", headerName: "zs1", width: 130 },
    { field: "zs2", headerName: "zs2", width: 130 },
    { field: "zs3", headerName: "zs3", width: 130 },
    { field: "nfp", headerName: "nfp", width: 130 },
    { field: "etabar", headerName: "etabar", width: 130 }
  ];

  return (
    <Paper sx={{ height: 500, width: "100%", marginTop: "50px" }}>
      <h2>Select a Stellarator Configuration</h2>
      <DataGrid
        rows={configs}
        columns={columns}
        paginationMode="server"
        filterMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={newModel => setPaginationModel(newModel)}
        onFilterModelChange={(newFilter) => {
          setFilterModel(newFilter);
          setPaginationModel(prev => ({ ...prev, page: 0 }));
        }}
        rowsPerPageOptions={[25, 50, 100]}
        rowCount={totalRows}
        checkboxSelection
        sx={{ border: 0 }}
      />
    </Paper>
  );
}

export default StellaratorTable;