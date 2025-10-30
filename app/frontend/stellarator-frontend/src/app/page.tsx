//  "use client"
 
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import StellaratorTable from "./components/table"; // Adjust the import path

//  const ConfigList = () => {
//  const [configs, setConfigs] = useState([]);

//   useEffect(() => {
//     axios.get("https://stellarator.physics.wisc.edu/backend/api/configs")
//       .then(response => {
//         console.log("API Response:", response.data);
//         setConfigs(response.data);
//       })
//       .catch(error => {
//         console.error("API Error:", error.message);
//         // Optionally set some error state
//         // setError(error.message);
//       });
//   }, []);

//   return (
//     <div>
//       <header
//   style={{
//     backgroundColor: '#c5050c',
//     padding: '2.5rem 0',         
//     marginTop: '1rem',
//     textAlign: 'center',
//     color: 'white',
//     fontSize: '2.75rem',           
//     fontWeight: 'bold',
//     boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
//   }}
// >
//   UWPlasma Stellarators
// </header>
  
//       <main
//         style={{
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//           justifyContent: 'center',
//           minHeight: '100vh',
//           paddingTop: '3rem',
//           paddingBottom: '3rem',
//           textAlign: 'center',
//         }}
//       >
//         <h1
//   style={{
//     fontSize: '2.5rem',
//     fontWeight: 'bold',
//     marginBottom: '30px',
//     color: '#2c3e50',
//     whiteSpace: 'nowrap',       
//     overflow: 'hidden',   
//     textOverflow: 'ellipsis',   
//   }}
// >
//   Stellarator Database at the University of Wisconsin-Madison
// </h1>
  
//         <div
//           className="image-explanation"
//           style={{
//             marginTop: '20px',
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             gap: '1rem',
//             maxWidth: '700px',
//           }}
//         >
//           <div className="explanation">
//             <p className="explanation-1">
//               You can visit our group's website{" "}
//               <a
//                 href="https://rogerio.physics.wisc.edu"
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 here.
//               </a>
//             </p>
  
//             <p className="explanation-1">
//               All of our codes are open source and available{" "}
//               <a
//                 href="https://github.com/uwplasma"
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 here.
//               </a>
//             </p>
  
//             <p className="explanation-2">
//               Please explore our database below. It contains a list of
//               quasisymmetric stellarators created using the near-axis expansion.
//               The database and its use to develop a machine learning model are
//               explained in our publication{" "}
//               <a
//                 href="https://arxiv.org/abs/2409.00564"
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 here.
//               </a>
//             </p>
//           </div>
  
//           <div className="image">
//             <video
//               width="400"
//               autoPlay
//               muted
//               loop
//               style={{ backgroundColor: "white", borderRadius: "10px" }}
//             >
//               <source src="/StelleratorRecording.mp4" type="video/mp4" />
//               Your browser does not support HTML5 video.
//             </video>
//           </div>
//         </div>
  
//         <div className="table-container" style={{ marginTop: "3rem", width: "100%" }}>
//           <StellaratorTable />
//         </div>
//       </main>
  
//       <footer
//         style={{
//           marginTop: "3rem",
//           padding: "1rem",
//           textAlign: "center",
//           fontSize: "0.9rem",
//           color: "#888",
//         }}
//       >
//         © 2025 University of Wisconsin-Madison Stellarator Repository
//       </footer>
//     </div>
//   );
// };
  

// export default ConfigList;


// "use client"

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import StellaratorTable from "./components/table"; // Adjust the import path

// const ConfigList = () => {
//   const [configs, setConfigs] = useState([]);

//   useEffect(() => {
//     axios.get("https://stellarator.physics.wisc.edu/backend/api/configs")
//       .then(response => {
//         console.log("API Response:", response.data);
//         setConfigs(response.data);
//       })
//       .catch(error => {
//         console.error("API Error:", error.message);
//       });
//   }, []);

//   return (
//     <div>
//       {/* Removed red header */}

//       <main
//         style={{
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//           justifyContent: 'center',
//           minHeight: '100vh',
//           paddingTop: '3rem',
//           paddingBottom: '3rem',
//           textAlign: 'center',
//         }}
//       >
//         <h1
//           style={{
//             fontSize: '2.5rem',
//             fontWeight: 'bold',
//             marginBottom: '30px',
//             color: '#2c3e50',
//             whiteSpace: 'nowrap',
//             overflow: 'hidden',
//             textOverflow: 'ellipsis',
//           }}
//         >
//           Stellarator Database at the University of Wisconsin-Madison
//         </h1>

