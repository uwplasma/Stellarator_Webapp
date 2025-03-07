"use client"

import React from 'react';
import PlotView from '../../components/plot';
import { useParams } from 'next/navigation';

export default function PlotPage() {
  const params = useParams();
  const configId = params.configId as string;
  
  return (
    <div>
       <header className="tiny-header">
        <h1>QUASAR Stellarators</h1>
      </header>
    <main className="container mx-auto p-4">
      <PlotView configId={configId} />
    </main>
    
      <footer className="footer">
        <p>© 2025 QUASAR Stellarator Repository | All Rights Reserved</p>
      </footer>
    </div>
  );
}