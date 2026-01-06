// Build standalone trait matcher HTML with embedded data
const fs = require('fs');
const path = require('path');

// Configuration - adjust these paths as needed
const CSV_PATH = path.join(__dirname, '..', 'Sod2 Charater Traits', 'Character', 'SOD2 Charaters Traits.csv');
const XML_DIR = path.join(__dirname, '..', 'Community Editor-45-5-1-8-1734526595');
const MAPPING_PATH = path.join(__dirname, 'data', 'trait-id-mapping.json');
const OUTPUT_PATH = path.join(__dirname, 'trait-matcher-standalone.html');

console.log('Building standalone trait matcher...\n');

// Extract trait IDs from all XML files
function extractXmlTraits() {
    const traitIds = new Set();
    const traitIdPattern = /<PropertyName>TraitResourceID<\/PropertyName>[\s\S]*?<Value>(.*?)<\/Value>/g;
    
    console.log('Scanning XML files for trait IDs...');
    
    function scanDirectory(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                scanDirectory(fullPath);
            } else if (entry.isFile() && !entry.name.endsWith('.bak')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    let match;
                    while ((match = traitIdPattern.exec(content)) !== null) {
                        const traitId = match[1].trim();
                        if (traitId && traitId !== '') {
                            traitIds.add(traitId);
                        }
                    }
                } catch (err) {
                    // Skip files that can't be read
                }
            }
        }
    }
    
    if (fs.existsSync(XML_DIR)) {
        scanDirectory(XML_DIR);
    } else {
        console.warn(`Warning: XML directory not found: ${XML_DIR}`);
    }
    
    return Array.from(traitIds).sort();
}

// Parse CSV traits
function parseCsvTraits() {
    if (!fs.existsSync(CSV_PATH)) {
        console.warn(`Warning: CSV file not found: ${CSV_PATH}`);
        return [];
    }
    
    console.log('Parsing CSV traits...');
    const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const traits = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle CSV with quoted fields
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));
        
        if (values.length >= headers.length && values[0]) {
            const trait = {};
            headers.forEach((header, idx) => {
                trait[header] = values[idx] || '';
            });
            if (trait.Name && trait.Name.trim()) {
                traits.push(trait);
            }
        }
    }
    
    return traits;
}

// Load existing matches
function loadExistingMatches() {
    if (fs.existsSync(MAPPING_PATH)) {
        return JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
    }
    return {};
}

