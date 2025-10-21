# 1. Install dependencies
npm install

# 2. Get a testnet wallet
# Polygon Mumbai faucet or create with ethers

# 3. Create test data
echo '{"@context":"https://schema.org/","@type":"Article","headline":"Test"}' > test.json

# 4. Try it
node cli/prp.js anchor test.json --chain mumbai --key 0xYOUR_TEST_KEY

