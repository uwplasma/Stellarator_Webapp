"use client"

import React from "react";
import StellaratorTable from "./components/table";

const ConfigList = () => {
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <header style={{
        width: '100%',
        backgroundColor: '#c5050c',
        color: 'white',
        textAlign: 'center',
        padding: '30px 0',
        marginTop: '20px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          margin: 0,
          fontFamily: 'Georgia, serif',
          fontWeight: 'bold'
        }}>UWPlasma Stellarators</h1>
      </header>
      <p style={{
        textAlign: 'center',
        fontSize: '1.25rem',
        color: '#000000',
        marginTop: '30px',
        marginBottom: '0'
      }}>Stellarator Database at the University of Wisconsin-Madison</p>
      <StellaratorTable />
      <footer style={{
        width: '100%',
        backgroundColor: '#c5050c',
        color: 'white',
        textAlign: 'center',
        padding: '20px 0',
        fontSize: '1rem',
        marginTop: '60px',
        marginBottom: '20px',
        boxShadow: '0 -2px 5px rgba(0, 0, 0, 0.1)',
        fontFamily: 'Times New Roman, serif',
      }}>
        <p>© 2025 University of Wisconsin-Madison Stellarator Repository</p>
      </footer>
    </div>
  );
}

export default ConfigList;
