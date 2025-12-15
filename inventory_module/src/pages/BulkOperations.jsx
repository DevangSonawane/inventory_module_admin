import { useState } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { bulkService } from '../services/bulkService.js'

const BulkOperations = () => {
  const [uploading, setUploading] = useState(false)
  const [uploadType, setUploadType] = useState('materials')
  const [showModal, setShowModal] = useState(false)

  const parseCsv = (text) => {
    const rows = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)

    if (rows.length < 2) {
      throw new Error('File must contain a header row and at least one data row')
    }

    const headers = rows[0]
      .split(',')
      .map(h => h.trim().replace(/"/g, '').toLowerCase())

    const dataRows = rows.slice(1).map(row =>
      row.split(',').map(v => v.trim().replace(/"/g, ''))
    )

    return { headers, dataRows }
  }

  const getValue = (headers, row, keys) => {
    for (const key of keys) {
      const index = headers.indexOf(key)
      if (index !== -1) {
        return row[index] || ''
      }
    }
    return ''
  }

  const buildInwardPayload = (headers, dataRows) => {
    const entriesMap = new Map()
    const invalidRows = []

    dataRows.forEach((row, idx) => {
      const date = getValue(headers, row, ['date'])
      const invoiceNumber = getValue(headers, row, ['invoicenumber', 'invoice number', 'invoice'])
      const partyName = getValue(headers, row, ['partyname', 'party name', 'vendor'])
      const purchaseOrder = getValue(headers, row, ['purchaseorder', 'purchase order', 'po'])
      const poId = getValue(headers, row, ['poid', 'po id'])
      const stockAreaId = getValue(headers, row, ['stockareaid', 'stock area id'])
      const vehicleNumber = getValue(headers, row, ['vehiclenumber', 'vehicle number'])
      const remark = getValue(headers, row, ['remark', 'remarks'])

      const materialId = getValue(headers, row, ['materialid', 'material id'])
      const quantityRaw = getValue(headers, row, ['quantity', 'qty'])
      const priceRaw = getValue(headers, row, ['price', 'unitprice', 'unit price'])
      const serialNumber = getValue(headers, row, ['serialnumber', 'serial number', 'serial'])
      const macId = getValue(headers, row, ['macid', 'mac id'])
      const itemRemarks = getValue(headers, row, ['itemremark', 'item remark', 'itemremarks'])

      const quantity = Number(quantityRaw || 0)
      const price = priceRaw ? Number(priceRaw) : undefined

      if (!date || !invoiceNumber || !partyName || !stockAreaId || !materialId || !quantity) {
        invalidRows.push(idx + 2) // +2 to account for header and 0-based index
        return
      }

      const key = `${invoiceNumber}-${partyName}-${date}-${stockAreaId}-${purchaseOrder}-${vehicleNumber}-${remark}-${poId}`

      if (!entriesMap.has(key)) {
        entriesMap.set(key, {
          date,
          invoiceNumber,
          partyName,
          purchaseOrder: purchaseOrder || undefined,
          poId: poId || undefined,
          stockAreaId,
          vehicleNumber: vehicleNumber || undefined,
          remark: remark || undefined,
          items: [],
        })
      }

      entriesMap.get(key).items.push({
        materialId,
        quantity,
        price,
        serialNumber: serialNumber || undefined,
        macId: macId || undefined,
        remarks: itemRemarks || undefined,
      })
    })

    return { entries: Array.from(entriesMap.values()), invalidRows }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setUploading(true)
      const text = await file.text()
      const { headers, dataRows } = parseCsv(text)

      if (uploadType === 'materials') {
        const materials = []
        for (const values of dataRows) {
          const material = {}
          headers.forEach((header, index) => {
            if (header === 'materialname' || header === 'material name') {
              material.materialName = values[index]
            } else if (header === 'productcode' || header === 'product code') {
              material.productCode = values[index]
            } else if (header === 'materialtype' || header === 'material type') {
              material.materialType = values[index]
            } else if (header === 'uom') {
              material.uom = values[index]
            } else if (header === 'description') {
              material.description = values[index]
            }
          })
          if (material.materialName && material.productCode && material.materialType) {
            materials.push(material)
          }
        }

        if (materials.length === 0) {
          toast.error('No valid materials found in file')
          return
        }

        const response = await bulkService.bulkMaterials(materials)
        if (response.success) {
          toast.success(`Successfully imported ${response.data.created || materials.length} materials`)
          setShowModal(false)
        }
      } else if (uploadType === 'inward') {
        const { entries, invalidRows } = buildInwardPayload(headers, dataRows)

        if (invalidRows.length) {
          toast.error(`Invalid or missing required fields on rows: ${invalidRows.join(', ')}`)
          return
        }

        if (!entries.length) {
          toast.error('No valid inward entries found in file')
          return
        }

        const response = await bulkService.bulkInward(entries)
        if (response.success) {
          const createdCount = response.data?.created ?? entries.length
          const errorCount = response.data?.errors ?? 0
          toast.success(`Imported ${createdCount} inward entries${errorCount ? ` (${errorCount} failed)` : ''}`)
          setShowModal(false)
        }
      }
    } catch (error) {
      console.error('Error processing file:', error)
      toast.error(error.message || 'Failed to process file')
    } finally {
      setUploading(false)
      event.target.value = '' // Reset file input
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Bulk Operations</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Bulk Import Materials</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with columns: MaterialName, ProductCode, MaterialType, UOM, Description
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setUploadType('materials')
                setShowModal(true)
              }}
            >
              <Upload className="w-4 h-4 mr-2 inline" />
              Import Materials
            </Button>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Bulk Import Inward</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with inward entry and item details
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setUploadType('inward')
                setShowModal(true)
              }}
            >
              <Upload className="w-4 h-4 mr-2 inline" />
              Import Inward
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Bulk Import ${uploadType === 'materials' ? 'Materials' : 'Inward Entries'}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {uploadType === 'materials' ? (
              <>
                Please upload a CSV file with the following columns:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>MaterialName (required)</li>
                  <li>ProductCode (required)</li>
                  <li>MaterialType (required)</li>
                  <li>UOM (optional)</li>
                  <li>Description (optional)</li>
                </ul>
              </>
            ) : (
              <>
                Each row represents one item. Required columns:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Date</li>
                  <li>InvoiceNumber</li>
                  <li>PartyName</li>
                  <li>StockAreaId</li>
                  <li>MaterialId</li>
                  <li>Quantity</li>
                </ul>
                Optional columns: PurchaseOrder, POId, VehicleNumber, Remark, Price, SerialNumber, MacId, ItemRemark.
                Entries with the same invoice/date/party/stock area are grouped into one inward entry.
              </>
            )}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {uploading && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing file...</span>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="gray" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default BulkOperations









