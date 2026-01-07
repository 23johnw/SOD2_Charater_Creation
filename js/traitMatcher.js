// Trait Matcher Interface
class TraitMatcher {
    constructor() {
        this.csvTraits = [];
        this.xmlTraits = [];
        this.matches = {};
        this.selectedCsvTrait = null;
        this.selectedXmlTrait = null;
        this.csvFilter = 'all';
        this.xmlFilter = 'all';
        this.rules = [];
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.render();
    }

    async loadData() {
        try {
            // Load CSV traits
            const csvResponse = await fetch('/api/traits/csv');
            const csvData = await csvResponse.json();
            this.csvTraits = csvData.traits;
            
            // Load XML traits
            const xmlResponse = await fetch('/api/traits/xml');
            const xmlData = await xmlResponse.json();
            this.xmlTraits = xmlData.traits;
            
            // Load existing matches
            const matchesResponse = await fetch('/api/traits/matches');
            if (matchesResponse.ok) {
                this.matches = await matchesResponse.json();
            }
            
            // Load rules
            const rulesResponse = await fetch('/api/traits/rules');
            if (rulesResponse.ok) {
                this.rules = await rulesResponse.json();
                document.getElementById('rulesEditor').value = JSON.stringify(this.rules, null, 2);
            }
            
            console.log(`Loaded ${this.csvTraits.length} CSV traits and ${this.xmlTraits.length} XML traits`);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading data. Make sure the server is running and data files exist.');
        }
    }

    setupEventListeners() {
        // CSV search
        document.getElementById('csvSearch').addEventListener('input', (e) => {
            this.render();
        });
        
        // XML search
        document.getElementById('xmlSearch').addEventListener('input', (e) => {
            this.render();
        });
        
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
        document.getElementById('matchBtn').addEventListener('click', () => {
            this.createMatch();
        });
        
        // Unmatch button
        document.getElementById('unmatchBtn').addEventListener('click', () => {
            this.removeMatch();
        });
        
        // XML trait input suggestions
        document.getElementById('xmlTraitInput').addEventListener('input', (e) => {
            this.showSuggestions(e.target.value);
        });
        
        // Save rules
        document.getElementById('saveRulesBtn').addEventListener('click', () => {
            this.saveRules();
        });
        
        // Test rules
        document.getElementById('testRulesBtn').addEventListener('click', () => {
            this.testRules();
        });
        
        // Export matches
        document.getElementById('exportMatchesBtn').addEventListener('click', () => {
            this.exportMatches();
        });
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
        
        document.getElementById('csvCount').textContent = `${traits.length} traits`;
        
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
            
            return `
                <div class="${classes.join(' ')}" data-csv-trait="${trait.Name}">
                    <div class="trait-name">${trait.Name}</div>
                    ${trait.Description ? `<div style="font-size: 11px; color: #95a5a6; margin-top: 4px;">${trait.Description.substring(0, 100)}${trait.Description.length > 100 ? '...' : ''}</div>` : ''}
                    ${isMatched ? `<div class="trait-id">→ ${this.matches[trait.Name]}</div>` : ''}
                </div>
            `;
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
        
        document.getElementById('xmlCount').textContent = `${traits.length} traits`;
        
        if (traits.length === 0) {
            container.innerHTML = '<div class="empty-state">No XML traits found</div>';
            return;
        }
        
        container.innerHTML = traits.map(trait => {
            const isSelected = this.selectedXmlTrait === trait;
            const classes = ['trait-item'];
            if (isSelected) classes.push('selected');
            
            return `
                <div class="${classes.join(' ')}" data-xml-trait="${trait}">
                    <div class="trait-name">${trait}</div>
                </div>
            `;
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
        
        suggestionsDiv.innerHTML = matches.map(trait => `
            <div class="suggestion-item" data-trait="${trait}">${trait}</div>
        `).join('');
        
        suggestionsDiv.style.display = 'block';
        
        suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('xmlTraitInput').value = item.dataset.trait;
                suggestionsDiv.style.display = 'none';
            });
        });
    }

    async createMatch() {
        const csvTrait = document.getElementById('csvTraitInput').value;
        const xmlTrait = document.getElementById('xmlTraitInput').value;
        
        if (!csvTrait || !xmlTrait) {
            alert('Please select both a CSV trait and an XML trait ID');
            return;
        }
        
        this.matches[csvTrait] = xmlTrait;
        
        try {
            await fetch('/api/traits/matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csvTrait, xmlTrait })
            });
            
            document.getElementById('xmlTraitInput').value = '';
            this.selectedCsvTrait = null;
            this.selectedXmlTrait = null;
            this.render();
        } catch (error) {
            console.error('Error saving match:', error);
            alert('Error saving match');
        }
    }

    async removeMatch() {
        const csvTrait = document.getElementById('csvTraitInput').value;
        
        if (!csvTrait || !this.matches[csvTrait]) {
            alert('No match to remove');
            return;
        }
        
        delete this.matches[csvTrait];
        
        try {
            await fetch('/api/traits/matches', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csvTrait })
            });
            
            document.getElementById('xmlTraitInput').value = '';
            this.selectedCsvTrait = null;
            this.render();
        } catch (error) {
            console.error('Error removing match:', error);
            alert('Error removing match');
        }
    }

    async saveRules() {
        try {
            const rulesText = document.getElementById('rulesEditor').value;
            this.rules = JSON.parse(rulesText);
            
            await fetch('/api/traits/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.rules)
            });
            
            alert('Rules saved successfully');
        } catch (error) {
            console.error('Error saving rules:', error);
            alert('Error saving rules. Make sure the JSON is valid.');
        }
    }

    async testRules() {
        try {
            const rulesText = document.getElementById('rulesEditor').value;
            const rules = JSON.parse(rulesText);
            
            const response = await fetch('/api/traits/test-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rules })
            });
            
            const result = await response.json();
            alert(`Test Results:\nMatched: ${result.matched}\nUnmatched: ${result.unmatched}\nMatch Rate: ${result.matchRate}%`);
        } catch (error) {
            console.error('Error testing rules:', error);
            alert('Error testing rules. Make sure the JSON is valid.');
        }
    }

    async exportMatches() {
        try {
            const response = await fetch('/api/traits/export');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'trait-id-mapping.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting matches:', error);
            alert('Error exporting matches');
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TraitMatcher();
});





