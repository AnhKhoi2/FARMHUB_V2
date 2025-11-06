import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import "../css/ManagerGuides.css";
import placeholderImg from "../assets/placeholder.svg";

export default function ExpertPlantModels() {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  const fetchModels = useCallback(async (p = page) => {
    setLoading(true);
    try {
      // placeholder endpoint; backend may be added later
      const res = await axiosClient.get("/plant-models", { params: { page: p, limit } });
      const data = res.data || {};
      const docs = data.data || data.docs || [];
      const meta = data.meta || {};
      setModels(docs);
      setTotalPages(meta.pages || 1);
    } catch (e) {
      // if backend not ready, keep empty
      setModels([]);
      setTotalPages(1);
    } finally { setLoading(false); }
  }, [page, limit]);

  useEffect(() => { fetchModels(page); }, [page, fetchModels]);

  return (
    <div className="manager-guides-page">
      <header className="mg-header">
        <h2 className="mg-title">Plant Models</h2>
        <div className="mg-toolbar">
          <div style={{display:'flex',gap:8}}>
            <button className="mg-create-btn" onClick={() => navigate('/expert/plantmodels/create')}>Tạo mô hình</button>
          </div>
        </div>
      </header>

      <div className="mg-grid-container">
        {loading ? (<div className="mg-loading">Đang tải...</div>) : models.length === 0 ? (
          <div className="mg-empty">Chưa có mô hình trồng nào.</div>
        ) : (
          <div className="mg-grid">
            {models.map(m => (
              <div className="mg-card" key={m._id || m.id}>
                <div className="mg-thumb" style={{ backgroundImage: `url(${m.image || placeholderImg})` }} />
                <div className="mg-card-body">
                  <div className="mg-card-title">{m.title}</div>
                  <div className="mg-card-sub">{m.description || m.summary || '—'}</div>
                </div>
                <div className="mg-card-actions">
                  <button className="mg-btn" onClick={() => navigate(`/expert/plantmodels/${m._id || m.id}`)}>Xem</button>
                  <button className="mg-btn" onClick={() => navigate(`/expert/plantmodels/edit/${m._id || m.id}`)}>Sửa</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mg-pagination">
        <button className="mg-page-btn" disabled={page <= 1} onClick={() => setPage(Math.max(1, page-1))}>&lt; Prev</button>
        <span className="mg-page-info">Trang {page} / {totalPages}</span>
        <button className="mg-page-btn" disabled={page >= totalPages} onClick={() => setPage(Math.min(totalPages, page+1))}>Next &gt;</button>
      </div>
    </div>
  );
}
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import '../css/ManagerGuides.css';
import placeholderImg from '../assets/placeholder.svg';

export default function ExpertPlantModels(){
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  const fetch = useCallback(async (p = page) => {
    setLoading(true);
    try{
      const res = await axiosClient.get('/plant-models', { params: { page: p, limit } });
      const data = res.data || {};
      const docs = data.data || data.docs || [];
      const meta = data.meta || {};
      setModels(docs);
      setTotalPages(meta.pages || 1);
    }catch(e){ console.error(e); setModels([]); setTotalPages(1); }
    finally{ setLoading(false); }
  }, [page, limit]);

  useEffect(()=>{ fetch(page); }, [page, fetch]);

  return (
    <div className="manager-guides-page">
      <header className="mg-header">
        <h2 className="mg-title">Gợi ý mô hình trồng (Expert)</h2>
        <div className="mg-toolbar">
          <div style={{display:'flex',gap:8}}>
            <button className="mg-create-btn" onClick={() => navigate('/expert/plantmodels/create')}>Tạo mới</button>
          </div>
        </div>
      </header>

      <div className="mg-grid-container">
        {loading ? (<div className="mg-loading">Đang tải...</div>) : models.length===0 ? (
          <div className="mg-empty">Không có mô hình nào.</div>
        ) : (
          <div className="mg-grid">
            {models.map(m => (
              <div className="mg-card" key={m._id}>
                <div className="mg-thumb" style={{ backgroundImage: `url(${(m.images && m.images[0]) || placeholderImg})` }} />
                <div className="mg-card-body">
                  <div className="mg-card-title">{m.title}</div>
                  <div className="mg-card-sub">{m.description ? m.description.slice(0,120) : '—'}</div>
                </div>
                <div className="mg-card-actions">
                  <button className="mg-btn" onClick={() => navigate(`/expert/plantmodels/${m._id}`)}>Xem</button>
                  <button className="mg-btn" onClick={() => navigate(`/expert/plantmodels/edit/${m._id}`)}>Sửa</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mg-pagination">
        <button className="mg-page-btn" disabled={page<=1} onClick={() => setPage(Math.max(1, page-1))}>&lt; Prev</button>
        <span className="mg-page-info">Trang {page} / {totalPages}</span>
        <button className="mg-page-btn" disabled={page>=totalPages} onClick={() => setPage(Math.min(totalPages, page+1))}>Next &gt;</button>
      </div>
    </div>
  );
}
