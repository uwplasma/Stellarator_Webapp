"use client"

import React, { useState, useEffect } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import DownloadIcon from "@mui/icons-material/Download"; 
import Link from "next/link";
import { GridRowId, GridPagination } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

// Type definition for stellarator configuration
interface StellaratorConfig {
  id: number;
  rc1: string | number;
  rc2: string | number;
  zs1: string | number;
  zs2: string | number;
  nfp: number;
  etabar: string | number;
  B2c: string | number;
  iota: string | number;
  beta: string | number;
  r_singularity: string | number;
}

function StellaratorTable() {
  const [configs, setConfigs] = useState<StellaratorConfig[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100  
  });
  
  // State to store the selected rows' IDs
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowId[]>([]);

  // Custom filter states
  const [nfpFilter, setNfpFilter] = useState<number | "">("");
  const [idFilter, setIdFilter] = useState<string>("");

  // Tracking download format
  const [downloadFormat, setDownloadFormat] = useState<"json" | "csv">("json");

  useEffect(() => {
    const { page, pageSize } = paginationModel;
    axios
      .get("https://stellarator.physics.wisc.edu/backend/api/configs", {
        params: {
          page: page + 1,
          limit: pageSize,
          search_nfp: nfpFilter !== "" ? nfpFilter : undefined,
        }
      })
      .then(response => {
        setConfigs(response.data.configs || []);
        setTotalRows(response.data.count || 0);
      })
      .catch(error => console.error(error));
  }, [paginationModel, nfpFilter, idFilter]);

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
    // { field: "p2", headerName: "p2", width: 130, flex: 1 },
    { field: "iota", headerName: "iota", width: 130, flex: 1 },
    { field: "beta", headerName: "beta", width: 130, flex: 1 },
    // { field: "DMerc_times_r2", headerName: "DMerc_times_r2", width: 130, flex: 1 },
    // { field: "min_L_grad_B", headerName: "L_grad_B", width: 130, flex: 1 },
    { field: "r_singularity", headerName: "r_singularity", width: 130, flex: 1 },
    // { field: "B20_variation", headerName: "B20_variation", width: 130, flex: 1 },
    {
      field: "download",
      headerName: "Download",
      width: 80,
      flex: 0.5,
      sortable: false,
      renderCell: (params: { row: StellaratorConfig }) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(params.row.id);
          }}
          title="Download configuration data"
        >
          <DownloadIcon fontSize ="small" />
        </IconButton>
      )
    },

    {
      field: "open",
      headerName: "Plot",
      width: 100,
      flex: 1,
      renderCell: (params) => (
        <Button 
          variant="contained" 
          size="small"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row selection when clicking button
            window.open(`/app/plot/${params.row.id}`, "_blank");
          }}
        >
          View
        </Button>
      )
    }
  ];

  // Footer component with "Go to page" input
  function CustomFooter() {
    return (
      <Box sx={{marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
        <TextField
          label="Go to page"
          type="number"
          size="small"
          sx={{ width: 200, marginBottom: 3 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const page = parseInt((e.target as HTMLInputElement).value) - 1;
              setPaginationModel(prev => ({ ...prev, page }));
            }
          }}
        />
        <GridPagination />
      </Box>
    );
  }

  // Clear all filters
  const handleClearFilters = () => {
    setNfpFilter("");
    setIdFilter("");
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const handleDownload = (configId: number) => {
    const url = `https://stellarator.physics.wisc.edu/backend/api/download/${configId}?format=${downloadFormat}`;
    window.open(url, "_blank");
  };

  const handleBulkDownload = () => {
    if (selectedRowIds.length === 0) return;
    const ids = selectedRowIds.join(",");
    const url =
    `https://stellarator.physics.wisc.edu/backend/api/download/bulk?ids=${ids}&format=${downloadFormat}`;
    window.open(url, "_blank");
  };

  return (
    <Paper sx={{ width: "100%", marginTop: "50px", marginBottom: "10px", padding: 1 }}>
      <h2>Select a Stellarator Configuration</h2>

      {/* Filter Controls */}
      <Box sx={{ display: 'flex', gap: 2, marginTop: 2, marginBottom: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>NFP</InputLabel>
          <Select
            value={nfpFilter}
            label="NFP"
            onChange={(e) => {
              setNfpFilter(e.target.value as number | "");
              setPaginationModel(prev => ({ ...prev, page: 0 }));
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={2}>2</MenuItem>
            <MenuItem value={3}>3</MenuItem>
            <MenuItem value={4}>4</MenuItem>
            <MenuItem value={5}>5</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Search by ID"
          size="small"
          value={idFilter}
          onChange={(e) => {
            setIdFilter(e.target.value);
            setPaginationModel(prev => ({ ...prev, page: 0 }));
          }}
          sx={{ width: 150 }}
        />

        <Button
          variant="outlined"
          size="small"
          onClick={handleClearFilters}
          disabled={nfpFilter === "" && idFilter === ""}
        >
          Clear Filters
        </Button>
        
        <FormControl size="small" sx={{ minWidth: 100}}>
          <InputLabel>Format</InputLabel>
          <Select
            value={downloadFormat}
            label="Format"
            onChange={(e) => setDownloadFormat(e.target.value as "json" | "csv")}
          >
            <MenuItem value="json">JSON</MenuItem>
            <MenuItem value="csv">CSV</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          size="small"
          onClick={handleBulkDownload}
          disabled={selectedRowIds.length === 0}
          startIcon={<DownloadIcon />}
        >
          Download Selected ({selectedRowIds.length})
        </Button>

      </Box>

      <Button
        variant="contained"
        color="primary"
  onClick={() => {
    if (selectedRowIds.length > 0) {
      // First warn about popup blockers
      if (selectedRowIds.length > 1) {
        alert("Please allow popup windows in your browser settings if not all tabs open.");
      }
      
      // Create an array of the IDs
      const ids = [...selectedRowIds];
      
      // Open the first window immediately - this will usually work
      if (ids.length > 0) {
        window.open(`/app/plot/${ids[0]}`, "_blank");
        
        // Then open the rest with a slight delay to improve chances
        if (ids.length > 1) {
          setTimeout(() => {
            // Try to open the remaining windows
            for (let i = 1; i < ids.length; i++) {
              const newWindow = window.open(`/app/plot/${ids[i]}`, "_blank");
              
              // Check if window was blocked
              if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                alert(`Your browser blocked opening ${ids.length - 1} additional tabs. Please check your popup blocker settings.`);
                break;
              }
            }
          }, 100);
        }
      }
    }
  }}
  disabled={selectedRowIds.length === 0}
  sx={{ marginBottom: 2, marginTop: 1 }}
>
  Open All Selected ({selectedRowIds.length})
</Button>
      <DataGrid
        rows={configs}
        columns={columns}
        pagination
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={(newModel) => setPaginationModel(newModel)}
        pageSizeOptions={[25, 50, 100]}
        rowCount={totalRows}
        checkboxSelection
        disableRowSelectionOnClick
        keepNonExistentRowsSelected
        rowSelectionModel={selectedRowIds}
        onRowSelectionModelChange={(newSelection) => {
          setSelectedRowIds(newSelection as GridRowId[]);
        }}
        sx={{ marginLeft: 0, border: 0, height:500 }}
        slots={{
          footer: CustomFooter
        }}
      />
    </Paper>
  );
}

export default StellaratorTable;
