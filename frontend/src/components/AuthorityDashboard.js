import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, FileText, AlertCircle, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthorityDashboard = () => {
  const navigate = useNavigate();
  const [authority, setAuthority] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedAuthority = localStorage.getItem('authority');
    if (!storedAuthority) {
      navigate('/authority/login');
      return;
    }

    const auth = JSON.parse(storedAuthority);
    setAuthority(auth);
    fetchPendingApprovals(auth.id);
  }, [navigate]);

  const fetchPendingApprovals = async (authorityId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/approvals/pending/${authorityId}`);
      setApprovals(response.data);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
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
      fetchPendingApprovals(authority.id);
    } catch (error) {
      console.error('Error processing decision:', error);
      toast.error('Failed to process decision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authority');
    navigate('/authority/login');
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
        <div className="animate-pulse text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>
              Higher Authority Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Welcome, {authority?.name}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-slate-700 hover:bg-slate-800"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-slate-400">Pending Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{approvals.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-slate-400">Total Reviewed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{authority?.total_reviewed || 0}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-slate-400">Department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-white">{authority?.department}</div>
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
                  <Card key={approval.id} className="bg-slate-800/50 border-slate-700" data-testid={`approval-${index}`}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">{approval.project?.name}</h3>
                            <p className="text-sm text-slate-400">{approval.project?.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                {approval.project?.category}
                              </Badge>
                              <span className="text-sm text-slate-500">
                                Budget: <span className="text-white font-semibold">{formatCurrency(approval.project?.budget)}</span>
                              </span>
                            </div>
                          </div>
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            Pending Review
                          </Badge>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-blue-400">
                              <p className="font-medium">Anonymous Review</p>
                              <p className="text-blue-300 mt-1">Contractor identity hidden during review process</p>
                            </div>
                          </div>
                        </div>

                        {selectedApproval === approval.id ? (
                          <div className="space-y-4 pt-4 border-t border-slate-700">
                            <div className="space-y-2">
                              <label className="text-sm text-slate-400">Review Comments (required for rejection)</label>
                              <Textarea
                                value={reviewComments}
                                onChange={(e) => setReviewComments(e.target.value)}
                                placeholder="Enter your review comments..."
                                rows={4}
                                className="bg-slate-900 border-slate-700 text-white"
                                data-testid="review-comments"
                              />
                            </div>

                            <div className="flex space-x-3">
                              <Button
                                onClick={() => handleDecision(approval.id, 'Approved')}
                                className="flex-1 bg-green-500 hover:bg-green-600"
                                disabled={submitting}
                                data-testid="approve-btn"
                              >
                                {submitting ? (
                                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                                ) : (
                                  <><CheckCircle className="w-4 h-4 mr-2" />Approve & Release Funds</>
                                )}
                              </Button>
                              <Button
                                onClick={() => handleDecision(approval.id, 'Rejected')}
                                className="flex-1 bg-red-500 hover:bg-red-600"
                                disabled={submitting}
                                data-testid="reject-btn"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedApproval(null);
                                  setReviewComments('');
                                }}
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
                            data-testid={`review-btn-${index}`}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Review Project
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
      </div>
    </div>
  );
};

export default AuthorityDashboard;