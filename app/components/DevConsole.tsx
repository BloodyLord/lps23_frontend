'use client';

import { useState, useEffect } from 'react';

interface DevConsoleProps {
  isOffline: boolean;
  onOfflineModeChange: (offline: boolean) => void;
  onZoomChange?: (zoom: number) => void;
  currentZoom?: number;
  onClearCache?: () => void;
}

export default function DevConsole({ 
  isOffline, 
  onOfflineModeChange, 
  onZoomChange,
  currentZoom = 8,
  onClearCache 
}: DevConsoleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoomInput, setZoomInput] = useState(currentZoom.toString());
  const [zoomError, setZoomError] = useState('');

  const MIN_ZOOM = 8;
  const MAX_ZOOM = 13;

  useEffect(() => {
    setZoomInput(currentZoom.toString());
  }, [currentZoom]);

  const handleZoomInputChange = (value: string) => {
    setZoomInput(value);
    setZoomError('');

    // Allow empty input for typing
    if (value === '') return;

    const numValue = parseInt(value);
    
    if (isNaN(numValue)) {
      setZoomError('Must be a number');
      return;
    }

    if (numValue < MIN_ZOOM || numValue > MAX_ZOOM) {
      setZoomError(`Must be between ${MIN_ZOOM} and ${MAX_ZOOM}`);
      return;
    }

    // Valid zoom level
    if (onZoomChange) {
      onZoomChange(numValue);
    }
  };

  const handleZoomPreset = (zoom: number) => {
    setZoomInput(zoom.toString());
    setZoomError('');
    if (onZoomChange) {
      onZoomChange(zoom);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[1000] bg-gray-800 text-green-400 p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Developer Console"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Console Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-[1000] bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 w-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-400">Dev Console</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Mode Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tile Mode
              </label>
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => onOfflineModeChange(false)}
                  className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                    !isOffline
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Online
                </button>
                <button
                  onClick={() => onOfflineModeChange(true)}
                  className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                    isOffline
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Offline
                </button>
              </div>
            </div>

            {/* Zoom Control */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Zoom Level ({MIN_ZOOM}-{MAX_ZOOM})
              </label>
              
              {/* Zoom Input */}
              <div className="mb-2">
                <input
                  type="number"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  value={zoomInput}
                  onChange={(e) => handleZoomInputChange(e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded text-white text-sm ${
                    zoomError ? 'border-red-500' : 'border-gray-600'
                  } focus:outline-none focus:border-green-500`}
                  placeholder={`${MIN_ZOOM}-${MAX_ZOOM}`}
                />
                {zoomError && (
                  <p className="text-red-400 text-xs mt-1">{zoomError}</p>
                )}
              </div>

              {/* Zoom Presets */}
              <div className="grid grid-cols-3 gap-1">
                {[8, 9, 10, 11, 12, 13].map((zoom) => (
                  <button
                    key={zoom}
                    onClick={() => handleZoomPreset(zoom)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      currentZoom === zoom
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {zoom}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <div className="bg-gray-700 rounded p-2">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    isOffline ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm text-gray-300">
                    {isOffline ? 'Offline Mode' : 'Online Mode'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Actions
              </label>
              <div className="space-y-2">
                {onClearCache && (
                  <button
                    onClick={onClearCache}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors text-sm"
                  >
                    Clear Cache
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors text-sm"
                >
                  Reload App
                </button>
              </div>
            </div>

            {/* Info */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Info
              </label>
              <div className="bg-gray-700 rounded p-2 text-xs text-gray-400">
                <div>Zoom: {currentZoom} (Range: {MIN_ZOOM}-{MAX_ZOOM})</div>
                <div>Tiles: {isOffline ? 'Local Storage' : 'External APIs'}</div>
                <div>Mode: Development</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}