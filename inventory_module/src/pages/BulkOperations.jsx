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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setUploading(true)
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        toast.error('File must contain at least a header row and one data row')
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())
      
      if (uploadType === 'materials') {
        const materials = []
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
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
        // For inward entries, the structure is more complex
        // This would need to be implemented based on the actual CSV structure
        toast.info('Bulk inward import coming soon')
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
              Upload a CSV file with inward entry data (coming soon)
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setUploadType('inward')
                setShowModal(true)
              }}
              disabled
            >
              <Upload className="w-4 h-4 mr-2 inline" />
              Import Inward (Coming Soon)
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
              'Bulk inward import is coming soon.'
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









