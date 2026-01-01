import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Table from '../components/common/Table';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { TableSkeleton } from '../components/common/Skeleton';
import { hsnCodeService } from '../services/hsnCodeService.js';

const HSNCodeManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = Boolean(id && id !== 'new');
  const isCreateMode = location.pathname.endsWith('/hsn-code-management/new');

  const [hsnCodes, setHsnCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCodeId, setDeleteCodeId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    hsnCode: '',
    description: '',
    gstRate: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [selectedHsnCode, setSelectedHsnCode] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      fetchHsnCode();
    } else {
      resetForm();
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (isCreateMode && !isEditMode) {
      resetForm();
      setShowModal(true);
    } else if (!isEditMode) {
      setShowModal(false);
    }
  }, [isCreateMode, isEditMode]);

  useEffect(() => {
    fetchHsnCodes();
  }, [currentPage, itemsPerPage, searchTerm]);

  const fetchHsnCodes = async () => {
    try {
      setLoading(true);
      const response = await hsnCodeService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });

      if (response.success) {
        setHsnCodes(response.data.hsnCodes || []);
        setTotalItems(response.data.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Error fetching HSN codes:', error);
      toast.error('Failed to load HSN codes');
      setHsnCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHsnCode = async () => {
    try {
      setLoading(true);
      const response = await hsnCodeService.getById(id);
      if (response.success) {
        const code = response.data.hsnCode || response.data;
        setFormData({
          hsnCode: code.hsn_code || '',
          description: code.description || '',
          gstRate: code.gst_rate ? code.gst_rate.toString() : '',
        });
        setSelectedHsnCode(code);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching HSN code:', error);
      toast.error('Failed to load HSN code');
      navigate('/admin/hsn-code-management');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      hsnCode: '',
      description: '',
      gstRate: '',
    });
    setFormErrors({});
    setSelectedHsnCode(null);
  };

  const validateForm = () => {
    let errors = {};
    if (!formData.hsnCode.trim()) {
      errors.hsnCode = 'HSN code is required';
    } else if (formData.hsnCode.trim().length > 50) {
      errors.hsnCode = 'HSN code must not exceed 50 characters';
    }
    if (formData.gstRate && (parseFloat(formData.gstRate) < 0 || parseFloat(formData.gstRate) > 100)) {
      errors.gstRate = 'GST rate must be between 0 and 100';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const data = {
        hsnCode: formData.hsnCode.trim(),
        description: formData.description.trim() || undefined,
        gstRate: formData.gstRate.trim() || undefined,
      };

      let response;
      if (isEditMode) {
        response = await hsnCodeService.update(id, data);
      } else {
        response = await hsnCodeService.create(data);
      }

      if (response.success) {
        toast.success(`HSN code ${isEditMode ? 'updated' : 'created'} successfully!`);
        setShowModal(false);
        resetForm();
        fetchHsnCodes();
        navigate('/admin/hsn-code-management');
      } else {
        toast.error(response.message || `Failed to ${isEditMode ? 'update' : 'create'} HSN code`);
      }
    } catch (error) {
      console.error('Error saving HSN code:', error);
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} HSN code`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (codeId) => {
    setDeleteCodeId(codeId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteCodeId) return;
    try {
      setSaving(true);
      const response = await hsnCodeService.delete(deleteCodeId);
      if (response.success) {
        toast.success('HSN code deleted successfully!');
        setShowDeleteModal(false);
        setDeleteCodeId(null);
        fetchHsnCodes();
      } else {
        toast.error(response.message || 'Failed to delete HSN code');
      }
    } catch (error) {
      console.error('Error deleting HSN code:', error);
      toast.error(error.message || 'Failed to delete HSN code');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const columns = [
    { key: 'srNo', label: 'Sr. No.' },
    { key: 'hsnCode', label: 'HSN Code' },
    { key: 'description', label: 'Description' },
    { key: 'gstRate', label: 'GST Rate (%)' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/admin/hsn-code-management/${row.id}`)}
            className="text-blue-600 hover:text-blue-700"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-700"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const tableData = hsnCodes.map((code, index) => ({
    id: code.hsn_code_id,
    srNo: (currentPage - 1) * itemsPerPage + index + 1,
    hsnCode: code.hsn_code,
    description: code.description || '-',
    gstRate: code.gst_rate ? `${code.gst_rate}%` : '-',
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">HSN Code Management</h2>
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => navigate('/admin/hsn-code-management/new')}>
              <Plus className="w-4 h-4 mr-2 inline" />
              Add New HSN Code
            </Button>
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
                fetchHsnCodes();
                toast.success('HSN codes refreshed');
              }}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search HSN codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={10} columns={5} />
        ) : (
          <>
            <Table headers={columns.map(col => col.label)} data={tableData} columns={columns} />

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

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowModal(false);
            resetForm();
            navigate('/admin/hsn-code-management');
          }}
          title={isEditMode ? 'Edit HSN Code' : 'Add New HSN Code'}
          size="md"
        >
          <div className="space-y-4">
            <Input
              label="HSN Code"
              required
              value={formData.hsnCode}
              onChange={(e) => {
                setFormData({ ...formData, hsnCode: e.target.value });
                setFormErrors({ ...formErrors, hsnCode: '' });
              }}
              error={formErrors.hsnCode}
              placeholder="e.g., 12345678"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <Input
              label="GST Rate (%) (Optional)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.gstRate}
              onChange={(e) => {
                setFormData({ ...formData, gstRate: e.target.value });
                setFormErrors({ ...formErrors, gstRate: '' });
              }}
              error={formErrors.gstRate}
              placeholder="e.g., 18.00"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                resetForm();
                navigate('/admin/hsn-code-management');
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </Modal>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteCodeId(null);
        }}
        onConfirm={confirmDelete}
        title="Delete HSN Code"
        message="Are you sure you want to delete this HSN code? This action cannot be undone."
        confirmText={saving ? 'Deleting...' : 'Delete'}
        variant="danger"
        disabled={saving}
      />
    </div>
  );
};

export default HSNCodeManagement;

