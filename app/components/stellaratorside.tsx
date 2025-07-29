import React, { useState, useEffect } from "react";
import axios from "axios";
import Search from "./search";
import SelectPaper from "./SelectPaper";
import { TableContainer, TableHead, TableCell, TableRow, Table, TableBody, Paper } from "@mui/material";

function StellaratorTable() {
  interface Config {
    id: number;
    rbc_0_0: string;
    rbc_1_0: string;
    rbc_m1_1: string;
    rbc_0_1: string;
    rbc_1_1: string;
    zbs_0_0: string;
    zbs_1_0: string;
    zbs_m1_1: string;
    zbs_0_1: string;
    zbs_1_1: string;
    quasisymmetry: string;
    quasiisodynamic: string;
    rotational_transform: string;
    inverse_aspect_ratio: string;
    mean_local_magnetic_shear: string;
    vacuum_magnetic_well: string;
    maximum_elongation: string;
    mirror_ratio: string;
    number_of_field_periods_nfp: string;
    timestamp: string;
  }

  const [configs, setConfigs] = useState<Config[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQueries, setSearchQueries] = useState({
    rbc_0_0: "",
    rbc_1_0: "",
    rbc_m1_1: "",
    zbs_0_0: "",
    zbs_1_0: "",
    quasisymmetry: "",
    quasiisodynamic: "",
    number_of_field_periods_nfp: "",
  });

  const pageSize = 500;

  useEffect(() => {
    const queryParams = new URLSearchParams({
      page: currentPage.toString(),
      limit: pageSize.toString(),
      ...Object.fromEntries(
        Object.entries(searchQueries).map(([k, v]) => [`search_${k}`, v])
      )
    }).toString();

    axios
      .get(`https://stellarator.physics.wisc.edu/backend/api/configs?${queryParams}`)
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
    setCurrentPage(1);
  };

  const handleSelectChange = (id) => (e) => {
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
        <Table sx={{ minWidth: 650 }} aria-label="stellarator table">
          <TableHead>
            <TableRow>
              <TableCell>Actions</TableCell>
              <TableCell><Search label="rbc(0,0)" onChange={handleSearchChange("rbc_0_0")} /></TableCell>
              <TableCell><Search label="rbc(1,0)" onChange={handleSearchChange("rbc_1_0")} /></TableCell>
              <TableCell><Search label="rbc(-1,1)" onChange={handleSearchChange("rbc_m1_1")} /></TableCell>
              <TableCell><Search label="zbs(0,0)" onChange={handleSearchChange("zbs_0_0")} /></TableCell>
              <TableCell><Search label="zbs(1,0)" onChange={handleSearchChange("zbs_1_0")} /></TableCell>
              <TableCell><Search label="nfp" onChange={handleSearchChange("number_of_field_periods_nfp")} /></TableCell>
              <TableCell><Search label="Qsym" onChange={handleSearchChange("quasisymmetry")} /></TableCell>
              <TableCell><Search label="Qiso" onChange={handleSearchChange("quasiisodynamic")} /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Actions</TableCell>
              <TableCell>rbc(0,0)</TableCell>
              <TableCell>rbc(1,0)</TableCell>
              <TableCell>rbc(-1,1)</TableCell>
              <TableCell>zbs(0,0)</TableCell>
              <TableCell>zbs(1,0)</TableCell>
              <TableCell>nfp</TableCell>
              <TableCell>quasisymmetry</TableCell>
              <TableCell>quasiisodynamic</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configs.map((config) => (
              <TableRow key={config.id}>
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
                <TableCell>{config.rbc_0_0}</TableCell>
                <TableCell>{config.rbc_1_0}</TableCell>
                <TableCell>{config.rbc_m1_1}</TableCell>
                <TableCell>{config.zbs_0_0}</TableCell>
                <TableCell>{config.zbs_1_0}</TableCell>
                <TableCell>{config.number_of_field_periods_nfp}</TableCell>
                <TableCell>{config.quasisymmetry}</TableCell>
                <TableCell>{config.quasiisodynamic}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default StellaratorTable;
