import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, FileCheck, Package, AlertCircle, TrendingUp, Activity, Loader2, BarChart3, Database, MapPin } from 'lucide-react'
import { toast } from 'react-toastify'
import { userService } from '../services/userService.js'
import { materialRequestService } from '../services/materialRequestService.js'
import { purchaseRequestService } from '../services/purchaseRequestService.js'
import { stockLevelService } from '../services/stockLevelService.js'
import { materialService } from '../services/materialService.js'
import { stockAreaService } from '../services/stockAreaService.js'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    lowStockItems: 0,
    totalMaterials: 0,
    totalStockAreas: 0,
    pendingPRs: 0,
    pendingMRs: 0,
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all stats in parallel
      const [
        usersRes,
        prRes,
        mrRes,
        stockRes,
        materialsRes,
        stockAreasRes
      ] = await Promise.allSettled([
        userService.getAll({ limit: 1000 }),
        purchaseRequestService.getAll({ status: 'pending', limit: 1 }),
        materialRequestService.getAll({ status: 'pending', limit: 1 }),
        stockLevelService.getSummary(),
        materialService.getAll({ limit: 1 }),
        stockAreaService.getAll({ limit: 1 }),
      ])

      const users = usersRes.status === 'fulfilled' ? usersRes.value : null
      const prs = prRes.status === 'fulfilled' ? prRes.value : null
      const mrs = mrRes.status === 'fulfilled' ? mrRes.value : null
      const stock = stockRes.status === 'fulfilled' ? stockRes.value : null
      const materials = materialsRes.status === 'fulfilled' ? materialsRes.value : null
      const stockAreas = stockAreasRes.status === 'fulfilled' ? stockAreasRes.value : null

      setStats({
        totalUsers: users?.data?.pagination?.total || users?.data?.users?.length || 0,
        activeUsers: users?.data?.users?.filter(u => u.isActive !== false)?.length || 0,
        pendingPRs: prs?.data?.pagination?.totalItems || prs?.data?.purchaseRequests?.length || 0,
        pendingMRs: mrs?.data?.pagination?.totalItems || mrs?.data?.materialRequests?.length || 0,
        pendingApprovals: (prs?.data?.pagination?.totalItems || 0) + (mrs?.data?.pagination?.totalItems || 0),
        lowStockItems: stock?.data?.lowStockCount || 0,
        totalMaterials: materials?.data?.pagination?.totalItems || materials?.data?.materials?.length || 0,
        totalStockAreas: stockAreas?.data?.pagination?.totalItems || stockAreas?.data?.stockAreas?.length || 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} active`,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500',
      onClick: () => navigate('/admin/users'),
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      subtitle: `${stats.pendingPRs} PRs, ${stats.pendingMRs} MRs`,
      icon: <FileCheck className="w-6 h-6" />,
      color: 'bg-yellow-500',
      onClick: () => navigate('/admin/approvals'),
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      subtitle: 'Requires attention',
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'bg-red-500',
      onClick: () => navigate('/stock-levels'),
    },
    {
      title: 'Total Materials',
      value: stats.totalMaterials,
      subtitle: `${stats.totalStockAreas} stock areas`,
      icon: <Package className="w-6 h-6" />,
      color: 'bg-green-500',
      onClick: () => navigate('/material-management'),
    },
  ]

  const quickActions = [
    {
      label: 'Manage Users',
      icon: <Users className="w-5 h-5" />,
      onClick: () => navigate('/admin/users'),
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
    },
    {
      label: 'Review Approvals',
      icon: <FileCheck className="w-5 h-5" />,
      onClick: () => navigate('/admin/approvals'),
      color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700',
    },
    {
      label: 'View Audit Trail',
      icon: <Activity className="w-5 h-5" />,
      onClick: () => navigate('/audit-trail'),
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
    },
    {
      label: 'System Settings',
      icon: <Database className="w-5 h-5" />,
      onClick: () => navigate('/admin/settings'),
      color: 'bg-gray-50 hover:bg-gray-100 text-gray-700',
    },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card, index) => (
            <div
              key={index}
              onClick={card.onClick}
              className={`${card.color} text-white p-6 rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold mt-2">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-white/70 text-xs mt-1">{card.subtitle}</p>
                  )}
                </div>
                <div className="opacity-80">
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions and System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`${action.color} p-4 rounded-lg transition-colors flex flex-col items-center gap-2`}
                >
                  {action.icon}
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              System Overview
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Active Users</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Total Materials</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.totalMaterials}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Stock Areas</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.totalStockAreas}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-700">Low Stock Items</span>
                </div>
                <span className="font-semibold text-red-600">{stats.lowStockItems}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

