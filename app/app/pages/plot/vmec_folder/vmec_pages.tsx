"use client";
import Link from "next/link";

const exampleIds = [1, 2, 3, 4]; // Replace with real IDs or fetched data

export default function VMECOverviewPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">VMEC Configurations</h1>
      <ul className="space-y-2">
        {exampleIds.map((configId) => (
          <li key={configId}>
            <Link href={`/plot/vmec_folder/${configId}`} className="text-blue-600 hover:underline">
              View configuration {configId}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
