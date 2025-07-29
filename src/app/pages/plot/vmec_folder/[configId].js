import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function VMECPlotPage() {
  const router = useRouter();
  const { configId } = router.query;

  const [boundaryImage, setBoundaryImage] = useState(null);
  const [surfaceImage, setSurfaceImage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!configId) return;

    // Fetch boundary plot (VMECparams)
    fetch(`https://stellarator.physics.wisc.edu/backend/api/plot/${configId}`)
      .then(res => res.json())
      .then(data => {
        if (data.image) setBoundaryImage(data.image);
        else setError("Failed to load boundary image.");
      })
      .catch(err => {
        console.error(err);
        setError("Error fetching boundary image.");
      });

    // Fetch diagnostic surface plot (VMECsurfaces)
    fetch(`https://stellarator.physics.wisc.edu/backend/api/grid/${configId}`)
      .then(res => res.json())
      .then(data => {
        if (data.image) setSurfaceImage(data.image);
        else setError("Failed to load surface image.");
      })
      .catch(err => {
        console.error(err);
        setError("Error fetching surface image.");
      });

  }, [configId]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">VMEC Configuration {configId}</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Boundary Plot</h2>
        {boundaryImage ? (
          <img
            src={`data:image/png;base64,${boundaryImage}`}
            alt="VMEC boundary"
            className="w-full max-w-3xl shadow-md"
          />
        ) : (
          <p>Loading boundary plot...</p>
        )}
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Surface Diagnostic Plot</h2>
        {surfaceImage ? (
          <img
            src={`data:image/png;base64,${surfaceImage}`}
            alt="VMEC surface diagnostics"
            className="w-full max-w-3xl shadow-md"
          />
        ) : (
          <p>Loading surface plot...</p>
        )}
      </div>

      <div className="mt-6">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
