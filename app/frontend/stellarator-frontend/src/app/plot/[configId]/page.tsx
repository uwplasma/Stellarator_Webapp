"use client"

import React from 'react';
import PlotView from '../../components/plot';
import { useParams } from 'next/navigation';

export default function PlotPage() {
  const params = useParams();
  const configId = params.configId as string;
  
  return (
    <main className="container mx-auto p-4">
      <PlotView configId={configId} />
    </main>
  );
}