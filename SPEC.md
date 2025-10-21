# Permanent Record Protocol - Specification v0.1

## Purpose

Enable permanent, verifiable, readable records of transactions, credentials, statements, and creative works on any blockchain.

## Design Principles

1. **Full data on-chain** - actual JSON data, not just hashes
2. **Chain-agnostic** - works on any blockchain supporting arbitrary data
3. **Standards-based** - uses Schema.org vocabulary
4. **Permissionless** - no gatekeepers or central authority
5. **Permanent** - once anchored, readable forever

## Data Format

### Structure

Records use JSON-LD with Schema.org vocabulary:

```json
{
  "@context": "https://schema.org/",
  "@type": "SchemaOrgType",
  // ...type-specific fields
}
```

### Canonicalization

Before anchoring, JSON is canonicalized:
1. Keys sorted alphabetically
2. No whitespace
3. UTF-8 encoding

This ensures consistent representation across implementations.

### Common Record Types

- **Transactions:** BuyAction, SellAction, Invoice
- **Credentials:** EducationalOccupationalCredential
- **Statements:** Article, Message, CreativeWork
- **Creative Works:** CreativeWork, MediaObject
- **Legal:** (use appropriate Schema.org types or extend)

## Protocol Identifier

All PRP transactions include a 4-byte protocol identifier prefix:

**Format:** `PRP1` (ASCII)
**Hex:** `0x50525031`

This appears at the start of the transaction data field:
```
0x50525031 + [JSON data as hex]
```

**Purpose:**
- Distinguish PRP messages from other on-chain data
- Enable indexers to find protocol messages
- Support protocol versioning (PRP1, PRP2, etc.)

**Example:**
```
Full transaction data field:
0x50525031{"@context":"https://schema.org/","@type":"BuyAction",...}
   ^^^^^^^^ 
   Protocol ID (PRP1)
```

## Anchoring Process

### EVM Chains

1. Canonicalize JSON data
2. Convert to hex: `'0x' + Buffer.from(json).toString('hex')`
3. Create transaction with data in `data` field
4. Send to self (or any address)
5. Wait for confirmation

## Proof Format

After anchoring, generate proof file:

```json
{
  "proof": {
    "chain": "polygon",
    "chainId": 137,
    "txid": "0xabc...",
    "block": 12345678,
    "timestamp": "2025-10-17T10:30:00Z"
  }
}
```

**Note:** Original data is NOT in proof file - it's on-chain.

## Identity

No separate identity layer (DIDs, etc.) needed. Your wallet address is your identifier.

Track record built from:
- All records anchored from that address
- Can be queried by scanning address's transactions
- Third parties can build reputation systems

## Discovery

Protocol does not specify discovery mechanism. Possible approaches:

1. **Direct sharing** - parties exchange proof files
2. **Address scanning** - scan all transactions from an address
3. **Indexers** - third parties index all protocol messages
4. **Block explorers** - use existing tools to read data

## Multi-Party Records

For transactions requiring mutual verification (e.g., property sales):

1. Both parties anchor identical or complementary data
2. Each from their own wallet
3. Creates mutual proof of agreement
4. Both records verifiable independently

## Extensibility

### Custom Types

Users can:
- Use any Schema.org type
- Extend with custom properties
- Create domain-specific vocabularies

### New Chains

To add chain support:
1. Implement anchoring function for that chain
2. Implement verification function
3. Follow same proof format
4. Document chain-specific details

### Protocol Versioning

- Current version: 0.1
- Version indicated in proof file (future)
- Backward compatibility maintained

## Security Considerations

- **Private keys:** Required for anchoring. Secure storage essential.
- **Data privacy:** All data is public and permanent. 
- **Immutability:** Cannot delete or modify after anchoring.
- **Chain security:** Inherits security model of chosen blockchain.

## Limitations

- **No deletion** - permanent means permanent
- **No updates** - create new record instead
- **Chain costs** - varies dramatically by chain
- **Data limits** - some chains have size restrictions
- **No built-in privacy mechanisms**

## Future Considerations

- Protocol identifier prefix (e.g., "PRP1" in data field)
- Encrypted data support
- Inter-record references
- Standardized indexer API
- Discovery protocols

## Reference Implementation

JavaScript/Node.js implementation with:
- EVM chain support
- CLI tool
- Library for integration
- Example schemas
