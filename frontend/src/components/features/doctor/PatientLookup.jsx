import React, { useState, useCallback } from 'react'
import { ethers } from 'ethers'
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

    // If it looks like an address, validate it
    if (term.startsWith('0x')) {
      if (!ethers.isAddress(term)) {
        setResults([])
        return
      }
      
      // Direct address lookup
      setIsSearching(true)
      try {
        const userData = await apiService.getUser(term)
        if (userData.role === 'patient') {
          setResults([{
            name: userData.name || `Patient ${term.slice(0, 6)}...`,
            address: term,
            dob: userData.date_of_birth || 'Unknown',
            location: userData.location || 'Unknown'
          }])
        } else {
          setResults([])
        }
      } catch (err) {
        console.log('Patient not found:', err)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    } else {
      // Name search - in production this would hit a search endpoint
      // For now, show empty or mock results
      setResults([])
    }
  }, [addLog])

  const selectPatient = (patient) => {
    addLog(`Selected patient: ${patient.address.slice(0, 20)}...`, 'info')
    // Dispatch custom event or use context to populate other forms
    window.dispatchEvent(new CustomEvent('patientSelected', { detail: patient }))
    setSearchTerm('')
    setResults([])
  }

  return (
    <Card>
      <div className="section-title">Patient Lookup</div>
      <div className="info-text">
        Search for patients by wallet address (0x...) or name.
      </div>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="Search by wallet address (0x...) or name..."
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
                {patient.address.slice(0, 20)}... • {patient.location}
              </div>
            </div>
          </div>
        ))}
        
        {!isSearching && searchTerm.length >= 3 && results.length === 0 && (
          <div className="empty">No patients found. Try a valid wallet address (0x...).</div>
        )}
      </div>
    </Card>
  )
}