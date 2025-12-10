import { Navigate } from 'react-router-dom'
import { useAuth } from '../../utils/useAuth'
import { Loader2 } from 'lucide-react'
import ProtectedRoute from './ProtectedRoute'

const AdminRoute = ({ children }) => {
  const { isAdmin, user, loading } = useAuth()

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

  // Check admin status including specific admin email: itechseed1@gmail.com
  const hasAdminAccess = isAdmin || user?.email === 'itechseed1@gmail.com'

  if (!hasAdminAccess) {
    return <Navigate to="/inventory-stock" replace />
  }

  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default AdminRoute

