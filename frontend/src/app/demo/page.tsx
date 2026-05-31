'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Demo route: clears any live profile so dashboard falls back to cached demo data
export default function DemoPage() {
  const router = useRouter()
  useEffect(() => {
    sessionStorage.removeItem('cl-profile')
    sessionStorage.setItem('cl-input', 'I own a food truck in Dallas with 3 employees. I want to open a brick-and-mortar restaurant in Austin with a beer garden.')
    router.replace('/dashboard')
  }, [router])
  return null
}
