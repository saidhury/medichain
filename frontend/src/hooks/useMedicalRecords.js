import { useState, useCallback } from "react";
import { useWeb3 } from "@contexts/Web3Context.jsx";
import { apiService } from "@services/api.js";
import { encryptionService } from "@services/encryption.js";
import { ipfsService } from "@services/ipfs.js";

const logger = {
  debug: (...args) => console.debug("[useMedicalRecords]", ...args),
  info: (...args) => console.info("[useMedicalRecords]", ...args),
  warn: (...args) => console.warn("[useMedicalRecords]", ...args),
  error: (...args) => console.error("[useMedicalRecords]", ...args),
};

export function useMedicalRecords() {
  const { contract, account, addLog } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to handle errors consistently
  const handleError = (context, err) => {
    const message = err?.message || err?.toString() || "Unknown error";
    logger.error(`${context}:`, message);
    setError(message);
    addLog(`${context}: ${message}`, "error");
    return null;
  };

  const grantAccess = useCallback(
    async (doctorAddress) => {
      if (!contract || !account) {
        logger.warn("Cannot grant access: contract or account not available");
        return false;
      }

      setLoading(true);
      setError(null);
      logger.info("Granting access to:", doctorAddress);

      try {
        // Check if already has access
        const hasAccess = await contract.hasAccess(account, doctorAddress);
        if (hasAccess) {
          logger.warn("Doctor already has access");
          addLog("Doctor already has access", "warn");
          return false;
        }

        const tx = await contract.grantAccess(doctorAddress);
        logger.info("Transaction sent:", tx.hash);
        addLog(`Transaction sent: ${tx.hash.slice(0, 20)}...`, "info");

        const receipt = await tx.wait();
        logger.info("Transaction confirmed, block:", receipt.blockNumber);
        addLog(`Access granted to ${doctorAddress.slice(0, 10)}...`, "info");

        return true;
      } catch (err) {
        return handleError("Grant access failed", err);
      } finally {
        setLoading(false);
      }
    },
    [contract, account, addLog],
  );

  const revokeAccess = useCallback(
    async (doctorAddress) => {
      if (!contract || !account) {
        logger.warn("Cannot revoke access: contract or account not available");
        return false;
      }

      setLoading(true);
      setError(null);
      logger.info("Revoking access from:", doctorAddress);

      try {
        const tx = await contract.revokeAccess(doctorAddress);
        logger.info("Revoke transaction sent:", tx.hash);

        const receipt = await tx.wait();
        logger.info("Revoke confirmed, block:", receipt.blockNumber);
        addLog(`Access revoked from ${doctorAddress.slice(0, 10)}...`, "info");

        return true;
      } catch (err) {
        return handleError("Revoke access failed", err);
      } finally {
        setLoading(false);
      }
    },
    [contract, account, addLog],
  );

  const checkAccess = useCallback(
    async (patientAddress, doctorAddress) => {
      if (!contract) {
        logger.warn("Cannot check access: contract not available");
        return false;
      }

      logger.debug("Checking access:", patientAddress, "->", doctorAddress);
      try {
        const result = await contract.hasAccess(patientAddress, doctorAddress);
        logger.info("Access check result:", result);
        return result;
      } catch (err) {
        handleError("Check access failed", err);
        return false;
      }
    },
    [contract, addLog],
  );

  const getAuthorizedDoctors = useCallback(
    async (patientAddress) => {
      if (!contract) {
        logger.warn("Cannot get doctors: contract not available");
        return [];
      }

      logger.debug("Fetching authorized doctors for:", patientAddress);
      try {
        const doctors = await contract.getAuthorizedDoctors(patientAddress);
        logger.info("Found", doctors.length, "authorized doctors");
        return doctors;
      } catch (err) {
        handleError("Get doctors failed", err);
        return [];
      }
    },
    [contract, addLog],
  );

  const getMyRecords = useCallback(async () => {
    if (!contract || !account) {
      logger.warn("Cannot get records: contract or account not available");
      return [];
    }

    setLoading(true);
    setError(null);
    logger.info("Fetching my records from blockchain");

    try {
      const records = await contract.getMyRecords();
      logger.info("Found", records.length, "records on blockchain");

      // Enrich with backend data
      // In useMedicalRecords.js, replace the getMyRecords enrichment section:

      // Enrich with backend data (best effort - some may not be in backend)
      // In useMedicalRecords.js, replace the enrichment section:

      const enrichedRecords = await Promise.all(
        records.map(async (record, idx) => {
          try {
            // Only try to enrich if we have a CID
            if (!record.ipfsCID) {
              console.warn("Record missing CID:", record);
              return {
                ...record,
                id: `bc-${idx}`,
                displayId: idx + 1,
                filename: "Unknown",
                inBackend: false,
                type: "unknown",
              };
            }

            try {
              const backendData = await apiService.getRecordByCid(
                record.ipfsCID,
              );
              console.info("Enriched from backend:", record.ipfsCID);
              return {
                ...record,
                id: backendData?.record_id || `bc-${idx}`,
                displayId: idx + 1,
                filename: backendData?.filename || "Unknown",
                fileSize: backendData?.file_size || 0,
                uploadedByName:
                  backendData?.doctor_address || record.uploadedBy,
                txHash: backendData?.tx_hash || null,
                record_type: backendData?.record_type || "unknown",
                description: backendData?.description || "",
                hospital: backendData?.hospital || "Unknown Hospital",
                inBackend: true,
              };
            } catch (backendErr) {
              // Backend 404 is OK - record may only exist on blockchain
              if (
                backendErr.message?.includes("404") ||
                backendErr.message?.includes("not found")
              ) {
                console.info(
                  "Record not in backend (blockchain only):",
                  record.ipfsCID,
                );
              } else {
                console.warn("Backend enrichment failed:", backendErr.message);
              }

              // Return blockchain data with placeholder values
              // Try to extract type from CID or use default
              return {
                ...record,
                id: `bc-${idx}`,
                displayId: idx + 1,
                filename: `Record-${record.ipfsCID.slice(-8)}`,
                fileSize: 0,
                uploadedByName: record.uploadedBy || "Unknown Doctor",
                txHash: null,
                record_type: "unknown",
                description:
                  'Record exists on blockchain but metadata not in database. Click "Sync to DB" to restore.',
                hospital: "Unknown Hospital",
                inBackend: false,
                cid: record.ipfsCID,
                hash: record.fileHash,
                timestamp: record.timestamp,
              };
            }
          } catch (err) {
            logger.warn("Failed to process record:", idx, err.message);
            return {
              ...record,
              id: `bc-${idx}`,
              displayId: idx + 1,
              filename: "Unknown",
              inBackend: false,
              type: "unknown",
            };
          }
        }),
      );

      addLog(`Loaded ${enrichedRecords.length} records`, "info");
      return enrichedRecords;
    } catch (err) {
      return handleError("Get records failed", err) || [];
    } finally {
      setLoading(false);
    }
  }, [contract, account, addLog]);

  const getPatientRecords = useCallback(
    async (patientAddress) => {
      if (!contract) {
        logger.warn("Cannot get patient records: contract not available");
        return [];
      }

      setLoading(true);
      setError(null);
      logger.info("Fetching records for patient:", patientAddress);

      try {
        // First check access
        const hasAccess = await contract.hasAccess(patientAddress, account);
        if (!hasAccess) {
          logger.warn("No access to patient records");
          addLog("No access to patient records", "warn");
          return [];
        }

        const records = await contract.getRecords(patientAddress);
        logger.info("Found", records.length, "patient records");

        // Enrich with backend data
        const enrichedRecords = await Promise.all(
          records.map(async (record, idx) => {
            try {
              const backendData = await apiService.getRecordByCid(
                record.ipfsCID,
              );
              return {
                ...record,
                id: backendData?.record_id || idx,
                filename: backendData?.filename || "Unknown",
                fileSize: backendData?.file_size || 0,
                uploadedByName:
                  backendData?.doctor_address || record.uploadedBy,
              };
            } catch (err) {
              logger.warn("Failed to enrich patient record:", err.message);
              return { ...record, id: idx, filename: "Unknown" };
            }
          }),
        );

        return enrichedRecords;
      } catch (err) {
        return handleError("Get patient records failed", err) || [];
      } finally {
        setLoading(false);
      }
    },
    [contract, account, addLog],
  );

  const uploadRecord = useCallback(
    async (patientAddress, file, recordType, description) => {
      if (!contract || !account) {
        logger.warn("Cannot upload: contract or account not available");
        return false;
      }

      setLoading(true);
      setError(null);
      logger.info("Starting full upload pipeline for:", file.name);

      try {
        // Step 1: Check access
        logger.debug("Step 1: Checking doctor access...");
        const hasAccess = await contract.hasAccess(patientAddress, account);
        if (!hasAccess) {
          throw new Error(
            "Doctor does not have access to upload for this patient",
          );
        }

        // Step 2: Encrypt file
        logger.info("Step 2: Encrypting file...");
        addLog("Encrypting file...", "info");
        const encryptionResult = await encryptionService.encryptFile(file);
        logger.info("Encryption complete, hash:", encryptionResult.hash);

        // Step 3: Convert base64 to blob for IPFS
        logger.info("Step 3: Preparing encrypted data for IPFS...");
        const encryptedBytes = Uint8Array.from(
          atob(encryptionResult.encrypted_content),
          (c) => c.charCodeAt(0),
        );
        const encryptedBlob = new Blob([encryptedBytes]);
        const encryptedFile = new File(
          [encryptedBlob],
          `${file.name}.encrypted`,
        );

        // Step 4: Upload to IPFS
        logger.info("Step 4: Uploading to IPFS...");
        addLog("Uploading to IPFS...", "info");
        const cid = await ipfsService.uploadFile(
          encryptedFile,
          `${file.name}.encrypted`,
        );
        logger.info("IPFS upload complete, CID:", cid);

        // Step 5: Add to blockchain
        logger.info("Step 5: Adding to blockchain...");
        addLog("Recording on blockchain...", "info");
        const hashBytes = `0x${encryptionResult.hash}`; // Ensure 0x prefix
        const tx = await contract.addRecord(patientAddress, cid, hashBytes);
        logger.info("Blockchain transaction sent:", tx.hash);

        const receipt = await tx.wait();
        logger.info("Blockchain confirmed, block:", receipt.blockNumber);

        // Step 6: Save to backend
        logger.info("Step 6: Saving metadata to backend...");
        const formData = new FormData();
        formData.append("patient_address", patientAddress);
        formData.append("encrypted_file", encryptedFile);
        formData.append("iv", encryptionResult.iv);
        formData.append("file_hash", hashBytes);
        formData.append("filename", file.name);
        formData.append("file_size", file.size);
        formData.append("record_type", recordType);
        formData.append("description", description);
        formData.append("tx_hash", tx.hash);

        // Add authorization header with wallet address
        const backendResult = await apiService.uploadRecord(formData);
        logger.info(
          "Backend save complete, record ID:",
          backendResult?.record_id,
        );

        addLog(
          `Record uploaded successfully! CID: ${cid.slice(0, 20)}...`,
          "info",
        );
        return {
          success: true,
          cid,
          txHash: tx.hash,
          recordId: backendResult?.record_id,
          hash: encryptionResult.hash,
        };
      } catch (err) {
        return handleError("Upload failed", err);
      } finally {
        setLoading(false);
      }
    },
    [contract, account, addLog],
  );

  const downloadAndDecrypt = useCallback(
    async (cid, iv, key, expectedHash, filename) => {
      logger.info("Downloading and decrypting:", cid);
      setLoading(true);
      setError(null);

      try {
        // Step 1: Download from IPFS
        logger.info("Step 1: Downloading from IPFS...");
        addLog("Downloading from IPFS...", "info");
        const url = ipfsService.getGatewayUrl(cid);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to download from IPFS: ${response.status}`);
        }

        const encryptedBlob = await response.blob();
        logger.info("Downloaded", encryptedBlob.size, "bytes");

        // Step 2: Convert to base64 for decryption service
        logger.info("Step 2: Converting for decryption...");
        const arrayBuffer = await encryptedBlob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const base64 = btoa(String.fromCharCode(...bytes));

        // Step 3: Decrypt
        logger.info("Step 3: Decrypting...");
        addLog("Decrypting file...", "info");
        const decryptedResult = await encryptionService.decryptFile(
          base64,
          iv,
          key,
        );
        logger.info("Decryption complete, size:", decryptedResult.size);

        // Step 4: Verify hash
        logger.info("Step 4: Verifying integrity...");
        const decryptedBytes = Uint8Array.from(
          atob(decryptedResult.content_base64),
          (c) => c.charCodeAt(0),
        );
        const decryptedBlob = new Blob([decryptedBytes]);
        const decryptedFile = new File([decryptedBlob], filename);

        const verification = await encryptionService.verifyFile(
          decryptedFile,
          expectedHash,
        );
        if (!verification.verified) {
          logger.error("File verification failed!");
          addLog("WARNING: File integrity check failed!", "error");
          throw new Error(
            "File integrity verification failed - possible tampering",
          );
        }

        logger.info("Verification passed");
        addLog("File verified successfully", "info");

        // Step 5: Trigger download
        logger.info("Step 5: Triggering download...");
        const downloadUrl = URL.createObjectURL(decryptedBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        return true;
      } catch (err) {
        return handleError("Download/decrypt failed", err);
      } finally {
        setLoading(false);
      }
    },
    [addLog],
  );

  return {
    loading,
    error,
    grantAccess,
    revokeAccess,
    checkAccess,
    getAuthorizedDoctors,
    getMyRecords,
    getPatientRecords,
    uploadRecord,
    downloadAndDecrypt,
  };
}
