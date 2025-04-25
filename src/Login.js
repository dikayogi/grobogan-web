import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Login({ setAuth, theme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/api/login', {
        username,
        password
      });
      const { token, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      setAuth({ token, role });
      toast.success('Login berhasil!');
      navigate('/');
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Gagal login!');
      setLoading(false); // Pastikan loading dimatikan kalau error
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <ToastContainer position="top-center" autoClose={3000} />
      <div className={`p-8 rounded-lg shadow-lg w-full max-w-md ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <img
  src="/logosipenta.png"
  alt="Logo siPENTΛ"
  className="w-32 h-auto mx-auto mb-4"
/>
<p className="text-center text-gray-600 dark:text-gray-300 mb-6">
        Sistem Informasi Peta Nilai Tanah Grobogan
      </p>
<h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Nama Pengguna</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              }`}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2">Kata Sandi</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              }`}
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full p-2 bg-[#0c7b81] text-white rounded-lg hover:bg-[#095e61] transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? 'Memuat...' : 'Masuk'}
          </button>
          <div className="flex justify-center items-center gap-4 mt-6">
  <img
    src="/logo.png"
    alt="Logo Rekanan 1"
    className="w-16 h-auto"
  />
  <img
    src="/logo_pemprov.png"
    alt="Logo Pemprov"
    className="w-16 h-auto"
  />
  <img
    src="/logo_bankjateng.png"
    alt="Logo Bank Jateng"
    className="w-16 h-auto"
  />
</div>
        </form>
      </div>
    </div>
  );
}

export default Login;