import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import "../css/ManagerGuides.css";

export default function PlantModelEdit(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if (id){
      (async()=>{
        try{ setLoading(true); const res = await axiosClient.get(`/plant-models/${id}`); const data = res.data || {}; setTitle(data.title||""); setDescription(data.description||""); }catch(e){}finally{setLoading(false)}
      })();
    }
  },[id]);

  async function onSubmit(e){
    e.preventDefault();
    try{
      setLoading(true);
      const payload = { title, description };
      if (id) await axiosClient.put(`/plant-models/${id}`, payload);
      else await axiosClient.post(`/plant-models`, payload);
      navigate('/expert/plantmodels');
    }catch(e){ console.error(e); alert('Lưu thất bại'); }
    finally{ setLoading(false); }
  }

  return (
    <div className="manager-guides-page">
      <header className="mg-header"><h2 className="mg-title">{id ? 'Sửa mô hình' : 'Tạo mô hình'}</h2></header>
      <div className="mg-grid-container">
        <form onSubmit={onSubmit} className="mg-form" style={{padding:20}}>
          <label>Tiêu đề</label>
          <input className="mg-input" value={title} onChange={e=>setTitle(e.target.value)} />
          <label>Mô tả</label>
          <textarea className="mg-input" value={description} onChange={e=>setDescription(e.target.value)} />
          <div style={{marginTop:12}}>
            <button className="mg-create-btn" type="submit" disabled={loading}>{loading? 'Đang lưu...' : 'Lưu'}</button>
            <button className="mg-clear-btn" type="button" onClick={()=>navigate('/expert/plantmodels')}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  )
}
