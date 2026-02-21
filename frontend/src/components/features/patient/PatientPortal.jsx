import React, { useState } from 'react'
import GrantAccess from './GrantAccess.jsx'
import DoctorsList from './DoctorsList.jsx'
import RecordsList from './RecordsList.jsx'
import ShareRecords from './ShareRecords.jsx'

export default function PatientPortal() {
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshData = () => setRefreshKey(prev => prev + 1)

  return (
    <div id="patientView" className="section">
      <GrantAccess onGrant={refreshData} />
      <DoctorsList key={`doctors-${refreshKey}`} />
      <RecordsList key={`records-${refreshKey}`} />
      <ShareRecords doctors={[]} records={[]} />
    </div>
  )
}