import { useState, useCallback } from 'react'
import { MOCK_DOCTORS, MOCK_RECORDS } from '@lib/constants.js'

export function useMockData() {
  const [doctors, setDoctors] = useState(MOCK_DOCTORS)
  const [records, setRecords] = useState(MOCK_RECORDS)

  const addDoctor = useCallback((doctor) => {
    setDoctors(prev => [...prev, { ...doctor, status: 'active', recordsAccessed: 0, lastActive: 'Never' }])
  }, [])

  const removeDoctor = useCallback((address) => {
    setDoctors(prev => prev.filter(d => d.address !== address))
  }, [])

  const addRecord = useCallback((record) => {
    setRecords(prev => [...prev, { ...record, id: Date.now() }])
  }, [])

  const getDoctors = useCallback(() => doctors, [doctors])
  const getRecords = useCallback(() => records, [records])

  return {
    doctors,
    records,
    addDoctor,
    removeDoctor,
    addRecord,
    getDoctors,
    getRecords,
  }
}