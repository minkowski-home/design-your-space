#!/usr/bin/env node

/**
 * Model Management Script for Design Your Space
 * 
 * This script helps manage GLB models in the project.
 * Usage: node scripts/manage_models.js [command]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.join(__dirname, '../public/models');
const FURNITURE_FILE = path.join(__dirname, '../src/components/Furniture.js');

function listModels() {
    console.log('📁 Available GLB Models:');
    console.log('========================');
    
    if (!fs.existsSync(MODELS_DIR)) {
        console.log('❌ Models directory does not exist');
        return;
    }
    
    const files = fs.readdirSync(MODELS_DIR);
    const glbFiles = files.filter(file => file.endsWith('.glb'));
    
    if (glbFiles.length === 0) {
        console.log('❌ No GLB files found in models directory');
        return;
    }
    
    glbFiles.forEach((file, index) => {
        const filePath = path.join(MODELS_DIR, file);
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`${index + 1}. ${file}`);
        console.log(`   Size: ${sizeMB} MB`);
        console.log(`   Path: /models/${file}`);
        console.log('');
    });
}

function generateModelConfig() {
    console.log('🔧 Generating Model Configuration:');
    console.log('==================================');
    
    if (!fs.existsSync(MODELS_DIR)) {
        console.log('❌ Models directory does not exist');
        return;
    }
    
    const files = fs.readdirSync(MODELS_DIR);
    const glbFiles = files.filter(file => file.endsWith('.glb'));
    
    if (glbFiles.length === 0) {
        console.log('❌ No GLB files found');
        return;
    }
    
    console.log('Add this configuration to your Furniture.js file:');
    console.log('');
    
    glbFiles.forEach(file => {
        const modelName = file.replace('.glb', '').replace(/_/g, ' ');
        console.log(`{
    path: '/models/${file}',
    name: '${modelName}',
    scale: 0.5,
    height: 0.3,
    probability: 0.7
},`);
    });
}

function help() {
    console.log('🎨 Model Management Script');
    console.log('==========================');
    console.log('');
    console.log('Commands:');
    console.log('  list     - List all available GLB models');
    console.log('  config   - Generate configuration for models');
    console.log('  help     - Show this help message');
    console.log('');
    console.log('Usage: node scripts/manage_models.js [command]');
}

const command = process.argv[2] || 'help';

switch (command) {
    case 'list':
        listModels();
        break;
    case 'config':
        generateModelConfig();
        break;
    case 'help':
    default:
        help();
        break;
}
