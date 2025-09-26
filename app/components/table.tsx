// "use client";

// import React, { useState } from "react";
// import { DataGrid, GridFilterModel, GridRowId } from "@mui/x-data-grid";
// import Paper from "@mui/material/Paper";
// import Button from "@mui/material/Button";

// type StellaratorTableProps = {
//   configs: any[]; // Consider defining a type/interface if you know the structure
// };

// function StellaratorTable({ configs }: StellaratorTableProps) {
//   const [selectedRowIds, setSelectedRowIds] = useState<GridRowId[]>([]);

//   const columns = [
//     { field: "id", headerName: "ID", width: 70 },
//     { field: "rbc_0_0", headerName: "rbc(0,0)", width: 120 },
//     { field: "rbc_1_0", headerName: "rbc(1,0)", width: 120 },
//     { field: "rbc_m1_1", headerName: "rbc(-1,1)", width: 120 },
//     { field: "rbc_0_1", headerName: "rbc(0,1)", width: 120 },
//     { field: "rbc_1_1", headerName: "rbc(1,1)", width: 120 },
//     { field: "zbs_0_0", headerName: "zbs(0,0)", width: 120 },
//     { field: "zbs_1_0", headerName: "zbs(1,0)", width: 120 },
//     { field: "zbs_m1_1", headerName: "zbs(-1,1)", width: 120 },
//     { field: "zbs_0_1", headerName: "zbs(0,1)", width: 120 },
//     { field: "zbs_1_1", headerName: "zbs(1,1)", width: 120 },
//     { field: "quasisymmetry", headerName: "Quasisymmetry", width: 130 },
//     { field: "quasiisodynamic", headerName: "Quasiisodynamic", width: 130 },
//     { field: "rotational_transform", headerName: "Rotational Transform", width: 150 },
//     { field: "inverse_aspect_ratio", headerName: "Inverse Aspect Ratio", width: 160 },
//     { field: "mean_local_magnetic_shear", headerName: "⟨Local Magnetic Shear⟩", width: 180 },
//     { field: "vacuum_magnetic_well", headerName: "Vacuum Magnetic Well", width: 160 },
//     { field: "maximum_elongation", headerName: "Max Elongation", width: 130 },
//     { field: "mirror_ratio", headerName: "Mirror Ratio", width: 120 },
//     { field: "number_of_field_periods_nfp", headerName: "NFP", width: 80 },
//     {
//       field: "plot",
//       headerName: "Plot",
//       width: 100,
//       renderCell: (params: any) => (
//         <Button
//           variant="contained"
//           size="small"
//           onClick={(e) => {
//             e.stopPropagation();
//             window.open(`/plot/vmec_folder/${params.row.id}`, "_blank");
//           }}
//         >
//           View
//         </Button>
//       )
//     }
//   ];

//   return (
//     <Paper sx={{ height: 600, width: "100%", marginTop: "50px", padding: "1rem" }}>
//       <h2>Select a Stellarator Configuration</h2>

//       <Button
//         variant="contained"
//         color="primary"
//         onClick={() => {
//           if (selectedRowIds.length > 5) {
//             if (!confirm(`You're about to open ${selectedRowIds.length} tabs. Continue?`)) return;
//           }

//           selectedRowIds.forEach((id, index) => {
//             setTimeout(() => {
//               window.open(`/plot/vmec_folder/${id}`, "_blank");
//             }, 800 * index); // Avoid popup blocker
//           });
//         }}
//         disabled={selectedRowIds.length === 0}
//         sx={{ marginBottom: 2 }}
//       >
//         Open All Selected ({selectedRowIds.length})
//       </Button>

//       <DataGrid
//         rows={configs}
//         columns={columns}
//         getRowId={(row) => row.id}
//         pagination
//         pageSizeOptions={[25, 50, 100]}
//         checkboxSelection
//         disableRowSelectionOnClick
//         rowSelectionModel={selectedRowIds}
//         onRowSelectionModelChange={(newSelection) => {
//           setSelectedRowIds(newSelection as GridRowId[]);
//         }}
//         sx={{ border: 0 }}
//       />
//     </Paper>
//   );
// }

// export default StellaratorTable;

"use client";

import React, { useState } from "react";
import { DataGrid, GridRowId } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";

type StellaratorTableProps = {
  configs: any[];
};

const StellaratorTable = ({ configs }: StellaratorTableProps) => {
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowId[]>([]);

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "rbc_0_0", headerName: "rbc(0,0)", width: 120 },
    { field: "rbc_1_0", headerName: "rbc(1,0)", width: 120 },
    { field: "rbc_m1_1", headerName: "rbc(-1,1)", width: 120 },
    { field: "rbc_0_1", headerName: "rbc(0,1)", width: 120 },
    { field: "rbc_1_1", headerName: "rbc(1,1)", width: 120 },
    { field: "zbs_0_0", headerName: "zbs(0,0)", width: 120 },
    { field: "zbs_1_0", headerName: "zbs(1,0)", width: 120 },
    { field: "zbs_m1_1", headerName: "zbs(-1,1)", width: 120 },
    { field: "zbs_0_1", headerName: "zbs(0,1)", width: 120 },
    { field: "zbs_1_1", headerName: "zbs(1,1)", width: 120 },
    { field: "quasisymmetry", headerName: "Quasisymmetry", width: 130 },
    { field: "quasiisodynamic", headerName: "Quasiisodynamic", width: 130 },
    { field: "rotational_transform", headerName: "Rotational Transform", width: 150 },
    { field: "inverse_aspect_ratio", headerName: "Inverse Aspect Ratio", width: 160 },
    { field: "mean_local_magnetic_shear", headerName: "⟨Local Magnetic Shear⟩", width: 180 },
    { field: "vacuum_magnetic_well", headerName: "Vacuum Magnetic Well", width: 160 },
    { field: "maximum_elongation", headerName: "Max Elongation", width: 130 },
    { field: "mirror_ratio", headerName: "Mirror Ratio", width: 120 },
    { field: "number_of_field_periods_nfp", headerName: "NFP", width: 80 },
  ];

  return (
    <Paper sx={{ height: 600, width: "100%", marginTop: "30px", padding: "1rem" }}>
      <h2>Stellarator Configurations</h2>

      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          if (selectedRowIds.length > 5) {
            if (!confirm(`Opening ${selectedRowIds.length} tabs. Continue?`)) return;
          }
          selectedRowIds.forEach((id, i) => {
            setTimeout(() => {
              window.open(`/plot/vmec_folder/${id}`, "_blank");
            }, 800 * i);
          });
        }}
        disabled={selectedRowIds.length === 0}
        sx={{ marginBottom: 2 }}
      >
        Open All Selected ({selectedRowIds.length})
      </Button>

      <DataGrid
        rows={configs}
        columns={columns}
        getRowId={(row) => row.id}
        pagination
        pageSizeOptions={[25, 50, 100]}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={selectedRowIds}
        onRowSelectionModelChange={(sel) => setSelectedRowIds(sel as GridRowId[])}
        sx={{ border: 0 }}
      />
    </Paper>
  );
};

export default StellaratorTable;