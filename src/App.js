import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useLocation } from 'react-router-dom';
import MapComponent from './Map'; // Pakai Map.js
import Admin from './Admin';
import Login from './Login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Layout = ({ children, auth, handleLogout }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {!isLoginPage && (
        <>
          <div
            className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-white z-[1000] transition-transform duration-300 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } w-22 p-4 shadow-lg`}
          >
            <div className="flex items-center mb-6 pl-10">
              
            </div>
            <nav className="flex flex-col gap-3 mt-14 text-justify">
  <Link to="/" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setIsSidebarOpen(false)}>
    Peta
  </Link>
  {auth.token && auth.role === 'admin' && (
    <Link to="/admin" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setIsSidebarOpen(false)}>
      Admin
    </Link>
  )}
  {auth.token ? (
    <button onClick={handleLogout} className="p-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
      Logout
    </button>
  ) : (
    <Link to="/login" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setIsSidebarOpen(false)}>
      Login
    </Link>
  )}
</nav>
          </div>
          <button
  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
  className="fixed top-4 left-4 z-[1001] bg-white dark:bg-gray-900 p-2 rounded-full shadow-lg"
>
  <img
    src="/logo.png"
    alt="Logo"
    className="w-10 h-8" // Atur ukuran logo
  />
</button>
        </>
      )}
      <main className="flex-grow">{children}
        {/* Tambahkan tulisan floating di tengah bawah */}
        <div
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-lg shadow-lg"
        >
          siPENTΛ ©2025
        </div>
      </main>
      </div>
  );
};

function App() {
  const [auth, setAuth] = useState({ token: null, role: null });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) setAuth({ token, role });
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.className = theme;
  }, [theme]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setAuth({ token: null, role: null });
  };

  return (
    <Router>
      <Layout auth={auth} handleLogout={handleLogout}>
        <Routes>
          <Route path="/login" element={auth.token ? <Navigate to="/" /> : <Login setAuth={setAuth} theme={theme} />} />
          <Route path="/" element={<MapComponent auth={auth} theme={theme} />} />
          <Route
            path="/admin"
            element={auth.token && auth.role === 'admin' ? <Admin auth={auth} theme={theme} setTheme={setTheme} /> : <Navigate to="/" />}
          />
          <Route path="*" element={<MapComponent auth={auth} theme={theme} />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Layout>
    </Router>
  );
}

export default App;