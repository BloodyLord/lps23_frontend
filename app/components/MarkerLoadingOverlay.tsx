'use client';

interface MarkerLoadingOverlayProps {
  isVisible: boolean;
}

export default function MarkerLoadingOverlay({ isVisible }: MarkerLoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2500]">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 text-center">
        <div className="mb-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 border-3 border-gray-600 rounded-full"></div>
            <div className="absolute inset-0 border-3 border-green-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-green-400 mb-2">Analyzing Location</h3>
        <p className="text-gray-300 text-sm">Finding nearest data point...</p>
        
        <div className="mt-4 space-y-1 text-xs text-gray-400">
          <div>• Calculating distances</div>
          <div>• Processing risk factors</div>
          <div>• Generating analysis</div>
        </div>
      </div>
    </div>
  );
}