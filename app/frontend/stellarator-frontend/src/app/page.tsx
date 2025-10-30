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
