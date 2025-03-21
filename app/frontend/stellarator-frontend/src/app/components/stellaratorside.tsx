import React, { useState, useEffect } from "react";
import axios from "axios";
import Search from "./search";
import SelectPaper from "./SelectPaper";
import { TableContainer, TableHead, TableCell, TableRow, Table, TableBody, Paper } from "@mui/material";
// import "./table.css"; 

function StellaratorTable() {
  interface Config {
    id: number;
    rc1: string;
    rc2: string;
    rc3: string;
    zs1: string;
    zs2: string;
    zs3: string;
    nfp: string;
    etabar: string;
  }
  const [configs, setConfigs] = useState<Config[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQueries, setSearchQueries] = useState({
    rc1: "",
    rc2: "",
    rc3: "",
    zs1: "",
    zs2: "",
    zs3: "",
    nfp: "",
    etabar: ""
  });

  // Adjust this based on how your backend handles pagination
  const pageSize = 500;

  useEffect(() => {
    // Fetch only 500 records at a time using query params (example: ?page=1&limit=500&search=term)
    const queryParams = new URLSearchParams({
      page: currentPage.toString(),
      limit: pageSize.toString(),
      search_rc1: searchQueries.rc1,
      search_rc2: searchQueries.rc2,
      search_rc3: searchQueries.rc3,
      search_zs1: searchQueries.zs1,
      search_zs2: searchQueries.zs2,
      search_zs3: searchQueries.zs3,
      search_nfp: searchQueries.nfp,
      search_etabar: searchQueries.etabar
    }).toString();

    axios
      .get(`https://stellarator.physics.wisc.edu/app/backend/api/configs?${queryParams}`)
      .then(response => {
        setConfigs(response.data.configs || []);
        setTotalPages(response.data.totalPages || 1);
      })
      .catch(error => console.error(error));
  }, [currentPage, searchQueries]);

  const handlePageChange = (e) => {
    setCurrentPage(parseInt(e.target.value, 10));
  };

  const handleSearchChange = (column) => (e) => {
    setSearchQueries({
      ...searchQueries,
      [column]: e.target.value
    });
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleSelectChange = (id) => (e) => {
    // Handle the select change for each row
    console.log(`Selected option for config ${id}: ${e.target.value}`);
  };

  return (
    <div style={{ marginTop: "50px" }}>
      <h2>Select a Stellarator Configuration</h2>
      <Paper elevation={3} style={{ padding: "10px", display: "inline-block" }}>
        <label htmlFor="pageSelect">Page: </label>
        <select id="pageSelect" value={currentPage} onChange={handlePageChange}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <option key={page} value={page}>{page}</option>
          ))}
        </select>
      </Paper>

      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Actions</TableCell>
              <TableCell><Search label=" rc1" onChange={handleSearchChange("rc1")} /></TableCell>
              <TableCell><Search label=" rc2" onChange={handleSearchChange("rc2")} /></TableCell>
              <TableCell><Search label=" rc3" onChange={handleSearchChange("rc3")} /></TableCell>
              <TableCell><Search label=" zs1" onChange={handleSearchChange("zs1")} /></TableCell>
              <TableCell><Search label=" zs2" onChange={handleSearchChange("zs2")} /></TableCell>
              <TableCell><Search label=" zs3" onChange={handleSearchChange("zs3")} /></TableCell>
              <TableCell><Search label=" nfp" onChange={handleSearchChange("nfp")} /></TableCell>
              <TableCell><Search label=" etabar" onChange={handleSearchChange("etabar")} /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Actions</TableCell>
              <TableCell align="right">id</TableCell>
              <TableCell align="right">rc1</TableCell>
              <TableCell align="right">rc2</TableCell>
              <TableCell align="right">rc3</TableCell>
              <TableCell align="right">zs1</TableCell>
              <TableCell align="right">zs2</TableCell>
              <TableCell align="right">zs3</TableCell>
              <TableCell align="right">nfp</TableCell>
              <TableCell align="right">etabar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configs.map((config) => (
              <TableRow
                key={config.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>
                  <SelectPaper
                    options={[
                      { value: "view", label: "View" },
                      { value: "edit", label: "Edit" },
                      { value: "delete", label: "Delete" }
                    ]}
                    value=""
                    onChange={handleSelectChange(config.id)}
                  />
                </TableCell>
                <TableCell align="right">{config.id}</TableCell>
                <TableCell align="right">{config.rc1}</TableCell>
                <TableCell align="right">{config.rc2}</TableCell>
                <TableCell align="right">{config.rc3}</TableCell>
                <TableCell align="right">{config.zs1}</TableCell>
                <TableCell align="right">{config.zs2}</TableCell>
                <TableCell align="right">{config.zs3}</TableCell>
                <TableCell align="right">{config.nfp}</TableCell>
                <TableCell align="right">{config.etabar}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default StellaratorTable;
