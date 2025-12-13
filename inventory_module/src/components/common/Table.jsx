const Table = ({ 
  headers, 
  children, 
  data, 
  columns,
  // Selection props
  selectable = false,
  selectedIds = [],
  onSelectAll,
  onSelectRow
}) => {
  // Support both patterns: headers/children (old) and data/columns (new)
  if (data && columns) {
    // New pattern: data and columns
    const safeData = Array.isArray(data) ? data : []
    const safeColumns = Array.isArray(columns) ? columns : []
    
    // Check if all rows are selected
    const allSelected = selectable && safeData.length > 0 && 
      safeData.every(row => selectedIds.includes(row.id))
    const someSelected = selectable && 
      safeData.some(row => selectedIds.includes(row.id))
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-100">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected && !allSelected
                    }}
                    onChange={(e) => {
                      if (onSelectAll) {
                        onSelectAll(e.target.checked)
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
              )}
              {safeColumns.map((column, index) => (
                <th
                  key={column.key || index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                >
                  {column.label || column.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {safeData.length > 0 ? (
              safeData.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="hover:bg-gray-50">
                  {selectable && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => {
                          if (onSelectRow) {
                            onSelectRow(row.id, e.target.checked)
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                  )}
                  {safeColumns.map((column, colIndex) => (
                    <td
                      key={column.key || colIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render ? column.render(row) : (row[column.key] || '-')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={safeColumns.length + (selectable ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }
  
  // Old pattern: headers and children
  const safeHeaders = Array.isArray(headers) ? headers : []
  
  // For old pattern, we can't determine total rows from children
  // So we rely on the parent component's handleSelectAll to manage state
  // The checkbox will show checked if all current selectedIds match what parent considers "all"
  const allSelectedInOldPattern = selectable && selectedIds.length > 0
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-100">
          <tr>
            {selectable && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={allSelectedInOldPattern}
                  ref={(input) => {
                    if (input && selectable) {
                      // Indeterminate state when some but not all selected
                      // Since we can't count children, we'll let parent handle the visual state
                      input.indeterminate = false
                    }
                  }}
                  onChange={(e) => {
                    if (onSelectAll) {
                      onSelectAll(e.target.checked)
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
            )}
            {safeHeaders.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
      </table>
    </div>
  )
}

export default Table



