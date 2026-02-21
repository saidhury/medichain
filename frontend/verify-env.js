#!/usr/bin/env node
/**
 * Environment Verification Script - Windows & Linux Compatible
 * Run with: node verify-env.js
 * OR (Node 20.6+): node --env-file=.env verify-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredEnvVars = [
  { key: 'VITE_CONTRACT_ADDRESS', name: 'Contract Address', critical: true },
  { key: 'VITE_SEPOLIA_RPC_URL', name: 'Sepolia RPC URL', critical: true },
  { key: 'VITE_PINATA_API_KEY', name: 'Pinata API Key', critical: false },
  { key: 'VITE_PINATA_SECRET_KEY', name: 'Pinata Secret Key', critical: false },
  { key: 'VITE_ENCRYPTION_API_URL', name: 'Encryption Service URL', critical: true },
  { key: 'VITE_API_URL', name: 'Django API URL', critical: true },
];

const sensitivePatterns = [
  /0x[a-fA-F0-9]{64}/,
  /sk-[a-zA-Z0-9]{48}/,
];

function maskKey(key) {
  if (!key || key.length < 8) return '***';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function isPlaceholder(value) {
  const placeholders = ['your_', 'placeholder', 'example', 'test', 'xxx', '0000', 'changeme'];
  return !value || placeholders.some(p => value.toLowerCase().includes(p));
}

function looksLikePrivateKey(value) {
  return sensitivePatterns.some(pattern => pattern.test(value));
}

console.log('\n🔐 MediChain Environment Verification\n');
console.log('='.repeat(50));

let criticalMissing = 0;
let warnings = 0;

// Initialize vars with existing process.env (in case --env-file was used)
const envVars = { ...process.env };

// Manual Parse .env as fallback/primary
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  // Updated Regex: Handles Windows \r\n and strips extra quotes/whitespace
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove surrounding quotes
      value = value.trim().replace(/^(['"])(.*)\1$/, '$2');
      envVars[key] = value;
    }
  });
} else if (Object.keys(envVars).length < 5) {
    console.error('\n❌ .env file not found and no environment variables detected!');
    process.exit(1);
}

// Check each required variable
requiredEnvVars.forEach(({ key, name, critical }) => {
  const value = envVars[key];
  const isSet = value && !isPlaceholder(value);
  
  if (critical && !isSet) {
    console.log(`\n❌ ${name} (${key})`);
    console.log(`   Status: MISSING OR INVALID`);
    console.log(`   Value: ${value ? '[PLACEHOLDER]' : '[EMPTY]'}`);
    criticalMissing++;
  } else if (!isSet) {
    console.log(`\n⚠️  ${name} (${key})`);
    console.log(`   Status: NOT SET (Optional but recommended)`);
    warnings++;
  } else {
    console.log(`\n✅ ${name} (${key})`);
    if (looksLikePrivateKey(value)) {
      console.log(`   ⚠️  WARNING: Value looks like a private key!`);
      warnings++;
    } else {
      console.log(`   Value: ${maskKey(value)}`);
    }
  }
});

console.log('\n' + '='.repeat(50));
console.log('\n🔒 Security Checks:');

const contractAddr = envVars.VITE_CONTRACT_ADDRESS;
if (contractAddr === '0x0000000000000000000000000000000000000000') {
  console.log('⚠️  Contract address is zero address - deploy contract first!');
  warnings++;
} else if (contractAddr && /^0x[a-fA-F0-9]{40}$/.test(contractAddr)) {
  console.log('✅ Contract address format valid');
} else {
  console.log('❌ Contract address format invalid (Must be 0x followed by 40 hex chars)');
  if (envVars.VITE_CONTRACT_ADDRESS) criticalMissing++;
}

console.log('\n' + '='.repeat(50));
console.log('\n📊 Summary:');

if (criticalMissing === 0) {
  if (warnings === 0) {
    console.log('✅ All environment variables configured correctly!');
  } else {
    console.log(`⚠️  Verification passed with ${warnings} warning(s).`);
  }
  console.log('🚀 You can now start the development server.\n');
  process.exit(0);
} else {
  console.log(`❌ ${criticalMissing} critical variable(s) missing or invalid.`);
  console.log('🛑 Please fix these in your .env file.\n');
  process.exit(1);
}
