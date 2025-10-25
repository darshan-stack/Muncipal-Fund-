import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { CheckCircle, XCircle, FileText, AlertCircle, LogOut, Loader2, MapPin, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// List of authorized authority wallet addresses
const AUTHORIZED_AUTHORITIES = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',  // Example authority
  '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',  // Add more addresses
];

const AuthorityWalletDashboard = ({ account, onDisconnect }) => {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewingDocs, setViewingDocs] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (!account) {
      navigate('/');
      return;
    }

    // Check if wallet is authorized
    const isAuthorized = AUTHORIZED_AUTHORITIES.some(
      addr => addr.toLowerCase() === account.toLowerCase()
    );

    if (!isAuthorized) {
      toast.error('Your wallet is not authorized as a Higher Authority');
      navigate('/');
      return;
    }

    fetchPendingApprovals();
  }, [account, navigate]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      // Use wallet address as authority ID
      const response = await axios.get(`${API}/approvals/pending/${account}`);
      setApprovals(response.data);
    } catch (error) {
      console.error('Error:', error);
      // If no authority exists for this wallet, create one
      if (error.response?.status === 404 || error.response?.status === 503) {
        await registerAuthority();
        fetchPendingApprovals();
      } else {
        toast.error('Failed to load approvals');
      }
    } finally {
      setLoading(false);
    }
  };

  const registerAuthority = async () => {
    try {
      await axios.post(`${API}/auth/authority/register`, {
        username: account.slice(0, 10),
        password: 'wallet-based',
        name: `Authority ${account.slice(0, 8)}`,
        department: 'Municipal Review Board'
      });
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  const viewDocuments = async (projectId) => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}/documents`);
      setDocuments(response.data);
      setViewingDocs(projectId);
    } catch (error) {
      toast.error('Failed to load documents');
    }
  };

  const handleDecision = async (approvalId, decision) => {
    if (!reviewComments && decision === 'Rejected') {
      toast.error('Please provide rejection reason');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API}/approvals/${approvalId}/decide`, {
        decision,
        comments: reviewComments
      });

      toast.success(`Project ${decision.toLowerCase()} successfully!`);
      setSelectedApproval(null);
      setReviewComments('');
      fetchPendingApprovals();
    } catch (error) {
      toast.error('Failed to process decision');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>
              Higher Authority Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Wallet: {account?.slice(0, 8)}...{account?.slice(-6)}</p>
          </div>
          <Button onClick={onDisconnect} variant="outline" className="border-slate-700">
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="text-sm text-slate-400">Pending Reviews</div>
              <div className="text-3xl font-bold text-yellow-400 mt-2">{approvals.length}</div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="text-sm text-slate-400">Your Wallet</div>
              <div className="text-sm font-mono text-white mt-2">{account?.slice(0, 20)}...</div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="text-sm text-slate-400">Authentication</div>
              <div className="text-sm text-green-400 mt-2">✓ Wallet Verified</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals */}
        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Pending Approval Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {approvals.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvals.map((approval, index) => (
                  <Card key={approval.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <h3 className="text-lg font-semibold text-white">{approval.project?.name}</h3>
                            <p className="text-sm text-slate-400">{approval.project?.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge className="bg-purple-500/20 text-purple-400">
                                {approval.project?.category}
                              </Badge>
                              <span className="text-sm text-slate-500">
                                Budget: <span className="text-white font-semibold">{formatCurrency(approval.project?.budget)}</span>
                              </span>
                            </div>
                          </div>
                          <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                            <div className="text-xs text-blue-400">
                              <p className="font-medium">Anonymous Review</p>
                              <p className="text-blue-300 mt-1">Contractor: {approval.project?.contractor_name}</p>
                            </div>
                          </div>
                        </div>

                        {/* View Documents Button */}
                        <Button
                          onClick={() => viewDocuments(approval.project?.id)}
                          variant="outline"
                          className="w-full border-slate-600 hover:bg-slate-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View All Documents
                        </Button>

                        {selectedApproval === approval.id ? (
                          <div className="space-y-4 pt-4 border-t border-slate-700">
                            <Textarea
                              value={reviewComments}
                              onChange={(e) => setReviewComments(e.target.value)}
                              placeholder="Enter review comments..."
                              rows={4}
                              className="bg-slate-900 border-slate-700 text-white"
                            />
                            <div className="flex space-x-3">
                              <Button
                                onClick={() => handleDecision(approval.id, 'Approved')}
                                className="flex-1 bg-green-500 hover:bg-green-600"
                                disabled={submitting}
                              >
                                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                Approve & Release Funds
                              </Button>
                              <Button
                                onClick={() => handleDecision(approval.id, 'Rejected')}
                                className="flex-1 bg-red-500 hover:bg-red-600"
                                disabled={submitting}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                onClick={() => setSelectedApproval(null)}
                                variant="outline"
                                className="border-slate-700"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setSelectedApproval(approval.id)}
                            className="w-full bg-blue-500 hover:bg-blue-600"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Review & Decide
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Viewer Dialog */}
        <Dialog open={viewingDocs !== null} onOpenChange={() => setViewingDocs(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Project Documents</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {documents.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No documents uploaded yet</p>
              ) : (
                documents.map((doc, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span className="text-white font-medium">{doc.file_name}</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <p className="text-slate-400">Type: <span className="text-white">{doc.document_type}</span></p>
                            <p className="text-slate-400">Size: <span className="text-white">{(doc.file_size / 1024).toFixed(2)} KB</span></p>
                            <p className="text-slate-400">IPFS: <span className="text-xs font-mono text-green-400">{doc.ipfs_hash}</span></p>
                            {doc.gps_data && (
                              <div className="flex items-center space-x-2 text-green-400">
                                <MapPin className="w-3 h-3" />
                                <span className="text-xs">
                                  GPS: {doc.gps_data.latitude?.toFixed(6)}, {doc.gps_data.longitude?.toFixed(6)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <a
                          href={doc.ipfs_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>View</span>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AuthorityWalletDashboard;