# 🔗 Complete Blockchain & RPC Configuration Guide

## Polygon Mumbai Testnet Configuration

### Network Details

| Parameter | Value |
|-----------|-------|
| **Network Name** | Polygon Mumbai Testnet |
| **Chain ID** | 80001 (0x13881 in hex) |
| **Currency Symbol** | MATIC |
| **Currency Decimals** | 18 |
| **Block Explorer** | https://mumbai.polygonscan.com/ |

---

## RPC Endpoints

### Primary RPC (Currently Used)
```
https://rpc-mumbai.maticvigil.com
```

### Alternative RPC URLs (Backup Options)

1. **Alchemy** (Requires API Key)
   ```
   https://polygon-mumbai.g.alchemy.com/v2/YOUR-API-KEY
   ```

2. **Infura** (Requires API Key)
   ```
   https://polygon-mumbai.infura.io/v3/YOUR-API-KEY
   ```

3. **Chainstack** (Free)
   ```
   https://nd-123-456-789.p2pify.com/YOUR-API-KEY
   ```

4. **QuickNode** (Requires API Key)
   ```
   https://YOUR-ENDPOINT.matic-testnet.quiknode.pro/YOUR-API-KEY/
   ```

5. **Ankr** (Free Public)
   ```
   https://rpc.ankr.com/polygon_mumbai
   ```

6. **Polygon Official Public**
   ```
   https://polygon-mumbai.blockpi.network/v1/rpc/public
   ```

7. **Blast API** (Free)
   ```
   https://polygon-mumbai.public.blastapi.io
   ```

---

## Current Application Configuration

### Backend Configuration (`/app/backend/.env`)
```env
POLYGON_RPC_URL="https://rpc-mumbai.maticvigil.com"
```

### Frontend MetaMask Configuration
Automatically configured when user adds Mumbai network. Manual setup:

```javascript
Network Name: Polygon Mumbai
RPC URL: https://rpc-mumbai.maticvigil.com
Chain ID: 80001
Currency Symbol: MATIC
Block Explorer URL: https://mumbai.polygonscan.com/
```

---

## MetaMask Network Addition (Automatic)

### Via Code (In App.js)
```javascript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x13881',  // 80001 in hexadecimal
    chainName: 'Polygon Mumbai',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
  }],
});
```

### Manual Addition in MetaMask
1. Open MetaMask
2. Click Network dropdown
3. Click "Add Network"
4. Click "Add a network manually"
5. Enter the following:
   - **Network Name**: Polygon Mumbai
   - **New RPC URL**: `https://rpc-mumbai.maticvigil.com`
   - **Chain ID**: `80001`
   - **Currency Symbol**: `MATIC`
   - **Block Explorer URL**: `https://mumbai.polygonscan.com/`
6. Click "Save"

---

## RPC Rate Limits

### Public RPC (rpc-mumbai.maticvigil.com)
- **Requests/second**: ~10
- **Daily requests**: Unlimited (fair use)
- **WebSocket**: Not supported
- **Archive data**: Not available

### Recommended for Production

#### Alchemy (Recommended)
- **Free Tier**: 300M compute units/month
- **Rate Limit**: 330 requests/second
- **WebSocket**: Supported
- **Archive data**: Available
- **Sign up**: https://www.alchemy.com/

#### Infura
- **Free Tier**: 100,000 requests/day
- **Rate Limit**: 10 requests/second
- **WebSocket**: Supported
- **Archive data**: Available
- **Sign up**: https://infura.io/

---

## Web3 Connection in Application

### Backend (Python - web3.py)
```python
from web3 import Web3

POLYGON_RPC = "https://rpc-mumbai.maticvigil.com"
w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))

# Check connection
is_connected = w3.is_connected()
print(f"Connected: {is_connected}")

# Get latest block
latest_block = w3.eth.block_number
print(f"Latest block: {latest_block}")
```

### Frontend (JavaScript - ethers.js)
```javascript
import { ethers } from 'ethers';

// Connect to RPC
const provider = new ethers.JsonRpcProvider(
  "https://rpc-mumbai.maticvigil.com"
);

// Get network info
const network = await provider.getNetwork();
console.log("Chain ID:", network.chainId); // 80001

// Connect with MetaMask
const web3Provider = new ethers.BrowserProvider(window.ethereum);
const signer = await web3Provider.getSigner();
```

---

## Contract Deployment Configuration

### Remix IDE
1. **Compiler**: Solidity 0.8.0+
2. **Environment**: Injected Provider - MetaMask
3. **Network**: Ensure MetaMask is on Mumbai (Chain ID: 80001)
4. **Gas**: Auto (uses Mumbai testnet gas prices)

