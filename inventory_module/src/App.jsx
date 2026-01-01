import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/common/AdminRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import { useAuth } from './utils/useAuth'
import { connectSocket, disconnectSocket } from './services/chatSocket.js'
import Login from './pages/Login'
import Settings from './pages/Settings'
import InventoryStock from './pages/InventoryStock'
import AddInward from './pages/AddInward'
import InwardList from './pages/InwardList'
import MaterialRequest from './pages/MaterialRequest'
import MaterialRequestDetails from './pages/MaterialRequestDetails'
import StockTransferList from './pages/StockTransferList'
import StockTransfer from './pages/StockTransfer'
import RecordConsumptionList from './pages/RecordConsumptionList'
import RecordConsumption from './pages/RecordConsumption'
import MaterialManagement from './pages/MaterialManagement'
import MaterialTypeManagement from './pages/MaterialTypeManagement'
import HSNCodeManagement from './pages/HSNCodeManagement'
import StockAreaManagement from './pages/StockAreaManagement'
import StockLevels from './pages/StockLevels'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import AuditTrail from './pages/AuditTrail'
import BulkOperations from './pages/BulkOperations'
import PurchaseRequestList from './pages/PurchaseRequestList'
import PurchaseRequestDetails from './pages/PurchaseRequestDetails'
import PurchaseOrderList from './pages/PurchaseOrderList'
import PurchaseOrderDetails from './pages/PurchaseOrderDetails'
import BusinessPartnerManagement from './pages/BusinessPartnerManagement'
import PersonStock from './pages/PersonStock'
import ReturnStock from './pages/ReturnStock'
import AdminDashboard from './pages/AdminDashboard'
import UserManagement from './pages/UserManagement'
import ApprovalCenter from './pages/ApprovalCenter'
import AdminSettings from './pages/AdminSettings'
import PagePermissions from './pages/PagePermissions'
import PagePermissionGuard from './components/common/PagePermissionGuard'

// Smart redirect component based on user role
const SmartRedirect = () => {
  const { isAdmin, loading } = useAuth()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/inventory-stock'} replace />
}

