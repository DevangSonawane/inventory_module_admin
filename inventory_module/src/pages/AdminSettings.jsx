import { useState, useEffect } from 'react'
import { Settings, Database, Shield, Bell, Save, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import { adminService } from '../services/adminService.js'

const AdminSettings = () => {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    // General Settings
    systemName: 'Inventory Management System',
    companyName: '',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    itemsPerPage: 10,
    
    // Notification Settings
    emailNotifications: true,
    lowStockAlerts: true,
    approvalNotifications: true,
    dailyReports: false,
    
    // Security Settings
    sessionTimeout: 30,
    passwordMinLength: 6,
    requireStrongPassword: false,
    twoFactorAuth: false,
    
    // Inventory Settings
    autoGenerateSlipNumber: true,
    allowNegativeStock: false,
    defaultStockArea: '',
    serialNumberFormat: 'AUTO',
  })

  const timezoneOptions = [
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'America/New_York (EST)' },
  ]

  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  ]

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await adminService.getSettings()
      if (response.success) {
        const fetchedSettings = response.data
        setSettings({
          systemName: fetchedSettings.general?.systemName || 'Inventory Management System',
          companyName: fetchedSettings.general?.companyName || '',
          timezone: fetchedSettings.general?.timezone || 'Asia/Kolkata',
          dateFormat: fetchedSettings.general?.dateFormat || 'DD/MM/YYYY',
          itemsPerPage: fetchedSettings.general?.itemsPerPage || 10,
          emailNotifications: fetchedSettings.notifications?.emailNotifications !== false,
          lowStockAlerts: fetchedSettings.notifications?.lowStockAlerts !== false,
          approvalNotifications: fetchedSettings.notifications?.approvalNotifications !== false,
          dailyReports: fetchedSettings.notifications?.dailyReports || false,
          sessionTimeout: fetchedSettings.security?.sessionTimeout || 30,
          passwordMinLength: fetchedSettings.security?.passwordMinLength || 6,
          requireStrongPassword: fetchedSettings.security?.requireStrongPassword || false,
          twoFactorAuth: fetchedSettings.security?.twoFactorAuth || false,
          autoGenerateSlipNumber: fetchedSettings.inventory?.autoGenerateSlipNumber !== false,
          allowNegativeStock: fetchedSettings.inventory?.allowNegativeStock || false,
          defaultStockArea: fetchedSettings.inventory?.defaultStockArea || '',
          serialNumberFormat: fetchedSettings.inventory?.serialNumberFormat || 'AUTO',
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      // Use defaults if fetch fails
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      const settingsToSave = {
        general: {
          systemName: settings.systemName,
          companyName: settings.companyName,
          timezone: settings.timezone,
          dateFormat: settings.dateFormat,
          itemsPerPage: settings.itemsPerPage,
        },
        notifications: {
          emailNotifications: settings.emailNotifications,
          lowStockAlerts: settings.lowStockAlerts,
          approvalNotifications: settings.approvalNotifications,
          dailyReports: settings.dailyReports,
        },
        security: {
          sessionTimeout: settings.sessionTimeout,
          passwordMinLength: settings.passwordMinLength,
          requireStrongPassword: settings.requireStrongPassword,
          twoFactorAuth: settings.twoFactorAuth,
        },
        inventory: {
          autoGenerateSlipNumber: settings.autoGenerateSlipNumber,
          allowNegativeStock: settings.allowNegativeStock,
          defaultStockArea: settings.defaultStockArea,
          serialNumberFormat: settings.serialNumberFormat,
        },
      }
      
      const response = await adminService.updateSettings(settingsToSave)
      if (response.success) {
        toast.success('Settings saved successfully')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'general'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              General
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'notifications'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bell className="w-4 h-4" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'security'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'inventory'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Database className="w-4 h-4" />
              Inventory
            </button>
          </nav>
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Input
                label="System Name"
                value={settings.systemName}
                onChange={(e) => handleChange('systemName', e.target.value)}
              />
              <Input
                label="Company Name"
                value={settings.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
              />
              <Dropdown
                label="Timezone"
                options={timezoneOptions}
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
              />
              <Dropdown
                label="Date Format"
                options={dateFormatOptions}
                value={settings.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
              />
              <Input
                label="Items Per Page"
                type="number"
                value={settings.itemsPerPage}
                onChange={(e) => handleChange('itemsPerPage', parseInt(e.target.value))}
              />
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Enable email notifications for system events</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Low Stock Alerts</h4>
                  <p className="text-sm text-gray-600">Send alerts when stock levels are low</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.lowStockAlerts}
                  onChange={(e) => handleChange('lowStockAlerts', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Approval Notifications</h4>
                  <p className="text-sm text-gray-600">Notify when approvals are required</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.approvalNotifications}
                  onChange={(e) => handleChange('approvalNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Daily Reports</h4>
                  <p className="text-sm text-gray-600">Send daily summary reports</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dailyReports}
                  onChange={(e) => handleChange('dailyReports', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Session Timeout (minutes)"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
              />
              <Input
                label="Minimum Password Length"
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => handleChange('passwordMinLength', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Require Strong Password</h4>
                  <p className="text-sm text-gray-600">Enforce complex password requirements</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireStrongPassword}
                  onChange={(e) => handleChange('requireStrongPassword', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Enable 2FA for all users</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) => handleChange('twoFactorAuth', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* Inventory Settings */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Auto-generate Slip Number</h4>
                  <p className="text-sm text-gray-600">Automatically generate slip numbers for inward entries</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoGenerateSlipNumber}
                  onChange={(e) => handleChange('autoGenerateSlipNumber', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Allow Negative Stock</h4>
                  <p className="text-sm text-gray-600">Allow stock levels to go below zero</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowNegativeStock}
                  onChange={(e) => handleChange('allowNegativeStock', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Default Stock Area"
                value={settings.defaultStockArea}
                onChange={(e) => handleChange('defaultStockArea', e.target.value)}
                placeholder="Enter default stock area ID"
              />
              <Dropdown
                label="Serial Number Format"
                options={[
                  { value: 'AUTO', label: 'Auto' },
                  { value: 'MANUAL', label: 'Manual' },
                ]}
                value={settings.serialNumberFormat}
                onChange={(e) => handleChange('serialNumberFormat', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSettings

