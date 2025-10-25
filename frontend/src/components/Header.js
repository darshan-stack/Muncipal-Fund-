import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Wallet, LogOut, Activity } from 'lucide-react';

const Header = ({ account, chainId, onConnect, onDisconnect, isConnecting }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId) => {
    if (chainId === 80001) return 'Mumbai';
    if (chainId === 137) return 'Polygon';
    return 'Unknown';
  };

  return (
    <header className="glass-effect sticky top-0 z-50 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>CivicLedger</span>
            </Link>

            <nav className="hidden md:flex space-x-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive('/') 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
                data-testid="nav-dashboard"
              >
                Dashboard
              </Link>
              {account && (
                <Link
                  to="/create"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive('/create') 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                  data-testid="nav-create-project"
                >
                  Create Project
                </Link>
              )}
              <Link
                to="/transactions"
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive('/transactions') 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
                data-testid="nav-transactions"
              >
                Transactions
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {account ? (
              <>
                {chainId && (
                  <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
                    <span className="text-sm text-slate-300">{getNetworkName(chainId)}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-slate-200" data-testid="wallet-address">{formatAddress(account)}</span>
                </div>
                <Button
                  onClick={onDisconnect}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                  data-testid="disconnect-wallet-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={onConnect}
                disabled={isConnecting}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                data-testid="connect-wallet-btn"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;