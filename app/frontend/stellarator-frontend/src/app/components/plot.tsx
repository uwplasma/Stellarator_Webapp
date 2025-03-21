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
  
  // State for diagnostic plots
  const [gridPlotData, setGridPlotData] = useState("");
  const [individualPlots, setIndividualPlots] = useState<Record<string, any>>({});
  const [availablePlots, setAvailablePlots] = useState<string[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<string>("");
  
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

  useEffect(() => {
    if (configId) {
      setLoading(true);
      
      // Set up API requests
      const boundaryRequest = axios.get(`https://stellarator.physics.wisc.edu/backend/api/plot/${configId}`);
      const gridRequest = axios.get(`https://stellarator.physics.wisc.edu/backend/api/grid/${configId}`);
      
      // Execute both requests in parallel
      Promise.all([boundaryRequest, gridRequest])
        .then(([boundaryResponse, gridResponse]) => {
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
    <div className="container mt-5">
      <h1 className="text-2xl font-bold mb-4">Stellarator Configuration {configId}</h1>
      
      {loading ? (
        <p>Loading visualizations...</p>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-3">Boundary Visualization</h2>
            {interactivePlot ? (
              <div className="flex justify-left">
                <Plot 
                  data={interactivePlot.data}
                  layout={interactivePlot.layout}
                  config={{ responsive: true }}
                  style={{ width: "100%", height: "600px" }}
                  onRelayout={handleRelayout}
                />
                <button
                  onClick={toggleRotation}
                  className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md shadow-sm text-sm"
                >
                  {isRotating ? "Stop Rotation" : "Auto-Rotate"}
                </button>
              </div>
            ) : plotData ? (
              <img
                src={`data:image/png;base64,${plotData}`}
                alt="Stellarator Boundary Plot"
                style={{ width: "100%" }}
              />
            ) : (
              <p>Failed to load boundary visualization.</p>
            )}
          </section>
          
          {/* Diagnostic Plots with Selection */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-3">Diagnostic Plots</h2>
            
            {availablePlots.length > 0 ? (
              <div>
                <div className="mb-4">
                  <label htmlFor="plot-selector" className="block text-sm font-medium mb-2">
                    Select diagnostic plot:
                  </label>
                  <select
                    id="plot-selector"
                    className="border rounded px-3 py-2 w-full max-w-md"
                    value={selectedPlot}
                    onChange={(e) => setSelectedPlot(e.target.value)}
                  >
                    {availablePlots.map((plotName) => (
                      <option key={plotName} value={plotName}>
                        {plotName}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Display the selected diagnostic plot */}
                {selectedPlot && individualPlots[selectedPlot] ? (
                  <div className="individual-plot-container bg-gray-50 p-4 rounded">
                    <Plot
                      data={individualPlots[selectedPlot].data}
                      layout={individualPlots[selectedPlot].layout}
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
                      style={{ width: "100%", height: "600px" }}
                    />
                    <div className="text-center mt-2 text-gray-600">
                      <p>Tip: Click the camera icon to download this plot as an image</p>
                    </div>
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
