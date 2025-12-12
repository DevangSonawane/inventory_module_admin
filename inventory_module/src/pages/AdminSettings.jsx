import { useState, useEffect } from 'react'
import { Settings, Database, Shield, Bell, Save, Loader2, Users, Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import { adminService } from '../services/adminService.js'
import { groupService } from '../services/groupService.js'
import { teamService } from '../services/teamService.js'
import ConfirmationModal from '../components/common/ConfirmationModal'

const AdminSettings = () => {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [groups, setGroups] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null) // For editing groups
  const [selectedTeam, setSelectedTeam] = useState(null) // For editing teams
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteType, setDeleteType] = useState(null) // 'group' or 'team'
  const [deleteId, setDeleteId] = useState(null)
  const [groupForm, setGroupForm] = useState({ groupName: '', description: '' })
  const [teamForm, setTeamForm] = useState({ teamName: '', groupId: '', description: '' })
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
    if (activeTab === 'groups-teams') {
      fetchGroups()
      fetchTeams()
    }
  }, [activeTab])

  const fetchGroups = async () => {
    try {
      const response = await groupService.getAll({ limit: 100 })
      if (response.success) {
        setGroups(response.data?.groups || [])
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await teamService.getAll({ limit: 100 })
      if (response.success) {
        setTeams(response.data?.teams || [])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

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
            <button
              onClick={() => setActiveTab('groups-teams')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'groups-teams'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Groups & Teams
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

        {/* Groups & Teams Settings */}
        {activeTab === 'groups-teams' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Groups Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Groups</h3>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setGroupForm({ groupName: '', description: '' })
                      setSelectedGroup(null)
                      setShowGroupModal(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Group
                  </Button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {groups.map((group) => (
                    <div key={group.group_id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{group.group_name}</h4>
                        {group.description && (
                          <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setGroupForm({ groupName: group.group_name, description: group.description || '' })
                            setSelectedGroup(group)
                            setShowGroupModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteType('group')
                            setDeleteId(group.group_id)
                            setShowDeleteModal(true)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {groups.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No groups found</p>
                  )}
                </div>
              </div>

              {/* Teams Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Teams</h3>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setTeamForm({ teamName: '', groupId: '', description: '' })
                      setSelectedTeam(null)
                      setShowTeamModal(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Team
                  </Button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {teams.map((team) => {
                    const teamGroup = groups.find(g => g.group_id === team.group_id)
                    return (
                      <div key={team.team_id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{team.team_name}</h4>
                          {teamGroup && (
                            <p className="text-sm text-gray-500 mt-1">Group: {teamGroup.group_name}</p>
                          )}
                          {team.description && (
                            <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setTeamForm({
                              teamName: team.team_name,
                              groupId: team.group_id,
                              description: team.description || ''
                            })
                            setSelectedTeam(team)
                            setShowTeamModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                          <button
                            onClick={() => {
                              setDeleteType('team')
                              setDeleteId(team.team_id)
                              setShowDeleteModal(true)
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {teams.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No teams found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedGroup ? 'Edit Group' : 'Add Group'}
            </h3>
            <div className="space-y-4">
              <Input
                label="Group Name"
                value={groupForm.groupName}
                onChange={(e) => setGroupForm({ ...groupForm, groupName: e.target.value })}
                required
              />
              <Input
                label="Description"
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                multiline
              />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => {
                  setShowGroupModal(false)
                  setSelectedGroup(null)
                  setGroupForm({ groupName: '', description: '' })
                }}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    if (!groupForm.groupName) {
                      toast.error('Please enter a group name')
                      return
                    }
                    try {
                      if (selectedGroup) {
                        await groupService.update(selectedGroup.group_id, groupForm)
                        toast.success('Group updated successfully')
                      } else {
                        await groupService.create(groupForm)
                        toast.success('Group created successfully')
                      }
                      setShowGroupModal(false)
                      setSelectedGroup(null)
                      setGroupForm({ groupName: '', description: '' })
                      fetchGroups()
                    } catch (error) {
                      console.error('Error saving group:', error)
                      const errorMessage = error?.response?.data?.message || 
                                         error?.message || 
                                         error?.errors?.map(e => e.message || e.msg).join(', ') ||
                                         'Failed to save group'
                      toast.error(errorMessage)
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedTeam ? 'Edit Team' : 'Add Team'}
            </h3>
            <div className="space-y-4">
              <Input
                label="Team Name"
                value={teamForm.teamName}
                onChange={(e) => setTeamForm({ ...teamForm, teamName: e.target.value })}
                required
              />
              <Dropdown
                label="Group"
                options={[
                  { value: '', label: 'Select Group' },
                  ...groups.map(g => ({ value: g.group_id, label: g.group_name }))
                ]}
                value={teamForm.groupId}
                onChange={(e) => setTeamForm({ ...teamForm, groupId: e.target.value })}
                required
              />
              <Input
                label="Description"
                value={teamForm.description}
                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                multiline
              />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => {
                  setShowTeamModal(false)
                  setSelectedTeam(null)
                  setTeamForm({ teamName: '', groupId: '', description: '' })
                }}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    if (!teamForm.teamName || !teamForm.groupId) {
                      toast.error('Please fill all required fields')
                      return
                    }
                    try {
                      if (selectedTeam && selectedTeam.team_id) {
                        await teamService.update(selectedTeam.team_id, teamForm)
                        toast.success('Team updated successfully')
                      } else {
                        await teamService.create(teamForm)
                        toast.success('Team created successfully')
                      }
                      setShowTeamModal(false)
                      setSelectedTeam(null)
                      setTeamForm({ teamName: '', groupId: '', description: '' })
                      fetchTeams()
                    } catch (error) {
                      console.error('Error saving team:', error)
                      const errorMessage = error?.response?.data?.message || 
                                         error?.message || 
                                         error?.errors?.map(e => e.message || e.msg).join(', ') ||
                                         'Failed to save team'
                      toast.error(errorMessage)
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteId(null)
          setDeleteType(null)
        }}
            onConfirm={async () => {
              try {
                if (deleteType === 'group') {
                  await groupService.delete(deleteId)
                  toast.success('Group deleted successfully')
                  fetchGroups()
                } else {
                  await teamService.delete(deleteId)
                  toast.success('Team deleted successfully')
                  fetchTeams()
                }
                setShowDeleteModal(false)
                setDeleteId(null)
                setDeleteType(null)
              } catch (error) {
                console.error('Error deleting:', error)
                const errorMessage = error?.response?.data?.message || 
                                   error?.message || 
                                   error?.errors?.map(e => e.message || e.msg).join(', ') ||
                                   'Failed to delete'
                toast.error(errorMessage)
              }
            }}
        title={`Delete ${deleteType === 'group' ? 'Group' : 'Team'}`}
        message={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}

export default AdminSettings

