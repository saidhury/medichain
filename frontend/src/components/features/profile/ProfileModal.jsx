import React, { useState } from "react";
import { useWeb3 } from "@contexts/Web3Context.jsx";
import { apiService } from "@services/api.js";
import Modal from "@components/ui/Modal.jsx";
import Button from "@components/ui/Button.jsx";

export default function ProfileModal({ isOpen, onClose }) {
  const { userProfile, setUserProfile, account, addLog } = useWeb3();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile.name || "",
    email: userProfile.email || "",
    phone: userProfile.phone || "",
    hospital: userProfile.hospital || "",
    specialty: userProfile.specialty || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!account) {
      addLog("Wallet not connected", "error");
      return;
    }

    setSaving(true);
    try {
      console.log("[Profile] Saving profile:", formData);

      // Include role in the save data for auto-creation
      const saveData = {
        ...formData,
        role: userProfile.role || "patient", // Ensure role is sent for auto-creation
      };

      const result = await apiService.updateProfile(account, saveData);
      console.log("[Profile] Save result:", result);

      // Update local state with returned data
      setUserProfile({
        ...userProfile,
        ...result.user, // Use server-returned data
      });

      const msg = result.was_created
        ? "Profile created from blockchain"
        : "Profile saved";
      addLog(msg, "info");
      setEditing(false);
    } catch (err) {
      console.error("[Profile] Save failed:", err);
      addLog("Failed to save profile: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getRoleIcon = () => {
    if (userProfile.role === "doctor") return "👨‍⚕️";
    if (userProfile.role === "patient") return "🙋";
    return "👤";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Profile">
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "var(--primary-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem",
            margin: "0 auto 16px",
          }}
        >
          {getRoleIcon()}
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: "1.25rem" }}>
          {userProfile.name || "Anonymous User"}
        </h3>
        <span
          className="tag"
          style={{ textTransform: "capitalize", fontSize: "0.875rem" }}
        >
          {userProfile.role}
        </span>
      </div>

      {editing ? (
        <div className="flex-col" style={{ gap: "12px" }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "0.875rem",
                color: "var(--text-muted)",
              }}
            >
              Full Name *
            </label>
            <input
              placeholder="Dr. John Smith"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              autoFocus
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "0.875rem",
                color: "var(--text-muted)",
              }}
            >
              Email
            </label>
            <input
              placeholder="doctor@hospital.com"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "0.875rem",
                color: "var(--text-muted)",
              }}
            >
              Phone Number
            </label>
            <input
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          {userProfile.role === "doctor" && (
            <>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Hospital / Clinic
                </label>
                <input
                  placeholder="Apollo Hospitals"
                  value={formData.hospital}
                  onChange={(e) =>
                    setFormData({ ...formData, hospital: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Specialty
                </label>
                <input
                  placeholder="Cardiology"
                  value={formData.specialty}
                  onChange={(e) =>
                    setFormData({ ...formData, specialty: e.target.value })
                  }
                />
              </div>
            </>
          )}

          <div className="quick-actions" style={{ marginTop: "8px" }}>
            <Button onClick={() => setEditing(false)} ghost>
              Cancel
            </Button>
            <Button onClick={handleSave} primary loading={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="detail-row">
            <span className="detail-label">Full Name</span>
            <span className="detail-value">
              {userProfile.name || "Not set"}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Email</span>
            <span className="detail-value">
              {userProfile.email || "Not set"}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Phone</span>
            <span className="detail-value">
              {userProfile.phone || "Not set"}
            </span>
          </div>

          {userProfile.role === "doctor" && (
            <>
              <div className="detail-row">
                <span className="detail-label">Hospital/Clinic</span>
                <span className="detail-value">
                  {userProfile.hospital || "Not set"}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Specialty</span>
                <span className="detail-value">
                  {userProfile.specialty || "Not set"}
                </span>
              </div>
            </>
          )}

          {/* Hidden blockchain info */}
          <details style={{ marginTop: "16px", fontSize: "0.875rem" }}>
            <summary
              style={{
                color: "var(--text-muted)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              🔒 Blockchain Details (Advanced)
            </summary>
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                background: "var(--bg-input)",
                borderRadius: "8px",
                fontSize: "0.8125rem",
              }}
            >
              <div className="detail-row" style={{ padding: "8px 0" }}>
                <span className="detail-label">Wallet Address</span>
                <span
                  className="detail-value"
                  style={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                >
                  {formatAddress(userProfile.walletAddress)}
                </span>
              </div>
              <div className="detail-row" style={{ padding: "8px 0" }}>
                <span className="detail-label">Network</span>
                <span className="detail-value">Sepolia Testnet</span>
              </div>
              <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(userProfile.walletAddress);
                    addLog("Address copied", "info");
                  }}
                  secondary
                  style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                >
                  Copy
                </Button>
                <Button
                  onClick={() =>
                    window.open(
                      `https://sepolia.etherscan.io/address/${userProfile.walletAddress}`,
                      "_blank",
                    )
                  }
                  ghost
                  style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                >
                  Etherscan
                </Button>
              </div>
            </div>
          </details>

          <div className="quick-actions" style={{ marginTop: "16px" }}>
            <Button onClick={() => setEditing(true)} primary fullWidth>
              Edit Profile
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
