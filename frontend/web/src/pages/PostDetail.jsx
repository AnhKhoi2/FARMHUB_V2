import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/shared/axiosClient';
import Header from '../components/shared/Header';

export default function PostDetail(){
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        setLoading(true);
        const res = await axiosClient.get(`/admin/managerpost/public/${id}`);
        const payload = res.data?.data || res.data;
        if(!mounted) return;
        setPost(payload);
      }catch(err){
        console.error(err);
        setError(err?.response?.data?.message || err.message || 'Không tải được bài viết');
      }finally{ if(mounted) setLoading(false); }
    })();
    return ()=>{ mounted=false; };
  },[id]);

  const handleReport = async ()=>{
    if(!window.confirm('Bạn muốn báo cáo bài viết này?')) return;
    try{
      const reason = prompt('Lý do báo cáo (tùy chọn)') || '';
      await axiosClient.post(`/admin/managerpost/${id}/report`, { reason, message: '' });
      alert('Đã gửi báo cáo, cảm ơn bạn.');
    }catch(err){
      console.error(err);
      alert(err?.response?.data?.message || err.message || 'Báo cáo thất bại');
    }
  };

  if(loading) return (<><Header /><div className="container p-4">Đang tải…</div></>);
  if(error) return (<><Header /><div className="container p-4 text-danger">{error}</div></>);

  return (
    <>
      <Header />
      <div className="container p-4">
        <button className="btn btn-link mb-3" onClick={()=>navigate(-1)}>← Quay lại</button>
        <div className="card">
          <div className="card-body">
            <h2>{post.title}</h2>
            <p className="text-muted">{post.userId?.username || 'Người bán'} • {new Date(post.createdAt).toLocaleString()}</p>
            <div style={{margin:'12px 0'}}>
              {post.images?.length ? post.images.map((src,i)=>(<img key={i} src={src} alt="img" style={{maxWidth:200,marginRight:8}}/>)) : null}
            </div>
            <p style={{whiteSpace:'pre-wrap'}}>{post.description}</p>
            <div className="d-flex gap-2 mt-3">
              <a className="btn btn-primary" href={`tel:${post.phone || ''}`}>Gọi: {post.phone || '—'}</a>
              <button className="btn btn-outline-danger" onClick={handleReport}>Báo cáo</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
