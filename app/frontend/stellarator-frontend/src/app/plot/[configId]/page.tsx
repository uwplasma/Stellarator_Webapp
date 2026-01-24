"use client"

import React from 'react';
import PlotView from '../../components/plot';
import { useParams } from 'next/navigation';

export default function PlotPage() {
  const params = useParams();
  const configId = params.configId as string;
  
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
    <main className="container mx-auto p-4">
      <PlotView configId={configId} />
    </main>
    
      <footer style={{
        width: '100%',
        backgroundColor: '#c5050c',
        color: 'white',
        textAlign: 'center',
        padding: '20px 0',
        marginTop: '40px',
        marginBottom: '20px',
      }}>
        <p style={{ margin: 0, fontFamily: '"Times New Roman", Times, serif' }}>© 2025 University of Wisconsin-Madison Stellarator Repository | All Rights Reserved</p>
      </footer>
    </div>
  );
}