// Quick comparison script to check XML structure differences
// This helps identify ID format issues

const fs = require('fs');
const path = require('path');

function extractValues(xmlContent, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]+)</${tagName}>`, 'g');
    const matches = [];
    let match;
    while ((match = regex.exec(xmlContent)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}

function compareXMLFiles(file1, file2) {
    const xml1 = fs.readFileSync(file1, 'utf8');
    const xml2 = fs.readFileSync(file2, 'utf8');
    
    console.log('=== COMPARING XML FILES ===\n');
    console.log(`File 1: ${path.basename(file1)}`);
    console.log(`File 2: ${path.basename(file2)}\n`);
    
    // Compare VoiceID
    const voice1 = extractValues(xml1, 'PropertyName').find((name, idx, arr) => {
        const nextIdx = arr.indexOf('VoiceID', idx);
        return nextIdx !== -1 && xml1.indexOf('<Value>', xml1.indexOf(arr[nextIdx])) !== -1;
    });
    const voice1Value = extractValues(xml1, 'Value')[extractValues(xml1, 'PropertyName').indexOf('VoiceID') + 1];
    const voice2Value = extractValues(xml2, 'Value')[extractValues(xml2, 'PropertyName').indexOf('VoiceID') + 1];
    
    console.log('VoiceID:');
    console.log(`  Our: ${voice1Value}`);
    console.log(`  Ref: ${voice2Value}`);
    console.log(`  Match: ${voice1Value === voice2Value ? '✓' : '✗'}\n`);
    
    // Compare CulturalBackgroundName
    const cultural1 = extractValues(xml1, 'Value')[extractValues(xml1, 'PropertyName').indexOf('CulturalBackgroundName') + 1];
    const cultural2 = extractValues(xml2, 'Value')[extractValues(xml2, 'PropertyName').indexOf('CulturalBackgroundName') + 1];
    
    console.log('CulturalBackgroundName:');
    console.log(`  Our: ${cultural1}`);
    console.log(`  Ref: ${cultural2}`);
    console.log(`  Match: ${cultural1 === cultural2 ? '✓' : '✗'}\n`);
    
    // Compare HumanDefinition
    const human1 = extractValues(xml1, 'Value')[extractValues(xml1, 'PropertyName').indexOf('HumanDefinition') + 1];
    const human2 = extractValues(xml2, 'Value')[extractValues(xml2, 'PropertyName').indexOf('HumanDefinition') + 1];
    
    console.log('HumanDefinition:');
    console.log(`  Our: ${human1}`);
    console.log(`  Ref: ${human2}`);
    console.log(`  Format OK: ${human1 && human2 && human1.includes('Human') && human2.includes('Human') ? '✓' : '✗'}\n`);
    
    // Compare SkillResourceID values
    const skillIds1 = [];
    const skillIds2 = [];
    const skillMatches1 = xml1.matchAll(/<PropertyName>SkillResourceID<\/PropertyName>[\s\S]*?<Value>([^<]+)<\/Value>/g);
    const skillMatches2 = xml2.matchAll(/<PropertyName>SkillResourceID<\/PropertyName>[\s\S]*?<Value>([^<]+)<\/Value>/g);
    
    for (const match of skillMatches1) skillIds1.push(match[1]);
    for (const match of skillMatches2) skillIds2.push(match[1]);
    
    console.log('SkillResourceID:');
    console.log(`  Our: ${skillIds1.join(', ')}`);
    console.log(`  Ref: ${skillIds2.join(', ')}`);
    console.log(`  Format OK: ${skillIds1.every(s => ['Cardio', 'Wits', 'Fighting', 'Shooting', 'Hairdressing'].includes(s) || s.length > 0) ? '✓' : '✗'}\n`);
    
    // Compare SpecializationResourceID values
    const specIds1 = [];
    const specIds2 = [];
    const specMatches1 = xml1.matchAll(/<PropertyName>SpecializationResourceID<\/PropertyName>[\s\S]*?<Value>([^<]+)<\/Value>/g);
    const specMatches2 = xml2.matchAll(/<PropertyName>SpecializationResourceID<\/PropertyName>[\s\S]*?<Value>([^<]+)<\/Value>/g);
    
    for (const match of specMatches1) specIds1.push(match[1]);
    for (const match of specMatches2) specIds2.push(match[1]);
    
    console.log('SpecializationResourceID:');
    console.log(`  Our: ${specIds1.join(', ') || '(none)'}`);
    console.log(`  Ref: ${specIds2.join(', ') || '(none)'}`);
    console.log(`  Format OK: ${specIds1.every(s => s.length > 0 && !s.includes('▶')) ? '✓' : '✗'}\n`);
    
    // Compare TraitResourceID values
    const traitIds1 = [];
    const traitIds2 = [];
    const traitMatches1 = xml1.matchAll(/<PropertyName>TraitResourceID<\/PropertyName>[\s\S]*?<Value>([^<]+)<\/Value>/g);
    const traitMatches2 = xml2.matchAll(/<PropertyName>TraitResourceID<\/PropertyName>[\s\S]*?<Value>([^<]+)<\/Value>/g);
    
    for (const match of traitMatches1) traitIds1.push(match[1]);
    for (const match of traitMatches2) traitIds2.push(match[1]);
    
    console.log('TraitResourceID (first 10):');
    console.log(`  Our: ${traitIds1.slice(0, 10).join(', ')}`);
    console.log(`  Ref: ${traitIds2.slice(0, 10).join(', ')}`);
    
    // Check for invalid trait IDs
    const invalid1 = traitIds1.filter(t => t.includes('▶') || t.includes('much worse') || t.length < 3);
    const invalid2 = traitIds2.filter(t => t.includes('▶') || t.includes('much worse') || t.length < 3);
    
    console.log(`  Invalid in ours: ${invalid1.length > 0 ? invalid1.join(', ') : 'none ✓'}`);
    console.log(`  Invalid in ref: ${invalid2.length > 0 ? invalid2.join(', ') : 'none ✓'}\n`);
    
    // Compare AgeRange descriptor format
    const ageDesc1 = traitIds1.find(t => t.includes('Descriptor_Age_'));
    const ageDesc2 = traitIds2.find(t => t.includes('Descriptor_Age_'));
    
    console.log('Age Descriptor:');
    console.log(`  Our: ${ageDesc1 || 'NOT FOUND'}`);
    console.log(`  Ref: ${ageDesc2 || 'NOT FOUND'}`);
    console.log(`  Format OK: ${ageDesc1 && ageDesc2 && !ageDesc1.includes('MiddleAged') && !ageDesc2.includes('MiddleAged') ? '✓' : ageDesc1 && ageDesc1.includes('MiddleAged') ? '✗ (should be MiddleAge)' : '?'}\n`);
}

// Run comparison
const ourFile = process.argv[2] || 'C:\\Users\\wallc\\Downloads\\Joseph Moore (Joseph).xml';
const refFile = process.argv[3] || 'C:\\SOD2 Mods\\Community Editor-45-5-1-8-1734526595\\Lauren Napier (Lauren)';

if (fs.existsSync(ourFile) && fs.existsSync(refFile)) {
    compareXMLFiles(ourFile, refFile);
} else {
    console.log('Files not found. Usage: node compare-xml.js <our-file> <ref-file>');
}

