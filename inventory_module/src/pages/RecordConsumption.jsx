import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import { consumptionService } from '../services/consumptionService.js'
import { businessPartnerService } from '../services/businessPartnerService.js'
import { personStockService } from '../services/personStockService.js'
import { useAuth } from '../utils/useAuth.js'

const RecordConsumption = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeButton, setActiveButton] = useState('new-consumption')
  const [saving, setSaving] = useState(false)

  const [externalSystemRefId, setExternalSystemRefId] = useState('')
  const [isExternalRefSelected, setIsExternalRefSelected] = useState(false)

  const [customerData, setCustomerData] = useState({
    customerName: '',
    email: '',
    mobileNo: '',
    remark: '',
    franchise: '',
  })

  const [searchBy, setSearchBy] = useState('asset-id')
  const [searchAssetId, setSearchAssetId] = useState('')
  const [externalSystemRefOptions, setExternalSystemRefOptions] = useState([
    { value: '', label: 'Select External System Ref. ID' },
  ])
  const [loadingRefs, setLoadingRefs] = useState(false)
  const [loadingCustomerData, setLoadingCustomerData] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [franchiseOptions, setFranchiseOptions] = useState([
    { value: '', label: 'Select Franchise' },
  ])
  const [personStockSerials, setPersonStockSerials] = useState(new Set())
  const [loadingPersonStock, setLoadingPersonStock] = useState(false)

  const searchByOptions = [
    { value: 'asset-id', label: 'Asset ID' },
    { value: 'other', label: 'Other' },
  ]

  // Fetch external refs and business partners on mount
  useEffect(() => {
    const fetchExternalRefIds = async () => {
      try {
        setLoadingRefs(true)
        const response = await consumptionService.getAll({ limit: 1000 })

        if (response.success && response.data?.consumptions) {
          // Get unique external_system_ref_id values
          const uniqueRefs = [
            ...new Set(
              response.data.consumptions
                .map((c) => c.external_system_ref_id)
                .filter((ref) => ref && ref.trim() !== '')
            ),
          ].sort()

          setExternalSystemRefOptions([
            { value: '', label: 'Select External System Ref. ID' },
            ...uniqueRefs.map((ref) => ({ value: ref, label: ref })),
          ])
        }
      } catch (error) {
        console.error('Error fetching external ref IDs:', error)
        toast.error('Failed to load external system reference IDs')
      } finally {
        setLoadingRefs(false)
      }
    }

    const fetchFranchises = async () => {
      try {
        const response = await businessPartnerService.getAll({ limit: 1000 })
        if (response.success) {
          const partners =
            response.data?.businessPartners ||
            response.data?.data ||
            response.data?.items ||
            []

          const partnerOptions = partners
            .map((partner) => {
              const partnerName =
                partner.partner_name ||
                partner.partnerName ||
                partner.name ||
                'Business Partner'
              const partnerType = partner.partner_type || partner.partnerType || partner.type || ''
              const typeSuffix = partnerType ? ` (${partnerType})` : ''

              return {
                value:
                  partner.partner_name ||
                  partner.partnerName ||
                  partner.name ||
                  partner.partner_id ||
                  partner.id ||
                  '',
                label: `${partnerName}${typeSuffix}`,
              }
            })
            .filter((opt) => opt.value)

          setFranchiseOptions([
            { value: '', label: 'Select Franchise' },
            ...partnerOptions,
          ])
        }
      } catch (error) {
        console.error('Error fetching business partners:', error)
        toast.error('Failed to load business partners')
      }
    }

    fetchExternalRefIds()
    fetchFranchises()
  }, [])

  // Load technician/person stock once user context is available
  useEffect(() => {
    const fetchPersonStock = async () => {
      if (!user?.id && !user?.user_id) return
      try {
        setLoadingPersonStock(true)
        const response = await personStockService.getAll({
          userId: user.id || user.user_id,
          limit: 1000,
        })
        const items =
          response?.data?.personStock ||
          response?.data?.data ||
          response?.data ||
          response?.personStock ||
          []
        const serials = new Set()
        items.forEach((item) => {
          if (item.serial_number) {
            serials.add(String(item.serial_number).trim().toLowerCase())
          }
        })
        setPersonStockSerials(serials)
      } catch (error) {
        console.error('Error loading person stock:', error)
        toast.error('Unable to load technician stock for validation')
      } finally {
        setLoadingPersonStock(false)
      }
    }

    fetchPersonStock()
  }, [user])

  // Fetch customer data and items when external system ref is selected
  const handleExternalSystemRefChange = async (value) => {
    setExternalSystemRefId(value)
    
    if (!value) {
      setIsExternalRefSelected(false)
      setCustomerData({
        customerName: '',
        email: '',
        mobileNo: '',
        remark: '',
        franchise: '',
      })
      setTableData([])
      return
    }

    try {
      setLoadingCustomerData(true)
      setLoadingItems(true)
      
      // Fetch consumption records for this external system ref ID
      const response = await consumptionService.getAll({ 
        externalSystemRefId: value,
        limit: 1 // Get the most recent one
      })
      
      if (response.success && response.data?.consumptions?.length > 0) {
        const consumption = response.data.consumptions[0]
        
        // Extract customer data from customer_data JSON field
        if (consumption.customer_data) {
          let customer = consumption.customer_data
          if (typeof customer === 'string') {
            try {
              customer = JSON.parse(customer)
            } catch (err) {
              console.error('Failed to parse customer_data JSON string', err)
              customer = {}
            }
          }
          const name =
            customer.customerName ||
            customer.customer_name ||
            customer.name ||
            customer.fullName ||
            ''
          const email =
            customer.email ||
            customer.customerEmail ||
            customer.contact_email ||
            customer.emailId ||
            ''
          const phone =
            customer.mobileNo ||
            customer.mobile_no ||
            customer.phoneNumber ||
            customer.contact_number ||
            customer.phone ||
            ''

          setCustomerData({
            customerName: name,
            email,
            mobileNo: phone,
            remark: customer.remark || consumption.remarks || '',
            franchise: customer.franchise || customer.Franchise || customerData.franchise || '',
          })
        } else {
          // Fallback: use remarks if customer_data is not available
          setCustomerData({
            customerName: '',
            email: '',
            mobileNo: '',
            remark: consumption.remarks || '',
            franchise: customerData.franchise || '',
          })
        }
        
        setIsExternalRefSelected(true)
        
        // Fetch items for this consumption record
        if (consumption.consumption_id) {
          try {
            const itemResponse = await consumptionService.getById(consumption.consumption_id)
            if (itemResponse.success && itemResponse.data?.items) {
              // Transform items to match table format
              const items = itemResponse.data.items.map((item, index) => ({
                id: item.item_id || `item-${index}`,
                selected: false,
                itemName: item.material?.material_name || 'Unknown Material',
                properties: item.material?.properties || item.material?.description || '-',
                grnNo: '-', // GRN number might need to come from inward entry
                assetId: item.serial_number || '-',
                requestedQuantity: item.quantity || 0,
                remarks: item.remarks || '-',
                materialId: item.material_id,
              }))
              setTableData(items)
            } else {
              setTableData([])
            }
          } catch (itemError) {
            console.error('Error fetching consumption items:', itemError)
            setTableData([])
          }
        } else {
          setTableData([])
        }
      } else {
        // No consumption record found for this ref ID
        setIsExternalRefSelected(false)
        setCustomerData({
          customerName: '',
          email: '',
          mobileNo: '',
          remark: '',
          franchise: '',
        })
        setTableData([])
        toast.info('No consumption record found for this reference ID')
      }
    } catch (error) {
      console.error('Error fetching customer data:', error)
      toast.error('Failed to load customer data')
      setIsExternalRefSelected(false)
      setCustomerData({
        customerName: '',
        email: '',
        mobileNo: '',
        remark: '',
        franchise: '',
      })
      setTableData([])
    } finally {
      setLoadingCustomerData(false)
      setLoadingItems(false)
    }
  }

  // Table data state
  const [tableData, setTableData] = useState([])

  const paginatedData = tableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(tableData.length / itemsPerPage)

  const handleSave = async () => {
    if (saving) return

    if (!externalSystemRefId) {
      toast.error('Please select External System Ref. ID')
      return
    }

    const selectedItems = tableData.filter((item) => item.selected)
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item')
      return
    }

    // Validate serials against technician/person stock where provided
    const missingSerials = selectedItems
      .map((item) => item.assetId && item.assetId !== '-' ? String(item.assetId).trim() : null)
      .filter(Boolean)
      .filter((serial) => !personStockSerials.has(serial.toLowerCase()))

    if (missingSerials.length > 0) {
      toast.error(`Serials not in your stock: ${missingSerials.join(', ')}`)
      return
    }

    if (!user?.id && !user?.user_id) {
      toast.error('User context missing. Please re-login and try again.')
      return
    }

    try {
      setSaving(true)
      const payload = {
        externalSystemRefId,
        customerData,
        consumptionDate: new Date().toISOString().split('T')[0],
        items: selectedItems.map((item) => ({
          materialId: item.materialId,
          quantity: item.requestedQuantity || 1,
          serialNumber: item.assetId && item.assetId !== '-' ? item.assetId : null,
          remarks: item.remarks && item.remarks !== '-' ? item.remarks : null,
        })),
        remarks: customerData.remark,
        fromUserId: user?.id || user?.user_id,
      }

      const response = await consumptionService.create(payload)
      if (response.success) {
        toast.success('Record consumption saved successfully!')
        navigate('/record-consumption')
      } else {
        toast.error(response.message || 'Failed to save record consumption')
      }
    } catch (error) {
      console.error('Error saving record consumption:', error)
      toast.error(error.message || 'Failed to save record consumption')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Details</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Dropdown
            label="External System Ref. ID"
            required
            options={externalSystemRefOptions}
            value={externalSystemRefId}
            onChange={(e) => handleExternalSystemRefChange(e.target.value)}
            disabled={loadingRefs}
            loading={loadingRefs}
          />
          
          {loadingCustomerData && (
            <div className="col-span-2 text-sm text-gray-500">
              Loading customer data...
            </div>
          )}
          {isExternalRefSelected && !loadingCustomerData && (
            <>
              <Input
                label="Customer Name"
                value={customerData.customerName}
                readOnly
                className="bg-gray-50"
              />
              <Input
                label="Email"
                value={customerData.email}
                readOnly
                className="bg-gray-50"
              />
              <Input
                label="Mobile No."
                value={customerData.mobileNo}
                readOnly
                className="bg-gray-50"
              />
              <Input
                label="Remark"
                value={customerData.remark}
                readOnly
                className="bg-gray-50"
              />
              <Dropdown
                label="Franchise"
                options={franchiseOptions}
                value={customerData.franchise}
                onChange={(e) => setCustomerData({ ...customerData, franchise: e.target.value })}
              />
            </>
          )}
        </div>

        {isExternalRefSelected && (
          <>
            <div className="flex gap-4 mb-6">
              <Button
                variant={activeButton === 'new-consumption' ? 'primary' : 'gray'}
                onClick={() => setActiveButton('new-consumption')}
              >
                New Consumption
              </Button>
              <Button
                variant={activeButton === 'allocate-items' ? 'primary' : 'gray'}
                onClick={() => setActiveButton('allocate-items')}
              >
                Allocate Items
              </Button>
            </div>

            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search By</h3>
              <div className="flex gap-4 items-end">
                <div className="w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search By</label>
                  <Dropdown
                    options={searchByOptions}
                    value={searchBy}
                    onChange={(e) => setSearchBy(e.target.value)}
                  />
                </div>
                <div className="flex-1 max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-1 invisible">
                    Search Asset ID
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search Asset ID"
                      value={searchAssetId}
                      onChange={(e) => setSearchAssetId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 h-[38px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {loadingItems ? (
              <div className="text-center py-12 text-gray-500">
                Loading items...
              </div>
            ) : (
              <Table
                headers={['SELECT', 'ITEM NAME', 'PROPERTIES', 'GRN NO.', 'ASSET ID', 'REQUESTED QUANTITY', 'REMARKS']}
              >
                {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => {
                          setTableData(tableData.map(i =>
                            i.id === item.id ? { ...i, selected: e.target.checked } : i
                          ))
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.properties}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.grnNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.assetId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.requestedQuantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.remarks}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No data found
                  </td>
                </tr>
              )}
              </Table>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages || 1}
              itemsPerPage={itemsPerPage}
              totalItems={tableData.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}

        <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-gray-200">
          <Button variant="gray" onClick={() => navigate('/record-consumption')}>
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RecordConsumption

