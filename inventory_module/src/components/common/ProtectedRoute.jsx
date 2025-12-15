import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { authService } from '../../services/authService.js'

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      
      if (!accessToken) {
        setIsAuthenticated(false)
        setLoading(false)
        return
      }

      // Verify token by fetching profile
      const response = await authService.getProfile()
      
      if (response.success) {
        setIsAuthenticated(true)
        // Update user data in localStorage
        if (response.data) {
          localStorage.setItem('user', JSON.stringify(response.data))
        }
      } else {
        setIsAuthenticated(false)
        // Clear tokens if verification fails
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        // Only clear rememberMe if token verification fails
        const rememberMe = localStorage.getItem('rememberMe')
        if (!rememberMe || rememberMe !== 'true') {
          localStorage.removeItem('rememberMe')
        }
      }
    } catch (error) {
      // Token is invalid or expired
      setIsAuthenticated(false)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      // Only clear rememberMe if there's an error
      const rememberMe = localStorage.getItem('rememberMe')
      if (!rememberMe || rememberMe !== 'true') {
        localStorage.removeItem('rememberMe')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute









