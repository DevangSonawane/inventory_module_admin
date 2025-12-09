import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, User, Lock, Palette, Globe, Calendar, List } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import { authService } from '../services/authService.js'

const Settings = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetchingProfile, setFetchingProfile] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    employeCode: '',
  })
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'english',
    dateFormat: 'DD/MM/YYYY',
    itemsPerPage: 10,
  })

  // Load user profile and preferences on mount
  useEffect(() => {
    fetchProfile()
    loadPreferences()
  }, [])

  const fetchProfile = async () => {
    try {
      setFetchingProfile(true)
      const response = await authService.getProfile()
      
      if (response.success) {
        const user = response.data
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          phoneNumber: user.phone_number || '',
          employeCode: user.employeCode || user.employee_code || '',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setFetchingProfile(false)
    }
  }

  const loadPreferences = () => {
    // Load preferences from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light'
    const savedLanguage = localStorage.getItem('language') || 'english'
    const savedDateFormat = localStorage.getItem('dateFormat') || 'DD/MM/YYYY'
    const savedItemsPerPage = parseInt(localStorage.getItem('itemsPerPage')) || 10
    
    setPreferences({
      theme: savedTheme,
      language: savedLanguage,
      dateFormat: savedDateFormat,
      itemsPerPage: savedItemsPerPage,
    })
  }

  const handleUpdateProfile = async () => {
    if (!profileData.name.trim()) {
      toast.error('Name is required')
      return
    }

    try {
      setLoading(true)
      const response = await authService.updateProfile({
        name: profileData.name,
        email: profileData.email || undefined,
        phoneNumber: profileData.phoneNumber || undefined,
        employeCode: profileData.employeCode || undefined,
      })
      
      if (response.success) {
        toast.success('Profile updated successfully')
        // Update user in localStorage
        if (response.data) {
          localStorage.setItem('user', JSON.stringify(response.data))
        }
        fetchProfile()
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill all password fields')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    try {
      setLoading(true)
      const response = await authService.changePassword(
        passwordData.oldPassword,
        passwordData.newPassword
      )
      
      if (response.success) {
        toast.success('Password changed successfully')
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error(error.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreferences = () => {
    // Save preferences to localStorage
    localStorage.setItem('theme', preferences.theme)
    localStorage.setItem('language', preferences.language)
    localStorage.setItem('dateFormat', preferences.dateFormat)
    localStorage.setItem('itemsPerPage', preferences.itemsPerPage.toString())
    toast.success('Preferences saved successfully')
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Clear tokens even if API call fails
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      navigate('/login')
    }
  }

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ]

  const languageOptions = [
    { value: 'english', label: 'English' },
  ]

  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  ]

  const itemsPerPageOptions = [
    { value: '10', label: '10' },
    { value: '20', label: '20' },
    { value: '50', label: '50' },
    { value: '100', label: '100' },
  ]

  if (fetchingProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'password'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Change Password
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'preferences'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Palette className="w-4 h-4 inline mr-2" />
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'account'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Account
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <Input
                    label="Name"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                  <Input
                    label="Phone Number"
                    value={profileData.phoneNumber}
                    onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                  />
                  <Input
                    label="Employee Code"
                    value={profileData.employeCode}
                    onChange={(e) => setProfileData({ ...profileData, employeCode: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleUpdateProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                <div className="grid grid-cols-1 gap-6 max-w-md">
                  <Input
                    label="Current Password"
                    type="password"
                    required
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Minimum 6 characters"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
                <div className="grid grid-cols-2 gap-6 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Palette className="w-4 h-4 inline mr-2" />
                      Theme
                    </label>
                    <Dropdown
                      options={themeOptions}
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Language
                    </label>
                    <Dropdown
                      options={languageOptions}
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Date Format
                    </label>
                    <Dropdown
                      options={dateFormatOptions}
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <List className="w-4 h-4 inline mr-2" />
                      Items Per Page
                    </label>
                    <Dropdown
                      options={itemsPerPageOptions}
                      value={preferences.itemsPerPage.toString()}
                      onChange={(e) => setPreferences({ ...preferences, itemsPerPage: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleSavePreferences}
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Logout</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Sign out of your account. You will need to log in again to access the system.
                    </p>
                    <Button
                      variant="danger"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings

