import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PredictionProvider } from './context/PredictionContext';
import { AuthProvider } from './context/AuthContext'


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LAPS - Landslide and Avalanche Prediction System',
  description: 'Tactical Geospatial Intelligence for Landslide and Avalanche Risk Assessment',
  keywords: 'landslide, avalanche, prediction, geospatial, military, tactical intelligence',
  authors: [{ name: 'LAPS Development Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#1f2937" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <PredictionProvider>
        {children}
        </PredictionProvider>
      </body>
    </html>
  );
}