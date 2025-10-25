import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { ArrowLeft, ArrowRight, Upload, FileText, CheckCircle2, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateProjectWithDocuments = ({ account }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    category: 'Infrastructure',
    budget: '',
    contractor_name: '',
    contractor_wallet: ''
  });

  const [documents, setDocuments] = useState({
    proposal: null,
    lab_reports: [],
    gps_photos: [],
    invoices: []
  });

  const [projectId, setProjectId] = useState(null);

  const handleProjectDataChange = (e) => {
    setProjectData({ ...projectData, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (docType, files) => {
    if (docType === 'proposal') {
      setDocuments({ ...documents, [docType]: files[0] });
    } else {
      setDocuments({ ...documents, [docType]: Array.from(files) });
    }
  };

  const uploadDocument = async (file, docType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);
    formData.append('uploaded_by', account);

    const response = await axios.post(
      `${API}/projects/${projectId}/upload-document`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  };

  const handleStep1Submit = async () => {
    if (!projectData.name || !projectData.budget || !projectData.contractor_name) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const txHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const response = await axios.post(`${API}/projects`, {
        ...projectData,
        contractor_wallet: projectData.contractor_wallet || account,
        manager_address: account,
        budget: parseFloat(projectData.budget),
        tx_hash: txHash
      });

      setProjectId(response.data.id);
      toast.success('Project created! Now upload documents.');
      setCurrentStep(2);
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!documents.proposal) {
      toast.error('Project proposal is required');
      return;
    }

    if (documents.gps_photos.length === 0) {
      toast.error('At least one GPS photo is required');
      return;
    }

    try {
      setLoading(true);

      // Upload proposal
      if (documents.proposal) {
        toast.info('Uploading proposal to IPFS...');
        await uploadDocument(documents.proposal, 'proposal');
      }

      // Upload GPS photos
      for (const file of documents.gps_photos) {
        toast.info('Uploading GPS photo...');
        const result = await uploadDocument(file, 'gps_photo');
        if (result.gps_data) {
          toast.success(`GPS: ${result.gps_data.latitude?.toFixed(6)}, ${result.gps_data.longitude?.toFixed(6)}`);
        }
      }

      // Upload lab reports
      for (const file of documents.lab_reports) {
        await uploadDocument(file, 'lab_report');
      }

      // Upload invoices
      for (const file of documents.invoices) {
        await uploadDocument(file, 'invoice');
      }

      toast.success('All documents uploaded!');
      setCurrentStep(3);
    } catch (error) {
      toast.error('Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/projects/${projectId}/submit-approval`);
      toast.success('Project submitted for approval!');
      navigate(`/project/${projectId}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button onClick={() => currentStep === 1 ? navigate('/') : setCurrentStep(currentStep - 1)} variant="ghost">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>

        <Card className="glass-effect border-slate-700">
          <CardContent className="pt-6">
            <Progress value={(currentStep / 3) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>Project Info</span>
              <span>Documents</span>
              <span>Submit</span>
            </div>
          </CardContent>
        </Card>

        {currentStep === 1 && (
          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Project Name *</Label>
                <Input name="name" value={projectData.name} onChange={handleProjectDataChange} className="bg-slate-800/50 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Category</Label>
                <select name="category" value={projectData.category} onChange={handleProjectDataChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white">
                  <option>Infrastructure</option>
                  <option>Education</option>
                  <option>Healthcare</option>
                </select>
              </div>
              <div>
                <Label className="text-slate-300">Description *</Label>
                <Textarea name="description" value={projectData.description} onChange={handleProjectDataChange} rows={4} className="bg-slate-800/50 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Budget (USD) *</Label>
                <Input name="budget" type="number" value={projectData.budget} onChange={handleProjectDataChange} className="bg-slate-800/50 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Contractor Name *</Label>
                <Input name="contractor_name" value={projectData.contractor_name} onChange={handleProjectDataChange} className="bg-slate-800/50 border-slate-700 text-white" />
              </div>
              <Button onClick={handleStep1Submit} disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <>Next <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Upload Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300"><FileText className="w-4 h-4 inline mr-2" />Project Proposal (PDF) *</Label>
                <input type="file" accept=".pdf" onChange={(e) => handleFileSelect('proposal', e.target.files)} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white" />
                {documents.proposal && <p className="text-xs text-green-400 mt-1"><CheckCircle2 className="w-3 h-3 inline mr-1" />{documents.proposal.name}</p>}
              </div>
              <div>
                <Label className="text-slate-300"><MapPin className="w-4 h-4 inline mr-2" />GPS Photos *</Label>
                <input type="file" accept="image/*" multiple onChange={(e) => handleFileSelect('gps_photos', e.target.files)} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white" />
                {documents.gps_photos.length > 0 && <p className="text-xs text-green-400 mt-1">{documents.gps_photos.length} photo(s)</p>}
              </div>
              <div>
                <Label className="text-slate-300">Lab Reports (PDF)</Label>
                <input type="file" accept=".pdf" multiple onChange={(e) => handleFileSelect('lab_reports', e.target.files)} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Vendor Invoices</Label>
                <input type="file" accept=".pdf,image/*" multiple onChange={(e) => handleFileSelect('invoices', e.target.files)} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white" />
              </div>
              <Button onClick={handleStep2Submit} disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4 mr-2" />Upload to IPFS</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Review & Submit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-800/30 rounded-lg p-4">
                <p className="text-white">Project: {projectData.name}</p>
                <p className="text-slate-400">Budget: ${projectData.budget}</p>
                <p className="text-slate-400">Contractor: {projectData.contractor_name}</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-sm text-green-400">✓ Documents uploaded to IPFS<br/>✓ Ready for review</p>
              </div>
              <Button onClick={handleFinalSubmit} disabled={loading} className="w-full bg-green-500 hover:bg-green-600">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : 'Submit for Approval'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreateProjectWithDocuments;