import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Config.css";

function ConfigList() {
  const [configs, setConfigs] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/configs")
      .then(response => {
        setConfigs(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  return (
    <div className="header-container">
      <h1>A Repository of Quasi-symmetric Stellarator Designs</h1>
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
          <img
            src="/main.jpg"
            alt="Rotating"
            className="Stellarator-image"
            
          />
        </div>
      </div>

      <div className="table-container">
        <h2>Select a Stellarator Configuration</h2>
        <table className="Stellarator-table">
          <thead>
            <tr>
              <th>View Plot</th>
              <th>ID</th>
              <th>rc1</th>
              <th>rc2</th>
              <th>rc3</th>
              <th>zs1</th>
              <th>zs2</th>
              <th>zs3</th>
              <th>nfp</th>
              <th>etabar</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((config) => (
              <tr key={config.id}>
                <td>
                  {/* Link to the Plot page if using React Router, e.g. /plot/ID */}
                  <a href={`/plot/${config.id}`}>View</a>
                </td>
                <td>{config.id}</td>
                <td>{config.rc1}</td>
                <td>{config.rc2}</td>
                <td>{config.rc3}</td>
                <td>{config.zs1}</td>
                <td>{config.zs2}</td>
                <td>{config.zs3}</td>
                <td>{config.nfp}</td>
                <td>{config.etabar}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ConfigList;