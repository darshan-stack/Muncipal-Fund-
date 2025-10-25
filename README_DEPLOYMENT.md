# CivicLedger - Municipal Fund Transparency Platform 🏛️

## Overview

CivicLedger is a blockchain-based platform for transparently tracking municipal fund allocations and project progress. Built with React, FastAPI, MongoDB, and Polygon Mumbai testnet integration.

## 🚀 Features

### Core Functionalities

1. **Blockchain Integration**
   - Polygon Mumbai testnet connectivity
   - MetaMask wallet integration
   - Transaction tracking and verification
   - Simulated smart contract interactions (MVP mode)

2. **Project Management**
   - Create municipal projects with budget allocation
   - Track project progress in real-time
   - View detailed project information
   - Manager-based access control

3. **Milestone Tracking**
   - Create project milestones with target amounts
   - Track spending per milestone
   - Update milestone status (Pending → InProgress → Completed)
   - Visual progress indicators

4. **Expenditure Recording**
   - Record all project expenditures on blockchain
   - Link expenditures to specific milestones
   - Track recipient addresses
   - Immutable transaction records

5. **Public Transparency Dashboard**
   - Real-time project statistics
   - Budget utilization metrics
   - Completed milestones tracking
   - Transaction history with blockchain verification

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19, Tailwind CSS, Shadcn UI, ethers.js
- **Backend**: FastAPI, Python 3.11, web3.py
- **Database**: MongoDB
- **Blockchain**: Polygon Mumbai testnet
- **Wallet**: MetaMask integration

### Project Structure

```
/app/
├── backend/
│   ├── server.py              # FastAPI application
│   ├── .env                   # Environment variables
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main application
│   │   ├── components/
│   │   │   ├── Header.js     # Navigation header
│   │   │   ├── Dashboard.js  # Main dashboard
│   │   │   ├── CreateProject.js
│   │   │   ├── ProjectDetails.js
│   │   │   └── TransactionHistory.js
│   │   └── App.css           # Global styles
│   └── package.json
└── contracts/
    ├── FundTracker.sol        # Solidity smart contract
    └── README.md              # Deployment guide
```

## 🔧 Setup Instructions

### Prerequisites

1. **MetaMask Wallet**
   - Install MetaMask browser extension
   - Create a wallet account
   - Switch to Polygon Mumbai testnet

2. **Test MATIC Tokens**
   - Visit: https://faucet.polygon.technology/
   - Select "Mumbai" network
   - Enter your wallet address
   - Request test tokens (0.5 MATIC)

### Polygon Mumbai Network Configuration

Add to MetaMask:
- **Network Name**: Polygon Mumbai
- **RPC URL**: https://rpc-mumbai.maticvigil.com
- **Chain ID**: 80001
- **Currency Symbol**: MATIC
- **Block Explorer**: https://mumbai.polygonscan.com/

## 📱 How to Use

### 1. Connect Wallet

1. Click "Connect Wallet" in the header
2. Approve MetaMask connection request
3. Ensure you're on Polygon Mumbai testnet
4. Your address will appear in the header

### 2. Create a Project

1. Click "Create New Project" button
2. Fill in project details:
   - **Name**: Project name
   - **Description**: Project objectives
   - **Budget**: Total budget in USD
3. Click "Create Project"
4. Wait for blockchain transaction to complete
5. Project appears on dashboard

### 3. Add Milestones

1. Navigate to project details page
2. Click "Add Milestone" (only project manager)
3. Enter milestone information:
   - **Name**: Milestone name
   - **Description**: Details
   - **Target Amount**: Budget allocation
4. Milestone is recorded on blockchain

### 4. Record Expenditures

1. Go to project details → Expenditures tab
2. Click "Record Expenditure"
3. Fill in expenditure details:
   - **Milestone**: (Optional) Link to milestone
   - **Amount**: Expenditure amount
   - **Description**: Purpose
   - **Recipient**: Wallet address
4. Transaction is recorded immutably

### 5. Track Progress

- View real-time statistics on dashboard
- Monitor budget utilization
- Track milestone completion
- Verify all transactions on blockchain

## 🔐 Smart Contract Deployment

### Option 1: Using Current MVP Mode

The application currently runs in MVP mode with simulated blockchain transactions. This allows you to test all features without deploying actual smart contracts.

**Features in MVP mode:**
- Simulated transaction hashes
- All functionality working
- No gas fees required
- Instant transactions

### Option 2: Deploy Actual Smart Contract

For production deployment with real blockchain interactions:

1. **Review Smart Contract**
   - File: `/app/contracts/FundTracker.sol`
   - Solidity version: ^0.8.0

