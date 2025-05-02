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
      .get("https://stellarator.physics.wisc.edu/backend/api/configs", {
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
    { field: "rbc_0_0", headerName: "rbc_0_0", width: 130 },
    { field: "rbc_1_0", headerName: "rbc_1_0", width: 130 },
    { field: "rbc_m1_1", headerName: "rbc_m1_1", width: 130 },
    { field: "rbc_0_1", headerName: "rbc_0_1", width: 130 },
    { field: "rbc_1_1", headerName: "rbc_1_1", width: 130 },
    { field: "zbs_0_0", headerName: "zbs_0_0", width: 130 },
    { field: "zbs_1_0", headerName: "zbs_1_0", width: 130 },
    { field: "zbs_m1_1", headerName: "zbs_m1_1", width: 130 },
    { field: "zbs_0_1", headerName: "zbs_0_1", width: 130 },
    { field: "zbs_1_1", headerName: "zbs_1_1", width: 130 },
    { field: "quasisymmetry", headerName: "quasisymmetry", width: 130 },
    { field: "quasiisodynamic", headerName: "quasiisodynamic", width: 130 },
    { field: "rotational_transform", headerName: "rotational_transform", width: 130 },
    { field: "inverse_aspect_ratio", headerName: "inverse_aspect_ratio", width: 130 },
    { field: "mean_local_magnetic_shear", headerName: "magnetic_shear", width: 150 },
    { field: "vacuum_magnetic_well", headerName: "vacuum_well", width: 130 },
    { field: "maximum_elongation", headerName: "elongation", width: 130 },
    { field: "mirror_ratio", headerName: "mirror_ratio", width: 130 },
    { field: "number_of_field_periods_nfp", headerName: "nfp", width: 90 },
    { field: "timestamp", headerName: "Timestamp", width: 180 }
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
