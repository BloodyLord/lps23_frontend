# Offline Tile Storage

This directory contains cached map tiles for offline use. The system will automatically check for tiles in these folders before fetching from online APIs.

## Directory Structure

```
tiles/
├── satellite/          # Satellite imagery tiles
│   ├── {z}/           # Zoom level
│   │   ├── {x}/       # X coordinate
│   │   │   └── {y}.png # Tile image
├── street/            # Street map tiles
│   ├── {z}/
│   │   ├── {x}/
│   │   │   └── {y}.png
└── tiff/              # TIFF overlay tiles
    ├── {z}/
    │   ├── {x}/
    │   │   └── {y}.tiff
```

## Usage

1. **Automatic Loading**: The system automatically checks for local tiles first
2. **Fallback**: If local tiles are not found, it fetches from online APIs
3. **Manual Storage**: You can manually place tiles in the appropriate folders

## Tile Naming Convention

Tiles should be named using the standard slippy map format:
- `{z}` = Zoom level (0-18)
- `{x}` = X coordinate
- `{y}` = Y coordinate

Example: `tiles/satellite/10/512/384.png`

## Supported Formats

- **Satellite**: PNG format
- **Street**: PNG format  
- **TIFF**: TIFF format for overlay data

## Benefits

- **Offline Access**: Works without internet connection
- **Faster Loading**: Local tiles load much faster
- **Reduced Bandwidth**: Saves internet usage
- **Reliability**: No dependency on external services

## Adding Tiles

To add tiles manually:

1. Create the appropriate directory structure
2. Place tiles in the correct format and location
3. The system will automatically detect and use them

## Cache Management

The tile manager provides methods to:
- Check cache statistics
- Clear cached tiles
- Monitor loading status