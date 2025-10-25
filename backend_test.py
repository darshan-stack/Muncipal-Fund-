#!/usr/bin/env python3
"""
Backend API Testing for Municipal Fund Tracker Platform
Tests all critical APIs with comprehensive scenarios
"""

import requests
import json
import os
import io
from pathlib import Path
import uuid
from datetime import datetime
import time

# Get backend URL from frontend .env
def get_backend_url():
    env_path = Path("/app/frontend/.env")
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    return "http://localhost:8001"

BASE_URL = get_backend_url()
API_URL = f"{BASE_URL}/api"

class MunicipalFundTrackerTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_data = {}
        self.results = {
            'passed': 0,
            'failed': 0,
            'errors': []
        }
    
    def log_result(self, test_name, success, message="", response=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if response and not success:
            print(f"   Response: {response.status_code} - {response.text[:200]}")
        
        if success:
            self.results['passed'] += 1
        else:
            self.results['failed'] += 1
            self.results['errors'].append({
                'test': test_name,
                'message': message,
                'response': response.text if response else None
            })
        print()
    
    def test_api_health(self):
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{API_URL}/")
            if response.status_code == 200:
                data = response.json()
                self.log_result("API Health Check", True, f"API is running: {data.get('message', 'OK')}")
                return True
            else:
                self.log_result("API Health Check", False, f"API not responding properly", response)
                return False
        except Exception as e:
            self.log_result("API Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_register_authority(self):
        """Test authority registration"""
        try:
            authority_data = {
                "username": f"test_authority_{int(time.time())}",
                "password": "secure_password_123",
                "name": "Test Municipal Authority",
                "department": "Public Works Department"
            }
            
            response = self.session.post(f"{API_URL}/auth/authority/register", json=authority_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.test_data['authority_id'] = data['authority_id']
                    self.test_data['authority_credentials'] = {
                        'username': authority_data['username'],
                        'password': authority_data['password']
                    }
                    self.log_result("Authority Registration", True, f"Authority registered with ID: {data['authority_id']}")
                    return True
                else:
                    self.log_result("Authority Registration", False, "Registration failed", response)
                    return False
            else:
                self.log_result("Authority Registration", False, "Registration request failed", response)
                return False
        except Exception as e:
            self.log_result("Authority Registration", False, f"Error: {str(e)}")
            return False
    
    def test_authority_login(self):
        """Test authority login"""
        try:
            if 'authority_credentials' not in self.test_data:
                self.log_result("Authority Login", False, "No authority credentials available")
                return False
            
            response = self.session.post(f"{API_URL}/auth/authority/login", 
                                       json=self.test_data['authority_credentials'])
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result("Authority Login", True, f"Login successful for authority: {data['authority']['name']}")
                    return True
                else:
                    self.log_result("Authority Login", False, "Login failed", response)
                    return False
            else:
                self.log_result("Authority Login", False, "Login request failed", response)
                return False
        except Exception as e:
            self.log_result("Authority Login", False, f"Error: {str(e)}")
            return False
    
    def test_project_creation(self):
        """Test project creation API"""
        try:
            project_data = {
                "name": "Municipal Road Improvement Project",
                "description": "Upgrading main street infrastructure with new asphalt and drainage systems",
                "category": "Infrastructure",
                "budget": 250000.0,
                "contractor_name": "City Construction LLC",
                "contractor_wallet": "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4",
                "manager_address": "0x123456789abcdef123456789abcdef123456789a"
            }
            
            response = self.session.post(f"{API_URL}/projects", json=project_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('id'):
                    self.test_data['project_id'] = data['id']
                    self.log_result("Project Creation", True, f"Project created with ID: {data['id']}")
                    return True
                else:
                    self.log_result("Project Creation", False, "No project ID returned", response)
                    return False
            else:
                self.log_result("Project Creation", False, "Project creation failed", response)
                return False
        except Exception as e:
            self.log_result("Project Creation", False, f"Error: {str(e)}")
            return False
    
    def create_test_pdf(self):
        """Create a test PDF file"""
        try:
            # Simple PDF content (minimal PDF structure)
            pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF"""
            return pdf_content
        except Exception as e:
            print(f"Error creating test PDF: {e}")
            return None
    
    def create_test_image_with_gps(self):
        """Create a test image with simulated GPS data"""
        try:
            # Create a simple test image (1x1 pixel PNG)
            png_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
            return png_content
        except Exception as e:
            print(f"Error creating test image: {e}")
            return None
    
    def test_document_upload_pdf(self):
        """Test document upload API with PDF"""
        try:
            if 'project_id' not in self.test_data:
                self.log_result("Document Upload (PDF)", False, "No project ID available")
                return False
            
            pdf_content = self.create_test_pdf()
            if not pdf_content:
                self.log_result("Document Upload (PDF)", False, "Could not create test PDF")
                return False
            
            files = {
                'file': ('project_proposal.pdf', io.BytesIO(pdf_content), 'application/pdf')
            }
            data = {
                'document_type': 'proposal',
                'uploaded_by': 'project_manager@city.gov'
            }
            
            response = self.session.post(
                f"{API_URL}/projects/{self.test_data['project_id']}/upload-document",
                files=files,
                data=data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.test_data['pdf_document_id'] = result['document_id']
                    self.log_result("Document Upload (PDF)", True, 
                                  f"PDF uploaded successfully. IPFS Hash: {result.get('ipfs_hash', 'N/A')}")
                    return True
                else:
                    self.log_result("Document Upload (PDF)", False, "Upload not successful", response)
                    return False
            else:
                self.log_result("Document Upload (PDF)", False, "Upload request failed", response)
                return False
        except Exception as e:
            self.log_result("Document Upload (PDF)", False, f"Error: {str(e)}")
            return False
    
    def test_document_upload_image(self):
        """Test document upload API with image (GPS photo)"""
        try:
            if 'project_id' not in self.test_data:
                self.log_result("Document Upload (Image)", False, "No project ID available")
                return False
            
            image_content = self.create_test_image_with_gps()
            if not image_content:
                self.log_result("Document Upload (Image)", False, "Could not create test image")
                return False
            
            files = {
                'file': ('site_photo.png', io.BytesIO(image_content), 'image/png')
            }
            data = {
                'document_type': 'gps_photos',
                'uploaded_by': 'field_inspector@city.gov'
            }
            
            response = self.session.post(
                f"{API_URL}/projects/{self.test_data['project_id']}/upload-document",
                files=files,
                data=data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.test_data['image_document_id'] = result['document_id']
                    self.log_result("Document Upload (Image)", True, 
                                  f"Image uploaded successfully. GPS Verified: {result.get('gps_verified', False)}")
                    return True
                else:
                    self.log_result("Document Upload (Image)", False, "Upload not successful", response)
                    return False
            else:
                self.log_result("Document Upload (Image)", False, "Upload request failed", response)
                return False
        except Exception as e:
            self.log_result("Document Upload (Image)", False, f"Error: {str(e)}")
            return False
    
    def test_document_retrieval(self):
        """Test document retrieval API"""
        try:
            if 'project_id' not in self.test_data:
                self.log_result("Document Retrieval", False, "No project ID available")
                return False
            
            response = self.session.get(f"{API_URL}/projects/{self.test_data['project_id']}/documents")
            
            if response.status_code == 200:
                documents = response.json()
                if isinstance(documents, list):
                    self.log_result("Document Retrieval", True, 
                                  f"Retrieved {len(documents)} documents for project")
                    
                    # Verify document structure
                    for doc in documents:
                        if not all(key in doc for key in ['id', 'file_name', 'document_type', 'ipfs_hash']):
                            self.log_result("Document Structure Validation", False, 
                                          "Document missing required fields")
                            return False
                    
                    self.log_result("Document Structure Validation", True, 
                                  "All documents have required fields")
                    return True
                else:
                    self.log_result("Document Retrieval", False, "Invalid response format", response)
                    return False
            else:
                self.log_result("Document Retrieval", False, "Retrieval request failed", response)
                return False
        except Exception as e:
            self.log_result("Document Retrieval", False, f"Error: {str(e)}")
            return False
    
    def test_submit_for_approval(self):
        """Test submit project for approval API"""
        try:
            if 'project_id' not in self.test_data:
                self.log_result("Submit for Approval", False, "No project ID available")
                return False
            
            response = self.session.post(f"{API_URL}/projects/{self.test_data['project_id']}/submit-approval")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.test_data['approval_tx_hash'] = result.get('tx_hash')
                    self.log_result("Submit for Approval", True, 
                                  f"Project submitted for approval. TX Hash: {result.get('tx_hash', 'N/A')}")
                    return True
                else:
                    self.log_result("Submit for Approval", False, "Submission not successful", response)
                    return False
            else:
                self.log_result("Submit for Approval", False, "Submission request failed", response)
                return False
        except Exception as e:
            self.log_result("Submit for Approval", False, f"Error: {str(e)}")
            return False
    
    def test_get_pending_approvals(self):
        """Test get pending approvals API"""
        try:
            if 'authority_id' not in self.test_data:
                self.log_result("Get Pending Approvals", False, "No authority ID available")
                return False
            
            # Wait a moment for the approval to be processed
            time.sleep(1)
            
            response = self.session.get(f"{API_URL}/approvals/pending/{self.test_data['authority_id']}")
            
            if response.status_code == 200:
                approvals = response.json()
                if isinstance(approvals, list):
                    if len(approvals) > 0:
                        # Store first approval for testing decision
                        self.test_data['approval_id'] = approvals[0]['id']
                        
                        # Verify anonymization
                        project = approvals[0].get('project', {})
                        contractor_hidden = project.get('contractor_name') == '[REDACTED]'
                        wallet_hidden = project.get('contractor_wallet') == '[HIDDEN]'
                        
                        if contractor_hidden and wallet_hidden:
                            self.log_result("Get Pending Approvals", True, 
                                          f"Retrieved {len(approvals)} pending approvals with proper anonymization")
                        else:
                            self.log_result("Get Pending Approvals", False, 
                                          "Contractor information not properly anonymized")
                            return False
                    else:
                        self.log_result("Get Pending Approvals", True, 
                                      "No pending approvals found")
                    return True
                else:
                    self.log_result("Get Pending Approvals", False, "Invalid response format", response)
                    return False
            else:
                self.log_result("Get Pending Approvals", False, "Request failed", response)
                return False
        except Exception as e:
            self.log_result("Get Pending Approvals", False, f"Error: {str(e)}")
            return False
    
    def test_approval_decision_approve(self):
        """Test approval decision API - Approve"""
        try:
            # Create a fresh project for approval testing
            project_data = {
                "name": "Test Approval Project",
                "description": "Project for testing approval workflow",
                "category": "Infrastructure",
                "budget": 150000.0,
                "contractor_name": "Approval Test Contractor",
                "contractor_wallet": "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C6",
                "manager_address": "0x123456789abcdef123456789abcdef123456789c"
            }
            
            project_response = self.session.post(f"{API_URL}/projects", json=project_data)
            if project_response.status_code != 200:
                self.log_result("Approval Decision (Approve) - Project Creation", False, "Could not create test project")
                return False
            
            approve_project_id = project_response.json()['id']
            
            # Submit for approval
            submit_response = self.session.post(f"{API_URL}/projects/{approve_project_id}/submit-approval")
            if submit_response.status_code != 200:
                self.log_result("Approval Decision (Approve) - Submit", False, "Could not submit project")
                return False
            
            # Wait for processing
            time.sleep(1)
            
            # Get pending approvals to find the new approval
            approvals_response = self.session.get(f"{API_URL}/approvals/pending/{self.test_data['authority_id']}")
            if approvals_response.status_code != 200:
                self.log_result("Approval Decision (Approve) - Get Approvals", False, "Could not get approvals")
                return False
            
            approvals = approvals_response.json()
            approve_approval_id = None
            for approval in approvals:
                if approval.get('project', {}).get('id') == approve_project_id:
                    approve_approval_id = approval['id']
                    break
            
            if not approve_approval_id:
                self.log_result("Approval Decision (Approve)", False, "Could not find approval for approval test")
                return False
            
            # Approve the project
            decision_data = {
                "decision": "Approved",
                "comments": "Project meets all municipal requirements and budget allocation is appropriate."
            }
            
            response = self.session.post(
                f"{API_URL}/approvals/{approve_approval_id}/decide",
                json=decision_data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('decision') == 'Approved':
                    self.log_result("Approval Decision (Approve)", True, 
                                  f"Project approved successfully. TX Hash: {result.get('tx_hash', 'N/A')}")
                    
                    # Verify project status updated
                    project_response = self.session.get(f"{API_URL}/projects/{approve_project_id}")
                    if project_response.status_code == 200:
                        project = project_response.json()
                        if project.get('status') == 'Approved' and project.get('allocated_funds') > 0:
                            self.log_result("Project Status Update Verification", True, 
                                          f"Project status updated to Approved with allocated funds: {project.get('allocated_funds')}")
                        else:
                            self.log_result("Project Status Update Verification", False, 
                                          f"Project status not properly updated. Status: {project.get('status')}, Funds: {project.get('allocated_funds')}")
                    
                    return True
                else:
                    self.log_result("Approval Decision (Approve)", False, "Decision not successful", response)
                    return False
            else:
                self.log_result("Approval Decision (Approve)", False, "Decision request failed", response)
                return False
        except Exception as e:
            self.log_result("Approval Decision (Approve)", False, f"Error: {str(e)}")
            return False
    
    def test_approval_decision_reject(self):
        """Test approval decision API - Reject (with new project)"""
        try:
            # Create another project for rejection testing
            project_data = {
                "name": "Test Rejection Project",
                "description": "Project for testing rejection workflow",
                "category": "Infrastructure",
                "budget": 100000.0,
                "contractor_name": "Test Contractor",
                "contractor_wallet": "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C5",
                "manager_address": "0x123456789abcdef123456789abcdef123456789b"
            }
            
            project_response = self.session.post(f"{API_URL}/projects", json=project_data)
            if project_response.status_code != 200:
                self.log_result("Approval Decision (Reject) - Project Creation", False, "Could not create test project")
                return False
            
            reject_project_id = project_response.json()['id']
            
            # Submit for approval
            submit_response = self.session.post(f"{API_URL}/projects/{reject_project_id}/submit-approval")
            if submit_response.status_code != 200:
                self.log_result("Approval Decision (Reject) - Submit", False, "Could not submit project")
                return False
            
            # Get pending approvals to find the new approval
            approvals_response = self.session.get(f"{API_URL}/approvals/pending/{self.test_data['authority_id']}")
            if approvals_response.status_code != 200:
                self.log_result("Approval Decision (Reject) - Get Approvals", False, "Could not get approvals")
                return False
            
            approvals = approvals_response.json()
            reject_approval_id = None
            for approval in approvals:
                if approval.get('project', {}).get('id') == reject_project_id:
                    reject_approval_id = approval['id']
                    break
            
            if not reject_approval_id:
                self.log_result("Approval Decision (Reject)", False, "Could not find approval for rejection test")
                return False
            
            # Reject the project
            decision_data = {
                "decision": "Rejected",
                "comments": "Budget allocation exceeds municipal guidelines for this project category."
            }
            
            response = self.session.post(
                f"{API_URL}/approvals/{reject_approval_id}/decide",
                json=decision_data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('decision') == 'Rejected':
                    self.log_result("Approval Decision (Reject)", True, 
                                  f"Project rejected successfully. TX Hash: {result.get('tx_hash', 'N/A')}")
                    
                    # Verify project status updated
                    project_response = self.session.get(f"{API_URL}/projects/{reject_project_id}")
                    if project_response.status_code == 200:
                        project = project_response.json()
                        if project.get('status') == 'Rejected':
                            self.log_result("Rejection Status Update Verification", True, 
                                          "Project status updated to Rejected")
                        else:
                            self.log_result("Rejection Status Update Verification", False, 
                                          f"Project status not properly updated. Status: {project.get('status')}")
                    
                    return True
                else:
                    self.log_result("Approval Decision (Reject)", False, "Decision not successful", response)
                    return False
            else:
                self.log_result("Approval Decision (Reject)", False, "Decision request failed", response)
                return False
        except Exception as e:
            self.log_result("Approval Decision (Reject)", False, f"Error: {str(e)}")
            return False
    
    def test_public_approved_projects(self):
        """Test public approved projects endpoint"""
        try:
            response = self.session.get(f"{API_URL}/public/projects/approved")
            
            if response.status_code == 200:
                projects = response.json()
                if isinstance(projects, list):
                    approved_count = len([p for p in projects if p.get('status') == 'Approved'])
                    self.log_result("Public Approved Projects", True, 
                                  f"Retrieved {len(projects)} projects, {approved_count} approved")
                    return True
                else:
                    self.log_result("Public Approved Projects", False, "Invalid response format", response)
                    return False
            else:
                self.log_result("Public Approved Projects", False, "Request failed", response)
                return False
        except Exception as e:
            self.log_result("Public Approved Projects", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print("=" * 60)
        print("MUNICIPAL FUND TRACKER - BACKEND API TESTING")
        print("=" * 60)
        print(f"Testing against: {API_URL}")
        print()
        
        # Test sequence following the workflow
        tests = [
            ("API Health Check", self.test_api_health),
            ("Authority Registration", self.test_register_authority),
            ("Authority Login", self.test_authority_login),
            ("Project Creation", self.test_project_creation),
            ("Document Upload (PDF)", self.test_document_upload_pdf),
            ("Document Upload (Image)", self.test_document_upload_image),
            ("Document Retrieval", self.test_document_retrieval),
            ("Submit for Approval", self.test_submit_for_approval),
            ("Get Pending Approvals", self.test_get_pending_approvals),
            ("Approval Decision (Approve)", self.test_approval_decision_approve),
            ("Approval Decision (Reject)", self.test_approval_decision_reject),
            ("Public Approved Projects", self.test_public_approved_projects)
        ]
        
        for test_name, test_func in tests:
            try:
                test_func()
            except Exception as e:
                self.log_result(test_name, False, f"Unexpected error: {str(e)}")
        
        # Print summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📊 Success Rate: {(self.results['passed'] / (self.results['passed'] + self.results['failed']) * 100):.1f}%")
        
        if self.results['errors']:
            print("\n🔍 FAILED TESTS DETAILS:")
            for error in self.results['errors']:
                print(f"   • {error['test']}: {error['message']}")
        
        print("=" * 60)
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = MunicipalFundTrackerTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)