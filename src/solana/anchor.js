// anchor.js - Anchor data to Solana
import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey
} from '@solana/web3.js';
import bs58 from 'bs58';
import { SOLANA_CONFIG, PROTOCOL_ID } from './config.js';

async function anchorToSolana(data, chainName, privateKeyBase58, customRpc = null) {
  const config = SOLANA_CONFIG[chainName];
  
  if (!config) {
    throw new Error(`Chain ${chainName} not supported`);
  }
  
  // 1. Canonicalize JSON
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  
  // 2. Add protocol identifier
  const fullData = PROTOCOL_ID + canonical;
  const dataBuffer = Buffer.from(fullData, 'utf8');
  
  // 3. Check size limits
  const dataSize = dataBuffer.length;
  console.log(`Data size: ${dataSize} bytes (${PROTOCOL_ID.length} protocol ID + ${canonical.length} data)`);
  
  if (dataSize > config.maxMemoSize) {
    throw new Error(
      `Data too large for Solana memo. Max: ${config.maxMemoSize} bytes, Got: ${dataSize} bytes.`
    );
  }
  
  // 4. Connect to Solana
  const rpcUrl = customRpc || config.rpcUrl;
  const connection = new Connection(rpcUrl, 'confirmed');
  
  console.log(`Connected to ${config.name}`);
  
  // 5. Setup keypair
  const secretKey = bs58.decode(privateKeyBase58);
  const payer = Keypair.fromSecretKey(secretKey);
  
  console.log(`Using address: ${payer.publicKey.toBase58()}`);
  
  // 6. Check balance
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Balance: ${balance / 1e9} SOL`);
  
  if (balance === 0) {
    throw new Error('Insufficient balance. Fund this address first.');
  }
  
  try {
    // 7. Create transaction with memo instruction
    const transaction = new Transaction();
    
    // Add memo instruction with our data
    // Memo program: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
    const memoProgramId = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    
    transaction.add(
      new TransactionInstruction({
        keys: [],
        programId: memoProgramId,
        data: dataBuffer
      })
    );
    
    // 8. Send and confirm transaction
    console.log('\nSending transaction...');
    
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer],
