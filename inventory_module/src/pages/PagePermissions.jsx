import { useState, useEffect } from 'react';
import { Users, Shield, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../components/common/Button';
import Dropdown from '../components/common/Dropdown';
import { pagePermissionService } from '../services/pagePermissionService.js';
import { userService } from '../services/userService.js';
import { roleService } from '../services/roleService.js';

const PagePermissions = () => {
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' or 'users'
  const [availablePages, setAvailablePages] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPages, setSelectedPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailablePages();
    fetchRoles();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'roles' && selectedRoleId) {
      fetchRolePermissions();
    } else if (activeTab === 'users' && selectedUserId) {
      fetchUserPermissions();
    } else {
      setSelectedPages([]);
    }
  }, [activeTab, selectedRoleId, selectedUserId]);

  const fetchAvailablePages = async () => {
    try {
      const response = await pagePermissionService.getAvailablePages();
      if (response.success) {
        setAvailablePages(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Failed to load available pages');
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleService.getAll();
      if (Array.isArray(response)) {
        setRoles(response.filter(role => role.is_active !== false));
      } else if (response.success) {
        setRoles((response.data || []).filter(role => role.is_active !== false));
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getAll({ limit: 1000 });
      if (response.success) {
        setUsers(response.data?.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchRolePermissions = async () => {
    try {
      setLoading(true);
      const response = await pagePermissionService.getRolePermissions(selectedRoleId);
      if (response.success) {
        setSelectedPages(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast.error('Failed to load role permissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      const response = await pagePermissionService.getUserPermissions(selectedUserId);
      if (response.success) {
        setSelectedPages(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      toast.error('Failed to load user permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePage = (pageId) => {
    setSelectedPages(prev => {
      if (prev.includes(pageId)) {
        return prev.filter(id => id !== pageId);
      } else {
        return [...prev, pageId];
      }
    });
  };

  const handleSelectAll = () => {
    const allPageIds = availablePages.map(p => p.id);
    setSelectedPages(allPageIds);
  };

  const handleDeselectAll = () => {
    setSelectedPages([]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let response;
      
      if (activeTab === 'roles') {
        if (!selectedRoleId) {
          toast.error('Please select a role');
          return;
        }
        response = await pagePermissionService.updateRolePermissions(selectedRoleId, selectedPages);
      } else {
        if (!selectedUserId) {
          toast.error('Please select a user');
          return;
        }
        response = await pagePermissionService.updateUserPermissions(selectedUserId, selectedPages);
      }

      if (response.success) {
        toast.success('Permissions saved successfully');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error(error.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const pagesBySection = availablePages.reduce((acc, page) => {
    if (!acc[page.section]) acc[page.section] = [];
    acc[page.section].push(page);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Page Permissions</h2>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || (!selectedRoleId && !selectedUserId)}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Permissions
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            <button
              onClick={() => {
                setActiveTab('roles');
                setSelectedRoleId('');
                setSelectedUserId('');
                setSelectedPages([]);
              }}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'roles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              Role Permissions
            </button>
            <button
              onClick={() => {
                setActiveTab('users');
                setSelectedRoleId('');
                setSelectedUserId('');
                setSelectedPages([]);
              }}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              User Permissions
            </button>
          </nav>
        </div>

        {/* Selector */}
        <div className="mb-6">
          {activeTab === 'roles' ? (
            <Dropdown
              label="Select Role"
              options={[
                { value: '', label: 'Select a role' },
                ...roles.map(role => ({
                  value: role.id,
                  label: role.name,
                })),
              ]}
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
            />
          ) : (
            <Dropdown
              label="Select User"
              options={[
                { value: '', label: 'Select a user' },
                ...users.map(user => ({
                  value: user.id,
                  label: `${user.name} (${user.email || user.employeCode || user.employee_code || user.id})`,
                })),
              ]}
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            />
          )}
        </div>

        {/* Pages Selection */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading permissions...</p>
          </div>
        ) : selectedRoleId || selectedUserId ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Select pages to allow access. If none selected, user will see all pages.
              </p>
              <div className="flex gap-2">
                <Button variant="gray" className="text-sm px-3 py-1" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="gray" className="text-sm px-3 py-1" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            {Object.entries(pagesBySection).map(([section, pages]) => (
              <div key={section} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 capitalize">{section}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pages.map((page) => (
                    <label
                      key={page.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPages.includes(page.id)}
                        onChange={() => handleTogglePage(page.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{page.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Please select a {activeTab === 'roles' ? 'role' : 'user'} to manage permissions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PagePermissions;