### Hardhat Configuration
```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.0",
  networks: {
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      chainId: 80001,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

### Truffle Configuration
```javascript
// truffle-config.js
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    mumbai: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        'https://rpc-mumbai.maticvigil.com'
      ),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  }
};
```

---

## Gas Configuration

### Current Gas Prices (Mumbai)
- **Gas Price**: ~1-2 Gwei (very cheap)
- **Gas Limit**: 
  - Simple transfer: 21,000
  - Contract deployment: 2,000,000+
  - Contract interaction: 50,000-300,000

### Estimate Gas (ethers.js)
```javascript
const gasEstimate = await contract.estimateGas.functionName(params);
const gasPrice = await provider.getGasPrice();
const totalCost = gasEstimate * gasPrice;
```

---

## Transaction Verification

### Block Explorer URLs
```
Transaction: https://mumbai.polygonscan.com/tx/{TX_HASH}
Address: https://mumbai.polygonscan.com/address/{ADDRESS}
Block: https://mumbai.polygonscan.com/block/{BLOCK_NUMBER}
Token: https://mumbai.polygonscan.com/token/{TOKEN_ADDRESS}
```

### API Endpoints (PolygonScan)
```
API URL: https://api-testnet.polygonscan.com/api
API Key: Required for >5 requests/second
Get API Key: https://polygonscan.com/apis
```

---

## Test MATIC Faucets

### Official Polygon Faucet (Recommended)
- **URL**: https://faucet.polygon.technology/
- **Amount**: 0.5 MATIC per request
- **Cooldown**: 24 hours
- **Requirements**: None

### Alternative Faucets

1. **Alchemy Faucet**
   - URL: https://mumbaifaucet.com/
   - Amount: 0.5 MATIC
   - Requires: Alchemy account

2. **QuickNode Faucet**
   - URL: https://faucet.quicknode.com/polygon/mumbai
   - Amount: 0.1 MATIC
   - Requires: Social login

3. **Chainlink Faucet**
   - URL: https://faucets.chain.link/mumbai
   - Amount: 0.1 MATIC + testnet LINK
   - Requires: Wallet connect

---

## Environment Variables Summary

### Backend (`/app/backend/.env`)
```env
# Current Configuration
MONGO_URL="mongodb://localhost:27017"
DB_NAME="municipal_fund_tracker"
CORS_ORIGINS="*"
POLYGON_RPC_URL="https://rpc-mumbai.maticvigil.com"

# Optional (for production)
# CONTRACT_ADDRESS="0x..." (After deployment)
# ALCHEMY_API_KEY="..." (If using Alchemy)
# INFURA_API_KEY="..." (If using Infura)
```

### Frontend (`/app/frontend/.env`)
```env
REACT_APP_BACKEND_URL=https://civic-ledger.preview.emergentagent.com
WDS_SOCKET_PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=true
ENABLE_HEALTH_CHECK=false

# Optional (for contract interaction)
# REACT_APP_CONTRACT_ADDRESS="0x..."
```

---

## Switching RPC Providers

### Update Backend
1. Edit `/app/backend/.env`
2. Change `POLYGON_RPC_URL` to new RPC
3. Restart backend: `sudo supervisorctl restart backend`

### Update Frontend (MetaMask)
1. Open MetaMask
2. Click current network
3. Settings → Networks
4. Edit Polygon Mumbai
5. Update RPC URL
6. Save

---

## Health Check Endpoints

### Check Backend Blockchain Connection
```bash
curl https://civic-ledger.preview.emergentagent.com/api/blockchain/status
```

Response:
```json
{
  "connected": true,
  "network": "Polygon Mumbai",
  "latest_block": 12345678,
  "rpc_url": "https://rpc-mumbai.maticvigil.com"
}
```

---

## Common Chain IDs Reference

| Network | Chain ID | Hex |
|---------|----------|-----|
| Ethereum Mainnet | 1 | 0x1 |
| Ethereum Sepolia | 11155111 | 0xaa36a7 |
| Polygon Mainnet | 137 | 0x89 |
| **Polygon Mumbai** | **80001** | **0x13881** |
| BSC Mainnet | 56 | 0x38 |
| BSC Testnet | 97 | 0x61 |
| Avalanche Mainnet | 43114 | 0xa86a |

---

## Production Deployment Checklist

- [ ] Sign up for Alchemy/Infura account
- [ ] Get API key
- [ ] Update RPC URL with API key
- [ ] Deploy smart contract
- [ ] Save contract address
- [ ] Update CONTRACT_ADDRESS in .env
- [ ] Test all contract interactions
- [ ] Monitor RPC usage
- [ ] Set up alerts for rate limits

---

## Support & Resources

### Documentation
- **Web3.py**: https://web3py.readthedocs.io/
- **Ethers.js**: https://docs.ethers.org/
- **Polygon Docs**: https://wiki.polygon.technology/
- **MetaMask Docs**: https://docs.metamask.io/

### Community
- **Polygon Discord**: https://discord.gg/polygon
- **Polygon Forum**: https://forum.polygon.technology/
- **GitHub**: https://github.com/maticnetwork

### Block Explorers
- **PolygonScan Mumbai**: https://mumbai.polygonscan.com/
- **Alternative**: https://mumbai.polygonscan.com/

---

## Current Application Setup

✅ **RPC URL**: `https://rpc-mumbai.maticvigil.com`
✅ **Chain ID**: `80001`
✅ **Network**: Polygon Mumbai Testnet
✅ **Status**: Connected and working
✅ **Backend**: Configured in `/app/backend/.env`
✅ **Frontend**: Auto-configured via MetaMask

**Access Application**: https://civic-ledger.preview.emergentagent.com
