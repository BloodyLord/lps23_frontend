// 'use client';

// import { useEffect } from 'react';
// import { useMap } from 'react-leaflet';
// import L from 'leaflet';

// interface SimpleTileLayerProps {
//   type: 'satellite' | 'street' | 'tiff';
//   opacity?: number;
//   isOffline?: boolean;
// }

// export default function SimpleTileLayer({ type, opacity = 1, isOffline = false }: SimpleTileLayerProps) {
//   const map = useMap();

//   useEffect(() => {
//     let tileLayer: L.TileLayer;

//     if (isOffline) {
//       // Offline mode - use local tiles
//       const localUrls = {
//         satellite: '/tiles/satellite/{z}/{x}/{y}.png',
//         street: '/tiles/street/{z}/{x}/{y}.png',
//         tiff: '/tiles/tiff/{z}/{x}/{y}.tiff'
//       };

//       tileLayer = L.tileLayer(localUrls[type], {
//         attribution: `Local ${type} tiles`,
//         maxZoom: 13,
//         minZoom: 8,
//         opacity,
//         errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent PNG
//       });
//     } else {
//       // Online mode - use external APIs
//       const onlineUrls = {
//         satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
//         street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
//         tiff: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' // Fallback to satellite for TIFF
//       };

//       const attributions = {
//         satellite: '&copy; <a href="https://www.esri.com/">Esri</a>',
//         street: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
//         tiff: '&copy; <a href="https://www.esri.com/">Esri</a> (TIFF Overlay)'
//       };

//       tileLayer = L.tileLayer(onlineUrls[type], {
//         attribution: attributions[type],
//         maxZoom: 13,
//         minZoom: 8,
//         opacity,
//         subdomains: type === 'street' ? ['a', 'b', 'c'] : [],
//       });
//     }

//     map.addLayer(tileLayer);

//     return () => {
//       map.removeLayer(tileLayer);
//     };
//   }, [map, type, opacity, isOffline]);

//   return null;
// }

'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface SimpleTileLayerProps {
  type: 'satellite' | 'street' | 'tiff';
  opacity?: number;
  isOffline?: boolean;
}

export default function SimpleTileLayer({
  type,
  opacity = 1,
  isOffline = false,
}: SimpleTileLayerProps) {
  const map = useMap();

  useEffect(() => {
    let tileLayer: L.TileLayer;

    const localUrls: Record<string, string> = {
      satellite: '/tiles/satellite/{z}/{x}/{y}.png',
      street: '/tiles/street/{z}/{x}/{y}.png',
      tiff: '/tiles/tiff/{z}/{x}/{y}.tiff',
    };

    const onlineUrls: Record<string, string> = {
      satellite:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      tiff:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', // fallback
    };

    const attributions: Record<string, string> = {
      satellite: '&copy; <a href="https://www.esri.com/">Esri</a>',
      street:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      tiff: '&copy; <a href="https://www.esri.com/">Esri</a> (TIFF Overlay)',
    };

    // ✅ Guard against invalid type values
    const tileUrl = isOffline ? localUrls[type] : onlineUrls[type];
    const attribution = attributions[type];

    if (!tileUrl || !attribution) {
      console.error(`Invalid tile layer type: '${type}'`);
      return;
    }

    tileLayer = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 13,
      minZoom: 8,
      opacity,
      subdomains: type === 'street' ? ['a', 'b', 'c'] : [],
      errorTileUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    });

    map.addLayer(tileLayer);

    return () => {
      map.removeLayer(tileLayer);
    };
  }, [map, type, opacity, isOffline]);

  return null;
}
