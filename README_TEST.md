# Permanent Record Protocol (PRP)

A protocol for anchoring permanent, readable records to blockchains.

## What This Is

PRP allows you to anchor structured data (transactions, credentials, statements, creative works) to any blockchain where full data can be stored on-chain and read by anyone.

**Key principles:**
- Full data on-chain (not just hashes)
- Chain-agnostic format (currently EVM, expandable to BSV, Bitcoin, etc.)
- Uses Schema.org vocabulary for interoperability
- No central infrastructure - pure protocol

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
    "name": "Property at 123 Main St"
  },
  "price": 500000,
  "priceCurrency": "USD"
}
EOF

# Anchor to blockchain
prp anchor my-deed.json --chain polygon --key 0xYOUR_PRIVATE_KEY
```

### Verify Proof

```bash
prp verify my-deed-proof.json
```

The full JSON data is retrieved directly from the blockchain.

## Supported Chains

Current EVM chains:
- Ethereum
- Polygon
- Base
- Arbitrum
- Optimism
- BSC
- Avalanche

**Note:** EVM support is primarily for demonstration. Gas costs make it expensive for large data. Future adapters for BSV and other chains will enable cheap, scalable permanent storage.

## How It Works

1. **Data is canonicalized** (JSON with sorted keys)
2. **Full JSON is converted to hex** and placed in transaction data field
3. **Transaction is broadcast** to chosen blockchain
4. **Proof file contains** chain name, txid, and block number
5. **Anyone can verify** by fetching the transaction and decoding the data

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

## Roadmap

- [ ] BSV adapter (cheap, scalable permanent storage)
- [ ] Bitcoin adapter (most secure, limited data)
- [ ] Solana adapter
- [ ] Additional schema templates
- [ ] Example indexer implementation
- [ ] Discovery tools

## Why Not Just Hashes?

Storing only hashes on-chain is cheaper but requires:
- Off-chain data storage (centralized or distributed)
- Users to maintain original data
- Trust that data matches hash

Full data on-chain means:
- Anyone can read it forever
- No off-chain dependencies
- True permanence
- Enables discovery and indexing

## Contributing

This is a protocol, not a product. Fork it, extend it, build on it.

## License

MIT
