'use client';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export default function LoadingScreen({ 
  message = "Loading...", 
  progress = 0, 
  showProgress = false 
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center z-[3000]">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
        {/* Military-style loading indicator */}
        <div className="mb-6">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-gray-600 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>

        {/* Loading message */}
        <h3 className="text-xl font-semibold text-green-400 mb-2">LAPS SYSTEM</h3>
        <p className="text-gray-300 mb-4">{message}</p>

        {/* Progress bar */}
        {showProgress && (
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
        )}

        {/* Status indicators */}
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Map Tiles</span>
            <span className="text-green-400">●</span>
          </div>
          <div className="flex justify-between">
            <span>Boundary Data</span>
            <span className="text-green-400">●</span>
          </div>
          <div className="flex justify-between">
            <span>Risk Analysis</span>
            <span className="text-green-400">●</span>
          </div>
        </div>
      </div>
    </div>
  );
}