import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Projects from './pages/Projects'
import Drive from './pages/Drive'
import Orders from './pages/Orders'
import { ToastContainer } from './components/Toast'

// Placeholder pages
const Home = () => (
  <div className="p-6">
    <h1 className="text-2xl font-semibold mb-4">Welcome to Smartcat</h1>
    <p className="text-gray-600">Select an option from the menu to get started.</p>
  </div>
)

const Marketplace = () => (
  <div className="p-6">
    <h1 className="text-2xl font-semibold mb-4">Marketplace</h1>
    <p className="text-gray-600">Find professional translators and language services.</p>
  </div>
)

const Clients = () => (
  <div className="p-6">
    <h1 className="text-2xl font-semibold mb-4">Clients</h1>
    <p className="text-gray-600">Manage your client relationships.</p>
  </div>
)

export default function App() {
  return (
    <Router>
      <>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/drive" element={<Drive />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/smartwords" element={<Navigate to="/projects" />} />
            <Route path="/linguistic-assets" element={<Navigate to="/projects" />} />
            <Route path="/integrations" element={<Navigate to="/projects" />} />
            <Route path="/team" element={<Navigate to="/projects" />} />
            <Route path="/settings" element={<Navigate to="/projects" />} />
          </Routes>
        </Layout>
        <ToastContainer />
      </>
    </Router>
  )
}