2. **Deploy Using Remix IDE**

   a. Open https://remix.ethereum.org/
   
   b. Create new file: `FundTracker.sol`
   
   c. Copy contract code from `/app/contracts/FundTracker.sol`
   
   d. Compile:
      - Compiler version: 0.8.0+
      - Click "Compile FundTracker.sol"
   
   e. Deploy:
      - Environment: "Injected Provider - MetaMask"
      - Ensure MetaMask is on Mumbai
      - Click "Deploy"
      - Confirm transaction (requires test MATIC)
   
   f. Save Contract Address:
      - Copy deployed contract address
      - Add to `/app/backend/.env`:
        ```
        CONTRACT_ADDRESS=0x...
        ```
      - Restart backend: `sudo supervisorctl restart backend`

3. **Update Frontend Integration**
   - Copy Contract ABI from Remix
   - Save to `/app/frontend/src/contracts/FundTrackerABI.json`
   - Update frontend to use real contract interactions

## 🎨 UI/UX Features

- **Modern Design**: Dark theme with glass-morphism effects
- **Responsive Layout**: Works on all screen sizes
- **Smooth Animations**: Fade-in and slide-in effects
- **Interactive Cards**: Hover effects with glow
- **Real-time Updates**: Live data synchronization
- **Professional Typography**: Space Grotesk + Inter fonts
- **Color-coded Status**: Visual indicators for project status

## 🔍 API Endpoints

### Projects
- `POST /api/projects` - Create new project
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details

### Milestones
- `POST /api/milestones` - Create milestone
- `GET /api/milestones/{project_id}` - Get project milestones
- `PUT /api/milestones/{id}` - Update milestone

### Expenditures
- `POST /api/expenditures` - Record expenditure
- `GET /api/expenditures/{project_id}` - Get project expenditures

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/{project_id}` - Get project transactions
- `GET /api/verify/{tx_hash}` - Verify transaction on blockchain

### Stats
- `GET /api/stats` - Get platform statistics

### Blockchain
- `GET /api/blockchain/status` - Check blockchain connection

## 🐛 Troubleshooting

### Common Issues

1. **MetaMask Not Connecting**
   - Ensure MetaMask is installed
   - Refresh the page
   - Check browser console for errors

2. **Wrong Network**
   - Switch to Polygon Mumbai in MetaMask
   - Application will prompt to add network if missing

3. **Transaction Failed**
   - Ensure you have test MATIC for gas fees
   - Check transaction on Mumbai PolygonScan
   - Verify wallet connection

4. **Backend Not Starting**
   - Check logs: `tail -n 50 /var/log/supervisor/backend.err.log`
   - Verify MongoDB is running
   - Check Python dependencies installed

5. **Frontend Not Loading**
   - Check logs: `tail -n 50 /var/log/supervisor/frontend.err.log`
   - Verify all npm packages installed
   - Check REACT_APP_BACKEND_URL in .env

## 📊 Database Collections

### projects
- Project information, budget, manager, status

### milestones
- Milestone details, target amounts, progress

### expenditures
- Spending records, recipients, blockchain hashes

### transactions
- All blockchain transaction records

## 🔗 Blockchain Verification

Every transaction includes:
- Transaction hash
- Link to Mumbai PolygonScan
- Timestamp
- Block number (when using real contract)
- Verifiable on-chain data

## 🚦 Service Management

```bash
# Restart services
sudo supervisorctl restart backend frontend

# Check status
sudo supervisorctl status

# View logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log
```

## 📈 Future Enhancements

1. **IPFS Integration**
   - Upload project documents
   - Store proof documents
   - Link IPFS hashes to transactions

2. **Enhanced Smart Contract**
   - Multi-signature approvals
   - Automated fund release on milestone completion
   - Governance voting

3. **Advanced Analytics**
   - Charts and graphs
   - Budget forecasting
   - Spending patterns

4. **Notifications**
   - Email alerts for milestones
   - Browser notifications
   - Telegram integration

## 🎯 Current Status

✅ **Completed**
- Full-stack application
- MetaMask wallet integration
- Project creation and management
- Milestone tracking
- Expenditure recording
- Transaction history
- Responsive UI
- Blockchain verification links
- Real-time statistics

🔄 **MVP Mode**
- Simulated blockchain transactions
- Ready for smart contract integration
- All features functional without gas fees

## 📝 Notes

- Application uses Polygon Mumbai testnet (free)
- Test MATIC tokens are free from faucet
- Smart contract code provided in `/app/contracts/`
- Ready for production deployment with minimal changes

## 🌐 Access Application

- **Frontend**: https://civic-ledger.preview.emergentagent.com
- **Backend API**: https://civic-ledger.preview.emergentagent.com/api

## 💡 Getting Started

1. Open the application URL
2. Click "Connect Wallet"
3. Connect MetaMask and switch to Mumbai
4. Explore dashboard and statistics
5. Create your first project
6. Add milestones and track expenditures
7. Verify all transactions on blockchain

---

**Built with ❤️ for transparent governance**
