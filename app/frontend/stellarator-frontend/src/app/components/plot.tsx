"use client"

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import Link from "next/link";

interface Camera {
  eye: { x: number; y: number; z: number };
  center: { x: number; y: number; z: number };
  up: { x: number; y: number; z: number };
}

// Dynamically import react-plotly.js with SSR disabled
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

interface PlotViewProps {
  configId: string;
}

export default function PlotView({ configId }: PlotViewProps) {
  // State for boundary plot
  const [plotData, setPlotData] = useState("");
  const [interactivePlot, setInteractivePlot] = useState<any>(null);

  // State for configuration metadata
  const [configData, setConfigData] = useState<any>(null);

  // State for diagnostic plots
  const [gridPlotData, setGridPlotData] = useState("");
  const [individualPlots, setIndividualPlots] = useState<Record<string, any>>({});
  const [availablePlots, setAvailablePlots] = useState<string[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<string>("");

  // Axis scale types for diagnostic plots (linear or log)
  const [xAxisScale, setXAxisScale] = useState<"linear" | "log">("linear");
  const [yAxisScale, setYAxisScale] = useState<"linear" | "log">("linear");

  const [loading, setLoading] = useState(true);

  // Add these state variables near your other useState declarations
  const [isRotating, setIsRotating] = useState(false);
  const rotationRef = useRef<number | null>(null);
  // Add this ref near your other refs
  const angleRef = useRef(0);

  // Add these state variables
  const animationRef = useRef<any>(null);

  // Add these refs for storing camera state
  const initialCameraRef = useRef<any>(null);
  const radiusRef = useRef<number>(1.2);

  // Add a ref to store the camera
  const cameraRef = useRef<Partial<Camera>>({
    eye: { x: 1.2, y: 0, z: 0.5 },
    center: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 0, z: 1 }
  });

  // Helper function to download files properly (works across all browsers)
  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  useEffect(() => {
    if (configId) {
      setLoading(true);

      // Set up API requests
      const boundaryRequest = axios.get(`${process.env.NEXT_PUBLIC_API_URL}/plot/${configId}`);
      const gridRequest = axios.get(`${process.env.NEXT_PUBLIC_API_URL}/grid/${configId}`);
      const configRequest = axios.get(`${process.env.NEXT_PUBLIC_API_URL}/download/${configId}?format=json`);
      
      // Execute all requests in parallel
      Promise.all([boundaryRequest, gridRequest, configRequest])
        .then(([boundaryResponse, gridResponse, configResponse]) => {
          // Store config metadata for download section
          setConfigData(configResponse.data);

          // Process boundary plot data
          setPlotData(boundaryResponse.data.plot_data);
          if (boundaryResponse.data.interactive_data) {
            try {
              const plotlyData = JSON.parse(boundaryResponse.data.interactive_data);
              setInteractivePlot(plotlyData);
            } catch (e) {
              console.error("Error parsing boundary plot data:", e);
            }
          }
          
          // Process individual diagnostic plots
          setGridPlotData(gridResponse.data.plot_data);
          if (gridResponse.data.interactive_data) {
            try {
              // Process all the individual plots
              const plots: Record<string, any> = {};
              const plotNames: string[] = [];
              
              // Parse each individual plot
              for (const [name, plotString] of Object.entries(gridResponse.data.interactive_data)) {
                if (typeof plotString === 'string') {
                  plots[name] = JSON.parse(plotString);
                  plotNames.push(name);
                }
              }
              
              setIndividualPlots(plots);
              setAvailablePlots(plotNames);
              
              // Set initial selected plot if available
              if (plotNames.length > 0) {
                setSelectedPlot(plotNames[0]);
              }
            } catch (e) {
              console.error("Error parsing individual diagnostic plots:", e);
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

  useEffect(() => {
    // Stop if no data or not rotating
    if (!interactivePlot || !isRotating) {
      if (rotationRef.current) {
        cancelAnimationFrame(rotationRef.current);
        rotationRef.current = null;
      }
      return;
    }

    // Rotation function
    const animate = () => {
      const camera = cameraRef.current;
      if (!camera || !camera.eye) {
        // Fallback if camera is missing
        rotationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Compute radius & angle on the fly
      const radius = Math.sqrt(camera.eye.x * camera.eye.x + camera.eye.y * camera.eye.y);
      const angle = Math.atan2(camera.eye.y, camera.eye.x);

      // Move along the circle, preserving existing zoom (eye.z)
      const newLayout = {
        ...interactivePlot.layout,
        scene: {
          ...interactivePlot.layout.scene,
          camera: {
            eye: {
              x: Math.cos(angleRef.current) * radius,
              y: Math.sin(angleRef.current) * radius,
              z: camera.eye.z
            },
            center: camera.center,
            up: camera.up
          }
        }
      };

      setInteractivePlot((prev: any) => ({
        ...prev,
        layout: newLayout
      }));

      // Increment angle for next frame
      angleRef.current += 0.02;

      // Keep going if still rotating
      if (isRotating) {
        rotationRef.current = requestAnimationFrame(animate);
      }
    };

    // Start animation
    rotationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (rotationRef.current) {
        cancelAnimationFrame(rotationRef.current);
        rotationRef.current = null;
      }
    };
  }, [isRotating, interactivePlot]); // We do include interactivePlot so we update the layout keys if changed

  // Add toggle function
  const toggleRotation = () => {
    setIsRotating(prev => !prev);
  };

  // Add onRelayout handler to capture new camera on user zoom/pan
  function handleRelayout(relayoutData: any) {
    if (relayoutData["scene.camera"]) {
      cameraRef.current = relayoutData["scene.camera"];
    }
  }

  return (
    <div className="container mt-5" style={{ padding: '40px 20px 0 20px' }}>
      <div style={{
        marginBottom: '40px',
        textAlign: 'left'
      }}>
        <h3 style={{
          fontSize: '1rem',
          
          margin: 0,
          color: '#1a1a1a'
        }}>Stellarator Configuration <strong>{configId}</strong></h3>
      </div>

      {loading ? (
        <p>Loading visualizations...</p>
      ) : (
        <>
          {/* Side-by-side plots container */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', flexWrap: 'wrap' }}>
            {/* Boundary Visualization */}
            <section style={{ flex: '1', minWidth: '400px', textAlign: 'center' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '20px',
                color: '#1a1a1a'
              }}>Boundary Visualization</h2>
              {interactivePlot ? (
                <div style={{ position: 'relative' }}>
                  <Plot
                    data={interactivePlot.data}
                    layout={interactivePlot.layout}
                    config={{ responsive: true }}
                    style={{ width: "100%", maxWidth: "500px", height: "450px", border: "4px solid #d1d5db", borderRadius: "8px", margin: "0 auto" }}
                    onRelayout={handleRelayout}
                  />
                  <button
                    onClick={toggleRotation}
                    style={{
                      marginTop: '12px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  >
                    {isRotating ? "Stop Rotation" : "Auto-Rotate"}
                  </button>
                </div>
              ) : plotData ? (
                <img
                  src={`data:image/png;base64,${plotData}`}
                  alt="Stellarator Boundary Plot"
                  style={{ width: "100%", maxWidth: "500px" }}
                />
              ) : (
                <p>Failed to load boundary visualization.</p>
              )}
            </section>

            {/* Diagnostic Plots with Selection */}
            <section style={{ flex: '1', minWidth: '300px', textAlign: 'center' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#1a1a1a'
            }}>Diagnostic Plots</h2>

            {availablePlots.length > 0 ? (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <label
                    htmlFor="plot-selector"
                    style={{
                      display: 'block',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      marginBottom: '12px',
                      color: '#374151'
                    }}
                  >
                    Select diagnostic plot:
                  </label>
                  <select
                    id="plot-selector"
                    value={selectedPlot}
                    onChange={(e) => setSelectedPlot(e.target.value)}
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '1rem',
                      width: '100%',
                      maxWidth: '400px',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {availablePlots.map((plotName) => (
                      <option key={plotName} value={plotName}>
                        {plotName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Axis Scale Selectors */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <label
                      htmlFor="x-scale"
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        marginRight: '8px',
                        color: '#374151'
                      }}
                    >
                      X-Axis Scale:
                    </label>
                    <select
                      id="x-scale"
                      value={xAxisScale}
                      onChange={(e) => setXAxisScale(e.target.value as "linear" | "log")}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.9rem',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="linear">Linear</option>
                      <option value="log">Log</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="y-scale"
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        marginRight: '8px',
                        color: '#374151'
                      }}
                    >
                      Y-Axis Scale:
                    </label>
                    <select
                      id="y-scale"
                      value={yAxisScale}
                      onChange={(e) => setYAxisScale(e.target.value as "linear" | "log")}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.9rem',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="linear">Linear</option>
                      <option value="log">Log</option>
                    </select>
                  </div>
                </div>

                {/* Display the selected diagnostic plot */}
                {selectedPlot && individualPlots[selectedPlot] ? (
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <Plot
                      data={individualPlots[selectedPlot].data}
                      layout={{
                        ...individualPlots[selectedPlot].layout,
                        autosize: true,
                        width: undefined,
                        height: undefined,
                        xaxis: {
                          ...individualPlots[selectedPlot].layout?.xaxis,
                          type: xAxisScale
                        },
                        yaxis: {
                          ...individualPlots[selectedPlot].layout?.yaxis,
                          type: yAxisScale
                        }
                      }}
                      config={{
                        responsive: true,
                        toImageButtonOptions: {
                          format: 'png',
                          filename: `stellarator_${configId}_${selectedPlot}`,
                          height: 800,
                          width: 1200,
                          scale: 2  // Higher resolution for saved images
                        }
                      }}
                      style={{ width: "100%", maxWidth: "calc(100% - 40px)", height: "350px", margin: "0 auto", border: "4px solid #d1d5db", borderRadius: "8px" }}
                      useResizeHandler={true}
                    />
                    <p style={{
                      marginTop: '12px',
                      color: '#6b7280',
                      fontSize: '0.9rem',
                      fontStyle: 'italic'
                    }}>
                      Tip: Click the camera icon to download this plot as an image
                    </p>
                  </div>
                ) : (
                  <p>Selected plot not available</p>
                )}
              </div>
            ) : gridPlotData ? (
              // Fallback to static image if no interactive plots
              <img
                src={`data:image/png;base64,${gridPlotData}`}
                alt="Stellarator Diagnostic Plot"
                style={{ width: "100%" }}
              />
            ) : (
              <p>Failed to load diagnostic plots.</p>
            )}
          </section>
          </div>

          {/* Divider line */}
          <hr style={{
            border: 'none',
            borderTop: '1px solid rgba(0, 0, 0, 0.15)',
            marginTop: '40px',
            marginBottom: '40px',
            width: '100%'
          }} />

          {/* Run Configuration Data Section */}
          <section style={{
            marginBottom: '40px'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '30px',
              color: '#1a1a1a'
            }}>Run Configuration Data</h2>

            {/* Subsection 1: Fetch directly from API */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#374151',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px'
              }}>Fetch directly from API</h3>
              <p style={{
                fontSize: '0.9rem',
                color: '#6b7280',
                marginBottom: '16px'
              }}>
                Fetch configuration data directly from our API using Python requests:
              </p>
              <pre style={{
                backgroundColor: '#1f2937',
                color: '#4ade80',
                padding: '16px',
                borderRadius: '8px',
                overflowX: 'auto',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                margin: 0
              }}>
                <code>{`# pip install qsc requests
from qsc import Qsc
import requests

ID_CONFIG = ${configId}
url = f"https://stellarator.physics.wisc.edu/backend/api/download/{ID_CONFIG}?format=json"

config = requests.get(url).json()
stel = Qsc(
    rc=[1, config['rc1'], config['rc2'], config['rc3']],
    zs=[0, config['zs1'], config['zs2'], config['zs3']],
    nfp=config['nfp'], etabar=config['etabar'],
    I2=0., order='r3', B2c=config['B2c'], p2=config['p2']
)

stel.plot()`}</code>
              </pre>
            </div>

            {/* Subsection 2: Download and use locally */}
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#374151',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px'
              }}>Download and use locally</h3>

              {/* Download Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                  onClick={() => downloadFile(`${process.env.NEXT_PUBLIC_API_URL}/download/${configId}?format=csv`, `stellarator_config_${configId}.csv`)}
                  style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    fontWeight: '600',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                >
                  Download CSV
                </button>
                <button
                  onClick={() => downloadFile(`${process.env.NEXT_PUBLIC_API_URL}/download/${configId}?format=json`, `stellarator_config_${configId}.json`)}
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontWeight: '600',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  Download JSON
                </button>
                <button
                  onClick={() => downloadFile(`${process.env.NEXT_PUBLIC_API_URL}/download/${configId}?format=txt`, `stellarator_config_${configId}.txt`)}
                  style={{
                    backgroundColor: '#9333ea',
                    color: 'white',
                    fontWeight: '600',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7e22ce'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9333ea'}
                >
                  Download TXT
                </button>
              </div>

              {/* Code Snippets for local use */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Pandas snippet */}
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: '#374151'
                  }}>Load with Python (pandas)</h4>
                  <pre style={{
                    backgroundColor: '#1f2937',
                    color: '#4ade80',
                    padding: '16px',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    margin: 0
                  }}>
                    <code>{`import pandas as pd

# Update the path to where you saved the downloaded file
data = pd.read_csv('/path/to/stellarator_config_${configId}.csv')
print(data)`}</code>
                  </pre>
                </div>

                {/* qsc snippet */}
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: '#374151'
                  }}>Use with qsc (Near-Axis Expansion)</h4>
                  <pre style={{
                    backgroundColor: '#1f2937',
                    color: '#4ade80',
                    padding: '16px',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    margin: 0
                  }}>
                    <code>{`from qsc import Qsc

# Create stellarator configuration
stel = Qsc(
    rc=[1, ${configData?.rc1 ?? 'rc1'}, ${configData?.rc2 ?? 'rc2'}, ${configData?.rc3 ?? 'rc3'}],
    zs=[0, ${configData?.zs1 ?? 'zs1'}, ${configData?.zs2 ?? 'zs2'}, ${configData?.zs3 ?? 'zs3'}],
    nfp=${configData?.nfp ?? 'nfp'},
    etabar=${configData?.etabar ?? 'etabar'},
    B2c=${configData?.B2c ?? 'B2c'},
    p2=${configData?.p2 ?? 'p2'}
)

# Plot the stellarator
stel.plot()`}</code>
                  </pre>
                </div>

                {/* ESSOS snippet */}
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: '#374151'
                  }}>Use with ESSOS (Alternative)</h4>
                  <pre style={{
                    backgroundColor: '#1f2937',
                    color: '#4ade80',
                    padding: '16px',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    margin: 0
                  }}>
                    <code>{`from essos.fields import near_axis as Qsc

# Create stellarator configuration (same parameters as qsc)
stel = Qsc(
    rc=[1, ${configData?.rc1 ?? 'rc1'}, ${configData?.rc2 ?? 'rc2'}, ${configData?.rc3 ?? 'rc3'}],
    zs=[0, ${configData?.zs1 ?? 'zs1'}, ${configData?.zs2 ?? 'zs2'}, ${configData?.zs3 ?? 'zs3'}],
    nfp=${configData?.nfp ?? 'nfp'},
    etabar=${configData?.etabar ?? 'etabar'}
)`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="mt-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          Back to Configuration List
        </Link>
      </div>
    </div>
  );
}
