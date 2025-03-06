"use client"

import React, { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import Link from "next/link";

// Dynamically import react-plotly.js with SSR disabled
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface PlotViewProps {
  configId: string;
}

export default function PlotView({ configId }: PlotViewProps) {
  const [plotData, setPlotData] = useState("");
  const [interactivePlot, setInteractivePlot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (configId) {
      setLoading(true);
      axios.get(`http://127.0.0.1:5000/api/plot/${configId}`)
        .then(response => {
          setPlotData(response.data.plot_data);
          if (response.data.interactive_data) {
            try {
              const plotlyData = JSON.parse(response.data.interactive_data);
              setInteractivePlot(plotlyData);
            } catch (e) {
              console.error("Error parsing interactive plot data:", e);
            }
          }
          setLoading(false);
        })
        .catch(error => {
          console.error(error);
          setLoading(false);
        });
    }
  }, [configId]);

  return (
    <div className="container mt-5">
      <h1 className="text-2xl font-bold mb-4">Stellarator Plot</h1>
      
      {loading ? (
        <p>Loading plot...</p>
      ) : interactivePlot ? (
        <div className="interactive-plot-container">
          <Plot
            data={interactivePlot.data}
            layout={interactivePlot.layout}
            config={{ responsive: true }}
            style={{ width: "100%", height: "600px" }}
          />
        </div>
      ) : plotData ? (
        <img
          src={`data:image/png;base64,${plotData}`}
          alt="Stellarator Plot"
          style={{ width: "100%" }}
        />
      ) : (
        <p>Failed to load plot.</p>
      )}
      
      <div className="mt-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          Back to Configuration List
        </Link>
      </div>
    </div>
  );
}