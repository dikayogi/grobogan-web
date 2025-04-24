import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Tentukan base URL API berdasarkan environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Konfigurasi ikon default Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Ikon untuk titik yang dipilih
const selectedPointIcon = new L.Icon({
  iconUrl: '/markers/marker-icon-2x-black.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [0, -48],
});

// Warna marker berdasarkan index
const rainbowColors = ['red', 'orange', 'yellow', 'green', 'blue', 'violet'];
const getMarkerColor = (index) => {
  const colorIndex = Math.min(Math.floor(index / 3), rainbowColors.length - 1);
  return new L.Icon({
    iconUrl: `/markers/marker-icon-2x-${rainbowColors[colorIndex]}.png`,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [15, 24],
    iconAnchor: [12, 41],
  });
};

// Komponen untuk handle logika peta
function MapContent({ handleMapClick, layer, inputCoords, filteredLands, suggestedPrice, formatPrice, auth, showMore, toggleShowMore, handleDelete, searchRadius }) {
  const map = useMap();

  useEffect(() => {
    handleMapClick(map);

    // Tambahkan kontrol zoom di pojok kanan bawah
    const zoomControl = L.control.zoom({ position: 'bottomright' });
    zoomControl.addTo(map);

    return () => {
      map.off('click'); // Cleanup event listener on unmount
      map.removeControl(zoomControl); // Hapus kontrol zoom saat komponen di-unmount
    };
  }, [map, handleMapClick]);

  // Group marker yang koordinatnya sama
  const groupedLands = filteredLands.reduce((acc, land) => {
    const lat = parseFloat(land.LATITUDE);
    const lng = parseFloat(land.LONGITUDE);
    if (isNaN(lat) || isNaN(lng)) return acc;

    const key = `${lat},${lng}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(land);
    return acc;
  }, {});

  return (
    <>
      <TileLayer
        url={
          layer === 'osm'
            ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        }
        attribution={
          layer === 'osm'
            ? '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            : '© Esri'
        }
      />
      {inputCoords && (
        <Marker position={inputCoords} icon={selectedPointIcon}>
          <Popup>
            <div className="p-2">
              <div className="text-sm text-gray-800">
                <span className="font-semibold">Titik yang dipilih:</span> {inputCoords[0].toFixed(6)}, {inputCoords[1].toFixed(6)}
              </div>
              <div className="text-sm text-gray-800">
                <span className="font-semibold">Estimasi Harga Pasar:</span>{' '}
                {suggestedPrice ? `Rp ${formatPrice(suggestedPrice.toString())}/m²` : 'Tidak tersedia'}
              </div>
              <a
                href={`https://www.google.com/maps?q=${inputCoords[0]},${inputCoords[1]}&z=15`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  marginTop: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                <span>
                  <span style={{ color: '#4285F4' }}>G</span>
                  <span style={{ color: '#EA4335' }}>o</span>
                  <span style={{ color: '#F28C38' }}>o</span>
                  <span style={{ color: '#4285F4' }}>g</span>
                  <span style={{ color: '#34A853' }}>l</span>
                  <span style={{ color: '#EA4335' }}>e</span>{' '}
                  <span style={{ color: '#5F6368' }}>M</span>
                  <span style={{ color: '#5F6368' }}>a</span>
                  <span style={{ color: '#5F6368' }}>p</span>
                  <span style={{ color: '#5F6368' }}>s</span>
                </span>
              </a>
            </div>
          </Popup>
        </Marker>
      )}
      {Object.entries(groupedLands).map(([key, landsAtCoord], coordIndex) => {
        const [lat, lng] = key.split(',').map(parseFloat);
        const parseDate = (dateStr) => {
          if (!dateStr || typeof dateStr !== 'string') return null;
          const [day, month, year] = dateStr.split('/').map(Number);
          if (!day || !month || !year) return null;
          return new Date(year, month - 1, day);
        };

        // Jika hanya 1 marker di koordinat ini, tampilkan langsung
        if (landsAtCoord.length === 1) {
          const land = landsAtCoord[0];
          return (
            <Marker key={land._id} position={[lat, lng]} icon={getMarkerColor(coordIndex)}>
              <Popup>
                <div className="p-2 max-w-xs">
                  <div className="text-sm text-gray-800">
                    <span className="font-semibold">Harga:</span> Rp {formatPrice(land["HARGA PERKIRAAN PER M2"])}/m²
                  </div>
                  <div className="text-sm text-gray-800">
                    <span className="font-semibold">Tahun:</span> {land["TGL BAYAR"] ? parseDate(land["TGL BAYAR"])?.getFullYear() : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-800">
                    <span className="font-semibold">Lokasi:</span> {land["LETAK OP"]}
                  </div>
                  <div className="text-sm text-gray-800">
                    <span className="font-semibold">Desa:</span> {land["DESA/KELURAHAN OP"]}
                  </div>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <a
                      href={`https://www.google.com/maps?q=${land.LATITUDE},${land.LONGITUDE}&z=15`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      <span>
                        <span style={{ color: '#4285F4' }}>G</span>
                        <span style={{ color: '#EA4335' }}>o</span>
                        <span style={{ color: '#F28C38' }}>o</span>
                        <span style={{ color: '#4285F4' }}>g</span>
                        <span style={{ color: '#34A853' }}>l</span>
                        <span style={{ color: '#EA4335' }}>e</span>{' '}
                        <span style={{ color: '#5F6368' }}>M</span>
                        <span style={{ color: '#5F6368' }}>a</span>
                        <span style={{ color: '#5F6368' }}>p</span>
                        <span style={{ color: '#5F6368' }}>s</span>
                      </span>
                    </a>
                    {auth.role !== 'user' && (
                      <button
                        onClick={() => handleDelete(land._id)}
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
                        Delete
                      </button>
                    )}
                    {auth.role !== 'user' && (
                      <button
                        onClick={() => toggleShowMore(land._id)}
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
                        {showMore[land._id] ? 'Less' : 'More'}
                      </button>
                    )}
                  </div>
                  {auth.role !== 'user' && showMore[land._id] && (
                    <div className="mt-2 text-xs text-gray-800">
                      <div><span className="font-semibold">Nama:</span> {land.NAMA || 'N/A'}</div>
                      <div><span className="font-semibold">Luas Tanah:</span> {land.LUAS_TANAH_OP || 'Tidak Tersedia'}</div>
                      <div><span className="font-semibold">Luas Bangunan:</span> {land.LUAS_BANGUNAN_OP || 'Tidak Tersedia'}</div>
                      <div><span className="font-semibold">Kecamatan:</span> {land["KECAMATAN OP"] || 'N/A'}</div>
                      <div><span className="font-semibold">Nilai Perolehan:</span> {land["NILAI PEROLEHAN"] || 'N/A'}</div>
                      <div><span className="font-semibold">Jenis Perolehan:</span> {land["JENIS PEROLEHAN"] || 'N/A'}</div>
                      <div><span className="font-semibold">BPHTB:</span> {land["BPHTB (terbayar)"] || 'N/A'}</div>
                      <div><span className="font-semibold">Tanggal Bayar:</span> {land["TGL BAYAR"] || 'N/A'}</div>
                      <div><span className="font-semibold">Longitude:</span> {land.LONGITUDE}</div>
                      <div><span className="font-semibold">Latitude:</span> {land.LATITUDE}</div>
                      <div><span className="font-semibold">NOP:</span> {land.NOP || 'N/A'}</div>
                      <div><span className="font-semibold">NJOP Tanah:</span> {land["NJOP TANAH"] || 'N/A'}</div>
                      <div><span className="font-semibold">NJOP Bangunan:</span> {land["NJOP BANGUNAN"] || 'N/A'}</div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        }

        // Jika ada beberapa marker di koordinat yang sama, tampilkan dalam 1 popup
        return (
          <Marker key={key} position={[lat, lng]} icon={getMarkerColor(coordIndex)}>
            <Popup>
              <div className="p-2 max-w-xs">
                {landsAtCoord.map((land, index) => (
                  <div key={land._id} className="mb-4">
                    <div className="text-sm text-gray-800">
                      <span className="font-semibold">Data {index + 1}</span>
                    </div>
                    <div className="text-sm text-gray-800">
                      <span className="font-semibold">Harga:</span> Rp {formatPrice(land["HARGA PERKIRAAN PER M2"])}/m²
                    </div>
                    <div className="text-sm text-gray-800">
                      <span className="font-semibold">Tahun:</span> {land["TGL BAYAR"] ? parseDate(land["TGL BAYAR"])?.getFullYear() : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-800">
                      <span className="font-semibold">Lokasi:</span> {land["LETAK OP"]}
                    </div>
                    <div className="text-sm text-gray-800">
                      <span className="font-semibold">Desa:</span> {land["DESA/KELURAHAN OP"]}
                    </div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <a
                        href={`https://www.google.com/maps?q=${land.LATITUDE},${land.LONGITUDE}&z=15`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                      >
                        <span>
                          <span style={{ color: '#4285F4' }}>G</span>
                          <span style={{ color: '#EA4335' }}>o</span>
                          <span style={{ color: '#F28C38' }}>o</span>
                          <span style={{ color: '#4285F4' }}>g</span>
                          <span style={{ color: '#34A853' }}>l</span>
                          <span style={{ color: '#EA4335' }}>e</span>{' '}
                          <span style={{ color: '#5F6368' }}>M</span>
                          <span style={{ color: '#5F6368' }}>a</span>
                          <span style={{ color: '#5F6368' }}>p</span>
                          <span style={{ color: '#5F6368' }}>s</span>
                        </span>
                      </a>
                      {auth.role !== 'user' && (
                        <button
                          onClick={() => handleDelete(land._id)}
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
                          Delete
                        </button>
                      )}
                      {auth.role !== 'user' && (
                        <button
                          onClick={() => toggleShowMore(land._id)}
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
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3B82F6')}
                        >
                          {showMore[land._id] ? 'Less' : 'More'}
                        </button>
                      )}
                    </div>
                    {auth.role !== 'user' && showMore[land._id] && (
                      <div className="mt-2 text-xs text-gray-800">
                        <div><span className="font-semibold">Nama:</span> {land.NAMA || 'N/A'}</div>
                        <div><span className="font-semibold">Luas Tanah:</span> {land.LUAS_TANAH_OP || 'Tidak Tersedia'}</div>
                        <div><span className="font-semibold">Luas Bangunan:</span> {land.LUAS_BANGUNAN_OP || 'Tidak Tersedia'}</div>
                        <div><span className="font-semibold">Kecamatan:</span> {land["KECAMATAN OP"] || 'N/A'}</div>
                        <div><span className="font-semibold">Nilai Perolehan:</span> {land["NILAI PEROLEHAN"] || 'N/A'}</div>
                        <div><span className="font-semibold">Jenis Perolehan:</span> {land["JENIS PEROLEHAN"] || 'N/A'}</div>
                        <div><span className="font-semibold">BPHTB:</span> {land["BPHTB (terbayar)"] || 'N/A'}</div>
                        <div><span className="font-semibold">Tanggal Bayar:</span> {land["TGL BAYAR"] || 'N/A'}</div>
                        <div><span className="font-semibold">Longitude:</span> {land.LONGITUDE}</div>
                        <div><span className="font-semibold">Latitude:</span> {land.LATITUDE}</div>
                        <div><span className="font-semibold">NOP:</span> {land.NOP || 'N/A'}</div>
                        <div><span className="font-semibold">NJOP Tanah:</span> {land["NJOP TANAH"] || 'N/A'}</div>
                        <div><span className="font-semibold">NJOP Bangunan:</span> {land["NJOP BANGUNAN"] || 'N/A'}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

function MapComponent({ auth, theme }) {
  const [lands, setLands] = useState([]);
  const [filteredLands, setFilteredLands] = useState([]);
  const [combinedCoords, setCombinedCoords] = useState('');
  const [initialCenter] = useState([-7.2, 110.65]);
  const [layer, setLayer] = useState('osm');
  const [inputCoords, setInputCoords] = useState(null);
  const [showMore, setShowMore] = useState({});
  const [yearFilter, setYearFilter] = useState('all');
  const [searchRadius, setSearchRadius] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedPrice, setSuggestedPrice] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const navigate = useNavigate();

  const formatPrice = (priceStr) => {
    if (!priceStr) return '0,00';
    const cleanPrice = priceStr.replace(/[^0-9,]/g, '');
    const [integerPart, decimalPart = '00'] = cleanPrice.split(',');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedInteger},${decimalPart}`;
  };

  const fetchLands = async () => {
    setLoading(true);
    setError('');
    const startTime = Date.now();
    try {
      const countRes = await axios.get(`${API_URL}/api/lands/count`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const totalCount = countRes.data.count;
      console.log(`Total lands in database: ${totalCount}`);

      const limit = 1000;
      const totalPages = Math.ceil(totalCount / limit);
      const allLands = [];

      for (let page = 1; page <= totalPages; page++) {
        const res = await axios.get(`${API_URL}/api/lands?page=${page}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        allLands.push(...res.data);
        console.log(`Fetched page ${page}/${totalPages}, ${res.data.length} lands`);
      }

      setLands(allLands);
      console.log(`Total lands fetched: ${allLands.length} in ${Date.now() - startTime}ms`);
    } catch (err) {
      setError('Gagal memuat data: ' + (err.response?.data?.message || err.message));
      toast.error('Gagal memuat data!');
    } finally {
      setLoading(false);
    }
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const parseDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  };

  const roundToNearest = (value, nearest) => {
    return Math.round(value / nearest) * nearest;
  };

  const getMedian = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  };

  const calculateSuggestedPrice = (inputLat, inputLng, landsToUse, filteredLands) => {
    if (!landsToUse || landsToUse.length === 0) return null;

    const landsWithDistance = landsToUse.map(land => {
      const lat = parseFloat(land.LATITUDE);
      const lng = parseFloat(land.LONGITUDE);
      const year = land["TGL BAYAR"] ? parseDate(land["TGL BAYAR"])?.getFullYear() : 2000;
      if (isNaN(lat) || isNaN(lng)) return { ...land, distance: Infinity, year };
      const distance = getDistance(inputLat, inputLng, lat, lng);
      return { ...land, distance, year };
    });

    const validLands = landsWithDistance.filter(land => land.distance !== Infinity);
    const nearestLands = validLands.sort((a, b) => a.distance - b.distance).slice(0, 3);

    if (nearestLands.length === 0) return null;

    let totalWeightedPrice = 0;
    let totalWeight = 0;

    nearestLands.forEach(land => {
      const price = parseFloat(land["HARGA PERKIRAAN PER M2"]?.replace(/\./g, '').replace(',', '.') || 0);
      const yearWeight = Math.max(1, land.year - 2000);
      const distanceWeight = 1 / (land.distance || 0.0001);
      const totalWeightForLand = distanceWeight * yearWeight;
      totalWeightedPrice += price * totalWeightForLand;
      totalWeight += totalWeightForLand;
    });

    if (totalWeight === 0) return null;

    const weightedAveragePrice = totalWeightedPrice / totalWeight;
    const topThreePrices = filteredLands.slice(0, 3).map(land =>
      parseFloat(land["HARGA PERKIRAAN PER M2"]?.replace(/\./g, '').replace(',', '.') || 0)
    );

    while (topThreePrices.length < 3) {
      topThreePrices.push(0);
    }

    const medianTopPrice = getMedian(topThreePrices);
    const finalPrice = (weightedAveragePrice + medianTopPrice) / 2;
    return roundToNearest(finalPrice, 100000);
  };

  const updateFilteredLands = (inputLat, inputLng) => {
    if (!inputLat || !inputLng) return;

    let filteredByYear = lands;
    if (yearFilter !== 'all') {
      filteredByYear = lands.filter(land => {
        const date = parseDate(land['TGL BAYAR']);
        const year = date ? date.getFullYear().toString() : null;
        return year === yearFilter;
      });
    }

    const landsWithDistance = filteredByYear.map(land => {
      const lat = parseFloat(land.LATITUDE);
      const lng = parseFloat(land.LONGITUDE);
      if (isNaN(lat) || isNaN(lng)) return { ...land, distance: NaN };
      const distance = getDistance(inputLat, inputLng, lat, lng);
      return { ...land, distance };
    });

    const validLands = landsWithDistance.filter(land => !isNaN(land.distance));
    const nearestLands = validLands
      .sort((a, b) => a.distance - b.distance)
      .filter(land => land.distance <= searchRadius)
      .slice(0, 18);
    const sortedLands = nearestLands.sort((a, b) => {
      const priceA = parseFloat(a["HARGA PERKIRAAN PER M2"]?.replace(/\./g, '').replace(',', '.') || 0);
      const priceB = parseFloat(b["HARGA PERKIRAAN PER M2"]?.replace(/\./g, '').replace(',', '.') || 0);
      return priceB - priceA;
    });

    setFilteredLands(sortedLands);
    setInputCoords([inputLat, inputLng]);

    const price = calculateSuggestedPrice(inputLat, inputLng, filteredByYear, sortedLands);
    setSuggestedPrice(price);
  };

  const handleSearch = () => {
    if (!combinedCoords) {
      toast.error('Masukkan koordinat terlebih dahulu!');
      return;
    }

    const coords = combinedCoords.split(',').map(coord => coord.trim());
    if (coords.length !== 2) {
      toast.error('Format koordinat salah! Gunakan: latitude, longitude');
      return;
    }

    const inputLat = parseFloat(coords[0]);
    const inputLng = parseFloat(coords[1]);
    if (isNaN(inputLat) || isNaN(inputLng)) {
      toast.error('Koordinat tidak valid!');
      return;
    }

    setCombinedCoords(`${inputLat}, ${inputLng}`);
    updateFilteredLands(inputLat, inputLng);
  };

  const handleMapClick = (map) => {
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setCombinedCoords(`${lat}, ${lng}`);
      updateFilteredLands(lat, lng);
    });
  };

  const handleYearFilterChange = (e) => {
    setYearFilter(e.target.value);
    if (inputCoords) {
      updateFilteredLands(inputCoords[0], inputCoords[1]);
    }
  };

  const handleRadiusChange = (e) => {
    setSearchRadius(parseFloat(e.target.value));
    if (inputCoords) {
      updateFilteredLands(inputCoords[0], inputCoords[1]);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus data ini?')) {
      try {
        await axios.delete(`${API_URL}/api/lands/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        setFilteredLands(filteredLands.filter(land => land._id !== id));
        setLands(lands.filter(land => land._id !== id));
        toast.success('Data berhasil dihapus!');
      } catch (err) {
        toast.error('Gagal menghapus data!');
      }
    }
  };

  const toggleShowMore = (id) => {
    setShowMore(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (!auth.token) {
      navigate('/');
      return;
    }
    fetchLands();
  }, [auth.token, navigate]);

  if (!auth.token) return null;

  return (
    <div className="relative">
      <ToastContainer position="top-center" autoClose={3000} />
      <div
        className={`absolute bottom-4 left-4 z-[1000] bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg flex flex-col gap-3 w-full max-w-xs sm:max-w-sm transition-all duration-300 ${
          isPanelOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        } ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
      >
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Koordinat (-7.0863, 110.98848)"
            value={combinedCoords}
            onChange={(e) => setCombinedCoords(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c7b81] bg-white dark:bg-gray-800 text-gray-800 dark:text-white flex-[3]"
          />
          <button
            onClick={handleSearch}
            className="p-2 bg-[#0c7b81] text-white rounded-lg hover:bg-[#095e61] transition-colors flex items-center gap-1 flex-[1]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Cari
          </button>
        </div>
        <select
          onChange={(e) => setYearFilter(e.target.value)}
          value={yearFilter}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c7b81] bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="all">Pilih Tahun: Semua(2022-2025)</option>
          <option value="2022">2022</option>
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>
        <select
          onChange={(e) => setSearchRadius(e.target.value)}
          value={searchRadius}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c7b81] bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="0.5">Radius: 500 m</option>
          <option value="1">1 km</option>
          <option value="1.5">1.5 km</option>
        </select>
      </div>
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="absolute top-4 left-4 z-[1001] bg-white dark:bg-gray-900 p-2 rounded-full shadow-lg text-gray-800 dark:text-white sm:hidden"
      >
        {isPanelOpen ? '✕' : '☰'}
      </button>
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => setLayer('osm')}
          className={`p-2 rounded-lg shadow-lg ${layer === 'osm' ? 'bg-[#0c7b81] text-white' : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white'} hover:bg-gray-100 dark:hover:bg-gray-700`}
        >
          Map
        </button>
        <button
          onClick={() => setLayer('esri')}
          className={`p-2 rounded-lg shadow-lg ${layer === 'esri' ? 'bg-[#0c7b81] text-white' : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white'} hover:bg-gray-100 dark:hover:bg-gray-700`}
        >
          Satellite
        </button>
      </div>
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="ml-2 text-white">Memuat...</p>
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
      <MapContainer
        center={initialCenter}
        zoom={10}
        style={{ height: '100vh', width: '100%' }}
        className="rounded-lg"
        zoomControl={false}
      >
        <MapContent
          handleMapClick={handleMapClick}
          layer={layer}
          inputCoords={inputCoords}
          filteredLands={filteredLands}
          suggestedPrice={suggestedPrice}
          formatPrice={formatPrice}
          auth={auth}
          showMore={showMore}
          toggleShowMore={toggleShowMore}
          handleDelete={handleDelete}
          searchRadius={searchRadius}
        />
      </MapContainer>
    </div>
  );
}

export default MapComponent;