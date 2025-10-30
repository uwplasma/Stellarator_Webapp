import React, { useEffect, useState } from "react";
import axios from "axios";
import StellaratorTable from "../components/table"; // Adjust the import path

const ConfigList = () => {
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
      <h1>A Repository of Quasi-symmetric Stellarator Designs       </h1>
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

      <div className="table-container">
        <StellaratorTable />
      </div>
    </div>
  );
}

export default ConfigList;