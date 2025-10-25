from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from web3 import Web3
import json
import shutil
from ipfs_service import ipfs_service
from document_processor import document_processor

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Web3 connection to Polygon Mumbai
POLYGON_RPC = os.environ.get('POLYGON_RPC_URL', 'https://rpc-mumbai.maticvigil.com')
w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str = "Infrastructure"
    budget: float
    allocated_funds: float = 0.0
    spent_funds: float = 0.0
    contractor_name: str = ""
    contractor_wallet: str = ""
    manager_address: str
    status: str = "Draft"  # Draft, Active, PendingApproval, Approved, Rejected
    is_anonymous: bool = False
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    reviewer_id: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tx_hash: Optional[str] = None
    contract_project_id: Optional[int] = None

class ProjectCreate(BaseModel):
    name: str
    description: str
    category: str
    budget: float
    contractor_name: str = ""
    contractor_wallet: str = ""
    manager_address: str
    tx_hash: Optional[str] = None
    contract_project_id: Optional[int] = None

class FundAllocation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    amount: float
    allocated_by: str
    purpose: str
    tx_hash: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FundAllocationCreate(BaseModel):
    project_id: str
    amount: float
    allocated_by: str
    purpose: str
    tx_hash: str

class Milestone(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    name: str
    description: str
    target_amount: float
    spent_amount: float = 0.0
    status: str = "Pending"  # Pending, InProgress, Completed
    completion_date: Optional[datetime] = None
    tx_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MilestoneCreate(BaseModel):
    project_id: str
    name: str
    description: str
    target_amount: float
    tx_hash: Optional[str] = None

class MilestoneUpdate(BaseModel):
    spent_amount: Optional[float] = None
    status: Optional[str] = None
    tx_hash: Optional[str] = None

class Expenditure(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    milestone_id: Optional[str] = None
    amount: float
    category: str = "General"  # Materials, Labor, Equipment, Services, etc.
    description: str
    recipient: str
    tx_hash: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    verified: bool = False

class ExpenditureCreate(BaseModel):
    project_id: str
    milestone_id: Optional[str] = None
    amount: float
    category: str
    description: str
    recipient: str
    tx_hash: str

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tx_hash: str
    type: str  # project_create, milestone_create, expenditure, fund_allocation
    project_id: Optional[str] = None
    details: dict
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    block_number: Optional[int] = None
    verified: bool = False

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Municipal Fund Tracker API", "blockchain": "Polygon Mumbai"}

@api_router.get("/blockchain/status")
async def blockchain_status():
    try:
        is_connected = w3.is_connected()
        latest_block = w3.eth.block_number if is_connected else None
        return {
            "connected": is_connected,
            "network": "Polygon Mumbai",
            "latest_block": latest_block,
            "rpc_url": POLYGON_RPC
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}

# Project endpoints
@api_router.post("/projects", response_model=Project)
async def create_project(input: ProjectCreate):
    project_dict = input.model_dump()
    project_obj = Project(**project_dict)
    
    doc = project_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('completion_date'):
        doc['completion_date'] = doc['completion_date'].isoformat()
    
    await db.projects.insert_one(doc)
    
    # Record transaction
    if input.tx_hash:
        tx_record = Transaction(
            tx_hash=input.tx_hash,
            type="project_create",
            project_id=project_obj.id,
            details={"name": input.name, "budget": input.budget, "category": input.category}
        )
        tx_doc = tx_record.model_dump()
        tx_doc['timestamp'] = tx_doc['timestamp'].isoformat()
        await db.transactions.insert_one(tx_doc)
    
    return project_obj

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    for project in projects:
        if isinstance(project['created_at'], str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
    return projects

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if isinstance(project['created_at'], str):
        project['created_at'] = datetime.fromisoformat(project['created_at'])
    return project

# Fund Allocation endpoints
@api_router.post("/allocations", response_model=FundAllocation)
async def allocate_funds(input: FundAllocationCreate):
    # Verify project exists
    project = await db.projects.find_one({"id": input.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    allocation_dict = input.model_dump()
    allocation_obj = FundAllocation(**allocation_dict)
    
    doc = allocation_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.fund_allocations.insert_one(doc)
    
    # Update project allocated funds
    await db.projects.update_one(
        {"id": input.project_id},
        {"$inc": {"allocated_funds": input.amount}}
    )
    
    # Record transaction
    tx_record = Transaction(
        tx_hash=input.tx_hash,
        type="fund_allocation",
        project_id=input.project_id,
        details={"amount": input.amount, "purpose": input.purpose}
    )
    tx_doc = tx_record.model_dump()
    tx_doc['timestamp'] = tx_doc['timestamp'].isoformat()
    await db.transactions.insert_one(tx_doc)
    
    return allocation_obj

@api_router.get("/allocations/{project_id}", response_model=List[FundAllocation])
async def get_project_allocations(project_id: str):
    allocations = await db.fund_allocations.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    for alloc in allocations:
        if isinstance(alloc['timestamp'], str):
            alloc['timestamp'] = datetime.fromisoformat(alloc['timestamp'])
    return allocations

# Milestone endpoints
@api_router.post("/milestones", response_model=Milestone)
async def create_milestone(input: MilestoneCreate):
    # Verify project exists
    project = await db.projects.find_one({"id": input.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    milestone_dict = input.model_dump()
    milestone_obj = Milestone(**milestone_dict)
    
    doc = milestone_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('completion_date'):
        doc['completion_date'] = doc['completion_date'].isoformat()
    
    await db.milestones.insert_one(doc)
    
    # Record transaction
    if input.tx_hash:
        tx_record = Transaction(
            tx_hash=input.tx_hash,
            type="milestone_create",
            project_id=input.project_id,
            details={"milestone_name": input.name, "target_amount": input.target_amount}
        )
        tx_doc = tx_record.model_dump()
        tx_doc['timestamp'] = tx_doc['timestamp'].isoformat()
        await db.transactions.insert_one(tx_doc)
    
    return milestone_obj

@api_router.get("/milestones/{project_id}", response_model=List[Milestone])
async def get_project_milestones(project_id: str):
    milestones = await db.milestones.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    for milestone in milestones:
        if isinstance(milestone['created_at'], str):
            milestone['created_at'] = datetime.fromisoformat(milestone['created_at'])
        if milestone.get('completion_date') and isinstance(milestone['completion_date'], str):
            milestone['completion_date'] = datetime.fromisoformat(milestone['completion_date'])
    return milestones

@api_router.put("/milestones/{milestone_id}", response_model=Milestone)
async def update_milestone(milestone_id: str, input: MilestoneUpdate):
    milestone = await db.milestones.find_one({"id": milestone_id}, {"_id": 0})
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    if "status" in update_data and update_data["status"] == "Completed":
        update_data["completion_date"] = datetime.now(timezone.utc).isoformat()
    
    await db.milestones.update_one({"id": milestone_id}, {"$set": update_data})
    
    # Update project spent funds
    if "spent_amount" in update_data:
        project = await db.projects.find_one({"id": milestone["project_id"]})
        if project:
            old_spent = milestone.get("spent_amount", 0)
            new_spent = update_data["spent_amount"]
            diff = new_spent - old_spent
            await db.projects.update_one(
                {"id": milestone["project_id"]},
                {"$inc": {"spent_funds": diff}}
            )
    
    updated_milestone = await db.milestones.find_one({"id": milestone_id}, {"_id": 0})
    if isinstance(updated_milestone['created_at'], str):
        updated_milestone['created_at'] = datetime.fromisoformat(updated_milestone['created_at'])
    if updated_milestone.get('completion_date') and isinstance(updated_milestone['completion_date'], str):
        updated_milestone['completion_date'] = datetime.fromisoformat(updated_milestone['completion_date'])
    
    return updated_milestone

# Expenditure endpoints
@api_router.post("/expenditures", response_model=Expenditure)
async def create_expenditure(input: ExpenditureCreate):
    # Verify project exists
    project = await db.projects.find_one({"id": input.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    expenditure_dict = input.model_dump()
    expenditure_obj = Expenditure(**expenditure_dict)
    
    doc = expenditure_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.expenditures.insert_one(doc)
    
    # Update project spent funds
    await db.projects.update_one(
        {"id": input.project_id},
        {"$inc": {"spent_funds": input.amount}}
    )
    
    # Update milestone if specified
    if input.milestone_id:
        await db.milestones.update_one(
            {"id": input.milestone_id},
            {"$inc": {"spent_amount": input.amount}}
        )
    
    # Record transaction
    tx_record = Transaction(
        tx_hash=input.tx_hash,
        type="expenditure",
        project_id=input.project_id,
        details={
            "amount": input.amount,
            "category": input.category,
            "description": input.description,
            "recipient": input.recipient
        }
    )
    tx_doc = tx_record.model_dump()
    tx_doc['timestamp'] = tx_doc['timestamp'].isoformat()
    await db.transactions.insert_one(tx_doc)
    
    return expenditure_obj

@api_router.get("/expenditures/{project_id}", response_model=List[Expenditure])
async def get_project_expenditures(project_id: str):
    expenditures = await db.expenditures.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    for exp in expenditures:
        if isinstance(exp['timestamp'], str):
            exp['timestamp'] = datetime.fromisoformat(exp['timestamp'])
    return expenditures

# Transaction endpoints
@api_router.get("/transactions", response_model=List[Transaction])
async def get_all_transactions():
    transactions = await db.transactions.find({}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    for tx in transactions:
        if isinstance(tx['timestamp'], str):
            tx['timestamp'] = datetime.fromisoformat(tx['timestamp'])
    return transactions

@api_router.get("/transactions/{project_id}", response_model=List[Transaction])
async def get_project_transactions(project_id: str):
    transactions = await db.transactions.find({"project_id": project_id}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    for tx in transactions:
        if isinstance(tx['timestamp'], str):
            tx['timestamp'] = datetime.fromisoformat(tx['timestamp'])
    return transactions

@api_router.get("/verify/{tx_hash}")
async def verify_transaction(tx_hash: str):
    try:
        tx = w3.eth.get_transaction(tx_hash)
        receipt = w3.eth.get_transaction_receipt(tx_hash)
        
        return {
            "verified": True,
            "tx_hash": tx_hash,
            "block_number": receipt['blockNumber'],
            "from": receipt['from'],
            "to": receipt['to'],
            "status": receipt['status'],
            "gas_used": receipt['gasUsed'],
            "explorer_url": f"https://mumbai.polygonscan.com/tx/{tx_hash}"
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Transaction not found: {str(e)}")

@api_router.get("/stats")
async def get_stats():
    total_projects = await db.projects.count_documents({})
    active_projects = await db.projects.count_documents({"status": "Active"})
    approved_projects = await db.projects.count_documents({"status": "Approved"})
    pending_approvals = await db.projects.count_documents({"status": {"$in": ["PendingApproval", "UnderReview"]}})
    total_milestones = await db.milestones.count_documents({})
    completed_milestones = await db.milestones.count_documents({"status": "Completed"})
    total_expenditures = await db.expenditures.count_documents({})
    
    # Calculate total budget, allocated, and spent
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    total_budget = sum(p.get('budget', 0) for p in projects)
    total_allocated = sum(p.get('allocated_funds', 0) for p in projects)
    total_spent = sum(p.get('spent_funds', 0) for p in projects)
    
    # Category breakdown
    expenditures = await db.expenditures.find({}, {"_id": 0}).to_list(1000)
    category_spending = {}
    for exp in expenditures:
        category = exp.get('category', 'General')
        category_spending[category] = category_spending.get(category, 0) + exp.get('amount', 0)
    
    # Project category breakdown
    project_category_budget = {}
    project_category_spent = {}
    for p in projects:
        category = p.get('category', 'Other')
        project_category_budget[category] = project_category_budget.get(category, 0) + p.get('budget', 0)
        project_category_spent[category] = project_category_spent.get(category, 0) + p.get('spent_funds', 0)
    
    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "approved_projects": approved_projects,
        "pending_approvals": pending_approvals,
        "total_milestones": total_milestones,
        "completed_milestones": completed_milestones,
        "total_expenditures": total_expenditures,
        "total_budget": total_budget,
        "total_allocated": total_allocated,
        "total_spent": total_spent,
        "unallocated_funds": total_budget - total_allocated,
        "allocated_unspent": total_allocated - total_spent,
        "budget_utilization": (total_spent / total_budget * 100) if total_budget > 0 else 0,
        "allocation_rate": (total_allocated / total_budget * 100) if total_budget > 0 else 0,
        "spending_rate": (total_spent / total_allocated * 100) if total_allocated > 0 else 0,
        "expenditure_by_category": category_spending,
        "budget_by_project_category": project_category_budget,
        "spent_by_project_category": project_category_spent
    }

# ==================== HIGHER AUTHORITY & APPROVAL ENDPOINTS ====================

@api_router.post("/auth/authority/login")
async def authority_login(credentials: dict):
    """Authority login"""
    authority = await db.authorities.find_one({"username": credentials['username']}, {"_id": 0})
    
    if not authority or authority['password'] != credentials['password']:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "success": True,
        "authority": {
            "id": authority['id'],
            "name": authority['name'],
            "department": authority['department']
        }
    }

@api_router.post("/auth/authority/register")
async def register_authority(authority_data: dict):
    """Register new authority"""
    from datetime import datetime, timezone
    import uuid
    
    authority = {
        "id": str(uuid.uuid4()),
        "username": authority_data['username'],
        "password": authority_data['password'],
        "name": authority_data['name'],
        "department": authority_data.get('department', 'Municipal Office'),
        "active_reviews": 0,
        "total_reviewed": 0,
        "joined_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.authorities.insert_one(authority)
    return {"success": True, "authority_id": authority['id']}

@api_router.post("/projects/{project_id}/submit-approval")
async def submit_for_approval(project_id: str):
    """Submit project for approval"""
    from datetime import datetime, timezone
    import uuid
    
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get next available reviewer
    authorities = await db.authorities.find({}, {"_id": 0}).sort("active_reviews", 1).to_list(10)
    if not authorities:
        raise HTTPException(status_code=503, detail="No reviewers available. Please register authorities first.")
    
    reviewer_id = authorities[0]['id']
    
    # Generate tx hash
    tx_hash = '0x' + ''.join([hex(int(x))[2:] for x in os.urandom(32)])
    
    # Update project
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {
            "status": "PendingApproval",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "reviewer_id": reviewer_id,
            "is_anonymous": True,
            "tx_hash": tx_hash
        }}
    )
    
    # Create approval request
    approval = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "reviewer_id": reviewer_id,
        "assigned_at": datetime.now(timezone.utc).isoformat(),
        "status": "Pending"
    }
    
    await db.approval_requests.insert_one(approval)
    
    # Update reviewer count
    await db.authorities.update_one(
        {"id": reviewer_id},
        {"$inc": {"active_reviews": 1}}
    )
    
    return {"success": True, "message": "Project submitted for approval", "tx_hash": tx_hash}

@api_router.get("/approvals/pending/{authority_id}")
async def get_pending_approvals(authority_id: str):
    """Get pending approvals for authority"""
    approvals = await db.approval_requests.find(
        {"reviewer_id": authority_id, "status": "Pending"},
        {"_id": 0}
    ).to_list(100)
    
    for approval in approvals:
        project = await db.projects.find_one({"id": approval['project_id']}, {"_id": 0})
        if project:
            approval['project'] = {
                "id": project['id'],
                "name": project['name'],
                "description": project['description'],
                "category": project['category'],
                "budget": project['budget'],
                "status": project['status'],
                "contractor_name": "[REDACTED]",
                "contractor_wallet": "[HIDDEN]",
                "submitted_at": project.get('submitted_at')
            }
    
    return approvals

@api_router.post("/approvals/{approval_id}/decide")
async def decide_approval(approval_id: str, decision: dict):
    """Approve or reject project"""
    from datetime import datetime, timezone
    import uuid
    
    approval = await db.approval_requests.find_one({"id": approval_id})
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    tx_hash = '0x' + ''.join([hex(int(x))[2:] for x in os.urandom(32)])
    
    # Update approval
    await db.approval_requests.update_one(
        {"id": approval_id},
        {"$set": {
            "status": decision['decision'],
            "review_comments": decision.get('comments'),
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "approval_tx_hash": tx_hash
        }}
    )
    
    # Update project
    project_status = "Approved" if decision['decision'] == "Approved" else "Rejected"
    project_update = {
        "status": project_status,
        "is_anonymous": False if decision['decision'] == "Approved" else True
    }
    
    if decision['decision'] == "Approved":
        project = await db.projects.find_one({"id": approval['project_id']})
        project_update["approved_at"] = datetime.now(timezone.utc).isoformat()
        project_update["allocated_funds"] = project['budget']
    else:
        project_update["rejection_reason"] = decision.get('comments')
    
    await db.projects.update_one({"id": approval['project_id']}, {"$set": project_update})
    
    # Update reviewer stats
    await db.authorities.update_one(
        {"id": approval['reviewer_id']},
        {"$inc": {"active_reviews": -1, "total_reviewed": 1}}
    )
    
    # Record transaction
    tx_record = {
        "id": str(uuid.uuid4()),
        "tx_hash": tx_hash,
        "type": "project_approval" if decision['decision'] == "Approved" else "project_rejection",
        "project_id": approval['project_id'],
        "details": {"decision": decision['decision'], "comments": decision.get('comments')},
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "verified": False
    }
    
    await db.transactions.insert_one(tx_record)
    
    return {"success": True, "decision": decision['decision'], "tx_hash": tx_hash}

@api_router.get("/public/projects/approved")
async def get_approved_projects():
    """Get approved projects for citizens"""
    projects = await db.projects.find({"status": "Approved"}, {"_id": 0}).to_list(1000)
    return projects

# ==================== DOCUMENT UPLOAD & MANAGEMENT ENDPOINTS ====================

@api_router.post("/projects/{project_id}/upload-document")
async def upload_document(
    project_id: str,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    uploaded_by: str = Form(...)
):
    """Upload document for a project"""
    try:
        # Verify project exists
        project = await db.projects.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Create uploads directory if not exists
        uploads_dir = Path("/app/backend/uploads")
        uploads_dir.mkdir(exist_ok=True)
        
        # Save file temporarily
        file_path = uploads_dir / f"{uuid.uuid4()}_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Process document based on type
        metadata = {}
        
        # Extract GPS from photos
        if document_type in ['gps_photos', 'site_photos'] and file.content_type and 'image' in file.content_type:
            gps_data = document_processor.extract_gps_from_image(file_content)
            if gps_data:
                metadata['gps_data'] = gps_data
        
        # Get file hash
        file_hash = document_processor.get_file_hash(file_content)
        metadata['file_hash'] = file_hash
        
        # Upload to IPFS (simulated)
        ipfs_result = ipfs_service.upload_file(str(file_path), file.filename)
        ipfs_hash = ipfs_result['IpfsHash']
        ipfs_url = ipfs_service.get_gateway_url(ipfs_hash)
        
        # Store document record
        document = {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "file_name": file.filename,
            "file_size": file_size,
            "file_type": file.content_type or 'application/octet-stream',
            "document_type": document_type,
            "ipfs_hash": ipfs_hash,
            "ipfs_url": ipfs_url,
            "file_hash": file_hash,
            "uploaded_by": uploaded_by,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata,
            "gps_data": metadata.get('gps_data'),
            "verified": True if metadata.get('gps_data') else False
        }
        
        await db.documents.insert_one(document)
        
        # Clean up temp file
        try:
            os.remove(file_path)
        except:
            pass
        
        return {
            "success": True,
            "document_id": document['id'],
            "ipfs_hash": ipfs_hash,
            "ipfs_url": ipfs_url,
            "gps_verified": bool(metadata.get('gps_data'))
        }
        
    except Exception as e:
        logger.error(f"Document upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/projects/{project_id}/documents")
async def get_project_documents(project_id: str):
    """Get all documents for a project"""
    try:
        documents = await db.documents.find(
            {"project_id": project_id},
            {"_id": 0}
        ).to_list(1000)
        
        return documents
        
    except Exception as e:
        logger.error(f"Error fetching documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/projects/{project_id}/documents/{document_id}")
async def delete_document(project_id: str, document_id: str):
    """Delete a document"""
    try:
        result = await db.documents.delete_one({
            "id": document_id,
            "project_id": project_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"success": True, "message": "Document deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()