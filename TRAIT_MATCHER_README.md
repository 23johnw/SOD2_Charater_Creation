# Trait Matcher - Standalone Tool

A local, browser-based tool for matching CSV traits with XML TraitResourceIDs. No server required!

## Quick Start

1. **Build the standalone HTML file:**
   ```bash
   npm run build-matcher
   ```
   Or directly:
   ```bash
   node build-trait-matcher.js
   ```

2. **Open the generated file:**
   - Open `trait-matcher-standalone.html` in your web browser
   - No server needed - just double-click the file!

## How to Use

### Matching Traits

1. **Select a CSV trait** from the left panel (unmatched traits)
2. **Select or type an XML trait ID** from the right panel
3. Click **"Match"** to create the match
4. Matches are automatically saved to browser localStorage

### Features

- **Search & Filter**: Use the search boxes and filter buttons to find traits quickly
- **Auto-suggestions**: Type in the XML trait input to see matching suggestions
- **Visual indicators**: 
  - Green = Matched traits
  - Blue = Selected trait
- **Export**: Click "Export Matches" to download your matches as JSON
- **Persistent storage**: Matches are saved in browser localStorage

### Statistics

The stats bar shows:
- Total CSV traits
- Total XML traits  
- Number of matched traits
- Number of unmatched traits
- Match rate percentage

### Exporting Matches

1. Click **"Export Matches (JSON)"** button
2. The file `trait-id-mapping.json` will be downloaded
3. This file can be used to update the matching system

### Clearing Storage

If you want to start fresh:
1. Click **"Clear Local Storage"**
2. This will reset to the original matches from the mapping file
3. **Warning**: This cannot be undone!

## Configuration

Edit `build-trait-matcher.js` to change paths:

```javascript
const CSV_PATH = path.join(__dirname, '..', 'Sod2 Charater Traits', 'Character', 'SOD2 Charaters Traits.csv');
const XML_DIR = path.join(__dirname, '..', 'Community Editor-45-5-1-8-1734526595');
const MAPPING_PATH = path.join(__dirname, 'data', 'trait-id-mapping.json');
```

## Tips

- Use the filter buttons to narrow down traits by category (Career, Hobby, Attribute, Philosophy)
- The search is case-insensitive and searches both names and descriptions
- You can click on any trait in either panel to select it
- Matched traits will show the XML ID below the CSV name

## Troubleshooting

**File not found errors:**
- Make sure the CSV and XML paths in `build-trait-matcher.js` are correct
- Check that the files exist at those locations

**No traits showing:**
- Rebuild the HTML file after updating paths
- Check browser console for errors

**Matches not saving:**
- Check if localStorage is enabled in your browser
- Try exporting matches manually if localStorage isn't working

