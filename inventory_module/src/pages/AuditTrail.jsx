import { useState, useEffect } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Table from '../components/common/Table'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import { TableSkeleton } from '../components/common/Skeleton'
import { auditService } from '../services/auditService.js'
import { format } from 'date-fns'

const AuditTrail = () => {
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [totalItems, setTotalItems] = useState(0)
  
  // Filters
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')
  const [action, setAction] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    fetchAuditLogs()
  }, [currentPage, itemsPerPage, entityType, entityId, action, startDate, endDate, userId])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
        ...(action && { action }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(userId && { userId }),
      }

      const response = await auditService.getAuditLogs(params)
      if (response.success) {
        setAuditLogs(response.data.auditLogs || [])
        setTotalItems(response.data.pagination?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const entityTypeOptions = [
    { value: '', label: 'All Entity Types' },
    { value: 'Material', label: 'Material' },
    { value: 'StockArea', label: 'Stock Area' },
    { value: 'InwardEntry', label: 'Inward Entry' },
    { value: 'MaterialRequest', label: 'Material Request' },
    { value: 'StockTransfer', label: 'Stock Transfer' },
    { value: 'ConsumptionRecord', label: 'Consumption Record' },
  ]

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
    { value: 'APPROVE', label: 'Approve' },
    { value: 'REJECT', label: 'Reject' },
  ]

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Audit Trail</h2>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Dropdown
            label="Entity Type"
            options={entityTypeOptions}
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value)
              setCurrentPage(1)
            }}
          />
          <Input
            label="Entity ID"
            value={entityId}
            onChange={(e) => {
              setEntityId(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Enter entity ID"
          />
          <Dropdown
            label="Action"
            options={actionOptions}
            value={action}
            onChange={(e) => {
              setAction(e.target.value)
              setCurrentPage(1)
            }}
          />
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setCurrentPage(1)
            }}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setCurrentPage(1)
            }}
          />
          <Input
            label="User ID"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Enter user ID"
          />
        </div>

        {loading ? (
          <TableSkeleton rows={10} columns={7} />
        ) : (
          <>
            <Table
              headers={['TIMESTAMP', 'ENTITY TYPE', 'ENTITY ID', 'ACTION', 'USER', 'CHANGES', 'IP ADDRESS']}
            >
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.audit_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.timestamp ? format(new Date(log.timestamp), 'dd-MM-yyyy HH:mm:ss') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.entityType || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.entityId || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge variant={
                        log.action === 'CREATE' ? 'success' :
                        log.action === 'UPDATE' ? 'primary' :
                        log.action === 'DELETE' ? 'danger' :
                        log.action === 'APPROVE' ? 'success' :
                        'warning'
                      }>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.userId || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.changes ? (
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-700">View Changes</summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.ipAddress || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              )}
            </Table>

            {totalItems > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AuditTrail









