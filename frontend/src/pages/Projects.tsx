import React, { useState, useEffect } from 'react'
import { FolderOpen, Plus, Search, Filter, ArrowLeft } from 'lucide-react'
import ProjectBuilder from '../components/ProjectBuilder'
import { useUploadStore } from '../uploadStore'

const Projects: React.FC = () => {
  const { uploads } = useUploadStore()
  const [showNewProject, setShowNewProject] = useState(false)
  const [manualOverride, setManualOverride] = useState(false)

  // Check if there are active uploads or files to show project creation state
  useEffect(() => {
    const hasUploads = Array.from(uploads.values()).length > 0
    if (hasUploads && !manualOverride) {
      setShowNewProject(true)
    } else if (!hasUploads) {
      setShowNewProject(false)
      setManualOverride(false) // Reset manual override when no uploads
    }
  }, [uploads, manualOverride])
  const projects = [
    { id: 1, name: 'Website Localization Q1', languages: 'EN → FR, DE, ES', words: '12,450', deadline: '2024-02-15', status: 'In Progress' },
    { id: 2, name: 'Mobile App Translation', languages: 'EN → JP, KR', words: '8,320', deadline: '2024-02-10', status: 'Review' },
    { id: 3, name: 'Marketing Materials', languages: 'EN → IT, PT', words: '5,670', deadline: '2024-02-20', status: 'Draft' },
    { id: 4, name: 'Technical Documentation', languages: 'EN → ZH, RU', words: '23,100', deadline: '2024-03-01', status: 'In Progress' },
  ]

  if (showNewProject) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => {
              setShowNewProject(false)
              setManualOverride(true)
            }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </button>
        </div>
        <ProjectBuilder />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Projects</h1>
          <button 
            onClick={() => {
              setShowNewProject(true)
              setManualOverride(false)
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Languages</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FolderOpen className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-900">{project.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{project.languages}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{project.words}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{project.deadline}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    project.status === 'Review' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Projects
