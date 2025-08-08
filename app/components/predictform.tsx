'use client';

import { useState } from "react";
import { usePrediction } from "../context/PredictionContext";
import { API_URL } from "../lib";

export default function SidebarPredictForm() {
  const [showForm, setShowForm] = useState(false);
  const { addPrediction } = usePrediction();
  const [formData, setFormData] = useState({
    lat: "",
    lon: "",
    date: "",
  });
  const [netcdfFile, setNetcdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.nc')) {
        setError('Please select a valid NetCDF file (.nc)');
        return;
      }
      setNetcdfFile(file);
      setError(null);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    const token = await localStorage.getItem('token');

    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate inputs
    if (!netcdfFile) {
      setError('Please select a NetCDF file');
      setIsLoading(false);
      return;
    }

    // Validate latitude and longitude
    const lat = parseFloat(formData.lat);
    const lon = parseFloat(formData.lon);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be a number between -90 and 90');
      setIsLoading(false);
      return;
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError('Longitude must be a number between -180 and 180');
      setIsLoading(false);
      return;
    }

    // Validate date
    if (!formData.date) {
      setError('Please select a date');
      setIsLoading(false);
      return;
    }

    try {
      // Create FormData for multipart/form-data request
      const formDataToSend = new FormData();
      
      // Append form fields - these should match the Form parameters in FastAPI
      formDataToSend.append('lat', lat.toString());
      formDataToSend.append('lon', lon.toString());
      formDataToSend.append('date', formData.date);
      formDataToSend.append('file', netcdfFile);

      console.log('Sending request with:', {
        lat: lat.toString(),
        lon: lon.toString(),
        date: formData.date,
        filename: netcdfFile.name
      });

      const response = await fetch(`${API_URL}/predict/point`, {
  method: "POST",
  body: formDataToSend,
  headers: {
    Authorization: `Bearer ${token}`,
    // Don't set Content-Type manually for FormData
  },
});

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('API Error Response:', errorData);
          errorDetail = errorData.detail || errorDetail;
          
          // If it's a validation error, show more details
          if (response.status === 422 && errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errorDetail = errorData.detail.map((err: any) => 
                `${err.loc?.join('.')}: ${err.msg}`
              ).join(', ');
            }
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            console.error('Error response text:', errorText);
            errorDetail = errorText || errorDetail;
          } catch {
            // Use the original status text
          }
        }
        throw new Error(errorDetail);
      }

      const result = await response.json();
      
      console.log('API Response:', result);
      
      // Transform the API response to match the expected format
      const transformedResult = {
        lat: result.closest_lat,
        lon: result.closest_lon,
        prediction: result.prediction,
        landslide_probability: result.landslide_probability,  // Updated to use correct field name
        day: result.requested_date,
        weather_data: result.weather_data,
      };
      
      addPrediction(transformedResult);
      setShowForm(false);
      
      // Reset form data
      setFormData({
        lat: "",
        lon: "",
        date: "",
      });
      setNetcdfFile(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setError(null);
    // Reset form data when canceling
    setFormData({
      lat: "",
      lon: "",
      date: "",
    });
    setNetcdfFile(null);
  };

  return (
    <div className="w-full">
      {!showForm ? (
        <button
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
          onClick={() => setShowForm(true)}
        >
          🎯 Predict Landslide Risk
        </button>
      ) : (
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-green-400 font-medium flex items-center">
              🎯 New Prediction
            </h4>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              {/* Location Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="lat" className="text-xs text-gray-300 mb-1 block font-medium">
                    Latitude
                  </label>
                  <input
                    id="lat"
                    type="number"
                    step="any"
                    name="lat"
                    value={formData.lat}
                    onChange={handleChange}
                    placeholder="e.g., 28.6139"
                    min="-90"
                    max="90"
                    className="w-full p-2 text-sm rounded bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lon" className="text-xs text-gray-300 mb-1 block font-medium">
                    Longitude
                  </label>
                  <input
                    id="lon"
                    type="number"
                    step="any"
                    name="lon"
                    value={formData.lon}
                    onChange={handleChange}
                    placeholder="e.g., 77.2090"
                    min="-180"
                    max="180"
                    className="w-full p-2 text-sm rounded bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Date Field */}
              <div>
                <label htmlFor="date" className="text-xs text-gray-300 mb-1 block font-medium">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full p-2 text-sm rounded bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* NetCDF File Upload */}
              <div>
                <label htmlFor="netcdf-file" className="text-xs text-gray-300 mb-1 block font-medium">
                  NetCDF Weather Data File (.nc)
                </label>
                <div className="relative">
                  <input
                    id="netcdf-file"
                    type="file"
                    accept=".nc"
                    onChange={handleFileChange}
                    className="w-full p-2 text-sm rounded bg-gray-800 border border-gray-600 text-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                  {netcdfFile && (
                    <div className="mt-1 text-xs text-green-400">
                      ✓ {netcdfFile.name} ({(netcdfFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Upload a NetCDF file containing weather data for the specified date and location.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded p-2">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-sm transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed font-medium flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Predicting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}