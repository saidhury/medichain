const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicalRecords", function () {
  let medicalRecords;
  let owner, patient, doctor, other;

  beforeEach(async function () {
    [owner, patient, doctor, other] = await ethers.getSigners();
    
    const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
    medicalRecords = await MedicalRecords.deploy();
    await medicalRecords.waitForDeployment();
  });

  describe("Record Management", function () {
    it("Should add a record", async function () {
      const cid = "QmTest123";
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test content"));
      
      await expect(
        medicalRecords.connect(doctor).addRecord(patient.address, cid, hash)
      )
        .to.emit(medicalRecords, "RecordAdded")
        .withArgs(patient.address, doctor.address, cid, hash, await time.latest());
    });

    it("Should retrieve patient records", async function () {
      const cid = "QmTest123";
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test content"));
      
      await medicalRecords.connect(doctor).addRecord(patient.address, cid, hash);
      
      const records = await medicalRecords.connect(patient).getMyRecords();
      expect(records).to.have.lengthOf(1);
      expect(records[0].ipfsCID).to.equal(cid);
    });
  });

  describe("Access Control", function () {
    it("Should grant access to doctor", async function () {
      await expect(medicalRecords.connect(patient).grantAccess(doctor.address))
        .to.emit(medicalRecords, "AccessGranted");
      
      expect(await medicalRecords.hasAccess(patient.address, doctor.address)).to.be.true;
    });

    it("Should revoke access", async function () {
      await medicalRecords.connect(patient).grantAccess(doctor.address);
      await medicalRecords.connect(patient).revokeAccess(doctor.address);
      
      expect(await medicalRecords.hasAccess(patient.address, doctor.address)).to.be.false;
    });

    it("Should allow doctor to view records with access", async function () {
      const cid = "QmTest123";
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test content"));
      
      await medicalRecords.connect(patient).grantAccess(doctor.address);
      await medicalRecords.connect(doctor).addRecord(patient.address, cid, hash);
      
      const records = await medicalRecords.connect(doctor).getRecords(patient.address);
      expect(records).to.have.lengthOf(1);
    });

    it("Should prevent unauthorized access", async function () {
      await expect(
        medicalRecords.connect(other).getRecords(patient.address)
      ).to.be.revertedWith("Not authorized to access these records");
    });
  });
});