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
      .get("http://localhost:5000/api/configs", {
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
    { field: "rbc_0_0", headerName: "rbc(0,0)", width: 130, flex: 1 },
    { field: "rbc_1_0", headerName: "rbc(1,0)", width: 130, flex: 1 },
    { field: "rbc_m1_1", headerName: "rbc(-1,1)", width: 130, flex: 1 },
    { field: "rbc_0_1", headerName: "rbc(0,1)", width: 130, flex: 1 },
    { field: "rbc_1_1", headerName: "rbc(1,1)", width: 130, flex: 1 },
    { field: "zbs_0_0", headerName: "zbs(0,0)", width: 130, flex: 1 },
    { field: "zbs_1_0", headerName: "zbs(1,0)", width: 130, flex: 1 },
    { field: "zbs_m1_1", headerName: "zbs(-1,1)", width: 130, flex: 1 },
    { field: "zbs_0_1", headerName: "zbs(0,1)", width: 130, flex: 1 },
    { field: "zbs_1_1", headerName: "zbs(1,1)", width: 130, flex: 1 },
    { field: "quasisymmetry", headerName: "Quasisymmetry", width: 130, flex: 1 },
    { field: "quasiisodynamic", headerName: "Quasiisodynamic", width: 130, flex: 1 },
    { field: "rotational_transform", headerName: "Rotational Transform", width: 130, flex: 1 },
    { field: "inverse_aspect_ratio", headerName: "Inverse Aspect Ratio", width: 130, flex: 1 },
    { field: "mean_local_magnetic_shear", headerName: "⟨Local Magnetic Shear⟩", width: 130, flex: 1 },
    { field: "vacuum_magnetic_well", headerName: "Vacuum Magnetic Well", width: 130, flex: 1 },
    { field: "maximum_elongation", headerName: "Max Elongation", width: 130, flex: 1 },
    { field: "mirror_ratio", headerName: "Mirror Ratio", width: 130, flex: 1 },
    { field: "number_of_field_periods_nfp", headerName: "NFP", width: 80, flex: 1 },
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
            e.stopPropagation();
            window.open(`/plot/vmec_folder/${params.row.id}`, "_blank");
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
      const newWindow = window.open(`/plot/vmec_folder/${ids[index]}`, "_blank");
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