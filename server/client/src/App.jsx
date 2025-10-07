import React from 'react'
import "./App.css"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home';
import NoPage from './pages/NoPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import CreateDocs from './pages/createDocs';

const App = () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  // ProtectedRoute component defined inside App.js
  const ProtectedRoute = ({ children }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path='/signUp' element={<SignUp />} />
          <Route path='/login' element={<Login />} />

          {/* Protected routes */}
          <Route path='/' element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />

          <Route path='/createDocs/:docsId' element={
            <ProtectedRoute>
              <CreateDocs />
            </ProtectedRoute>
          } />

          <Route path="*" element={
            <ProtectedRoute>
              <NoPage />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;
