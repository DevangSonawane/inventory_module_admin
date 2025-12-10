import { useState, useEffect } from 'react'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const parsed = JSON.parse(userData)
          setUser(parsed)
          // Check admin status from multiple possible fields
          // Also check for specific admin email: itechseed1@gmail.com
          const adminStatus = 
            parsed.isAdmin || 
            parsed.role === 'admin' || 
            parsed.role_id === 2 ||
            parsed.Role?.name === 'admin' ||
            parsed.Role?.id === 2 ||
            parsed.email === 'itechseed1@gmail.com'
          setIsAdmin(adminStatus)
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
      setLoading(false)
    }

    loadUser()

    // Listen for storage changes (e.g., when user logs in/out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        loadUser()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const updateUser = (userData) => {
    setUser(userData)
    // Check admin status including specific admin email
    const adminStatus = 
      userData.isAdmin || 
      userData.role === 'admin' || 
      userData.role_id === 2 ||
      userData.Role?.name === 'admin' ||
      userData.Role?.id === 2 ||
      userData.email === 'itechseed1@gmail.com'
    setIsAdmin(adminStatus)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  return { user, isAdmin, loading, updateUser }
}

