// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FundTracker {
    struct Project {
        uint256 id;
        string name;
        uint256 budget;
        uint256 allocatedFunds;
        uint256 spentFunds;
        address manager;
        bool exists;
    }
    
    struct Milestone {
        uint256 id;
        uint256 projectId;
        string name;
        uint256 targetAmount;
        uint256 spentAmount;
        bool completed;
        bool exists;
    }
    
    struct Expenditure {
        uint256 id;
        uint256 projectId;
        uint256 milestoneId;
        uint256 amount;
        string description;
        address recipient;
        uint256 timestamp;
    }
    
    uint256 public projectCount = 0;
    uint256 public milestoneCount = 0;
    uint256 public expenditureCount = 0;
    
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Milestone) public milestones;
    mapping(uint256 => Expenditure) public expenditures;
    mapping(uint256 => uint256[]) public projectMilestones;
    mapping(uint256 => uint256[]) public projectExpenditures;
    
    event ProjectCreated(uint256 indexed projectId, string name, uint256 budget, address manager);
    event FundsAllocated(uint256 indexed projectId, uint256 amount);
    event MilestoneCreated(uint256 indexed milestoneId, uint256 indexed projectId, string name, uint256 targetAmount);
    event ExpenditureRecorded(uint256 indexed expenditureId, uint256 indexed projectId, uint256 amount, address recipient);
    event MilestoneCompleted(uint256 indexed milestoneId, uint256 indexed projectId);
    
    modifier projectExists(uint256 projectId) {
        require(projects[projectId].exists, "Project does not exist");
        _;
    }
    
    modifier onlyProjectManager(uint256 projectId) {
        require(projects[projectId].manager == msg.sender, "Only project manager can perform this action");
        _;
    }
    
    function createProject(string memory _name, uint256 _budget) external returns (uint256) {
        projectCount++;
        
        projects[projectCount] = Project({
            id: projectCount,
            name: _name,
            budget: _budget,
            allocatedFunds: 0,
            spentFunds: 0,
            manager: msg.sender,
            exists: true
        });
        
        emit ProjectCreated(projectCount, _name, _budget, msg.sender);
        return projectCount;
    }
    
    function allocateFunds(uint256 _projectId, uint256 _amount) 
        external 
        projectExists(_projectId) 
        onlyProjectManager(_projectId) 
    {
        Project storage project = projects[_projectId];
        require(project.allocatedFunds + _amount <= project.budget, "Allocation exceeds budget");
        
        project.allocatedFunds += _amount;
        emit FundsAllocated(_projectId, _amount);
    }
    
    function createMilestone(uint256 _projectId, string memory _name, uint256 _targetAmount) 
        external 
        projectExists(_projectId) 
        onlyProjectManager(_projectId)
        returns (uint256)
    {
        milestoneCount++;
        
        milestones[milestoneCount] = Milestone({
            id: milestoneCount,
            projectId: _projectId,
            name: _name,
            targetAmount: _targetAmount,
            spentAmount: 0,
            completed: false,
            exists: true
        });
        
        projectMilestones[_projectId].push(milestoneCount);
        emit MilestoneCreated(milestoneCount, _projectId, _name, _targetAmount);
        return milestoneCount;
    }
    
    function recordExpenditure(
        uint256 _projectId,
        uint256 _milestoneId,
        uint256 _amount,
        string memory _description,
        address _recipient
    ) 
        external 
        projectExists(_projectId) 
        onlyProjectManager(_projectId)
        returns (uint256)
    {
        Project storage project = projects[_projectId];
        require(project.spentFunds + _amount <= project.allocatedFunds, "Expenditure exceeds allocated funds");
        
        expenditureCount++;
        
        expenditures[expenditureCount] = Expenditure({
            id: expenditureCount,
            projectId: _projectId,
            milestoneId: _milestoneId,
            amount: _amount,
            description: _description,
            recipient: _recipient,
            timestamp: block.timestamp
        });
        
        project.spentFunds += _amount;
        
        if (_milestoneId > 0 && milestones[_milestoneId].exists) {
            milestones[_milestoneId].spentAmount += _amount;
        }
        
        projectExpenditures[_projectId].push(expenditureCount);
        emit ExpenditureRecorded(expenditureCount, _projectId, _amount, _recipient);
        return expenditureCount;
    }
    
    function completeMilestone(uint256 _milestoneId) 
        external 
    {
        require(milestones[_milestoneId].exists, "Milestone does not exist");
        Milestone storage milestone = milestones[_milestoneId];
        require(!milestone.completed, "Milestone already completed");
        require(projects[milestone.projectId].manager == msg.sender, "Only project manager can complete milestone");
        
        milestone.completed = true;
        emit MilestoneCompleted(_milestoneId, milestone.projectId);
    }
    
    function getProject(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (Project memory) 
    {
        return projects[_projectId];
    }
    
    function getMilestone(uint256 _milestoneId) 
        external 
        view 
        returns (Milestone memory) 
    {
        require(milestones[_milestoneId].exists, "Milestone does not exist");
        return milestones[_milestoneId];
    }
    
    function getProjectMilestones(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (uint256[] memory) 
    {
        return projectMilestones[_projectId];
    }
    
    function getProjectExpenditures(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (uint256[] memory) 
    {
        return projectExpenditures[_projectId];
    }
}