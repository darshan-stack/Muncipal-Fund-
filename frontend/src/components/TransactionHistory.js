import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ExternalLink, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, filterType]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    if (searchQuery) {
      filtered = filtered.filter(tx => 
        tx.tx_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(tx.details).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'project_create':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'milestone_create':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'expenditure':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'fund_allocation':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTypeLabel = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>
            Transaction History
          </h1>
          <p className="text-slate-400">All blockchain transactions for municipal projects</p>
        </div>

        {/* Filters */}
        <Card className="glass-effect border-slate-700">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search by transaction hash or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                  data-testid="search-transactions-input"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white"
                  data-testid="filter-type-select"
                >
                  <option value="all">All Types</option>
                  <option value="project_create">Project Creation</option>
                  <option value="milestone_create">Milestone Creation</option>
                  <option value="expenditure">Expenditure</option>
                  <option value="fund_allocation">Fund Allocation</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {filteredTransactions.length === 0 ? (
            <Card className="glass-effect border-slate-700">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">No transactions found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((tx, index) => (
                <Card key={tx.id} className="glass-effect border-slate-700 hover-glow" data-testid={`transaction-${index}`}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center space-x-3">
                          <Badge className={getTypeColor(tx.type)} data-testid={`tx-type-${index}`}>
                            {getTypeLabel(tx.type)}
                          </Badge>
                          <span className="text-xs text-slate-500">{formatDate(tx.timestamp)}</span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-400">Transaction Hash</p>
                          <p className="text-sm font-mono text-white break-all" data-testid={`tx-hash-${index}`}>{tx.tx_hash}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-400">Details</p>
                          <div className="text-sm text-slate-300">
                            {Object.entries(tx.details).map(([key, value]) => (
                              <div key={key} className="flex space-x-2">
                                <span className="text-slate-500">{key}:</span>
                                <span>{typeof value === 'number' && key.includes('amount') 
                                  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
                                  : String(value)
                                }</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <a
                        href={`https://mumbai.polygonscan.com/tx/${tx.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                        data-testid={`verify-tx-${index}`}
                      >
                        <ExternalLink className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-slate-300">Verify</span>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;