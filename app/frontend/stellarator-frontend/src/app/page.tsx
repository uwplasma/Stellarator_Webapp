"use client"

import React, { useEffect, useState } from "react";
import axios from "axios";
import StellaratorTable from "./components/table"; // Adjust the import path

const ConfigList = () => {
  const [configs, setConfigs] = useState([]);

  useEffect(() => {
    axios.get("https://stellarator.physics.wisc.edu/app/backend/api/configs")
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
        <h1>UWPlasma Stellarators</h1>
      </header>
      <h1 style={{ 
        textAlign: 'center',
        fontSize: '2.5rem', 
        fontWeight: 'bold',
        marginBottom: '30px',
        color: '#2c3e50',
        width: '100%',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        Stellarator Database at the University of Wisconsin-Madison
      </h1>
      <div className="image-explanation" style={{ marginTop: "20px" }}>
        <div className="explanation">
            <p className="explanation-1">
              You can visit our group's website{" "}
              <a href="https://rogerio.physics.wisc.edu" target="_blank" rel="noopener noreferrer">
               here.
              </a>
            </p>

            <p className="explanation-1">
              All of our codes are open source and available {" "}
              <a href="https://github.com/uwplasma" target="_blank" rel="noopener noreferrer">
               here.
              </a>
            </p>
          <p className="explanation-2">
            Please explore our database below. It contains a list of quasisymmetric stellarators created using the near-axis expansion.
            The database and its use to develop a machine learning model are explained in our publication {" "}
              <a href="https://arxiv.org/abs/2409.00564" target="_blank" rel="noopener noreferrer">
               here.
              </a>
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
        <p>© 2025 University of Wisconsin-Madison Stellarator Repository</p>
      </footer>
    </div>
  );
}

export default ConfigList;