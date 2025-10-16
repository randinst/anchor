# Blockchain Anchoring Standard

## Purpose
Permanent, verifiable records of transactions, statements, credentials, and creative works.

## Core Principles
1. Use standard JSON schemas for common record types
2. Anchor to any blockchain that supports arbitrary data
3. Both parties in physical transactions should anchor independently

## Data Structure

Choose a schema from `/schemas` or create your own following this pattern:
```json
{
  "type": "deed|credential|statement|artwork|receipt|testimony",
  "timestamp": "ISO8601 datetime",
  ... type-specific fields
}
```

## Anchoring Process

1. **Create your record** using a schema template
2. **Hash it**: `sha256(canonical_json)` - use sorted keys, no whitespace
3. **Anchor the hash** to your chosen blockchain:
   - Bitcoin: OP_RETURN transaction
   - Ethereum: Contract call or transaction data
   - XRP: Memo field
   - BSV: OP_RETURN
4. **Create proof file**:
```json
{
  "data": { /* original record */ },
  "proof": {
    "hash": "sha256 hash",
    "chain": "bitcoin|ethereum|xrp|bsv",
    "txid": "transaction id",
    "block": 123456,
    "timestamp": "ISO8601"
  }
}
```

## Verification

Anyone can verify by:
1. Hash the `data` field → should match `proof.hash`
2. Look up `txid` on the chain → should exist at claimed block
3. Check timestamp matches block time

## For Physical Transactions

Both parties should:
- Anchor identical data structure
- Exchange proof files
- Creates mutual verification

## Chain-Specific Notes

**Bitcoin**: Use OP_RETURN with hex-encoded hash (80 byte limit)
**Ethereum**: Store hash in transaction input data or contract
**XRP**: Use memo field (max 1KB)
**BSV**: OP_RETURN supports larger data

## Tools

See `/tools` for optional helpers. Or use:
- `bitcoin-cli` + your own scripts
- Chain libraries in your language
- Any tool that can create transactions with arbitrary data

# MORE

MESSAGE TYPES:
- deed
- credential  
- statement
- artwork
- receipt
- testimony

MESSAGE FORMAT:
{
  "version": "1.0",
  "type": "deed",
  "timestamp": "ISO8601",
  "author": "did:key:abc123...",
  "data": { /* type-specific fields */ },
  "proof": {
    "chain": "bitcoin|bsv|ethereum|xrp",
    "txid": "...",
    "block": 12345
  }
}

VERIFICATION:
- Hash data field
- Check hash in txid on specified chain
- Validate signature against author DID
