import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
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

function App() {
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
                    <Route path="/" element={<InventoryStock />} />
                    <Route path="/inventory-stock" element={<InventoryStock />} />
                    <Route path="/add-inward" element={<AddInward />} />
                    <Route path="/add-inward/:id" element={<AddInward />} />
                    <Route path="/inward-list" element={<InwardList />} />
                    <Route path="/material-request" element={<MaterialRequest />} />
                    <Route path="/material-request/:id" element={<MaterialRequestDetails />} />
                    <Route path="/material-request/new" element={<MaterialRequestDetails />} />
                    <Route path="/stock-transfer" element={<StockTransferList />} />
                    <Route path="/stock-transfer-list" element={<StockTransferList />} />
                    <Route path="/stock-transfer/:id" element={<StockTransfer />} />
                    <Route path="/stock-transfer/new" element={<StockTransfer />} />
                    <Route path="/record-consumption" element={<RecordConsumptionList />} />
                    <Route path="/record-consumption-list" element={<RecordConsumptionList />} />
                    <Route path="/record-consumption/:id" element={<RecordConsumption />} />
                    <Route path="/record-consumption/new" element={<RecordConsumption />} />
                    <Route path="/material-management" element={<MaterialManagement />} />
                    <Route path="/material-management/:id" element={<MaterialManagement />} />
                    <Route path="/material-management/new" element={<MaterialManagement />} />
                    <Route path="/stock-area-management" element={<StockAreaManagement />} />
                    <Route path="/stock-area-management/:id" element={<StockAreaManagement />} />
                    <Route path="/stock-area-management/new" element={<StockAreaManagement />} />
                    <Route path="/stock-levels" element={<StockLevels />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/audit-trail" element={<AuditTrail />} />
                    <Route path="/bulk-operations" element={<BulkOperations />} />
                    <Route path="/settings" element={<Settings />} />
                    {/* Purchase Requests */}
                    <Route path="/purchase-request" element={<PurchaseRequestList />} />
                    <Route path="/purchase-request/:id" element={<PurchaseRequestDetails />} />
                    <Route path="/purchase-request/new" element={<PurchaseRequestDetails />} />
                    {/* Purchase Orders */}
                    <Route path="/purchase-order" element={<PurchaseOrderList />} />
                    <Route path="/purchase-order/:id" element={<PurchaseOrderDetails />} />
                    <Route path="/purchase-order/new" element={<PurchaseOrderDetails />} />
                    {/* Business Partners */}
                    <Route path="/business-partner" element={<BusinessPartnerManagement />} />
                    <Route path="/business-partner/:id" element={<BusinessPartnerManagement />} />
                    <Route path="/business-partner/new" element={<BusinessPartnerManagement />} />
                    {/* Person Stock */}
                    <Route path="/person-stock" element={<PersonStock />} />
                    {/* Return Stock */}
                    <Route path="/return-stock" element={<ReturnStock />} />
                    <Route path="/return-stock/:id" element={<ReturnStock />} />
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

