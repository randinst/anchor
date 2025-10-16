#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import { anchorToEVM, verifyProof } from '../src/index.js';

const program = new Command();

program
  .name('prp')
  .description('Permanent Record Protocol CLI')
  .version('1.0.0');

program
  .command('anchor')
  .description('Anchor data to blockchain')
  .argument('<file>', 'JSON file to anchor')
  .option('--chain <chain>', 'Chain name (ethereum, polygon, base, etc)')
  .option('--key <key>', 'Private key')
  .option('--rpc <url>', 'Custom RPC URL (optional)')
  .action(async (file, options) => {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const proof = await anchorToEVM(data, options.chain, options.key, options.rpc);
    
    const outputFile = file.replace('.json', '-proof.json');
    fs.writeFileSync(outputFile, JSON.stringify(proof, null, 2));
    
    console.log(`✓ Anchored to ${options.chain}`);
    console.log(`  Transaction: ${proof.proof.txid}`);
    console.log(`  Proof saved: ${outputFile}`);
  });

program
  .command('verify')
  .description('Verify a proof')
  .argument('<file>', 'Proof file to verify')
  .option('--rpc <url>', 'Custom RPC URL (optional)')
  .action(async (file, options) => {
    const proof = JSON.parse(fs.readFileSync(file, 'utf8'));
    const result = await verifyProof(proof, options.rpc);
    
    if (result.valid) {
      console.log('✓ Proof is valid');
    } else {
      console.log(`✗ Proof is invalid: ${result.reason}`);
    }
  });

program.parse();
