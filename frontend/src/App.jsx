import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import FacultyRoutes from './features/faculty/routes/FacultyRoutes'
import { FacultyAuthProvider } from './features/faculty/hooks/useAuth'

function App() {
  return (
    <FacultyAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/faculty/*" element={<FacultyRoutes />} />
          <Route path="/" element={<Navigate to="/faculty" replace />} />
        </Routes>
      </BrowserRouter>
    </FacultyAuthProvider>
  )
}

export default App
