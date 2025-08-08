'use client';

import { useState } from "react";
import { usePrediction, useDaySelection } from "../context/PredictionContext";

interface NetCDFPrediction {
  lat: number;
  lon: number;
  day: string;
  prediction: number;
}

interface NetCDFResponse {
  predictions: NetCDFPrediction[];
}

export default function SidebarNetCDFUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { addBulkPredictions } = usePrediction();
  const { selectedDay, setSelectedDay, availableDays } = useDaySelection();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.nc')) {
      setFile(selectedFile);
    } else if (selectedFile) {
      alert('Please select a NetCDF (.nc) file');
      e.target.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.nc')) {
      setFile(droppedFile);
    } else if (droppedFile) {
      alert('Please drop a NetCDF (.nc) file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePredict = async () => {
    const token = await localStorage.getItem('token');

    if (!file) return;
    setLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const res = await fetch("http://localhost:8000/predict/nc", {
        method: "POST",
        body: formData,
        headers: {
    Authorization: `Bearer ${token}`,
    // Don't set Content-Type manually for FormData
  },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: NetCDFResponse = await res.json();
      console.log('NetCDF predictions:', data);
      
      if (data.predictions && Array.isArray(data.predictions)) {
        // Use the existing addBulkPredictions method
        addBulkPredictions(data.predictions);
        
        const uniqueDays = Array.from(new Set(data.predictions.map(p => p.day))).length;
        alert(`Successfully processed ${data.predictions.length} predictions from NetCDF file across ${uniqueDays} days.`);
      } else {
        alert("Predictions processed from NetCDF file.");
      }
      
      setUploadProgress(0);
      
    } catch (err) {
      console.error('NetCDF upload error:', err);
      alert("Failed to process NetCDF file. Please check the file format and try again.");
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDayChange = (dayIndex: number) => {
    setSelectedDay(dayIndex);
  };

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
    const fileInput = document.getElementById('netcdf-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="w-full">
      <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 shadow-lg">
        <div className="flex items-center mb-3">
          <h4 className="text-green-400 font-medium flex items-center">
            📁 Upload NetCDF File
          </h4>
        </div>
        
        <div className="space-y-3">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
              dragActive
                ? 'border-green-500 bg-green-500/10'
                : file
                ? 'border-gray-500 bg-gray-800'
                : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!file ? (
              <div>
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-xs text-gray-300 mb-1">
                  Drop your NetCDF file here or
                </p>
                <label htmlFor="netcdf-file" className="text-green-400 hover:text-green-300 cursor-pointer text-xs underline">
                  browse files
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Supports .nc files only
                </p>
              </div>
            ) : (
              <div className="text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-green-400 mr-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium truncate max-w-32" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Remove file"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            id="netcdf-file"
            type="file"
            accept=".nc"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Day Selection - Only show when there are available days */}
          {availableDays.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
              <label className="text-xs text-gray-300 mb-2 block font-medium">
                📅 Select Day to Display
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableDays.map((dayInfo, index) => (
                  <button
                    key={index}
                    onClick={() => handleDayChange(index)}
                    className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                      selectedDay === index
                        ? 'bg-green-600 text-white border-green-500'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600'
                    } border`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Day {index + 1}</div>
                      <div className="text-xs opacity-75">
                        {new Date(dayInfo.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {selectedDay !== null && availableDays[selectedDay] && (
                <div className="mt-2 text-xs text-gray-400">
                  Showing predictions for {availableDays[selectedDay].date} 
                  ({availableDays[selectedDay].count} locations)
                </div>
              )}
            </div>
          )}

          {/* Progress bar */}
          {loading && uploadProgress > 0 && (
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handlePredict}
              disabled={!file || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed font-medium flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                  </svg>
                  Upload & Process
                </>
              )}
            </button>
            
            {file && !loading && (
              <button
                onClick={removeFile}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded transition-colors"
                title="Clear file"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          {/* File info */}
          {file && !loading && (
            <div className="text-xs text-gray-400 bg-gray-800 rounded p-2">
              <p><strong>File Type:</strong> NetCDF</p>
              <p><strong>Size:</strong> {formatFileSize(file.size)}</p>
              <p><strong>Last Modified:</strong> {new Date(file.lastModified).toLocaleDateString()}</p>
            </div>
          )}

          {/* Processing Status */}
          {availableDays.length > 0 && (
            <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
              <div className="flex items-center text-green-400 text-xs">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>NetCDF processed successfully! Use day selector above to view different predictions.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}