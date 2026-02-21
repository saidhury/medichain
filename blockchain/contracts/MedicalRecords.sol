// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MedicalRecords {
    
    struct Record {
        string ipfsCID;
        bytes32 fileHash;
        address patient;
        address uploadedBy;
        uint256 timestamp;
        bool exists;
    }
    
    // patient => list of records
    mapping(address => Record[]) private patientRecords;
    
    // patient => doctor => hasAccess
    mapping(address => mapping(address => bool)) private accessRights;
    
    // patient => list of authorized doctors (for easy lookup)
    mapping(address => address[]) private authorizedDoctors;
    
    // patient => doctor => index in authorizedDoctors array (for efficient removal)
    mapping(address => mapping(address => uint256)) private doctorIndex;
    
    // Events
    event RecordAdded(
        address indexed patient,
        address indexed uploadedBy,
        string ipfsCID,
        bytes32 fileHash,
        uint256 timestamp
    );
    
    event AccessGranted(
        address indexed patient,
        address indexed doctor,
        uint256 timestamp
    );
    
    event AccessRevoked(
        address indexed patient,
        address indexed doctor,
        uint256 timestamp
    );
    
    // Modifier: Only patient themselves
    modifier onlyPatient(address _patient) {
        require(msg.sender == _patient, "Not the patient");
        _;
    }
    
    // Modifier: Requires access to patient records (RENAME to avoid conflict)
    modifier requiresAccess(address _patient) {
        require(
            msg.sender == _patient || accessRights[_patient][msg.sender],
            "No access"
        );
        _;
    }
    
    // ==================== PATIENT FUNCTIONS ====================
    
    // Grant access to a doctor
    function grantAccess(address _doctor) external {
        require(_doctor != msg.sender, "Cannot grant to self");
        require(_doctor != address(0), "Invalid address");
        require(!accessRights[msg.sender][_doctor], "Access already granted");
        
        accessRights[msg.sender][_doctor] = true;
        
        // Add to list and track index
        authorizedDoctors[msg.sender].push(_doctor);
        doctorIndex[msg.sender][_doctor] = authorizedDoctors[msg.sender].length - 1;
        
        emit AccessGranted(msg.sender, _doctor, block.timestamp);
    }
    
    // Revoke access from a doctor
    function revokeAccess(address _doctor) external {
        require(accessRights[msg.sender][_doctor], "Access not granted");
        
        accessRights[msg.sender][_doctor] = false;
        
        // Remove from array efficiently (swap with last and pop)
        uint256 index = doctorIndex[msg.sender][_doctor];
        uint256 lastIndex = authorizedDoctors[msg.sender].length - 1;
        
        if (index != lastIndex) {
            address lastDoctor = authorizedDoctors[msg.sender][lastIndex];
            authorizedDoctors[msg.sender][index] = lastDoctor;
            doctorIndex[msg.sender][lastDoctor] = index;
        }
        
        authorizedDoctors[msg.sender].pop();
        delete doctorIndex[msg.sender][_doctor];
        
        emit AccessRevoked(msg.sender, _doctor, block.timestamp);
    }
    
    // Check if doctor has access to patient
    function hasAccess(address _patient, address _doctor) external view returns (bool) {
        return accessRights[_patient][_doctor];
    }
    
    // Get list of authorized doctors for a patient
    function getAuthorizedDoctors(address _patient) external view returns (address[] memory) {
        return authorizedDoctors[_patient];
    }
    
    // Get my own records
    function getMyRecords() external view returns (Record[] memory) {
        return patientRecords[msg.sender];
    }
    
    // ==================== DOCTOR FUNCTIONS ====================
    
    // Add record for a patient (requires access)
    function addRecord(
        address _patient,
        string memory _cid,
        bytes32 _hash
    ) external requiresAccess(_patient) {
        require(bytes(_cid).length > 0, "Empty CID");
        require(_hash != bytes32(0), "Invalid hash");
        
        Record memory newRecord = Record({
            ipfsCID: _cid,
            fileHash: _hash,
            patient: _patient,
            uploadedBy: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        patientRecords[_patient].push(newRecord);
        
        emit RecordAdded(_patient, msg.sender, _cid, _hash, block.timestamp);
    }
    
    // Get records for a specific patient (requires access)
    function getRecords(address _patient) external view requiresAccess(_patient) returns (Record[] memory) {
        return patientRecords[_patient];
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    // Get record count for patient
    function getRecordCount(address _patient) external view returns (uint256) {
        return patientRecords[_patient].length;
    }
    
    // Check if patient has any records
    function hasRecords(address _patient) external view returns (bool) {
        return patientRecords[_patient].length > 0;
    }
}