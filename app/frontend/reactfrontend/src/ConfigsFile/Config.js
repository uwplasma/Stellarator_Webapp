import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Config.css";
import ThreeModel from "./3d";
import StellaratorTable from "./table"; // Import your table component

function ConfigList() {
  const [configs, setConfigs] = useState([]);

  useEffect(() => {
    axios.get("https://stellarator.physics.wisc.edu/backend/api/configs")
      .then(response => {
        setConfigs(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  return (
    <div className="header-container">
      
      <h1>Stellarator Database at the University of Wisconsin-Madison       </h1>
      {/* <div className="image-explanation" style={{ marginTop: "20px" }}>
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
          <img
            src="/main.jpg"
            alt="Rotating"
            className="Stellarator-image"
          />
        </div>
      </div> */}

      <div style={{ marginTop: "50px", backgroundColor: "white" }}>
        <h2>Interactive 3D Model</h2>
        <ThreeModel />
      </div>

      <div className="table-container">
        {/* Render the new StellaratorTable component instead of the old table */}
        <StellaratorTable />
      </div>
    </div>
  );
}

export default ConfigList;
