import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@contexts/Web3Context.jsx";
import { useMedicalRecords } from "@hooks/useMedicalRecords.js";
import { apiService } from "@services/api.js";
import Card from "@components/ui/Card.jsx";
import Button from "@components/ui/Button.jsx";
import DoctorModal from "./DoctorModal.jsx";

export default function DoctorsList() {
  const { account, addLog } = useWeb3();
  const { getAuthorizedDoctors, revokeAccess, loading } = useMedicalRecords();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // In DoctorsList.jsx, replace the enrichment section with this:

  const loadDoctors = useCallback(async () => {
    if (!account) {
      console.warn("[DoctorsList] No account available");
      return;
    }

    setIsLoading(true);
    addLog("Loading authorized doctors...", "info");
    console.info("[DoctorsList] Fetching doctors for:", account);

    try {
      // Get addresses from blockchain
      const addresses = await getAuthorizedDoctors(account);
      console.info("[DoctorsList] Found addresses:", addresses);

      if (addresses.length === 0) {
        setDoctors([]);
        setIsLoading(false);
        return;
      }

      // Use a cache to prevent duplicate API calls for same address
      const userCache = new Map();

      const getUserWithCache = async (addr) => {
        const lowerAddr = addr.toLowerCase();
        if (userCache.has(lowerAddr)) {
          return userCache.get(lowerAddr);
        }

        try {
          const userData = await apiService.getUser(lowerAddr);
          userCache.set(lowerAddr, userData);
          return userData;
        } catch (err) {
          console.warn(
            "[DoctorsList] Failed to fetch user:",
            addr,
            err.message,
          );
          userCache.set(lowerAddr, null); // Cache the failure too
          return null;
        }
      };

      // Enrich with backend data (with deduplication)
      const enrichedDoctors = await Promise.all(
        addresses.map(async (addr, idx) => {
          try {
            // Try to get from cache or fetch
            const userData = await getUserWithCache(addr);

            if (userData) {
              return {
                address: addr,
                name: userData.name || `Doctor ${idx + 1}`,
                hospital: userData.hospital || "Unknown Hospital",
                specialty: userData.specialty || "General Medicine",
                status: "active",
                grantedDate: new Date().toISOString().split("T")[0],
                expiry: "Permanent",
                recordsAccessed: 0,
                lastActive: "Never",
                inBackend: true,
              };
            } else {
              // Backend fetch failed, show blockchain data only
              return {
                address: addr,
                name: `Doctor ${addr.slice(0, 6)}...${addr.slice(-4)}`,
                hospital: "Unknown Hospital (click to sync)",
                specialty: "General Medicine",
                status: "active",
                grantedDate: new Date().toISOString().split("T")[0],
                expiry: "Permanent",
                recordsAccessed: 0,
                lastActive: "Never",
                inBackend: false, // Flag for UI
              };
            }
          } catch (err) {
            console.warn(
              "[DoctorsList] Failed to enrich doctor:",
              addr,
              err.message,
            );
            return {
              address: addr,
              name: `Doctor ${addr.slice(0, 6)}...${addr.slice(-4)}`,
              hospital: "Unknown Hospital",
              specialty: "General Medicine",
              status: "active",
              grantedDate: new Date().toISOString().split("T")[0],
              expiry: "Permanent",
              recordsAccessed: 0,
              lastActive: "Never",
              inBackend: false,
            };
          }
        }),
      );

      console.info("[DoctorsList] Enriched doctors:", enrichedDoctors);
      setDoctors(enrichedDoctors);
      addLog(`Loaded ${enrichedDoctors.length} authorized doctors`, "info");
    } catch (err) {
      console.error("[DoctorsList] Failed to load doctors:", err);
      addLog("Failed to load doctors", "error");
    } finally {
      setIsLoading(false);
    }
  }, [account, getAuthorizedDoctors, addLog]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleRevoke = async (address) => {
    const success = await revokeAccess(address);
    if (success) {
      loadDoctors();
    }
  };

  return (
    <Card>
      <div
        className="section-title"
        style={{ justifyContent: "space-between" }}
      >
        <span>My Care Team</span>
        <Button
          onClick={loadDoctors}
          loading={isLoading || loading}
          style={{ padding: "8px 16px", fontSize: "0.875rem" }}
        >
          Refresh
        </Button>
      </div>
      <div className="info-text">
        Doctors who currently have access to your medical history across all
        hospitals and clinics.
      </div>

      {isLoading ? (
        <div className="empty">Loading doctors...</div>
      ) : doctors.length === 0 ? (
        <div className="empty">
          No authorized doctors found. Grant access to add doctors to your care
          team.
        </div>
      ) : (
        doctors.map((doc, idx) => (
          <div
            key={idx}
            className="doctor-card"
            onClick={() => setSelectedDoctor(doc)}
          >
            <div className="doctor-avatar">👨‍⚕️</div>
            <div className="doctor-info">
              <div className="doctor-name">{doc.name}</div>
              <div className="doctor-meta">
                {doc.hospital} •{" "}
                {doc.status === "active" ? "Access Active" : "Access Revoked"}
              </div>
            </div>
            <div
              className={`status-indicator ${doc.status !== "active" ? "inactive" : ""}`}
            ></div>
          </div>
        ))
      )}

      {selectedDoctor && (
        <DoctorModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onRevoke={handleRevoke}
        />
      )}
    </Card>
  );
}
