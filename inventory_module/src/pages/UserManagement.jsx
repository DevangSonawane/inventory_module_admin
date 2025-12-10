import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Loader2, UserPlus, UserX, UserCheck } from 'lucide-react'
import { toast } from 'react-toastify'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Badge from '../components/common/Badge'
import { TableSkeleton } from '../components/common/Skeleton'
import { userService } from '../services/userService.js'
import Modal from '../components/common/Modal'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeCode: '',
    phoneNumber: '',
    password: '',
    role: 'user',
    isActive: true,
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchUsers()
  }, [currentPage, itemsPerPage, searchTerm])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await userService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      })

      if (response.success) {
        setUsers(response.data?.users || [])
        setTotalItems(response.data?.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      employeCode: '',
      phoneNumber: '',
      password: '',
      role: 'user',
      isActive: true,
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      employeCode: user.employeCode || user.employee_code || '',
      phoneNumber: user.phoneNumber || user.phone_number || '',
      password: '',
      role: user.role || 'user',
      isActive: user.isActive !== false,
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const response = await userService.delete(userId)
      if (response.success) {
        toast.success('User deleted successfully')
        fetchUsers()
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error.message || 'Failed to delete user')
    }
  }

  const handleToggleActive = async (user) => {
    try {
      const response = await userService.update(user.id, {
        isActive: !user.isActive,
      })
      if (response.success) {
        toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`)
        fetchUsers()
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(error.message || 'Failed to update user')
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    if (!editingUser && !formData.password) errors.password = 'Password is required'
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const submitData = { ...formData }
      if (editingUser && !submitData.password) {
        delete submitData.password
      }

      let response
      if (editingUser) {
        response = await userService.update(editingUser.id, submitData)
      } else {
        response = await userService.create(submitData)
      }

      if (response.success || response.id) {
        toast.success(`User ${editingUser ? 'updated' : 'created'} successfully`)
        setShowModal(false)
        fetchUsers()
      }
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error(error.message || `Failed to ${editingUser ? 'update' : 'create'} user`)
    }
  }

  const roleOptions = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
  ]

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <Button variant="primary" onClick={handleCreate}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={10} columns={7} />
        ) : (
          <>
            <Table
              headers={['NAME', 'EMAIL', 'EMPLOYEE CODE', 'PHONE', 'ROLE', 'STATUS', 'ACTIONS']}
            >
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.employeCode || user.employee_code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.phoneNumber || user.phone_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge variant={user.role === 'admin' ? 'primary' : 'secondary'}>
                        {user.role || 'user'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge variant={user.isActive !== false ? 'success' : 'danger'}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="text-yellow-600 hover:text-yellow-700"
                          title={user.isActive !== false ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive !== false ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </Table>

            {totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </>
        )}
      </div>

      {/* User Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingUser ? 'Edit User' : 'Create User'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
            />
            <Input
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
            />
            <Input
              label="Employee Code"
              value={formData.employeCode}
              onChange={(e) => setFormData({ ...formData, employeCode: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
            <Input
              label={editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
              type="password"
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={formErrors.password}
            />
            <Dropdown
              label="Role"
              options={roleOptions}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default UserManagement

