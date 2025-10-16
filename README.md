# anchor
is...

- Property deeds (both parties verify)
- Academic credentials (institution issues)
- Statements/manifestos (author publishes)
- Art provenance (artist records)
- Purchases with historical significance
- Court testimony

## Quick Start

1. Copy a schema from `/schemas`
2. Fill it with your data
3. Hash it: `shasum -a 256 <(jq -cS . < yourfile.json)`
4. Anchor to any blockchain
5. Save proof

See SPEC.md for details.

Usage?

```
const proof = await anchorToEVM(
  deedData,
  'polygon',  // just chain name
  privateKey
);
```
Library Usage?

// Default RPC
await anchor(data, 'polygon', privateKey);

// Custom RPC
await anchor(data, 'polygon', privateKey, 'https://my-node.com');

Custom RPC config?
```
// Use default public RPC
prp anchor deed.json --chain polygon

// Or provide your own
prp anchor deed.json --chain polygon --rpc https://your-node.com

// Or use Alchemy/Infura
prp anchor deed.json --chain polygon --rpc https://polygon-mainnet.g.alchemy.com/v2/YOUR-KEY
```
