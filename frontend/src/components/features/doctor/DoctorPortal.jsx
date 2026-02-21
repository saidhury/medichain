import React from 'react'
import PatientLookup from './PatientLookup.jsx'
import UploadRecord from './UploadRecord.jsx'
import ViewRecords from './ViewRecords.jsx'
import AccessRequests from './AccessRequests.jsx'

export default function DoctorPortal() {
  return (
    <div id="doctorView" className="section">
      <PatientLookup />
      <UploadRecord />
      <ViewRecords />
      <AccessRequests />
    </div>
  )
}