//         {/* Removed writing + video, but left blank space */}
//         <div
//           style={{
//             marginTop: '100px',   // keeps the blank space
//             marginBottom: '100px' // adds vertical spacing
//           }}
//         />

//         <div className="table-container" style={{ marginTop: "3rem", width: "100%" }}>
//           <StellaratorTable />
//         </div>
//       </main>

//       <footer
//         style={{
//           marginTop: "3rem",
//           padding: "1rem",
//           textAlign: "center",
//           fontSize: "0.9rem",
//           color: "#888",
//         }}
//       >
//         © 2025 University of Wisconsin-Madison Stellarator Repository
//       </footer>
//     </div>
//   );
// };

// export default ConfigList;

"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Slider from "@mui/material/Slider";
import StellaratorTable from "./components/table";

type Row = { id?: number | string; [k: string]: any };

const numericCols = [
  "rbc_0_0",
  "rbc_1_0",
  "rbc_m1_1",
  "rbc_0_1",
  "rbc_1_1",
  "zbs_0_0",
  "zbs_1_0",
  "zbs_m1_1",
  "zbs_0_1",
  "zbs_1_1",
  "quasisymmetry",
  "quasiisodynamic",
  "rotational_transform",
  "inverse_aspect_ratio",
  "mean_local_magnetic_shear",
  "vacuum_magnetic_well",
  "maximum_elongation",
  "mirror_ratio",
  "numberoffieldperiodsnfp",
];

const Page: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ranges, setRanges] = useState<{ [key: string]: [number, number] }>({});

  useEffect(() => {
    axios
      .get("https://stellarator.physics.wisc.edu/backend/api/configs")
      .then((res) => {
        console.log("API raw response:", res.data); // 👈 this helps debug
  
        let data: Row[] = [];
  
        // Case 1: API directly gives an array
        if (Array.isArray(res.data)) {
          data = res.data;
        }
        // Case 2: API wraps it inside "configs"
        else if (res.data.configs && Array.isArray(res.data.configs)) {
          data = res.data.configs;
        }
        // Unexpected format
        else {
          setErr("Unexpected API format");
          return;
        }
  
        setRows(data);
  
        const initRanges: { [key: string]: [number, number] } = {};
const firstRow = data[0] || {};

Object.keys(firstRow).forEach((col) => {
  const vals = data.map((r) => Number(r[col])).filter((v) => !isNaN(v));
  if (vals.length > 0) {
    initRanges[col] = [Math.min(...vals), Math.max(...vals)];
  }
});

console.log("Detected numeric columns:", Object.keys(initRanges));
setRanges(initRanges);
      })
      .catch((e) => {
        console.error("API Error:", e.message);
        setErr(e?.message || "Failed to load");
      });
  }, []);
  

  const filtered = useMemo(() => {
    return rows.filter((r) =>
      Object.entries(ranges).every(([col, [min, max]]) => {
        const v = Number(r[col]);
        if (isNaN(v)) return true;
        return v >= min && v <= max;
      })
    );
  }, [rows, ranges]);

  const updateRange = (col: string, newRange: [number, number]) => {
    setRanges((prev) => ({ ...prev, [col]: newRange }));
  };

  return (
    <main style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <h1>Stellarator Configs with Filters</h1>
      {err && <div style={{ color: "red", margin: "1rem 0" }}>{err}</div>}

      {/*<pre>{JSON.stringify(ranges, null, 2)}</pre>*/}

      {Object.keys(ranges).length === 0 && <div>No sliders to show (ranges is empty)</div>}

      <div style={{ marginBottom: 32 }}>
        {Object.entries(ranges).map(([col, [min, max]]) => (
          <div
            key={col}
            style={{
              border: "1px solid #ccc",
              borderRadius: 10,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: 10 }}>
              {col}: {min.toFixed(3)} — {max.toFixed(3)}
            </div>
            <Slider
              value={[min, max]}
              min={Math.min(...rows.map((r) => Number(r[col]) || 0))}
              max={Math.max(...rows.map((r) => Number(r[col]) || 0))}
              step={0.001}
              onChange={(e, newVal) => updateRange(col, newVal as [number, number])}
              valueLabelDisplay="auto"
              sx={{ width: 320 }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 10 }}>
        Showing <b>{filtered.length}</b> of {rows.length} rows
      </div>

      <StellaratorTable configs={filtered} />
    </main>
  );
};

export default Page;
