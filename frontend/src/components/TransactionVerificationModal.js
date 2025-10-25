import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { ExternalLink, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const TransactionVerificationModal = ({ isOpen, onClose, txHash, type, details }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type) => {
    return type?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>Transaction Details</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Blockchain transaction information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* MVP Mode Notice */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-400">MVP Mode - Simulated Transaction</p>
                <p className="text-xs text-slate-400">
                  This platform is running in MVP mode with simulated blockchain transactions. 
                  In production, deploy the smart contract to see real on-chain transactions.
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Hash */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Transaction Hash</label>
            <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-3">
              <code className="text-sm text-white font-mono flex-1 break-all">{txHash}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(txHash)}
                className="flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Transaction Type */}
          {type && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Transaction Type</label>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <span className="text-white font-medium">{getTypeLabel(type)}</span>
              </div>
            </div>
          )}

          {/* Transaction Details */}
          {details && Object.keys(details).length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Details</label>
              <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                {Object.entries(details).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-white font-medium">
                      {typeof value === 'number' && key.includes('amount') 
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
                        : String(value)
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Network Info */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Network Information</label>
            <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Network:</span>
                <span className="text-white">Polygon Mumbai Testnet</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Chain ID:</span>
                <span className="text-white">80001</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status:</span>
                <span className="text-green-400 flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Simulated (MVP Mode)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <Button
              onClick={() => window.open(`https://mumbai.polygonscan.com/tx/${txHash}`, '_blank')}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on PolygonScan
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-700 hover:bg-slate-800"
            >
              Close
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-slate-500 text-center pt-2">
            <p>Note: Simulated transactions won't appear on the actual blockchain explorer.</p>
            <p>Deploy the smart contract for real blockchain verification.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionVerificationModal;