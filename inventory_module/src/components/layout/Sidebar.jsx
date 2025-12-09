import { useState } from 'react'
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
} from 'lucide-react'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [expandedSections, setExpandedSections] = useState({
    inventory: true,
    management: true,
    reports: true,
    other: false,
  })

  const inventoryItems = [
    { id: 'inventory-stock', label: 'Inventory Stock', icon: <Package className="w-4 h-4" />, path: '/inventory-stock' },
    { id: 'add-inward', label: 'Add Inward', icon: <FileText className="w-4 h-4" />, path: '/add-inward' },
    { id: 'inward-list', label: 'Inward List', icon: <FileText className="w-4 h-4" />, path: '/inward-list' },
    { id: 'material-request', label: 'Material Request', icon: <ShoppingCart className="w-4 h-4" />, path: '/material-request' },
    { id: 'stock-transfer', label: 'Stock Transfer', icon: <Truck className="w-4 h-4" />, path: '/stock-transfer' },
    { id: 'person-stock', label: 'Person Stock', icon: <User className="w-4 h-4" />, path: '/person-stock' },
    { id: 'record-consumption', label: 'Record Consumption', icon: <ClipboardList className="w-4 h-4" />, path: '/record-consumption' },
    { id: 'return-stock', label: 'Return Stock', icon: <RotateCcw className="w-4 h-4" />, path: '/return-stock' },
  ]

  const managementItems = [
    { id: 'purchase-request', label: 'Purchase Requests', icon: <FileCheck className="w-4 h-4" />, path: '/purchase-request' },
    { id: 'purchase-order', label: 'Purchase Orders', icon: <ShoppingBag className="w-4 h-4" />, path: '/purchase-order' },
    { id: 'business-partner', label: 'Business Partners', icon: <Users className="w-4 h-4" />, path: '/business-partner' },
    { id: 'material-management', label: 'Material Management', icon: <Database className="w-4 h-4" />, path: '/material-management' },
    { id: 'stock-area-management', label: 'Stock Area Management', icon: <MapPin className="w-4 h-4" />, path: '/stock-area-management' },
    { id: 'stock-levels', label: 'Stock Levels', icon: <BarChart3 className="w-4 h-4" />, path: '/stock-levels' },
  ]

  const reportsItems = [
    { id: 'reports', label: 'Reports', icon: <FileSearch className="w-4 h-4" />, path: '/reports' },
    { id: 'audit-trail', label: 'Audit Trail', icon: <Activity className="w-4 h-4" />, path: '/audit-trail' },
  ]

  const otherItems = [
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, path: '/notifications' },
    { id: 'bulk-operations', label: 'Bulk Operations', icon: <Upload className="w-4 h-4" />, path: '/bulk-operations' },
  ]

  const isActive = (path) => {
    if (!path) return false
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const renderSection = (title, items, sectionKey, icon) => {
    const isExpanded = expandedSections[sectionKey]
    const hasActiveItem = items.some(item => isActive(item.path))

    return (
      <div className="mb-1">
        <button
          onClick={() => toggleSection(sectionKey)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
            hasActiveItem
              ? 'bg-blue-500 text-white font-semibold'
              : 'text-gray-300 hover:bg-blue-700 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            {icon}
            <span>{title}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => item.path && navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-400 text-white font-semibold'
                    : 'text-gray-300 hover:bg-blue-700 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-64 bg-[#1e3a5f] text-white flex flex-col min-h-screen fixed left-0 top-0">
      <div className="p-4 border-b border-blue-600">
        <h2 className="text-lg font-semibold">Inventory Management</h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {/* Inventory Section */}
        {renderSection('Inventory', inventoryItems, 'inventory', <Package className="w-5 h-5" />)}

        {/* Management Section */}
        {renderSection('Management', managementItems, 'management', <Database className="w-5 h-5" />)}

        {/* Reports & Audit Section */}
        {renderSection('Reports & Audit', reportsItems, 'reports', <FileSearch className="w-5 h-5" />)}

        {/* Other Section */}
        {renderSection('Other', otherItems, 'other', <Settings className="w-5 h-5" />)}
        
        {/* Settings Link */}
        <div className="mt-4 pt-4 border-t border-blue-600">
          <button
            onClick={() => navigate('/settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive('/settings')
                ? 'bg-blue-400 text-white font-semibold'
                : 'text-gray-300 hover:bg-blue-700 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default Sidebar
