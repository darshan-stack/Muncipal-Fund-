import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ethers } from 'ethers';
import '@/App.css';
import Dashboard from './components/Dashboard';
import ProjectDetails from './components/ProjectDetails';
import CreateProjectWithDocuments from './components/CreateProjectWithDocuments';
import TransactionHistory from './components/TransactionHistory';
import AuthorityWalletDashboard from './components/AuthorityWalletDashboard';
import Header from './components/Header';
import { Toaster } from './components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use this application');
      return;
    }

    try {
      setIsConnecting(true);
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const web3Signer = await web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(address);
      setChainId(Number(network.chainId));

      // Check if on Mumbai testnet
      if (Number(network.chainId) !== 80001) {
        alert('Please switch to Polygon Mumbai testnet');
        await switchToMumbai();
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToMumbai = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13881' }], // 80001 in hex
      });
    } catch (switchError) {
      // Chain not added, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x13881',
                chainName: 'Polygon Mumbai',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
                blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding Mumbai network:', addError);
        }
      }
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', (chainIdHex) => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Header 
          account={account}
          chainId={chainId}
          onConnect={connectWallet}
          onDisconnect={disconnectWallet}
          isConnecting={isConnecting}
        />
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                account={account}
                provider={provider}
                signer={signer}
              />
            } 
          />
          <Route 
            path="/project/:id" 
            element={
              <ProjectDetails 
                account={account}
                provider={provider}
                signer={signer}
              />
            } 
          />
          <Route 
            path="/create" 
            element={
              account ? (
                <CreateProjectWithDocuments 
                  account={account}
                  signer={signer}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/transactions" 
            element={<TransactionHistory />} 
          />
          <Route 
            path="/authority/login" 
            element={<AuthorityLogin onLoginSuccess={() => {}} />} 
          />
          <Route 
            path="/authority/dashboard" 
            element={<AuthorityDashboard />} 
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;