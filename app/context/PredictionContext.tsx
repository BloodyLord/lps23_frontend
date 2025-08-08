'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

// 1. Define the shape of weather data
interface WeatherData {
  temperature_max?: number;
  temperature_min?: number;
  precipitation?: number;
  snowfall?: number;
  wind_speed?: number;
  pressure?: number;
}

// 2. Define the shape of a single prediction result
interface PredictionResult {
  lat: number;
  lon: number;
  prediction: number;
  landslide_probability?: number | null;  // Updated to match FastAPI response
  day: string;
  weather_data?: WeatherData;
}

// 3. Define the shape of the context's state and methods
interface PredictionContextType {
  predictionResults: PredictionResult[];
  panToLocation: [number, number] | null;
  selectedDay: number | null;
  filteredPredictions: PredictionResult[];
  addPrediction: (result: PredictionResult) => void;
  addBulkPredictions: (results: NetCDFPredictionResult[]) => void;
  setSelectedDay: (day: number | null) => void;
  clearPredictions: () => void;
}

interface NetCDFPredictionResult {
  lat: number;
  lon: number;
  day: string;
  prediction: number;
  landslide_probability?: number | null;  // Updated to match FastAPI response
  weather_data?: WeatherData;
}

// 4. Create the context with a default undefined value
const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

// 5. Create the Provider component
interface PredictionProviderProps {
  children: ReactNode;
}

export function PredictionProvider({ children }: PredictionProviderProps) {
  const [predictionResults, setPredictionResults] = useState<PredictionResult[]>([]);
  const [panToLocation, setPanToLocation] = useState<[number, number] | null>(null);
  const [selectedDay, setSelectedDayState] = useState<number | null>(null);

  // Helper function to get unique days from predictions
  const getUniqueDays = (predictions: PredictionResult[]) => {
    const uniqueDays = Array.from(new Set(predictions.map(p => p.day))).sort();
    return uniqueDays;
  };

  // Filter predictions based on selected day
  const getFilteredPredictions = () => {
    if (selectedDay === null) {
      return predictionResults; // Return all if no day selected
    }

    const uniqueDays = getUniqueDays(predictionResults);
    if (selectedDay >= 0 && selectedDay < uniqueDays.length) {
      const targetDay = uniqueDays[selectedDay];
      return predictionResults.filter(pred => pred.day === targetDay);
    }
    
    return predictionResults;
  };

  const addPrediction = (result: PredictionResult) => {
    setPredictionResults(prevResults => [...prevResults, result]);
    setPanToLocation([result.lat, result.lon]);
    // Reset selected day when adding single prediction
    setSelectedDayState(null);
  };
  
  const addBulkPredictions = (results: NetCDFPredictionResult[]) => {
    const convertedResults: PredictionResult[] = results.map((res) => ({
      lat: res.lat,
      lon: res.lon,
      prediction: res.prediction,
      landslide_probability: res.landslide_probability,  // Updated field name
      day: res.day,
      weather_data: res.weather_data,
    }));

    // For NetCDF bulk predictions, replace existing predictions to avoid overlap
    setPredictionResults(convertedResults);
    
    if (convertedResults.length > 0) {
      setPanToLocation([
        convertedResults[0].lat,
        convertedResults[0].lon,
      ]);
      
      // Auto-select first day when bulk predictions are added
      setSelectedDayState(0);
    }
  };

  const setSelectedDay = (day: number | null) => {
    setSelectedDayState(day);
  };

  const clearPredictions = () => {
    setPredictionResults([]);
    setSelectedDayState(null);
    setPanToLocation(null);
  };

  const value = {
    predictionResults,
    panToLocation,
    selectedDay,
    filteredPredictions: getFilteredPredictions(),
    addPrediction,
    addBulkPredictions, 
    setSelectedDay,
    clearPredictions,
  };

  return (
    <PredictionContext.Provider value={value}>
      {children}
    </PredictionContext.Provider>
  );
}

// 6. Create a custom hook for easy access to the context
export function usePrediction() {
  const context = useContext(PredictionContext);
  if (context === undefined) {
    throw new Error('usePrediction must be used within a PredictionProvider');
  }
  return context;
}

// 7. Append function to add multiple NetCDF predictions (kept for backward compatibility)
export function useNetCDFPrediction() {
  const context = useContext(PredictionContext);
  if (context === undefined) {
    throw new Error('useNetCDFPrediction must be used within a PredictionProvider');
  }

  const addNetCDFPredictions = (results: NetCDFPredictionResult[]) => {
    context.addBulkPredictions(results);
  };

  return {
    addNetCDFPredictions,
  };
}

// 8. Additional helper hooks for day management
export function useDaySelection() {
  const context = useContext(PredictionContext);
  if (context === undefined) {
    throw new Error('useDaySelection must be used within a PredictionProvider');
  }

  // Get unique days from all predictions
  const getAvailableDays = () => {
    const uniqueDays = Array.from(new Set(context.predictionResults.map(p => p.day))).sort();
    return uniqueDays.map((day, index) => ({
      index,
      date: day,
      count: context.predictionResults.filter(p => p.day === day).length
    }));
  };

  return {
    selectedDay: context.selectedDay,
    setSelectedDay: context.setSelectedDay,
    availableDays: getAvailableDays(),
    filteredPredictions: context.filteredPredictions,
  };
}

// 9. Hook for prediction statistics
export function usePredictionStats() {
  const { predictionResults, filteredPredictions } = usePrediction();
  
  const getAllStats = () => ({
    total: predictionResults.length,
    safe: predictionResults.filter(p => p.prediction === 0).length,
    risky: predictionResults.filter(p => p.prediction === 1).length,
    uniqueDays: Array.from(new Set(predictionResults.map(p => p.day))).length,
  });

  const getFilteredStats = () => ({
    total: filteredPredictions.length,
    safe: filteredPredictions.filter(p => p.prediction === 0).length,
    risky: filteredPredictions.filter(p => p.prediction === 1).length,
  });

  return {
    all: getAllStats(),
    filtered: getFilteredStats(),
  };
}