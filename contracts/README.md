# FundTracker Smart Contract Deployment Guide

## Prerequisites
1. MetaMask wallet installed
2. Polygon Mumbai testnet configured in MetaMask
3. Test MATIC tokens (get from faucet)

## Getting Test MATIC
1. Visit: https://faucet.polygon.technology/
2. Select "Mumbai" network
3. Enter your wallet address
4. Request tokens (you'll receive ~0.5 test MATIC)

## Deployment Options

### Option 1: Using Remix IDE (Recommended for beginners)

1. **Open Remix**
   - Go to https://remix.ethereum.org/

2. **Create Contract File**
   - Create new file: `FundTracker.sol`
   - Copy and paste the contract code from `/app/contracts/FundTracker.sol`

3. **Compile Contract**
   - Go to "Solidity Compiler" tab
   - Select compiler version: 0.8.0 or higher
   - Click "Compile FundTracker.sol"

4. **Deploy Contract**
   - Go to "Deploy & Run Transactions" tab
   - Select Environment: "Injected Provider - MetaMask"
   - Ensure MetaMask is connected to Polygon Mumbai
   - Click "Deploy"
   - Confirm transaction in MetaMask

5. **Save Contract Address**
   - After deployment, copy the contract address
   - Add it to `/app/backend/.env` as `CONTRACT_ADDRESS=0x...`
   - Restart backend: `sudo supervisorctl restart backend`

### Option 2: Using Hardhat (For advanced users)

```bash
# Install Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Initialize Hardhat project
npx hardhat

# Configure hardhat.config.js for Polygon Mumbai
# Deploy
npx hardhat run scripts/deploy.js --network mumbai
```

## Contract ABI

After deployment, you'll need the Contract ABI. In Remix:
1. Go to "Solidity Compiler" tab
2. Click "ABI" button (copy to clipboard)
3. Save to `/app/frontend/src/contracts/FundTrackerABI.json`

## Polygon Mumbai Network Configuration

Add to MetaMask:
- Network Name: Polygon Mumbai
- RPC URL: https://rpc-mumbai.maticvigil.com
- Chain ID: 80001
- Currency Symbol: MATIC
- Block Explorer: https://mumbai.polygonscan.com/

## Verification

Verify your deployment:
1. Visit: https://mumbai.polygonscan.com/
2. Search for your contract address
3. You should see the deployment transaction

## Testing the Contract

Test contract functions in Remix:
1. Create a project: `createProject("Test Project", 1000000)`
2. Check project count: `projectCount()`
3. Get project details: `getProject(1)`

## Troubleshooting

- **Transaction Failed**: Ensure you have enough test MATIC
- **MetaMask Not Connecting**: Refresh page and reconnect
- **Wrong Network**: Double-check you're on Mumbai, not Mainnet

## Support

For issues:
- Polygon Faucet: https://faucet.polygon.technology/
- Remix Documentation: https://remix-ide.readthedocs.io/
- MetaMask Support: https://support.metamask.io/