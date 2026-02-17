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

    // Patient => Records array
    mapping(address => Record[]) private records;
    
    // Patient => Doctor => HasAccess
    mapping(address => mapping(address => bool)) private accessPermissions;
    
    // Track all doctors that have been granted access by a patient
    mapping(address => address[]) private authorizedDoctors;

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

    modifier onlyPatientOrAuthorized(address _patient) {
        require(
            msg.sender == _patient || accessPermissions[_patient][msg.sender],
            "Not authorized to access these records"
        );
        _;
    }

    function addRecord(
        address _patient,
        string memory _cid,
        bytes32 _hash
    ) external {
        require(bytes(_cid).length > 0, "CID cannot be empty");
        require(_hash != bytes32(0), "Hash cannot be empty");
        require(_patient != address(0), "Invalid patient address");

        Record memory newRecord = Record({
            ipfsCID: _cid,
            fileHash: _hash,
            patient: _patient,
            uploadedBy: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        records[_patient].push(newRecord);

        emit RecordAdded(
            _patient,
            msg.sender,
            _cid,
            _hash,
            block.timestamp
        );
    }

    function grantAccess(address _doctor) external {
        require(_doctor != address(0), "Invalid doctor address");
        require(_doctor != msg.sender, "Cannot grant access to self");
        require(!accessPermissions[msg.sender][_doctor], "Access already granted");

        accessPermissions[msg.sender][_doctor] = true;
        authorizedDoctors[msg.sender].push(_doctor);

        emit AccessGranted(msg.sender, _doctor, block.timestamp);
    }

    function revokeAccess(address _doctor) external {
        require(accessPermissions[msg.sender][_doctor], "Access not granted");

        accessPermissions[msg.sender][_doctor] = false;

        // Remove from authorized doctors array
        address[] storage doctors = authorizedDoctors[msg.sender];
        for (uint i = 0; i < doctors.length; i++) {
            if (doctors[i] == _doctor) {
                doctors[i] = doctors[doctors.length - 1];
                doctors.pop();
                break;
            }
        }

        emit AccessRevoked(msg.sender, _doctor, block.timestamp);
    }

    function hasAccess(address _patient, address _doctor) external view returns (bool) {
        return accessPermissions[_patient][_doctor];
    }

    function getRecords(address _patient) 
        external 
        view 
        onlyPatientOrAuthorized(_patient) 
        returns (Record[] memory) 
    {
        return records[_patient];
    }

    function getMyRecords() external view returns (Record[] memory) {
        return records[msg.sender];
    }

    function getAuthorizedDoctors(address _patient) 
        external 
        view 
        returns (address[] memory) 
    {
        require(
            msg.sender == _patient || accessPermissions[_patient][msg.sender],
            "Not authorized"
        );
        return authorizedDoctors[_patient];
    }

    function getRecordCount(address _patient) 
        external 
        view 
        onlyPatientOrAuthorized(_patient) 
        returns (uint256) 
    {
        return records[_patient].length;
    }
}