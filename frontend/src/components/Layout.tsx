import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  FolderOpen, 
  FileText, 
  ShoppingCart, 
  Users, 
  Store, 
  Languages, 
  Settings,
  ChevronLeft,
  Globe,
  User
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  
  const menuItems = [
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/drive', icon: Home, label: 'Drive' },
    { path: '/smartwords', icon: Languages, label: 'Smartwords' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/marketplace', icon: Store, label: 'Marketplace' },
    { path: '/linguistic-assets', icon: FileText, label: 'Linguistic assets' },
    { path: '/integrations', icon: Globe, label: 'Integrations' },
    { path: '/team', icon: Users, label: 'Team' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-4 border-b border-gray-200">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center text-white font-bold">
              SC
            </div>
            <span className="font-semibold text-xl">Smartcat</span>
          </Link>
        </div>

        {/* Hub Section */}
        <div className="p-3">
          <Link to="/" className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">Hub</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive 
                        ? 'bg-purple-50 text-purple-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">BS</div>
              <div className="text-xs text-gray-500">Work</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-medium">
              {location.pathname === '/' && 'Hub'}
              {location.pathname === '/projects' && 'Projects'}
              {location.pathname === '/drive' && 'Drive'}
              {location.pathname === '/orders' && 'Orders'}
              {location.pathname === '/clients' && 'Clients'}
              {location.pathname === '/marketplace' && 'Marketplace'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
              60,053 credits
            </div>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors">
              + New
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
