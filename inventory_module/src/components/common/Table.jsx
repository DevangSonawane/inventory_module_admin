const Table = ({ headers, children, data, columns }) => {
  // Support both patterns: headers/children (old) and data/columns (new)
  if (data && columns) {
    // New pattern: data and columns
    const safeData = Array.isArray(data) ? data : []
    const safeColumns = Array.isArray(columns) ? columns : []
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-100">
            <tr>
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
                <td colSpan={safeColumns.length} className="px-6 py-12 text-center text-gray-500">
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
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-100">
          <tr>
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



