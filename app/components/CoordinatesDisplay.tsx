// app/components/CoordinatesDisplay.tsx
'use client';

interface CoordinatesDisplayProps {
  lat: number | null;
  lng: number | null;
}

export default function CoordinatesDisplay({ lat, lng }: CoordinatesDisplayProps) {
  if (lat === null || lng === null) {
    return null; // Don't render if no coordinates are available
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 text-white text-sm p-3 flex justify-center items-center z-[1000] border-t border-gray-700">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-gray-300">Cursor Position:</span>
        </div>
        <div className="font-mono text-green-400">
          <span className="text-gray-300">Lat:</span> {lat.toFixed(6)}°
          <span className="mx-2 text-gray-500">|</span>
          <span className="text-gray-300">Lng:</span> {lng.toFixed(6)}°
        </div>
        <div className="text-xs text-gray-500">
          (WGS84)
        </div>
      </div>
    </div>
  );
}