// Generate standalone HTML
function generateStandaloneHTML(csvTraits, xmlTraits, existingMatches) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trait Matcher - SOD2 Character Generator</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔗</text></svg>">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #1a1a1a;
            color: #ecf0f1;
            line-height: 1.6;
        }
        .matcher-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #34495e;
        }
        header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            color: #3498db;
        }
        .stats-bar {
            background: #2c3e50;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
        }
        .stat-item {
            text-align: center;
            margin: 5px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
        }
        .stat-label {
            font-size: 12px;
            color: #bdc3c7;
            text-transform: uppercase;
        }
        .match-rate {
            color: #e74c3c;
        }
        .match-rate.good {
            color: #2ecc71;
        }
        .main-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        @media (max-width: 1200px) {
            .main-content {
                grid-template-columns: 1fr;
            }
        }
        .panel {
            background: #34495e;
            border-radius: 8px;
            padding: 15px;
        }
        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #2c3e50;
        }
        .panel-title {
            font-size: 18px;
            font-weight: bold;
            color: #ecf0f1;
        }
        .search-box {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid #2c3e50;
            border-radius: 4px;
            background: #2c3e50;
            color: #ecf0f1;
            font-size: 14px;
        }
        .trait-list {
            max-height: 600px;
            overflow-y: auto;
        }
        .trait-item {
            background: #2c3e50;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
            border-left: 3px solid transparent;
        }
        .trait-item:hover {
            background: #3d566e;
        }
        .trait-item.selected {
            background: #3498db;
            border-left-color: #2980b9;
        }
        .trait-item.matched {
            background: #27ae60;
            border-left-color: #229954;
        }
        .trait-name {
            font-weight: bold;
            color: #ecf0f1;
            margin-bottom: 4px;
        }
        .trait-id {
            font-size: 12px;
            color: #95a5a6;
            font-family: monospace;
        }
        .match-controls {
            background: #34495e;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .match-controls h3 {
            margin-top: 0;
            margin-bottom: 15px;
        }
        .control-group {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
            align-items: center;
        }
        .control-group label {
            min-width: 120px;
        }
        .control-group input[type="text"] {
            flex: 1;
            padding: 8px;
            border: 1px solid #2c3e50;
            border-radius: 4px;
            background: #2c3e50;
            color: #ecf0f1;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: background 0.2s;
        }
        .btn-primary {
            background: #3498db;
            color: white;
        }
        .btn-primary:hover {
            background: #2980b9;
        }
        .btn-success {
            background: #2ecc71;
            color: white;
        }
        .btn-success:hover {
            background: #27ae60;
        }
        .btn-danger {
            background: #e74c3c;
            color: white;
        }
        .btn-danger:hover {
            background: #c0392b;
        }
        .btn-secondary {
            background: #95a5a6;
            color: white;
        }
        .btn-secondary:hover {
            background: #7f8c8d;
        }
        .suggestions {
            margin-top: 10px;
            padding: 10px;
            background: #2c3e50;
            border-radius: 4px;
            max-height: 200px;
            overflow-y: auto;
            display: none;
        }
        .suggestion-item {
            padding: 8px;
            margin-bottom: 5px;
            background: #34495e;
            border-radius: 4px;
            cursor: pointer;
        }
        .suggestion-item:hover {
            background: #3d566e;
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #95a5a6;
        }
        .filters {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        .filter-btn {
            padding: 6px 12px;
            border: 1px solid #2c3e50;
            border-radius: 4px;
            background: #2c3e50;
            color: #ecf0f1;
            cursor: pointer;
            font-size: 12px;
        }
        .filter-btn.active {
            background: #3498db;
            border-color: #2980b9;
        }
        .export-section {
            background: #34495e;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .export-section h3 {
            margin-top: 0;
            margin-bottom: 15px;
        }
        .status-message {
            padding: 10px;
            margin-top: 10px;
            border-radius: 4px;
            display: none;
        }
        .status-message.success {
            background: #27ae60;
            display: block;
        }
        .status-message.error {
            background: #e74c3c;
            display: block;
        }
    </style>
</head>
<body>
    <div class="matcher-container">
        <header>
            <h1>🔗 Trait Matcher</h1>
            <p>Match CSV traits with XML TraitResourceIDs (Standalone - No Server Required)</p>
        </header>

        <div class="stats-bar">
            <div class="stat-item">
                <div class="stat-value" id="totalCsvTraits">0</div>
                <div class="stat-label">Total CSV Traits</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="totalXmlTraits">0</div>
                <div class="stat-label">Total XML Traits</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="matchedCount">0</div>
                <div class="stat-label">Matched</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="unmatchedCount">0</div>
                <div class="stat-label">Unmatched</div>
            </div>
            <div class="stat-item">
                <div class="stat-value match-rate" id="matchRate">0%</div>
                <div class="stat-label">Match Rate</div>
            </div>
        </div>

        <div class="match-controls">
            <h3>Manual Matching</h3>
            <div class="control-group">
                <label>CSV Trait:</label>
                <input type="text" id="csvTraitInput" readonly>
            </div>
            <div class="control-group">
                <label>XML Trait ID:</label>
                <input type="text" id="xmlTraitInput" placeholder="Enter or select XML trait ID">
                <button class="btn btn-primary" id="matchBtn">Match</button>
                <button class="btn btn-danger" id="unmatchBtn">Unmatch</button>
            </div>
            <div id="suggestions" class="suggestions"></div>
        </div>

        <div class="main-content">
            <div class="panel">
                <div class="panel-header">
                    <div class="panel-title">Unmatched CSV Traits</div>
                    <div style="color: #95a5a6; font-size: 12px;" id="csvCount">0 traits</div>
                </div>
                <input type="text" class="search-box" id="csvSearch" placeholder="Search CSV traits...">
                <div class="filters">
                    <button class="filter-btn active" data-filter="all">All</button>
                    <button class="filter-btn" data-filter="career">Career</button>
                    <button class="filter-btn" data-filter="hobby">Hobby</button>
                    <button class="filter-btn" data-filter="attribute">Attribute</button>
                    <button class="filter-btn" data-filter="philosophy">Philosophy</button>
                </div>
                <div class="trait-list" id="csvTraitsList"></div>
            </div>

            <div class="panel">
                <div class="panel-header">
                    <div class="panel-title">Available XML Trait IDs</div>
                    <div style="color: #95a5a6; font-size: 12px;" id="xmlCount">0 traits</div>
                </div>
                <input type="text" class="search-box" id="xmlSearch" placeholder="Search XML trait IDs...">
                <div class="filters">
                    <button class="filter-btn active" data-filter-xml="all">All</button>
                    <button class="filter-btn" data-filter-xml="career">Career</button>
                    <button class="filter-btn" data-filter-xml="hobby">Hobby</button>
                    <button class="filter-btn" data-filter-xml="attribute">Attribute</button>
                    <button class="filter-btn" data-filter-xml="philosophy">Philosophy</button>
                    <button class="filter-btn" data-filter-xml="descriptor">Descriptor</button>
                </div>
                <div class="trait-list" id="xmlTraitsList"></div>
            </div>
        </div>

        <div class="export-section">
            <h3>Export & Save</h3>
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 10px;">
                Your matches are automatically saved to browser localStorage. Export to save to a file.
            </p>
            <div>
                <button class="btn btn-success" id="exportMatchesBtn">Export Matches (JSON)</button>
                <button class="btn btn-secondary" id="clearStorageBtn">Clear Local Storage</button>
            </div>
            <div id="statusMessage" class="status-message"></div>
        </div>
    </div>

    <script>
        // Embedded data
        const CSV_TRAITS = ${JSON.stringify(csvTraits, null, 8)};
        const XML_TRAITS = ${JSON.stringify(xmlTraits, null, 8)};
        const EXISTING_MATCHES = ${JSON.stringify(existingMatches, null, 8)};

        // Trait Matcher Interface
        class TraitMatcher {
            constructor() {
                this.csvTraits = CSV_TRAITS;
                this.xmlTraits = XML_TRAITS;
                this.matches = { ...EXISTING_MATCHES };
                this.selectedCsvTrait = null;
                this.selectedXmlTrait = null;
                this.csvFilter = 'all';
                this.xmlFilter = 'all';
                
                // Load from localStorage if available
                this.loadFromStorage();
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.render();
            }

            loadFromStorage() {
                try {
                    const stored = localStorage.getItem('traitMatches');
                    if (stored) {
                        const storedMatches = JSON.parse(stored);
                        // Merge with existing matches (localStorage takes precedence)
                        this.matches = { ...this.matches, ...storedMatches };
                    }
                } catch (e) {
                    console.warn('Could not load from localStorage:', e);
                }
            }

            saveToStorage() {
                try {
                    localStorage.setItem('traitMatches', JSON.stringify(this.matches));
                } catch (e) {
                    console.warn('Could not save to localStorage:', e);
                }
            }

            setupEventListeners() {
                // CSV search
                document.getElementById('csvSearch').addEventListener('input', () => this.render());
                
                // XML search
                document.getElementById('xmlSearch').addEventListener('input', () => this.render());
                
                // CSV filter buttons
                document.querySelectorAll('[data-filter]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        this.csvFilter = e.target.dataset.filter;
                        this.render();
                    });
                });
                
                // XML filter buttons
                document.querySelectorAll('[data-filter-xml]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        document.querySelectorAll('[data-filter-xml]').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        this.xmlFilter = e.target.dataset.filterXml;
                        this.render();
                    });
                });
                
                // Match button
                document.getElementById('matchBtn').addEventListener('click', () => this.createMatch());
                
                // Unmatch button
                document.getElementById('unmatchBtn').addEventListener('click', () => this.removeMatch());
                
                // XML trait input suggestions
                document.getElementById('xmlTraitInput').addEventListener('input', (e) => {
                    this.showSuggestions(e.target.value);
                });
                
                // Export matches
                document.getElementById('exportMatchesBtn').addEventListener('click', () => this.exportMatches());
                
                // Clear storage
                document.getElementById('clearStorageBtn').addEventListener('click', () => this.clearStorage());
            }

            getUnmatchedCsvTraits() {
                return this.csvTraits.filter(t => !this.matches[t.Name]);
            }

            getFilteredCsvTraits() {
                let traits = this.getUnmatchedCsvTraits();
                const search = document.getElementById('csvSearch').value.toLowerCase();
                
                if (search) {
                    traits = traits.filter(t => 
                        t.Name.toLowerCase().includes(search) ||
                        (t.Description && t.Description.toLowerCase().includes(search))
                    );
                }
                
                if (this.csvFilter !== 'all') {
                    traits = traits.filter(t => {
                        const name = t.Name.toLowerCase();
                        switch(this.csvFilter) {
                            case 'career': return name.includes('career');
                            case 'hobby': return name.includes('hobby');
                            case 'attribute': return name.includes('attribute');
                            case 'philosophy': return name.includes('philosophy');
                            default: return true;
                        }
                    });
                }
                
                return traits;
            }

            getFilteredXmlTraits() {
                let traits = this.xmlTraits;
                const search = document.getElementById('xmlSearch').value.toLowerCase();
                
                if (search) {
                    traits = traits.filter(t => t.toLowerCase().includes(search));
                }
                
                if (this.xmlFilter !== 'all') {
                    traits = traits.filter(t => {
                        const lower = t.toLowerCase();
                        switch(this.xmlFilter) {
                            case 'career': return lower.includes('_career_');
                            case 'hobby': return lower.includes('_hobby_');
                            case 'attribute': return lower.includes('_attribute_');
                            case 'philosophy': return lower.includes('philosophy_');
                            case 'descriptor': return lower.includes('descriptor_');
                            default: return true;
                        }
                    });
                }
                
                return traits;
            }

            render() {
                this.updateStats();
                this.renderCsvTraits();
                this.renderXmlTraits();
            }

            updateStats() {
                const totalCsv = this.csvTraits.length;
                const totalXml = this.xmlTraits.length;
                const matched = Object.keys(this.matches).length;
                const unmatched = totalCsv - matched;
                const matchRate = totalCsv > 0 ? ((matched / totalCsv) * 100).toFixed(1) : 0;
                
                document.getElementById('totalCsvTraits').textContent = totalCsv;
                document.getElementById('totalXmlTraits').textContent = totalXml;
                document.getElementById('matchedCount').textContent = matched;
                document.getElementById('unmatchedCount').textContent = unmatched;
                document.getElementById('matchRate').textContent = matchRate + '%';
                
                const matchRateEl = document.getElementById('matchRate');
                matchRateEl.classList.remove('good');
                if (parseFloat(matchRate) >= 50) {
                    matchRateEl.classList.add('good');
                }
            }

            renderCsvTraits() {
                const container = document.getElementById('csvTraitsList');
                const traits = this.getFilteredCsvTraits();
                
                document.getElementById('csvCount').textContent = \`\${traits.length} traits\`;
                
                if (traits.length === 0) {
                    container.innerHTML = '<div class="empty-state">No unmatched traits found</div>';
                    return;
                }
                
                container.innerHTML = traits.map(trait => {
                    const isSelected = this.selectedCsvTrait === trait.Name;
                    const isMatched = !!this.matches[trait.Name];
                    const classes = ['trait-item'];
                    if (isSelected) classes.push('selected');
                    if (isMatched) classes.push('matched');
                    
                    return \`
                        <div class="\${classes.join(' ')}" data-csv-trait="\${trait.Name}">
                            <div class="trait-name">\${trait.Name}</div>
                            \${trait.Description ? \`<div style="font-size: 11px; color: #95a5a6; margin-top: 4px;">\${trait.Description.substring(0, 100)}\${trait.Description.length > 100 ? '...' : ''}</div>\` : ''}
                            \${isMatched ? \`<div class="trait-id">→ \${this.matches[trait.Name]}</div>\` : ''}
                        </div>
                    \`;
                }).join('');
                
                // Add click listeners
                container.querySelectorAll('.trait-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const traitName = item.dataset.csvTrait;
                        this.selectCsvTrait(traitName);
                    });
                });
            }

            renderXmlTraits() {
                const container = document.getElementById('xmlTraitsList');
                const traits = this.getFilteredXmlTraits();
                
                document.getElementById('xmlCount').textContent = \`\${traits.length} traits\`;
                
                if (traits.length === 0) {
                    container.innerHTML = '<div class="empty-state">No XML traits found</div>';
                    return;
                }
                
                container.innerHTML = traits.map(trait => {
                    const isSelected = this.selectedXmlTrait === trait;
                    const classes = ['trait-item'];
                    if (isSelected) classes.push('selected');
                    
                    return \`
                        <div class="\${classes.join(' ')}" data-xml-trait="\${trait}">
                            <div class="trait-name">\${trait}</div>
                        </div>
                    \`;
                }).join('');
                
                // Add click listeners
                container.querySelectorAll('.trait-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const traitId = item.dataset.xmlTrait;
                        this.selectXmlTrait(traitId);
                    });
                });
            }

            selectCsvTrait(traitName) {
                this.selectedCsvTrait = traitName;
                document.getElementById('csvTraitInput').value = traitName;
                
                // If already matched, show the match
                if (this.matches[traitName]) {
                    document.getElementById('xmlTraitInput').value = this.matches[traitName];
                } else {
                    document.getElementById('xmlTraitInput').value = '';
                }
                
                this.render();
            }

            selectXmlTrait(traitId) {
                this.selectedXmlTrait = traitId;
                document.getElementById('xmlTraitInput').value = traitId;
                this.render();
            }

            showSuggestions(query) {
                const suggestionsDiv = document.getElementById('suggestions');
                if (!query || query.length < 2) {
                    suggestionsDiv.style.display = 'none';
                    return;
                }
                
                const queryLower = query.toLowerCase();
                const matches = this.xmlTraits
                    .filter(t => t.toLowerCase().includes(queryLower))
                    .slice(0, 10);
                
                if (matches.length === 0) {
                    suggestionsDiv.style.display = 'none';
                    return;
                }
                
                suggestionsDiv.innerHTML = matches.map(trait => \`
                    <div class="suggestion-item" data-trait="\${trait}">\${trait}</div>
                \`).join('');
                
                suggestionsDiv.style.display = 'block';
                
                suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        document.getElementById('xmlTraitInput').value = item.dataset.trait;
                        suggestionsDiv.style.display = 'none';
                    });
                });
            }

            createMatch() {
                const csvTrait = document.getElementById('csvTraitInput').value;
                const xmlTrait = document.getElementById('xmlTraitInput').value;
                
                if (!csvTrait || !xmlTrait) {
                    this.showStatus('Please select both a CSV trait and an XML trait ID', 'error');
                    return;
                }
                
                this.matches[csvTrait] = xmlTrait;
                this.saveToStorage();
                
                document.getElementById('xmlTraitInput').value = '';
                this.selectedCsvTrait = null;
                this.selectedXmlTrait = null;
                this.showStatus('Match created successfully!', 'success');
                this.render();
            }

            removeMatch() {
                const csvTrait = document.getElementById('csvTraitInput').value;
                
                if (!csvTrait || !this.matches[csvTrait]) {
                    this.showStatus('No match to remove', 'error');
                    return;
                }
                
                delete this.matches[csvTrait];
                this.saveToStorage();
                
                document.getElementById('xmlTraitInput').value = '';
                this.selectedCsvTrait = null;
                this.showStatus('Match removed successfully!', 'success');
                this.render();
            }

            exportMatches() {
                const dataStr = JSON.stringify(this.matches, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'trait-id-mapping.json';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                this.showStatus('Matches exported successfully!', 'success');
            }

            clearStorage() {
                if (confirm('Are you sure you want to clear all local storage? This cannot be undone.')) {
                    localStorage.removeItem('traitMatches');
                    this.matches = { ...EXISTING_MATCHES };
                    this.saveToStorage();
                    this.showStatus('Local storage cleared!', 'success');
                    this.render();
                }
            }

            showStatus(message, type) {
                const statusEl = document.getElementById('statusMessage');
                statusEl.textContent = message;
                statusEl.className = 'status-message ' + type;
                setTimeout(() => {
                    statusEl.className = 'status-message';
                }, 3000);
            }
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new TraitMatcher();
        });
    </script>
</body>
</html>`;
    
    return html;
}

// Main execution
try {
    console.log('Extracting XML traits...');
    const xmlTraits = extractXmlTraits();
    console.log(`Found ${xmlTraits.length} unique XML trait IDs\n`);
    
    console.log('Parsing CSV traits...');
    const csvTraits = parseCsvTraits();
    console.log(`Found ${csvTraits.length} CSV traits\n`);
    
    console.log('Loading existing matches...');
    const existingMatches = loadExistingMatches();
    console.log(`Found ${Object.keys(existingMatches).length} existing matches\n`);
    
    console.log('Generating standalone HTML...');
    const html = generateStandaloneHTML(csvTraits, xmlTraits, existingMatches);
    
    fs.writeFileSync(OUTPUT_PATH, html, 'utf8');
    console.log(`\n✓ Standalone trait matcher generated: ${OUTPUT_PATH}`);
    console.log(`\nYou can now open this file directly in your browser - no server needed!`);
    console.log(`\nMatches are saved to browser localStorage and can be exported as JSON.`);
} catch (error) {
    console.error('Error building trait matcher:', error);
    process.exit(1);
}

