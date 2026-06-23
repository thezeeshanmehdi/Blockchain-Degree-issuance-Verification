// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DegreeContract
 * @dev Manages academic credential attestation using a Private Blockchain role model.
 */
contract DegreeContract {
    address public admin;

    struct DegreeInfo {
        string degreeSerialNumber;
        string graduateName;
        string programName;
        uint256 graduationDate; // Unix Timestamp
        uint256 cgpa;           // Scaled by 100 (e.g., 385 represents 3.85)
        address university;
        bool isIssued;
    }

    // Maps a degree's cryptographic SHA-256 hash to its verification record
    mapping(bytes32 => DegreeInfo) public degrees;
    
    // Tracks unique physical serial numbers to prevent duplicate physical issuances
    mapping(string => bool) private usedSerialNumbers;

    // Role mappings
    mapping(address => bool) public authorizedUniversities;
    mapping(address => bool) public registeredStudents;
    mapping(address => bool) public registeredEmployers;

    // Event logs for auditing
    event UniversityAuthorized(address indexed university);
    event UniversityDeauthorized(address indexed university);
    event StudentRegistered(address indexed student);
    event EmployerRegistered(address indexed employer);
    event DegreeIssued(bytes32 indexed degreeHash, string serialNumber, address indexed university);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Access Denied: Only contract admin can perform this operation");
        _;
    }

    modifier onlyUniversity() {
        require(authorizedUniversities[msg.sender], "Access Denied: Only authorized universities can perform this operation");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function authorizeUniversity(address _university) public onlyAdmin {
        authorizedUniversities[_university] = true;
        emit UniversityAuthorized(_university);
    }

    function deauthorizeUniversity(address _university) public onlyAdmin {
        authorizedUniversities[_university] = false;
        emit UniversityDeauthorized(_university);
    }

    function registerStudent(address _student) public onlyAdmin {
        registeredStudents[_student] = true;
        emit StudentRegistered(_student);
    }

    function registerEmployer(address _employer) public onlyAdmin {
        registeredEmployers[_employer] = true;
        emit EmployerRegistered(_employer);
    }

    /**
     * @dev Issues a new digital degree certificate onto the blockchain.
     */
    function issueDegree(
        bytes32 _degreeHash,
        string memory _serialNumber,
        string memory _graduateName,
        string memory _programName,
        uint256 _graduationDate,
        uint256 _cgpa
    ) public onlyUniversity {
        require(!degrees[_degreeHash].isIssued, "Attestation Blocked: Degree with this hash already registered");
        require(!usedSerialNumbers[_serialNumber], "Attestation Blocked: Physical serial number already issued");

        degrees[_degreeHash] = DegreeInfo({
            degreeSerialNumber: _serialNumber,
            graduateName: _graduateName,
            programName: _programName,
            graduationDate: _graduationDate,
            cgpa: _cgpa,
            university: msg.sender,
            isIssued: true
        });

        usedSerialNumbers[_serialNumber] = true;

        emit DegreeIssued(_degreeHash, _serialNumber, msg.sender);
    }

    /**
     * @dev Public verification helper checking the validity of a degree hash.
     */
    function verifyDegree(bytes32 _degreeHash) public view returns (
        bool isIssued,
        string memory serialNumber,
        string memory graduateName,
        string memory programName,
        uint256 graduationDate,
        uint256 cgpa,
        address university
    ) {
        DegreeInfo memory deg = degrees[_degreeHash];
        require(deg.isIssued, "Verification Failed: Degree hash not found on the registry");
        return (
            deg.isIssued,
            deg.degreeSerialNumber,
            deg.graduateName,
            deg.programName,
            deg.graduationDate,
            deg.cgpa,
            deg.university
        );
    }
}
