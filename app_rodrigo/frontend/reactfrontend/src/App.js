import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ConfigList from "./ConfigsFile/Config";
import PlotView from "./Plot/plot";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConfigList /> } />
       <Route path="/plot/:configId" element={<PlotView />} />
      </Routes>
    </Router>
  );
}

export default App;