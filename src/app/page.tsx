"use client"

import React, { useEffect, useState } from "react";
import axios from "axios";
import StellaratorTable from "./components/table"; // Adjust the import path

const ConfigList = () => {
  const [configs, setConfigs] = useState([]);

  useEffect(() => {
    axios.get("https://stellarator.physics.wisc.edu/backend/api/configs")
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
    <div>
      <header
  style={{
    backgroundColor: '#c5050c',
    padding: '2.5rem 0',         
    marginTop: '1rem',
    textAlign: 'center',
    color: 'white',
    fontSize: '2.75rem',           
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  }}
>
  UWPlasma Stellarators
</header>
  
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          paddingTop: '3rem',
          paddingBottom: '3rem',
          textAlign: 'center',
        }}
      >
        <h1
  style={{
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '30px',
    color: '#2c3e50',
    whiteSpace: 'nowrap',       
    overflow: 'hidden',   
    textOverflow: 'ellipsis',   
  }}
>
  Stellarator Database at the University of Wisconsin-Madison
</h1>
  
        <div
          className="image-explanation"
          style={{
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '700px',
          }}
        >
          <div className="explanation">
            <p className="explanation-1">
              You can visit our group's website{" "}
              <a
                href="https://rogerio.physics.wisc.edu"
                target="_blank"
                rel="noopener noreferrer"
              >
                here.
              </a>
            </p>
  
            <p className="explanation-1">
              All of our codes are open source and available{" "}
              <a
                href="https://github.com/uwplasma"
                target="_blank"
                rel="noopener noreferrer"
              >
                here.
              </a>
            </p>
  
            <p className="explanation-2">
              Please explore our database below. It contains a list of
              quasisymmetric stellarators created using the near-axis expansion.
              The database and its use to develop a machine learning model are
              explained in our publication{" "}
              <a
                href="https://arxiv.org/abs/2409.00564"
                target="_blank"
                rel="noopener noreferrer"
              >
                here.
              </a>
            </p>
          </div>
  
          <div className="image">
            <video
              width="400"
              autoPlay
              muted
              loop
              style={{ backgroundColor: "white", borderRadius: "10px" }}
            >
              <source src="/StelleratorRecording.mp4" type="video/mp4" />
              Your browser does not support HTML5 video.
            </video>
          </div>
        </div>
  
        <div className="table-container" style={{ marginTop: "3rem", width: "100%" }}>
          <StellaratorTable />
        </div>
      </main>
  
      <footer
        style={{
          marginTop: "3rem",
          padding: "1rem",
          textAlign: "center",
          fontSize: "0.9rem",
          color: "#888",
        }}
      >
        © 2025 University of Wisconsin-Madison Stellarator Repository
      </footer>
    </div>
  );
};
  

export default ConfigList;