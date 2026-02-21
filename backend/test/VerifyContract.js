const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicalRecords Contract Verification", function () {
  let medicalRecords;
  let owner, patient, doctor, unauthorizedUser;

  // Runs before every test to reset the environment
  beforeEach(async function () {
    [owner, patient, doctor, unauthorizedUser] = await ethers.getSigners();
    const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
    medicalRecords = await MedicalRecords.deploy();
    await medicalRecords.waitForDeployment();
  });

  describe("1. Access Control Logic", function () {
    it("Should allow patient to grant access to a doctor", async function () {
      await medicalRecords.connect(patient).grantAccess(doctor.address);
      const hasAccess = await medicalRecords.hasAccess(patient.address, doctor.address);
      expect(hasAccess).to.equal(true);
    });

    it("Should allow patient to revoke access", async function () {
      await medicalRecords.connect(patient).grantAccess(doctor.address);
      await medicalRecords.connect(patient).revokeAccess(doctor.address);
      const hasAccess = await medicalRecords.hasAccess(patient.address, doctor.address);
      expect(hasAccess).to.equal(false);
    });

    it("Should correctly list authorized doctors", async function () {
      await medicalRecords.connect(patient).grantAccess(doctor.address);
      const authorized = await medicalRecords.connect(patient).getAuthorizedDoctors(patient.address);
      expect(authorized[0]).to.equal(doctor.address);
    });
  });

  describe("2. Record Management", function () {
    it("Should allow adding a record", async function () {
      const cid = "QmHash123";
      const fileHash = ethers.keccak256(ethers.toUtf8Bytes("MedicalData"));
      
      await expect(medicalRecords.connect(doctor).addRecord(patient.address, cid, fileHash))
        .to.emit(medicalRecords, "RecordAdded")
        .withArgs(patient.address, doctor.address, cid, fileHash, (await ethers.provider.getBlock('latest')).timestamp + 1);
    });

    it("Should allow patient to view their own records", async function () {
      const cid = "QmHash123";
      const fileHash = ethers.keccak256(ethers.toUtf8Bytes("MedicalData"));
      await medicalRecords.connect(doctor).addRecord(patient.address, cid, fileHash);

      const records = await medicalRecords.connect(patient).getMyRecords();
      expect(records.length).to.equal(1);
      expect(records[0].ipfsCID).to.equal(cid);
    });
  });

  describe("3. Security & Restrictions", function () {
    it("Should FAIL if unauthorized user tries to view records", async function () {
      // Doctor adds record
      await medicalRecords.connect(doctor).addRecord(patient.address, "CID", ethers.ZeroHash);
      
      // Stranger tries to read patient records
      await expect(
        medicalRecords.connect(unauthorizedUser).getRecords(patient.address)
      ).to.be.revertedWith("Not authorized to access these records");
    });

    it("Should FAIL if doctor reads records after access is revoked", async function () {
      // 1. Grant access
      await medicalRecords.connect(patient).grantAccess(doctor.address);
      // 2. Revoke access
      await medicalRecords.connect(patient).revokeAccess(doctor.address);
      
      // 3. Doctor tries to read
      await expect(
        medicalRecords.connect(doctor).getRecords(patient.address)
      ).to.be.revertedWith("Not authorized to access these records");
    });
  });
});