import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateProject = ({ account, signer }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Infrastructure',
    budget: '',
    contractor_name: '',
    contractor_wallet: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.budget) {
      toast.error('Please fill all fields');
      return;
    }

    if (parseFloat(formData.budget) <= 0) {
      toast.error('Budget must be greater than 0');
      return;
    }

    try {
      setLoading(true);

      // For MVP, we'll create a simulated transaction hash
      // In production, this would interact with the smart contract
      const simulatedTxHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      toast.info('Creating project on blockchain...');

      // Simulate blockchain transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create project in backend
      const response = await axios.post(`${API}/projects`, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        budget: parseFloat(formData.budget),
        manager_address: account,
        tx_hash: simulatedTxHash,
        contract_project_id: Math.floor(Math.random() * 10000)
      });

      toast.success('Project created successfully!');
      navigate(`/project/${response.data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="text-slate-400 hover:text-white"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <CardTitle className="text-3xl text-white" style={{fontFamily: 'Space Grotesk'}}>
              Create New Project
            </CardTitle>
            <CardDescription className="text-slate-400">
              Initialize a new municipal project on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Community Park Development"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  data-testid="project-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-300">Project Category</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white"
                  data-testid="project-category-select"
                >
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Education">Education</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Environment">Environment</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Public Safety">Public Safety</option>
                  <option value="Community Services">Community Services</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the project objectives and scope..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                  data-testid="project-description-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget" className="text-slate-300">Total Budget (USD)</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  placeholder="1000000"
                  value={formData.budget}
                  onChange={handleChange}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  data-testid="project-budget-input"
                />
              </div>

              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-slate-300">Project Manager</p>
                <p className="text-xs font-mono text-slate-400 break-all" data-testid="manager-address">{account}</p>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1 border-slate-700 hover:bg-slate-800"
                  disabled={loading}
                  data-testid="cancel-btn"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  disabled={loading}
                  data-testid="submit-project-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-sm">ℹ</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-300">Blockchain Transaction</p>
                <p className="text-xs text-slate-400">
                  Creating a project will initiate a blockchain transaction. Make sure you have enough test MATIC in your wallet for gas fees.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProject;