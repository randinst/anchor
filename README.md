# Ledger-Anchored Record Protocol

A protocol for embedding immutable, readable data records to blockchains.

## What This Is

LARP allows for anchoring of structured data (transactions, credentials, statements, creative works) on-chain that can be read by anyone.

**Key principles:**
- Chain-agnostic format
- Full data on-chain, not just hashes 
- Use of Schema.org vocabulary for interoperability
- No central infrastructure

## Quick Start

### Install

```bash
npm install
```

### Anchor Data

```bash
# Create a transaction record
cat > my-deed.json << EOF
{
  "@context": "https://schema.org/",
  "@type": "BuyAction",
  "seller": { "@type": "Person", "name": "Alice" },
  "buyer": { "@type": "Person", "name": "Bob" },
  "object": { 
    "@type": "Product",
    "name": "Property at 31 Spooner St"
  },
  "price": 500000,
  "priceCurrency": "USD"
}
EOF

# Anchor to blockchain
larp anchor my-deed.json --chain polygon --key 0xYOUR_PRIVATE_KEY
```

### Verify Proof

```bash
larp verify my-deed-proof.json
```

The full JSON data is retrieved directly from the blockchain.

## Supported Chains

- All EVM chains
- Bitcoin (BTC, BSV, BCH)
- Solana
- Tron
- XRPL

## Anchoring Process

1. Data is canonicalized (JSON with sorted keys)
2. Full JSON is converted to hex and placed in transaction data field
3. Transaction is broadcast to chosen blockchain
4. Proof file contains chain name, txid, and block number
5. Anyone can verify by fetching the transaction and decoding the data

## Schemas

The `/schemas` folder contains Schema.org examples for common record types:
- Transactions (BuyAction, Invoice)
- Credentials (EducationalOccupationalCredential)
- Creative works (CreativeWork, Article)
- And many more from Schema.org

Users can follow these examples or create custom structures using Schema.org vocabulary.

## Use Cases

- **Physical transactions:** Property deeds, vehicle sales, valuable items
- **Credentials:** Degrees, certifications, licenses
- **Statements:** Declarations, manifestos, public statements
- **Creative works:** Art provenance, writing, timestamps for IP
- **Legal records:** Testimony, contracts, agreements
- **Historical significance:** Purchases, events, anything worth preserving

## Protocol Philosophy

- **Data must be readable on-chain** - not just hashes that require off-chain lookups
- **Chain-agnostic** - works on any chain that supports arbitrary data
- **Standards-based** - uses Schema.org for interoperability
- **No platform** - just a protocol, no servers to maintain
- **Permissionless** - anyone can implement, extend, or build on top

Storing only hashes on-chain is cheaper but requires:
- Off-chain data storage (centralized or distributed)
- Users to maintain original data
- Trust that data matches hash

Full data on-chain means:
- Anyone can read it forever
- No off-chain dependencies
- Chain-specific permanence
- Viable discovery and indexing

---

## Installation
```bash
npm install
npm link  # Makes 'larp' command available globally
```

## Quick Examples

### 1. List Supported Chains
```bash
larp list
```

Shows all available chains and their key formats.

---

### 2. Anchor to Ethereum (EVM)
```bash
# Create a record
cat > deed.json << EOF
{
  "@context": "https://schema.org/",
  "@type": "BuyAction",
  "seller": { "@type": "Person", "name": "Alice" },
  "buyer": { "@type": "Person", "name": "Bob" },
  "object": { 
    "@type": "Product",
    "name": "Property at 31 Spooner St"
  },
  "price": 500000,
  "priceCurrency": "USD"
}
EOF

# Anchor it
larp anchor deed.json --chain polygon --key 0xYOUR_PRIVATE_KEY

# Output:
# ✓ Successfully anchored to polygon
# Transaction: 0xabc123...
# Proof saved: deed-proof.json
```

---

### 3. Anchor to Bitcoin
```bash
# Same JSON file
larp anchor deed.json --chain btc --key 0xYOUR_PRIVATE_KEY

# Note: BTC limited to 76 bytes (after protocol ID)
# Will error if data too large
```

---

### 4. Anchor to BSV (Unlimited Data)
```bash
# Large document - no problem on BSV
larp anchor large-document.json --chain bsv --key 0xYOUR_PRIVATE_KEY
```

---

### 5. Anchor to XRP
```bash
# XRP uses different key format
larp anchor statement.json --chain xrp --key sXXXXXXXXXXXXXXXXXX

# Max 1KB data
```

---

### 6. Anchor to Solana
```bash
# Solana uses Base58 key
larp anchor credential.json --chain solana --key 5Jv8...base58key...

# Max 566 bytes
```

---

### 7. Anchor to Tron
```bash
# Tron uses hex key
larp anchor receipt.json --chain tron --key 0xYOUR_PRIVATE_KEY

# Fast and cheap
```

---

### 8. Verify Any Proof
```bash
larp verify deed-proof.json

# Output:
# ✓ Proof is valid!
# Protocol: LARP v1
# Block: 12345678
# Data type: BuyAction
# 
# Full data retrieved from chain:
# {
#   "@context": "https://schema.org/",
#   "@type": "BuyAction",
#   ...
# }
```

---

## Chain Selection Guide

### Best For Small Records (< 1KB)

**All chains work, choose based on:**
- **Cheapest:** Solana, Tron, Polygon
- **Fastest:** Solana (400ms), XRP (3-5s)
- **Most Secure:** Bitcoin
- **Most Established:** Ethereum

### Best For Medium Records (1-10KB)

- **BSV** - Cheap and designed for data
- **Polygon** - EVM compatible but affordable
- **Tron** - Very cheap

### Best For Large Records (> 10KB)

- **BSV** - Only practical option for large data
- Others will be expensive (EVM) or hit limits

---

## Key Format Reference

### EVM Chains (Ethereum, Polygon, Base, Arbitrum, etc.)
```bash
--key 0x1234567890abcdef...  # 64 hex characters
```

Get from MetaMask: Settings → Security & Privacy → Reveal Private Key

### Bitcoin/BCH/BSV
```bash
--key 0x1234567890abcdef...  # Hex format
# Or WIF format (starts with 5, K, or L)
```

### XRP
```bash
--key sXXXXXXXXXXXXXXXXXX  # Secret key (starts with 's')
```

Get from XUMM wallet or XRP Toolkit

### Solana
```bash
--key 5Jv8gyF9...  # Base58 encoded (44-88 characters)
```

Get from Phantom wallet or Solana CLI

### Tron
```bash
--key 0x1234567890abcdef...  # Hex format
```

Get from TronLink wallet

---

## Testing Without Real Money

### Use Testnets

**Ethereum Sepolia:**
```bash
larp anchor test.json --chain sepolia --key 0x...
```
Get free ETH: https://sepoliafaucet.com

**Polygon Mumbai:**
```bash
larp anchor test.json --chain mumbai --key 0x...
```
Get free MATIC: https://faucet.polygon.technology

**Solana Devnet:**
```bash
larp anchor test.json --chain solanadev --key YOUR_KEY
```
Get free SOL: https://solfaucet.com

**XRP Testnet:**
```bash
larp anchor test.json --chain xrptest --key YOUR_SECRET
```
Get free XRP: https://xrpl.org/xrp-testnet-faucet.html

**Tron Shasta:**
```bash
larp anchor test.json --chain trontest --key 0x...
```
Get free TRX: https://www.trongrid.io/shasta

---

## Creating Test Wallets

### EVM Chains
```javascript
// create-wallet.js
import { ethers } from 'ethers';

const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```

### Solana
```bash
solana-keygen new --outfile test-wallet.json
solana-keygen pubkey test-wallet.json
# Private key in the JSON file
```

### XRP

Use https://xrpl.org/xrp-testnet-faucet.html (generates wallet for you)

---

## Common Errors

### "Insufficient balance"

**Problem:** Wallet has no funds

**Solution:** Fund wallet from faucet (testnet) or exchange (mainnet)

### "Data too large"

**Problem:** Data exceeds chain limit

**Solutions:**
- Use BSV (unlimited)
- Reduce JSON size
- Remove unnecessary fields

### "Transaction not found"

**Problem:** Transaction hasn't been mined yet

**Solution:** Wait a few seconds and try verify again

### "Invalid private key format"

**Problem:** Wrong key format for chain

**Solution:** Check key format guide above

---

## Advanced Usage

### Custom RPC Endpoint
```bash
# Use your own node or paid service
larp anchor deed.json --chain ethereum \
  --key 0x... \
  --rpc https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY
```

### Programmatic Use (Library)
```javascript
import { anchorToEVM } from 'permanent-record-protocol';

const proof = await anchorToEVM(
  { "@type": "BuyAction", ... },
  'polygon',
  '0xYOUR_KEY'
);

console.log('Anchored:', proof.txid);
```

---

## Data Size Limits Summary

| Chain | Limit | Cost | Speed |
|-------|-------|------|-------|
| BTC | 76 bytes | $$$ | 10 min |
| BCH | 216 bytes | $ | 10 min |
| BSV | Unlimited | $ | 10 min |
| Ethereum | No limit* | $$$$$ | 12 sec |
| Polygon | No limit* | $$ | 2 sec |
| XRP | 1 KB | ¢ | 3 sec |
| Solana | 566 bytes | ¢ | <1 sec |
| Tron | ~1 KB | ¢ | 3 sec |

*No technical limit, but gas cost scales with size

---

## Best Practices

### 1. Start Small
Test with small JSON files first (< 1KB)

### 2. Use Testnets
Always test on testnet before mainnet

### 3. Save Proofs
Keep proof files safe - they're your reference to on-chain data

### 4. Verify Before Sharing
Always verify proof works before sharing with others

### 5. Choose Chain Wisely
- Small important records: BTC (most secure)
- Large documents: BSV (only practical option)
- Speed matters: Solana
- Cost matters: Tron, Polygon

---

## Example Workflows

### Property Sale (Both Parties Anchor)

**Seller:**
```bash
larp anchor property-deed.json --chain bsv --key 0xSELLER_KEY
# Shares deed-proof.json with buyer
```

**Buyer:**
```bash
larp anchor property-deed.json --chain bsv --key 0xBUYER_KEY
# Shares deed-proof.json with seller
```

Both now have mutual proof of agreement.

### Academic Credential (Institution Issues)

**University:**
```bash
larp anchor degree.json --chain ethereum --key 0xUNI_KEY
# Shares degree-proof.json with graduate
```

**Graduate can verify:**
```bash
larp verify degree-proof.json
# Shows valid credential
```

Anyone can verify by checking the txid on block explorer.

---

## Getting Help

- Check proof file contains correct txid
- Verify you're using correct chain name
- Check key format matches chain type
- Try testnet first if unsure
- View transaction on block explorer to see raw data

### Simplest Test

*Install dependencies
```npm install```

*Get a testnet wallet
```Polygon Mumbai faucet or create with ethers```

*Create test data
```echo '{"@context":"https://schema.org/","@type":"Article","headline":"Test"}' > test.json```

*Try it
```node cli/larp.js anchor test.json --chain mumbai --key 0xYOUR_TEST_KEY```

