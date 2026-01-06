# State of Decay 2 Character Generator

A web-based character generator for State of Decay 2 that creates XML files compatible with the Community Editor.

🌐 **Live Demo**: [View on GitHub Pages](https://YOUR_USERNAME.github.io/sod2-character-generator/)

## Features

- **Complete Character Creation**: Create custom survivors with all attributes
- **Skills System**: 
  - Four core skills (Cardio, Wits, Fighting, Shooting) with levels 0-7
  - Specializations available at level 5+
  - Optional 5th skill (Community or Quirk skill)
- **Traits Management**:
  - Required traits (Default, Age, Pronoun, Philosophies)
  - Optional traits with multiple selection modes
  - Trait limit enforcement
- **Loadout Presets**: Heavy, Middle, Light, and Custom loadouts
- **XML Export**: Generate valid XML files for Community Editor import

## Setup

### Option 1: GitHub Pages (Recommended)

1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Select source branch (usually `main` or `master`)
4. The site will be available at `https://YOUR_USERNAME.github.io/sod2-character-generator/`

### Option 2: Local Development

1. Install Node.js (if not already installed)
2. Run the local server:
   ```bash
   npm start
   # or
   node server.js
   ```
3. Open `http://localhost:8000` in your browser

### Option 3: Direct File (Not Recommended)

Opening `index.html` directly will cause CORS errors. Use one of the options above.

## Usage

1. **Basic Information**: Fill in name, gender, age, voice, cultural background, and character model
2. **Character Attributes**: Select philosophies, standing level, leader type, and optional hero bonus
3. **Skills**: 
   - Adjust core skill levels (0-7)
   - Select specializations when level 5+ is reached
   - Choose optional 5th skill (Community, Quirk, or None)
4. **Traits**:
   - Select trait mode (Custom, All Good, Random, All Bad)
   - Set trait limit (default: 12)
   - Add optional traits by clicking on them
   - Required traits are automatically included
5. **Stats** (Optional): Adjust health and stamina
6. **Loadout** (Optional): Select equipment preset or customize manually
7. **Export**: Click "Preview XML" to review or "Download XML" to save

## File Structure

```
sod2-character-generator/
├── index.html          # Main HTML file
├── css/
│   └── styles.css     # Styling
├── js/
│   ├── dataLoader.js  # Loads JSON data files
│   ├── app.js         # Main application logic
│   ├── traitManager.js # Trait management
│   ├── loadouts.js    # Loadout management
│   ├── constraints.js # Validation and constraints
│   └── xmlGenerator.js # XML generation
├── data/              # JSON data files (converted from CSV)
└── README.md          # This file
```

## Data Files

All game data is stored in JSON format in the `data/` directory:
- `maleVoices.json`, `femaleVoices.json` - Voice options
- `culturalBackgrounds.json` - Cultural backgrounds
- `humanDefinitions.json` - Character models
- `coreSkills.json` - Core 4 skills
- `communitySkills.json` - Community 5th skills
- `quirkSkills.json` - Quirk skills
- `traits.json` - All character traits
- `enums.json` - Enum values (age, pronouns, philosophies, etc.)
- `loadouts.json` - Loadout presets
- Weapon and equipment JSON files

## Notes

- Equipment ClassString paths are not yet fully implemented - equipment slots can be left empty
- Trait ResourceIDs use trait names directly - may need mapping to actual game IDs
- Character IDs are randomly generated
- Some advanced XML features (inventory, detailed equipment) are simplified

## Browser Compatibility

Works in modern browsers that support:
- ES6 JavaScript
- Fetch API
- File download API

Tested in Chrome, Firefox, and Edge.

## GitHub Setup Instructions

1. **Create a new repository on GitHub** (or use an existing one)
   - Repository name: `sod2-character-generator` (or your preferred name)
   - Make it public (required for GitHub Pages free tier)

2. **Initialize and push to GitHub**:
   ```bash
   cd sod2-character-generator
   git init
   git add .
   git commit -m "Initial commit: SOD2 Character Generator"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sod2-character-generator.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select branch `main` (or `master`)
   - Click **Save**
   - Your site will be live at: `https://YOUR_USERNAME.github.io/sod2-character-generator/`

4. **Update the live demo link** in this README with your actual GitHub Pages URL

## Contributing

Feel free to submit issues or pull requests!

## License

MIT License - feel free to use and modify as needed.

