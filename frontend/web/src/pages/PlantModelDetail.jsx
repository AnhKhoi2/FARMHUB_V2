import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import "../css/ManagerGuides.css";
import placeholderImg from "../assets/placeholder.svg";

export default function PlantModelDetail(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    (async()=>{
      try{ setLoading(true); const res = await axiosClient.get(`/plant-models/${id}`); setModel(res.data || null); }catch(e){}finally{setLoading(false)}
    })();
  },[id]);

  if (loading) return <div className="mg-loading">Đang tải...</div>;
  if (!model) return <div className="mg-empty">Không tìm thấy mô hình.</div>;

  return (
    <div className="manager-guides-page">
      <header className="mg-header"><h2 className="mg-title">{model.title}</h2></header>
      <div className="mg-grid-container">
        <div style={{padding:20}}>
          <img src={model.image || placeholderImg} alt={model.title} style={{maxWidth:320}} />
          <div style={{marginTop:12}} dangerouslySetInnerHTML={{__html: model.description || ''}} />
          <div style={{marginTop:12}}>
            <button className="mg-create-btn" onClick={()=>navigate('/expert/plantmodels')}>Quay lại</button>
            <button className="mg-clear-btn" onClick={()=>navigate(`/expert/plantmodels/edit/${id}`)}>Sửa</button>
          </div>
        </div>
      </div>
    </div>
  )
}
