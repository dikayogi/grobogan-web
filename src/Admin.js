import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function Admin({ auth, theme, setTheme }) {
  const [file, setFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [editUser, setEditUser] = useState(null);
  const [uploadLimit, setUploadLimit] = useState(localStorage.getItem('uploadLimit') || 10);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [errorUsers, setErrorUsers] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers('');
    try {
      const res = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setUsers(res.data);
    } catch (err) {
      setErrorUsers('Gagal memuat pengguna!');
      toast.error('Gagal memuat pengguna!');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Pilih file dulu!');
    if (!file.name.endsWith('.csv')) return toast.error('Hanya file CSV!');
    if (file.size > uploadLimit * 1024 * 1024) return toast.error(`File melebihi ${uploadLimit}MB!`);

    const formData = new FormData();
    formData.append('file', file);
    setLoadingUpload(true);
    try {
      const res = await axios.post(`${API_URL}/api/lands/upload`, formData, {
        headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Gagal upload: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (newUser.username.length < 4) return toast.error('Username minimal 4 karakter!');
    if (!/^[a-zA-Z0-9_]+$/.test(newUser.username)) return toast.error('Username hanya huruf, angka, underscore!');
    if (newUser.password.length < 6) return toast.error('Password minimal 6 karakter!');

    try {
      const res = await axios.post(`${API_URL}/api/register`, newUser, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      toast.success(res.data.message);
      fetchUsers();
      setNewUser({ username: '', password: '', role: 'user' });
    } catch (err) {
      toast.error('Gagal tambah user!');
    }
  };

  const handleEditUser = (user) => setEditUser({ ...user, password: '' });

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (editUser.username.length < 4) return toast.error('Username minimal 4 karakter!');
    if (!/^[a-zA-Z0-9_]+$/.test(editUser.username)) return toast.error('Username hanya huruf, angka, underscore!');
    if (editUser.password && editUser.password.length < 6) return toast.error('Password minimal 6 karakter!');

    try {
      const res = await axios.put(`${API_URL}/api/users/${editUser._id}`, editUser, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      toast.success(res.data.message);
      fetchUsers();
      setEditUser(null);
    } catch (err) {
      toast.error('Gagal update user!');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Yakin hapus user?')) {
      try {
        const res = await axios.delete(`${API_URL}/api/users/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        toast.success(res.data.message);
        fetchUsers();
      } catch (err) {
        toast.error('Gagal hapus user!');
      }
    }
  };

  const handleThemeChange = (e) => setTheme(e.target.value);

  const handleUploadLimitChange = (e) => {
    const limit = parseInt(e.target.value);
    if (limit < 1 || limit > 50) return toast.error('Batas upload 1-50 MB!');
    setUploadLimit(limit);
    localStorage.setItem('uploadLimit', limit);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Admin Dashboard</h2>
        {/* Upload Card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-white">Upload Data Properti</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".csv"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            />
            <button
              type="submit"
              className="p-2 bg-[#0c7b81] text-white rounded-lg hover:bg-[#095e61] disabled:bg-gray-400 transition-colors"
              disabled={loadingUpload}
            >
              {loadingUpload ? 'Mengunggah...' : 'Unggah'}
            </button>
          </form>
        </div>
        {/* User Management Card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-white">Kelola Pengguna</h3>
          {editUser ? (
            <form onSubmit={handleUpdateUser} className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Username"
                value={editUser.username}
                onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                required
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
              <input
                type="password"
                placeholder="Password (kosongkan jika tidak diubah)"
                value={editUser.password}
                onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
              <select
                value={editUser.role}
                onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              >
                <option value="user">Pengguna Umum</option>
                <option value="verifikator">Verifikator</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#16A34A',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0c7b81')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#095e61')}
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#EF4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#DC2626')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#EF4444')}
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddUser} className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                required
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              >
                <option value="user">Pengguna Umum</option>
                <option value="verifikator">Verifikator</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="p-2 bg-[#0c7b81] text-white rounded-lg hover:bg-[#095e61]">
                Tambah User
              </button>
            </form>
          )}
          <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Daftar Pengguna</h4>
          {loadingUsers ? (
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-gray-800 dark:text-white">Memuat...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="p-3 text-left text-gray-800 dark:text-white">Username</th>
                    <th className="p-3 text-left text-gray-800 dark:text-white">Role</th>
                    <th className="p-3 text-left text-gray-800 dark:text-white">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3 text-gray-800 dark:text-white">{user.username}</td>
                      <td className="p-3 text-gray-800 dark:text-white">{user.role}</td>
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: '#3B82F6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#095e61')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0c7b81')}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: '#EF4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#DC2626')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#EF4444')}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Settings Card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-white">Pengaturan Sistem</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-gray-800 dark:text-white">Tema</label>
              <select
                value={theme}
                onChange={handleThemeChange}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-gray-800 dark:text-white">Batas Upload File (MB)</label>
              <input
                type="number"
                value={uploadLimit}
                onChange={handleUploadLimitChange}
                min="1"
                max="50"
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white w-20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;