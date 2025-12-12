import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Package,
  FileText,
  ShoppingCart,
  Truck,
  ClipboardList,
  Settings,
  BarChart3,
  Database,
  MapPin,
  Bell,
  FileSearch,
  Upload,
  Activity,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  FileCheck,
  Users,
  User,
  RotateCcw,
  Shield,
  CheckCircle,
  Lock,
} from 'lucide-react'
import { useAuth } from '../../utils/useAuth'
import { usePagePermissions } from '../../utils/usePagePermissions'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin } = useAuth()
  const { hasAccess } = usePagePermissions()
  
  // Helper to check if a path is active
  const isActive = (path) => {
    if (!path) return false
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }
  
  // Initialize expanded sections - only expand the section containing the active page
  const getInitialExpandedState = () => {
    const allInventoryItems = [
      { id: 'inventory-stock', path: '/inventory-stock' },
      { id: 'add-inward', path: '/add-inward' },
      { id: 'inward-list', path: '/inward-list' },
      { id: 'material-request', path: '/material-request' },
      { id: 'stock-transfer', path: '/stock-transfer' },
      { id: 'person-stock', path: '/person-stock' },
      { id: 'record-consumption', path: '/record-consumption' },
      { id: 'return-stock', path: '/return-stock' },
    ]
    const allManagementItems = [
      { id: 'purchase-request', path: '/purchase-request' },
      { id: 'purchase-order', path: '/purchase-order' },
      { id: 'business-partner', path: '/business-partner' },
      { id: 'material-management', path: '/material-management' },
      { id: 'stock-area-management', path: '/stock-area-management' },
      { id: 'stock-levels', path: '/stock-levels' },
    ]
    const allReportsItems = [
      { id: 'reports', path: '/reports' },
      { id: 'audit-trail', path: '/audit-trail' },
    ]
    const allOtherItems = [
      { id: 'notifications', path: '/notifications' },
      { id: 'bulk-operations', path: '/bulk-operations' },
    ]
    const allAdminItems = [
      { id: 'admin-dashboard', path: '/admin/dashboard' },
      { id: 'user-management', path: '/admin/users' },
      { id: 'approval-center', path: '/admin/approvals' },
      { id: 'admin-settings', path: '/admin/settings' },
      { id: 'page-permissions', path: '/admin/page-permissions' },
    ]
    
    return {
      inventory: allInventoryItems.some(item => isActive(item.path)),
      management: allManagementItems.some(item => isActive(item.path)),
      reports: allReportsItems.some(item => isActive(item.path)),
      other: allOtherItems.some(item => isActive(item.path)),
      admin: allAdminItems.some(item => isActive(item.path)),
    }
  }
  
  const [expandedSections, setExpandedSections] = useState(getInitialExpandedState())

  const allInventoryItems = [
    { id: 'inventory-stock', label: 'Inventory Stock', icon: <Package className="w-4 h-4" />, path: '/inventory-stock' },
    { id: 'add-inward', label: 'Add Inward', icon: <FileText className="w-4 h-4" />, path: '/add-inward' },
    { id: 'inward-list', label: 'Inward List', icon: <FileText className="w-4 h-4" />, path: '/inward-list' },
    { id: 'material-request', label: 'Material Request', icon: <ShoppingCart className="w-4 h-4" />, path: '/material-request' },
    { id: 'stock-transfer', label: 'Stock Transfer', icon: <Truck className="w-4 h-4" />, path: '/stock-transfer' },
    { id: 'person-stock', label: 'Person Stock', icon: <User className="w-4 h-4" />, path: '/person-stock' },
    { id: 'record-consumption', label: 'Record Consumption', icon: <ClipboardList className="w-4 h-4" />, path: '/record-consumption' },
    { id: 'return-stock', label: 'Return Stock', icon: <RotateCcw className="w-4 h-4" />, path: '/return-stock' },
  ]

  const allManagementItems = [
    { id: 'purchase-request', label: 'Purchase Requests', icon: <FileCheck className="w-4 h-4" />, path: '/purchase-request' },
    { id: 'purchase-order', label: 'Purchase Orders', icon: <ShoppingBag className="w-4 h-4" />, path: '/purchase-order' },
    { id: 'business-partner', label: 'Business Partners', icon: <Users className="w-4 h-4" />, path: '/business-partner' },
    { id: 'material-management', label: 'Material Management', icon: <Database className="w-4 h-4" />, path: '/material-management' },
    { id: 'stock-area-management', label: 'Stock Area Management', icon: <MapPin className="w-4 h-4" />, path: '/stock-area-management' },
    { id: 'stock-levels', label: 'Stock Levels', icon: <BarChart3 className="w-4 h-4" />, path: '/stock-levels' },
  ]

  const allReportsItems = [
    { id: 'reports', label: 'Reports', icon: <FileSearch className="w-4 h-4" />, path: '/reports' },
    { id: 'audit-trail', label: 'Audit Trail', icon: <Activity className="w-4 h-4" />, path: '/audit-trail' },
  ]

  const allOtherItems = [
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, path: '/notifications' },
    { id: 'bulk-operations', label: 'Bulk Operations', icon: <Upload className="w-4 h-4" />, path: '/bulk-operations' },
  ]

  const allAdminItems = [
    { id: 'admin-dashboard', label: 'Admin Dashboard', icon: <BarChart3 className="w-4 h-4" />, path: '/admin/dashboard' },
    { id: 'user-management', label: 'User Management', icon: <Users className="w-4 h-4" />, path: '/admin/users' },
    { id: 'approval-center', label: 'Approval Center', icon: <CheckCircle className="w-4 h-4" />, path: '/admin/approvals' },
    { id: 'admin-settings', label: 'System Settings', icon: <Shield className="w-4 h-4" />, path: '/admin/settings' },
    { id: 'page-permissions', label: 'Page Permissions', icon: <Lock className="w-4 h-4" />, path: '/admin/page-permissions' },
  ]

  // Filter items based on permissions (admins see all)
  const inventoryItems = allInventoryItems.filter(item => hasAccess(item.id))
  const managementItems = allManagementItems.filter(item => hasAccess(item.id))
  const reportsItems = allReportsItems.filter(item => hasAccess(item.id))
  const otherItems = allOtherItems.filter(item => hasAccess(item.id))
  const adminItems = allAdminItems // Admins always see all admin pages

  // Auto-expand section containing active page when route changes
  useEffect(() => {
    const newExpandedState = getInitialExpandedState()
    setExpandedSections(newExpandedState)
  }, [location.pathname])

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const renderSection = (title, items, sectionKey, icon) => {
    // Don't render section if no items (all filtered out)
    if (items.length === 0) return null;
    
    const isExpanded = expandedSections[sectionKey]
    const hasActiveItem = items.some(item => isActive(item.path))

    return (
      <div className="mb-1">
        <button
          onClick={() => toggleSection(sectionKey)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            hasActiveItem
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-300 hover:bg-blue-800/50 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0">{icon}</span>
            <span className="text-left">{title}</span>
          </div>
          <span className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 transition-transform" />
            ) : (
              <ChevronRight className="w-4 h-4 transition-transform" />
            )}
          </span>
        </button>
        {isExpanded && (
          <div className="ml-6 mt-1.5 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => item.path && navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                  isActive(item.path)
                    ? 'bg-blue-500 text-white font-medium shadow-sm'
                    : 'text-gray-300 hover:bg-blue-700/70 hover:text-white'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-64 bg-gradient-to-b from-[#1e3a5f] to-[#152a47] text-white flex flex-col h-screen fixed left-0 top-0 z-40 shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-blue-600/30 bg-blue-900/20">
        <h2 className="text-lg font-bold tracking-wide">Inventory Management</h2>
        <p className="text-xs text-gray-400 mt-0.5">System Portal</p>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
        <div className="space-y-1">
          {/* Inventory Section */}
          {renderSection('Inventory', inventoryItems, 'inventory', <Package className="w-5 h-5" />)}

          {/* Management Section */}
          {renderSection('Management', managementItems, 'management', <Database className="w-5 h-5" />)}

          {/* Reports & Audit Section */}
          {renderSection('Reports & Audit', reportsItems, 'reports', <FileSearch className="w-5 h-5" />)}

          {/* Other Section */}
          {renderSection('Other', otherItems, 'other', <Settings className="w-5 h-5" />)}
        </div>
        
        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-blue-600/30">
            {renderSection('Admin', adminItems, 'admin', <Shield className="w-5 h-5" />)}
          </div>
        )}
        
        {/* Settings Link - Always visible if user has access */}
        {hasAccess('settings') && (
          <div className="mt-4 pt-4 border-t border-blue-600/30">
            <button
              onClick={() => navigate('/settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/settings')
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-300 hover:bg-blue-700/70 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        )}
      </nav>
    </div>
  )
}

export default Sidebar