function App() {
  useEffect(() => {
    // Initialize socket connection when app loads
    const token = localStorage.getItem('accessToken')
    if (token) {
      connectSocket()
    }

    // Cleanup on unmount
    return () => {
      disconnectSocket()
    }
  }, [])

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<SmartRedirect />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/*" element={<AdminRoute><Outlet /></AdminRoute>}>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="approvals" element={<ApprovalCenter />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="page-permissions" element={<PagePermissions />} />
                    </Route>
                    
                    {/* Regular Routes - Protected by Page Permissions */}
                    <Route path="/inventory-stock" element={<PagePermissionGuard><InventoryStock /></PagePermissionGuard>} />
                    <Route path="/add-inward" element={<PagePermissionGuard><AddInward /></PagePermissionGuard>} />
                    <Route path="/add-inward/:id" element={<PagePermissionGuard><AddInward /></PagePermissionGuard>} />
                    <Route path="/inward-list" element={<PagePermissionGuard><InwardList /></PagePermissionGuard>} />
                    <Route path="/material-request" element={<PagePermissionGuard><MaterialRequest /></PagePermissionGuard>} />
                    <Route path="/material-request/:id" element={<PagePermissionGuard><MaterialRequestDetails /></PagePermissionGuard>} />
                    <Route path="/material-request/new" element={<PagePermissionGuard><MaterialRequestDetails /></PagePermissionGuard>} />
                    <Route path="/stock-transfer" element={<PagePermissionGuard><StockTransferList /></PagePermissionGuard>} />
                    <Route path="/stock-transfer-list" element={<PagePermissionGuard><StockTransferList /></PagePermissionGuard>} />
                    <Route path="/stock-transfer/:id" element={<PagePermissionGuard><StockTransfer /></PagePermissionGuard>} />
                    <Route path="/stock-transfer/new" element={<PagePermissionGuard><StockTransfer /></PagePermissionGuard>} />
                    <Route path="/record-consumption" element={<PagePermissionGuard><RecordConsumptionList /></PagePermissionGuard>} />
                    <Route path="/record-consumption-list" element={<PagePermissionGuard><RecordConsumptionList /></PagePermissionGuard>} />
                    <Route path="/record-consumption/:id" element={<PagePermissionGuard><RecordConsumption /></PagePermissionGuard>} />
                    <Route path="/record-consumption/new" element={<PagePermissionGuard><RecordConsumption /></PagePermissionGuard>} />
                    <Route path="/material-management" element={<PagePermissionGuard><MaterialManagement /></PagePermissionGuard>} />
                    <Route path="/material-management/:id" element={<PagePermissionGuard><MaterialManagement /></PagePermissionGuard>} />
                    <Route path="/material-management/new" element={<PagePermissionGuard><MaterialManagement /></PagePermissionGuard>} />
                    <Route path="/material-type-management" element={<PagePermissionGuard><MaterialTypeManagement /></PagePermissionGuard>} />
                    <Route path="/material-type-management/:id" element={<PagePermissionGuard><MaterialTypeManagement /></PagePermissionGuard>} />
                    <Route path="/material-type-management/new" element={<PagePermissionGuard><MaterialTypeManagement /></PagePermissionGuard>} />
                    {/* HSN Code Management Routes */}
                    <Route path="/admin/hsn-code-management" element={<PagePermissionGuard><HSNCodeManagement /></PagePermissionGuard>} />
                    <Route path="/admin/hsn-code-management/:id" element={<PagePermissionGuard><HSNCodeManagement /></PagePermissionGuard>} />
                    <Route path="/admin/hsn-code-management/new" element={<PagePermissionGuard><HSNCodeManagement /></PagePermissionGuard>} />
                    <Route path="/stock-area-management" element={<PagePermissionGuard><StockAreaManagement /></PagePermissionGuard>} />
                    <Route path="/stock-area-management/:id" element={<PagePermissionGuard><StockAreaManagement /></PagePermissionGuard>} />
                    <Route path="/stock-area-management/new" element={<PagePermissionGuard><StockAreaManagement /></PagePermissionGuard>} />
                    <Route path="/stock-levels" element={<PagePermissionGuard><StockLevels /></PagePermissionGuard>} />
                    <Route path="/reports" element={<PagePermissionGuard><Reports /></PagePermissionGuard>} />
                    <Route path="/notifications" element={<PagePermissionGuard><Notifications /></PagePermissionGuard>} />
                    <Route path="/audit-trail" element={<PagePermissionGuard><AuditTrail /></PagePermissionGuard>} />
                    <Route path="/bulk-operations" element={<PagePermissionGuard><BulkOperations /></PagePermissionGuard>} />
                    <Route path="/settings" element={<PagePermissionGuard><Settings /></PagePermissionGuard>} />
                    {/* Purchase Requests */}
                    <Route path="/purchase-request" element={<PagePermissionGuard><PurchaseRequestList /></PagePermissionGuard>} />
                    <Route path="/purchase-request/:id" element={<PagePermissionGuard><PurchaseRequestDetails /></PagePermissionGuard>} />
                    <Route path="/purchase-request/new" element={<PagePermissionGuard><PurchaseRequestDetails /></PagePermissionGuard>} />
                    {/* Purchase Orders */}
                    <Route path="/purchase-order" element={<PagePermissionGuard><PurchaseOrderList /></PagePermissionGuard>} />
                    <Route path="/purchase-order/:id" element={<PagePermissionGuard><PurchaseOrderDetails /></PagePermissionGuard>} />
                    <Route path="/purchase-order/new" element={<PagePermissionGuard><PurchaseOrderDetails /></PagePermissionGuard>} />
                    {/* Business Partners */}
                    <Route path="/business-partner" element={<PagePermissionGuard><BusinessPartnerManagement /></PagePermissionGuard>} />
                    <Route path="/business-partner/:id" element={<PagePermissionGuard><BusinessPartnerManagement /></PagePermissionGuard>} />
                    <Route path="/business-partner/new" element={<PagePermissionGuard><BusinessPartnerManagement /></PagePermissionGuard>} />
                    {/* Person Stock */}
                    <Route path="/person-stock" element={<PagePermissionGuard><PersonStock /></PagePermissionGuard>} />
                    {/* Return Stock */}
                    <Route path="/return-stock" element={<PagePermissionGuard><ReturnStock /></PagePermissionGuard>} />
                    <Route path="/return-stock/:id" element={<PagePermissionGuard><ReturnStock /></PagePermissionGuard>} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App

