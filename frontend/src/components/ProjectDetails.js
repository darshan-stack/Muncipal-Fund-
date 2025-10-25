import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ArrowLeft, Plus, ExternalLink, CheckCircle2, Clock, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProjectDetails = ({ account, signer }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [showExpenditureDialog, setShowExpenditureDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    description: '',
    target_amount: ''
  });

  const [expenditureForm, setExpenditureForm] = useState({
    milestone_id: '',
    amount: '',
    category: 'General',
    description: '',
    recipient: ''
  });

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projectRes, milestonesRes, expendituresRes] = await Promise.all([
        axios.get(`${API}/projects/${id}`),
        axios.get(`${API}/milestones/${id}`),
        axios.get(`${API}/expenditures/${id}`)
      ]);
      setProject(projectRes.data);
      setMilestones(milestonesRes.data);
      setExpenditures(expendituresRes.data);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneForm.name || !milestoneForm.target_amount) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const simulatedTxHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      await axios.post(`${API}/milestones`, {
        project_id: id,
        name: milestoneForm.name,
        description: milestoneForm.description,
        target_amount: parseFloat(milestoneForm.target_amount),
        tx_hash: simulatedTxHash
      });

      toast.success('Milestone created successfully!');
      setShowMilestoneDialog(false);
      setMilestoneForm({ name: '', description: '', target_amount: '' });
      fetchProjectData();
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast.error('Failed to create milestone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateExpenditure = async (e) => {
    e.preventDefault();
    if (!expenditureForm.amount || !expenditureForm.description || !expenditureForm.recipient) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const simulatedTxHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      await axios.post(`${API}/expenditures`, {
        project_id: id,
        milestone_id: expenditureForm.milestone_id || null,
        amount: parseFloat(expenditureForm.amount),
        category: expenditureForm.category,
        description: expenditureForm.description,
        recipient: expenditureForm.recipient,
        tx_hash: simulatedTxHash
      });

      toast.success('Expenditure recorded successfully!');
      setShowExpenditureDialog(false);
      setExpenditureForm({ milestone_id: '', amount: '', category: 'General', description: '', recipient: '' });
      fetchProjectData();
    } catch (error) {
      console.error('Error recording expenditure:', error);
      toast.error('Failed to record expenditure');
    } finally {
      setSubmitting(false);
    }
  };

  const updateMilestoneStatus = async (milestoneId, newStatus) => {
    try {
      const simulatedTxHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      await axios.put(`${API}/milestones/${milestoneId}`, {
        status: newStatus,
        tx_hash: simulatedTxHash
      });

      toast.success('Milestone status updated!');
      fetchProjectData();
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast.error('Failed to update milestone');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading project details...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Project not found</div>
      </div>
    );
  }

  const progress = project.budget > 0 ? (project.spent_funds / project.budget) * 100 : 0;
  const isManager = account && account.toLowerCase() === project.manager_address.toLowerCase();

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="text-slate-400 hover:text-white"
          data-testid="back-to-dashboard-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Project Header */}
        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <CardTitle className="text-3xl text-white" style={{fontFamily: 'Space Grotesk'}}>
                  {project.name}
                </CardTitle>
                <p className="text-slate-400">{project.description}</p>
              </div>
              <span className={project.status === 'Active' ? 'status-active' : 'status-completed'}>
                {project.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Total Budget</p>
                <p className="text-2xl font-bold text-white" data-testid="project-budget">{formatCurrency(project.budget)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Allocated Funds</p>
                <p className="text-2xl font-bold text-green-400" data-testid="project-allocated">{formatCurrency(project.allocated_funds)}</p>
                <p className="text-xs text-slate-500">{((project.allocated_funds / project.budget) * 100).toFixed(1)}% allocated</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Spent Funds</p>
                <p className="text-2xl font-bold text-purple-400" data-testid="project-spent">{formatCurrency(project.spent_funds)}</p>
                <p className="text-xs text-slate-500">{((project.spent_funds / project.allocated_funds) * 100 || 0).toFixed(1)}% of allocated</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Available</p>
                <p className="text-2xl font-bold text-yellow-400" data-testid="project-remaining">
                  {formatCurrency(project.allocated_funds - project.spent_funds)}
                </p>
                <p className="text-xs text-slate-500">Can be spent</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Fund Allocation Progress</span>
                  <span className="text-white font-semibold">{((project.allocated_funds / project.budget) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                    style={{width: `${Math.min((project.allocated_funds / project.budget) * 100, 100)}%`}}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Allocated: {formatCurrency(project.allocated_funds)}</span>
                  <span>Unallocated: {formatCurrency(project.budget - project.allocated_funds)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Spending Progress</span>
                  <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Spent: {formatCurrency(project.spent_funds)}</span>
                  <span>Budget: {formatCurrency(project.budget)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <div className="space-y-1">
                <p className="text-sm text-slate-400">Project Manager</p>
                <p className="text-sm font-mono text-white" data-testid="project-manager">{project.manager_address}</p>
              </div>
              {project.tx_hash && (
                <a
                  href={`https://mumbai.polygonscan.com/tx/${project.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                  data-testid="view-blockchain-btn"
                >
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-300">View on Blockchain</span>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Milestones and Expenditures */}
        <Tabs defaultValue="milestones" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="milestones" className="data-[state=active]:bg-blue-500" data-testid="milestones-tab">
              Milestones ({milestones.length})
            </TabsTrigger>
            <TabsTrigger value="expenditures" className="data-[state=active]:bg-blue-500" data-testid="expenditures-tab">
              Expenditures ({expenditures.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="milestones" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Project Milestones</h3>
              {isManager && (
                <Dialog open={showMilestoneDialog} onOpenChange={setShowMilestoneDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-500 hover:bg-blue-600" data-testid="add-milestone-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Milestone
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create New Milestone</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Add a milestone to track project progress
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateMilestone} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="milestone-name" className="text-slate-300">Milestone Name</Label>
                        <Input
                          id="milestone-name"
                          value={milestoneForm.name}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                          data-testid="milestone-name-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="milestone-description" className="text-slate-300">Description</Label>
                        <Textarea
                          id="milestone-description"
                          value={milestoneForm.description}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                          data-testid="milestone-description-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="milestone-amount" className="text-slate-300">Target Amount (USD)</Label>
                        <Input
                          id="milestone-amount"
                          type="number"
                          value={milestoneForm.target_amount}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, target_amount: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                          data-testid="milestone-amount-input"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" disabled={submitting} data-testid="submit-milestone-btn">
                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Milestone'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {milestones.length === 0 ? (
              <Card className="glass-effect border-slate-700">
                <CardContent className="py-12 text-center">
                  <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No milestones yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {milestones.map((milestone, index) => {
                  const milestoneProgress = milestone.target_amount > 0 
                    ? (milestone.spent_amount / milestone.target_amount) * 100 
                    : 0;
                  return (
                    <Card key={milestone.id} className="glass-effect border-slate-700" data-testid={`milestone-card-${index}`}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h4 className="text-lg font-semibold text-white">{milestone.name}</h4>
                              <p className="text-sm text-slate-400">{milestone.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={
                                milestone.status === 'Completed' ? 'status-completed' :
                                milestone.status === 'InProgress' ? 'status-active' :
                                'status-pending'
                              }>
                                {milestone.status}
                              </span>
                              {isManager && milestone.status !== 'Completed' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateMilestoneStatus(milestone.id, 'Completed')}
                                  className="bg-green-500 hover:bg-green-600"
                                  data-testid={`complete-milestone-${index}`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Progress</span>
                              <span className="text-white">{milestoneProgress.toFixed(1)}%</span>
                            </div>
                            <Progress value={milestoneProgress} className="h-2" />
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Spent: {formatCurrency(milestone.spent_amount)}</span>
                              <span className="text-slate-500">Target: {formatCurrency(milestone.target_amount)}</span>
                            </div>
                          </div>

                          {milestone.tx_hash && (
                            <a
                              href={`https://mumbai.polygonscan.com/tx/${milestone.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300"
                              data-testid={`milestone-tx-${index}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View Transaction</span>
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expenditures" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Project Expenditures</h3>
              {isManager && (
                <Dialog open={showExpenditureDialog} onOpenChange={setShowExpenditureDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-500 hover:bg-blue-600" data-testid="add-expenditure-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Record Expenditure
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Record New Expenditure</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Track spending on the blockchain
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateExpenditure} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="exp-milestone" className="text-slate-300">Milestone (Optional)</Label>
                        <select
                          id="exp-milestone"
                          value={expenditureForm.milestone_id}
                          onChange={(e) => setExpenditureForm({ ...expenditureForm, milestone_id: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                          data-testid="expenditure-milestone-select"
                        >
                          <option value="">No specific milestone</option>
                          {milestones.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exp-category" className="text-slate-300">Category</Label>
                        <select
                          id="exp-category"
                          value={expenditureForm.category}
                          onChange={(e) => setExpenditureForm({ ...expenditureForm, category: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                          data-testid="expenditure-category-select"
                        >
                          <option value="Materials">Materials</option>
                          <option value="Labor">Labor</option>
                          <option value="Equipment">Equipment</option>
                          <option value="Services">Services</option>
                          <option value="Permits">Permits & Licenses</option>
                          <option value="General">General</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exp-amount" className="text-slate-300">Amount (USD)</Label>
                        <Input
                          id="exp-amount"
                          type="number"
                          value={expenditureForm.amount}
                          onChange={(e) => setExpenditureForm({ ...expenditureForm, amount: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                          data-testid="expenditure-amount-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exp-description" className="text-slate-300">Description</Label>
                        <Textarea
                          id="exp-description"
                          value={expenditureForm.description}
                          onChange={(e) => setExpenditureForm({ ...expenditureForm, description: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                          data-testid="expenditure-description-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exp-recipient" className="text-slate-300">Recipient Address</Label>
                        <Input
                          id="exp-recipient"
                          value={expenditureForm.recipient}
                          onChange={(e) => setExpenditureForm({ ...expenditureForm, recipient: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="0x..."
                          data-testid="expenditure-recipient-input"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" disabled={submitting} data-testid="submit-expenditure-btn">
                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Recording...</> : 'Record Expenditure'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {expenditures.length === 0 ? (
              <Card className="glass-effect border-slate-700">
                <CardContent className="py-12 text-center">
                  <DollarSign className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No expenditures recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {expenditures.map((exp, index) => (
                  <Card key={exp.id} className="glass-effect border-slate-700" data-testid={`expenditure-card-${index}`}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl font-bold text-white">{formatCurrency(exp.amount)}</div>
                            <span className="text-sm text-slate-500">{formatDate(exp.timestamp)}</span>
                          </div>
                          <p className="text-sm text-slate-400">{exp.description}</p>
                          <div className="text-xs text-slate-500">
                            <span className="font-medium">Recipient:</span> <span className="font-mono">{exp.recipient}</span>
                          </div>
                        </div>
                        <a
                          href={`https://mumbai.polygonscan.com/tx/${exp.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                          data-testid={`expenditure-tx-${index}`}
                        >
                          <ExternalLink className="w-4 h-4 text-blue-400" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetails;