import React, { useState, useCallback } from 'react'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import { apiService } from '@services/api.js'
import Card from '@components/ui/Card.jsx'

export default function PatientLookup() {
  const { addLog } = useWeb3()
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const searchPatients = useCallback(async (term) => {
    setSearchTerm(term)
    
    if (term.length < 3) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      // Search by name, email, phone, or ID
      const patients = await apiService.searchPatients({
        query: term,
        type: 'all'
      })
      setResults(patients)
    } catch (err) {
      console.log('Search failed:', err)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [addLog])

  const selectPatient = (patient) => {
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('patientSelected', { 
      detail: {
        id: patient.id,
        name: patient.name,
        wallet: patient.wallet_address
      }
    }))
    addLog(`Selected patient: ${patient.name}`, 'info')
    setSearchTerm('')
    setResults([])
  }

  return (
    <Card>
      <div className="section-title">Find Patient</div>
      <div className="info-text">
        Search by name, email, phone number, or patient ID.
      </div>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => searchPatients(e.target.value)}
        />
      </div>

      {isSearching && <div className="empty">Searching...</div>}

      <div>
        {!isSearching && results.map((patient, idx) => (
          <div 
            key={idx}
            className="doctor-card" 
            onClick={() => selectPatient(patient)}
            style={{ marginBottom: '8px' }}
          >
            <div className="doctor-avatar">👤</div>
            <div className="doctor-info">
              <div className="doctor-name">{patient.name}</div>
              <div className="doctor-meta">
                {patient.email || patient.phone || 'ID: ' + patient.id.slice(-6)}
              </div>
            </div>
          </div>
        ))}
        
        {!isSearching && searchTerm.length >= 3 && results.length === 0 && (
          <div className="empty">No patients found. Try a different search.</div>
        )}
      </div>
    </Card>
  )
}