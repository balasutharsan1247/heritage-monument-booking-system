import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Monuments from './pages/Monuments';
import MonumentDetails from './pages/MonumentDetails';
import Booking from './pages/Booking';
import TicketConfirmation from './pages/TicketConfirmation';
import MyTickets from './pages/MyTickets';
import StaffQueue from './pages/StaffQueue';
import StaffValidate from './pages/StaffValidate';
import AdminDashboard from './pages/AdminDashboard';
import PublicQueue from './pages/PublicQueue';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="monuments" element={<Monuments />} />
            <Route path="monuments/:id" element={<MonumentDetails />} />
            
            {/* Visitor Routes */}
            <Route path="book/:id" element={<ProtectedRoute roles={['visitor', 'admin']}><Booking /></ProtectedRoute>} />
            <Route path="tickets/:id" element={<ProtectedRoute roles={['visitor', 'admin']}><TicketConfirmation /></ProtectedRoute>} />
            <Route path="my-tickets" element={<ProtectedRoute roles={['visitor', 'admin']}><MyTickets /></ProtectedRoute>} />
            
            {/* Staff Routes */}
            <Route path="staff/queue" element={<ProtectedRoute roles={['staff', 'admin']}><StaffQueue /></ProtectedRoute>} />
            <Route path="staff/validate" element={<ProtectedRoute roles={['staff', 'admin']}><StaffValidate /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            
            {/* Public Queue */}
            <Route path="queue/:id" element={<PublicQueue />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;