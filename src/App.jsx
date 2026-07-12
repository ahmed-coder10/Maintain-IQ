import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/UI';

// Layout & Route Guards
import { Layout } from './components/Layout';
import { Protected } from './components/Protected';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import TechnicianPanel from './pages/TechnicianPanel';
import PublicAsset from './pages/PublicAsset';
import ReportIssue from './pages/ReportIssue';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              
              {/* Public Routes (Scan Portal - No Login Required) */}
              <Route path="/public/asset/:id" element={<PublicAsset />} />
              <Route path="/public/report/:id" element={<ReportIssue />} />
              
              {/* Auth Credentials Page */}
              <Route path="/login" element={<Login />} />

              {/* Private Protected Dashboard Workspace */}
              <Route 
                path="/" 
                element={
                  <Protected allowedRoles={['admin', 'technician']}>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </Protected>
                } 
              />
              
              <Route 
                path="/assets" 
                element={
                  <Protected allowedRoles={['admin']}>
                    <Layout>
                      <Assets />
                    </Layout>
                  </Protected>
                } 
              />
              
              <Route 
                path="/technician" 
                element={
                  <Protected allowedRoles={['admin', 'technician']}>
                    <Layout>
                      <TechnicianPanel />
                    </Layout>
                  </Protected>
                } 
              />

              <Route 
                path="/settings" 
                element={
                  <Protected allowedRoles={['admin']}>
                    <Layout>
                      <Settings />
                    </Layout>
                  </Protected>
                } 
              />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
}
