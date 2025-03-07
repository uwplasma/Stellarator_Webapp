"use client"

import React, { useEffect, useState } from "react";
import axios from "axios";
import StellaratorTable from "./components/table"; // Adjust the import path

const ConfigList = () => {
  const [configs, setConfigs] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/configs")
      .then(response => {
        console.log("API Response:", response.data);
        setConfigs(response.data);
      })
      .catch(error => {
        console.error("API Error:", error.message);
        // Optionally set some error state
        // setError(error.message);
      });
  }, []);

  return (
    <div className="header-container">
      <header className="tiny-header">
        <h1>QUASAR Stellarators</h1>
      </header>
      <h1>A Repository of Quasi-symmetric Stellarator Designs </h1>
      <div className="image-explanation" style={{ marginTop: "100px" }}>
        <div className="explanation">
          <p className="explanation-1">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vehicula auctor metus,
            The QUASAR repository houses a vast collection of over 370,000 innovative, curl-free stellarator
            configurations, each paired with optimized coil sets designed to achieve volume quasi-symmetry.
          </p>
          <p className="explanation-2">
            With the "Launch Navigator" feature, you can explore the QUASAR database effortlessly. Identify
            configurations that capture your interest and dive deeper with a single click to access detailed views.
            Each record offers in-depth information, including interactive 3D models, magnetic field configurations,
            and Poincaré plots for comprehensive analysis.
          </p>
        </div>
        <div className="image">
          <video 
            width="400" 
            
            autoPlay
            muted // Required for autoplay in most browsers
            loop // Optional: if you want it to repeat
            style={{ backgroundColor: "white" }}
          >
            <source src="/StelleratorRecording.mp4" type="video/mp4" />
            Your browser does not support HTML5 video.
          </video>
        </div>
      </div>

      <div className="table-container">
        <StellaratorTable />
      </div>

      <footer className="footer">
        <p>© 2025 QUASAR Stellarator Repository | All Rights Reserved</p>
      </footer>
    </div>
  );
}

export default ConfigList;