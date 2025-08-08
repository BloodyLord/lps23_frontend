// app/components/SachetUploadPanel.tsx
'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { parseCapXml } from '../utils/xmlParser';
import { Feature, Polygon, MultiPolygon } from 'geojson';

interface SachetUploadPanelProps {
  onGeoJSONDataProcessed: (data: Feature<Polygon | MultiPolygon>[]) => void;
}

export default function SachetUploadPanel({ onGeoJSONDataProcessed }: SachetUploadPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalXmlFiles, setTotalXmlFiles] = useState(0);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setError('Please upload a .zip file.');
      return;
    }

    setLoading(true);
    setError(null);
    setFileName(file.name);
    setProcessedCount(0);
    setTotalXmlFiles(0);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const zip = await JSZip.loadAsync(buffer);
          const allFeatures: Feature<Polygon | MultiPolygon>[] = [];
          let xmlFileCount = 0;

          // First pass to count XML files
          zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.xml')) {
              xmlFileCount++;
            }
          });

          setTotalXmlFiles(xmlFileCount);

          if (xmlFileCount === 0) {
            setError('No XML files found in the zip archive.');
            return;
          }

          let currentProcessed = 0;
          
          // Process XML files
          for (const relativePath in zip.files) {
            const zipEntry = zip.files[relativePath];

            if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.xml')) {
              try {
                const xmlContent = await zipEntry.async('string');
                const parsedFeatures = parseCapXml(xmlContent);
                allFeatures.push(...parsedFeatures);
                currentProcessed++;
                setProcessedCount(currentProcessed);
              } catch (xmlError) {
                console.error(`Error processing XML file ${relativePath}:`, xmlError);
              }
            }
          }

          onGeoJSONDataProcessed(allFeatures);
          
          if (allFeatures.length > 0) {
            setError(null);
          } else {
            setError('No valid geographic features found in the XML files.');
          }

        } catch (zipError) {
          console.error('Error processing zip file:', zipError);
          setError('Failed to process zip file. Please ensure it is a valid zip archive.');
        }
      };

      reader.onerror = () => {
        setError('Failed to read the uploaded file.');
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Error processing zip file:', err);
      setError('Failed to process zip file. Please ensure it contains valid XMLs.');
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFileName(null);
    setError(null);
    setProcessedCount(0);
    setTotalXmlFiles(0);
    onGeoJSONDataProcessed([]);
    
    // Reset file input
    const fileInput = document.getElementById('zip-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-green-400">SACHET Data Upload</h2>
        <div className="flex items-center text-green-400">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium">CAP XML Processor</span>
        </div>
      </div>
      
      <p className="text-gray-300 mb-6">
        Upload a .zip file containing CAP (Common Alerting Protocol) XML alerts to display emergency information and geographic boundaries on the map.
      </p>

      <div className="mb-6">
        <label htmlFor="zip-upload" className="block text-sm font-medium text-gray-300 mb-3">
          Select .zip file containing XML alerts
        </label>
        <div className="flex items-center space-x-3">
          <input
            id="zip-upload"
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-300
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-green-600 file:text-white
              hover:file:bg-green-700 cursor-pointer
              border border-gray-600 rounded-lg p-2 bg-gray-700"
            disabled={loading}
          />
          {fileName && (
            <button
              onClick={clearFile}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              disabled={loading}
            >
              Clear
            </button>
          )}
        </div>
        
        {fileName && (
          <div className="mt-3 p-3 bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-300">
              <span className="font-medium">Selected:</span> {fileName}
            </p>
            {totalXmlFiles > 0 && (
              <p className="text-sm text-green-400 mt-1">
                Found {totalXmlFiles} XML file{totalXmlFiles !== 1 ? 's' : ''} in archive
              </p>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-center text-green-400 mb-3">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-medium">Processing XML files...</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: totalXmlFiles > 0 ? `${(processedCount / totalXmlFiles) * 100}%` : '0%' }}
            ></div>
          </div>
          <p className="text-sm text-gray-300 mt-2 text-center">
            {processedCount} of {totalXmlFiles} files processed
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Supported Format:</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• CAP (Common Alerting Protocol) XML files</li>
          <li>• Files must contain &lt;cap:polygon&gt; elements for geographic data</li>
          <li>• Coordinates should be in "latitude,longitude" format</li>
          <li>• Multiple polygons per alert are supported</li>
        </ul>
      </div>
    </div>
  );
}