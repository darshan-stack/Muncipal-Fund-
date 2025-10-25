from fastapi import FastAPI, APIRouter, HTTPException
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
    category: str = "Infrastructure"  # Infrastructure, Education, Healthcare, Environment, etc.
    budget: float
    allocated_funds: float = 0.0
    spent_funds: float = 0.0
    manager_address: str
    status: str = "Active"  # Active, Completed, Paused
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tx_hash: Optional[str] = None
    contract_project_id: Optional[int] = None

class ProjectCreate(BaseModel):
    name: str
    description: str
    category: str
    budget: float
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