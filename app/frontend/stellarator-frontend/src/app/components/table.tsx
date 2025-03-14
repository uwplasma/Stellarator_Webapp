"use client"

import React, { useState, useEffect } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Link from "next/link";
import { GridFilterModel, GridRowId } from "@mui/x-data-grid";

function StellaratorTable() {
  const [configs, setConfigs] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100  
  });
  
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: []
  });
  // State to store the selected rows' IDs
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowId[]>([]);

  useEffect(() => {
    const { page, pageSize } = paginationModel;
    let filterValue = "";
    let filterField = "";
    if (filterModel.items.length > 0) {
      filterValue = filterModel.items[0].value || "";
      filterField = filterModel.items[0].field || "";
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

  // Define the columns for your data, including a new "Open" action column
  const columns = [
    { field: "id", headerName: "ID", width: 70, flex: 0.5 },
    { field: "rc1", headerName: "rc1", width: 130, flex: 1 },
    { field: "rc2", headerName: "rc2", width: 130, flex: 1 },
    // { field: "rc3", headerName: "rc3", width: 130, flex: 1 },
    { field: "zs1", headerName: "zs1", width: 130, flex: 1 },
    { field: "zs2", headerName: "zs2", width: 130, flex: 1 },
    // { field: "zs3", headerName: "zs3", width: 130, flex: 1 },
    { field: "nfp", headerName: "nfp", width: 50, flex: 1 },
    { field: "etabar", headerName: "etabar", width: 130, flex: 1 },
    { field: "B2c", headerName: "B2c", width: 130, flex: 1 },
    { field: "p2", headerName: "p2", width: 130, flex: 1 },
    { field: "iota", headerName: "iota", width: 130, flex: 1 },
    { field: "beta", headerName: "beta", width: 130, flex: 1 },
    // { field: "DMerc_times_r2", headerName: "DMerc_times_r2", width: 130, flex: 1 },
    // { field: "min_L_grad_B", headerName: "L_grad_B", width: 130, flex: 1 },
    { field: "r_singularity", headerName: "r_singularity", width: 130, flex: 1 },
    // { field: "B20_variation", headerName: "B20_variation", width: 130, flex: 1 },
    {
      field: "open",
      headerName: "Plot",
      width: 100,
      flex: 0.5,
      renderCell: (params) => (
        <Button 
          variant="contained" 
          size="small"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row selection when clicking button
            window.open(`/plot/${params.row.id}`, "_blank");
          }}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <Paper sx={{ height: 500, width: "100%", marginTop: "50px" }}>
      <h2>Select a Stellarator Configuration</h2>
      <Button
  variant="contained"
  color="primary"
  onClick={() => {
    // Store reference to first window we open
    let firstWindow: Window | null = null;
    
    // Function to open windows one by one
    const openWindowsSequentially = (ids, index = 0) => {
      if (index >= ids.length) return;
      
      // Open the window and store reference to first one
      const newWindow = window.open(`/plot/${ids[index]}`, "_blank");
      if (index === 0) firstWindow = newWindow;
      
      // Wait before opening next window
      setTimeout(() => {
        openWindowsSequentially(ids, index + 1);
      }, 800); // Larger delay to avoid browser blocking
    };
    
    // Start opening windows
    if (selectedRowIds.length > 0) {
      // Alert user if many tabs will be opened
      if (selectedRowIds.length > 5) {
        if (confirm(`You're about to open ${selectedRowIds.length} tabs. Continue?`)) {
          openWindowsSequentially(selectedRowIds);
        }
      } else {
        openWindowsSequentially(selectedRowIds);
      }
    }
  }}
  disabled={selectedRowIds.length === 0}
  sx={{ marginBottom: 2 }}
>
  Open All Selected ({selectedRowIds.length})
</Button>
      <DataGrid
        rows={configs}
        columns={columns}
        pagination
        paginationMode="server"
        filterMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={(newModel) => setPaginationModel(newModel)}
        onFilterModelChange={(newFilter) => {
          setFilterModel(newFilter);
          setPaginationModel(prev => ({ ...prev, page: 0 }));
        }}
        pageSizeOptions={[25, 50, 100]}
        rowCount={totalRows}
        checkboxSelection
        disableRowSelectionOnClick
        keepNonExistentRowsSelected
        rowSelectionModel={selectedRowIds}
        onRowSelectionModelChange={(newSelection) => {
          setSelectedRowIds(newSelection as GridRowId[]);
        }}
        sx={{ border: 0 }}
      />
    </Paper>
  );
}

export default StellaratorTable;