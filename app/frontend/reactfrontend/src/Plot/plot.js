import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";

function PlotView() {
  const { configId } = useParams(); 
  const [plotData, setPlotData] = useState("");

  useEffect(() => {
    axios.get(`http://127.0.0.1:5000/api/plot/${configId}`)
      .then(response => {
        // The API returns an object with "plot_data"
        setPlotData(response.data.plot_data);
      })
      .catch(error => {
        console.error(error);
      });
  }, [configId]);

  return (
    <div className="container mt-5">
      <h1>Stellarator Plot</h1>
      {plotData ? (
        <img
          src={`data:image/png;base64,${plotData}`}
          alt="Stellarator Plot"
          style={{ width: "100%" }}
        />
      ) : (
        <p>Loading plot...</p>
      )}
      <br />
      <Link to="/">Back to Configuration List</Link>
    </div>
  );
}

export default PlotView;