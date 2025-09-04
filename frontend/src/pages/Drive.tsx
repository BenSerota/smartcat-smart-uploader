import React from 'react'
import { Folder, File, Upload, Download, MoreHorizontal, Search, Filter } from 'lucide-react'

const Drive: React.FC = () => {
  const files = [
    { id: 1, name: 'Project_Proposal.docx', type: 'document', size: '2.4 MB', modified: '2024-01-15', status: 'Ready' },
    { id: 2, name: 'Marketing_Brochure.pdf', type: 'pdf', size: '5.1 MB', modified: '2024-01-14', status: 'Processing' },
    { id: 3, name: 'Website_Content.xlsx', type: 'spreadsheet', size: '1.8 MB', modified: '2024-01-13', status: 'Ready' },
    { id: 4, name: 'User_Manual.pdf', type: 'pdf', size: '12.3 MB', modified: '2024-01-12', status: 'Ready' },
    { id: 5, name: 'Product_Catalog.docx', type: 'document', size: '3.7 MB', modified: '2024-01-11', status: 'Processing' },
  ]

  const folders = [
    { id: 1, name: 'Q1_Projects', files: 12, modified: '2024-01-15' },
    { id: 2, name: 'Marketing_Materials', files: 8, modified: '2024-01-14' },
    { id: 3, name: 'Technical_Docs', files: 15, modified: '2024-01-13' },
    { id: 4, name: 'Client_Assets', files: 23, modified: '2024-01-12' },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Drive</h1>
          <div className="flex items-center space-x-3">
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files and folders..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Folders Section */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Folders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <div key={folder.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <Folder className="w-8 h-8 text-blue-500" />
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{folder.name}</h3>
              <p className="text-sm text-gray-500">{folder.files} files</p>
              <p className="text-xs text-gray-400 mt-1">Modified {folder.modified}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Files Section */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Files</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <File className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="font-medium text-gray-900">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{file.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{file.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{file.modified}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      file.status === 'Ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {file.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Drive
