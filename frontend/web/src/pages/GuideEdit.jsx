import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import '../css/ManagerGuides.css';
import placeholderImg from '../assets/placeholder.svg';

export default function GuideEdit(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [steps, setSteps] = useState([]);
  // tags (freeform) removed — using plantTags instead
  const [plantTags, setPlantTags] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [file, setFile] = useState(null);

  const availablePlantTags = [
    'Rau củ dễ chăm',
    'Trái cây ngắn hạn',
    'Cây gia vị',
    'Trồng trong chung cư',
    'Ít thời gian chăm sóc',
    'Cây leo nhỏ',
  ];

  useEffect(()=>{
    let mounted = true;
    const fetchGuide = async () => {
      if (!id) {
        // create mode: initialize defaults
        setTitle('');
        setDescription('');
        setContent('');
        setImagePreview(null);
        setSteps([{ title:'', text:'', imagePreview:null, file:null }]);
        setPlantTags([]);
        setLoading(false);
        return;
      }
      try{
        const res = await axiosClient.get(`/guides/${id}`);
        const g = res.data.data || res.data;
        if(!mounted) return;
        setTitle(g.title || '');
        setDescription(g.description || g.summary || '');
        setContent(g.content || '');
        // freeform tags removed; we keep plantTags instead
        setImagePreview(g.image || placeholderImg);
        // load steps into state (each step: title, text, imagePreview, file)
        const loaded = (g.steps && Array.isArray(g.steps)) ? g.steps.map(s=>({
          title: s.title || '',
          text: s.text || '',
          imagePreview: s.image || null,
          file: null
        })) : [];
        setSteps(loaded.length ? loaded : [{ title:'', text:'', imagePreview:null, file:null }]);
        setPlantTags((g.plantTags && Array.isArray(g.plantTags)) ? g.plantTags : []);
      }catch(err){
        console.warn(err);
        setError('Không thể tải hướng dẫn');
      }finally{ if(mounted) setLoading(false); }
    }
    fetchGuide();
    return ()=> mounted = false;
  },[id]);

  function onFileChange(e){
    const f = e.target.files[0];
    setFile(f);
    if(f){
      const url = URL.createObjectURL(f);
      setImagePreview(url);
    }
  }

  function onStepFileChange(index, e){
    const f = e.target.files[0];
    setSteps(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], file: f, imagePreview: f ? URL.createObjectURL(f) : copy[index].imagePreview };
      return copy;
    });
  }

  function addStep(){
    setSteps(prev => [...prev, { title:'', text:'', imagePreview:null, file:null }]);
  }

  function removeStep(index){
    setSteps(prev => prev.filter((_,i)=>i!==index));
  }

  function updateStep(index, field, value){
    setSteps(prev=>{
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  async function onSubmit(e){
    e.preventDefault();
    setSaving(true);
    setError(null);
    try{
      const form = new FormData();
      form.append('title', title);
      form.append('description', description);
      form.append('content', content);
  // freeform tags removed — not sending 'tags' field anymore
      if(file) form.append('image', file);

      // attach steps: JSON + per-step files named stepImage_<index>
      const stepsPayload = steps.map(s => ({ title: s.title, text: s.text, image: s.imagePreview }));
      form.append('steps', JSON.stringify(stepsPayload));
      steps.forEach((s, idx) => {
        if (s.file) form.append(`stepImage_${idx}`, s.file);
      });
      // plantTags
      form.append('plantTags', JSON.stringify(plantTags));

      if (id) {
        await axiosClient.put(`/guides/${id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axiosClient.post('/guides', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      // success
      navigate('/managerguides');
    }catch(err){
      console.warn(err);
      setError('Lưu thất bại');
    }finally{ setSaving(false); }
  }

  if(loading) return <div className="mg-loading">Đang tải...</div>;

  return (
    <div className="guide-edit-container">
      <div className="guide-card">
        <div className="guide-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h2>{id ? 'Sửa hướng dẫn' : 'Tạo hướng dẫn'}</h2>
            <div className="guide-sub">{id ? 'Chỉnh sửa nội dung và ảnh minh họa cho hướng dẫn' : 'Tạo mới hướng dẫn với các bước và ảnh minh họa'}</div>
          </div>
          <div className="header-actions">
            <button type="button" className="mg-btn back-btn" onClick={() => navigate(-1)}>Quay lại</button>
          </div>
        </div>

        {error && <div className="mg-error" style={{margin:'8px 20px'}}>{error}</div>}

        <form onSubmit={onSubmit} className="guide-form">
          <div className="form-grid">
            <div className="form-left">
              <div className="field">
                <label className="field-label">Tiêu đề</label>
                <input className="mg-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Nhập tiêu đề" />
              </div>

              <div className="field">
                <label className="field-label">Mô tả ngắn</label>
                <textarea className="mg-textarea" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Tóm tắt ngắn gọn" />
              </div>

              <div className="field">
                <label className="field-label">Các bước hướng dẫn</label>
                <div className="steps-list">
                  {steps.map((step, idx)=> (
                    <div key={idx} className="step-item" style={{border:'1px solid #eef6ff', padding:12, borderRadius:8, marginBottom:12}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                        <div style={{fontWeight:600}}>Bước {idx+1}</div>
                        <div>
                          <button type="button" className="mg-btn" onClick={()=>removeStep(idx)}>Xóa</button>
                        </div>
                      </div>
                      <input className="mg-input" placeholder="Tiêu đề bước (tùy chọn)" value={step.title} onChange={e=>updateStep(idx,'title',e.target.value)} />
                      <textarea className="mg-textarea" rows={4} placeholder="Mô tả/ghi chú cho bước" value={step.text} onChange={e=>updateStep(idx,'text',e.target.value)} style={{marginTop:8}} />
                      <div style={{display:'flex',gap:12,alignItems:'center', marginTop:8}}>
                        <div style={{width:140}}>
                          <div className="preview-image" style={{height:90,backgroundImage:`url(${step.imagePreview||placeholderImg})`, borderRadius:6}} />
                        </div>
                        <div>
                          <input type="file" accept="image/*" onChange={(e)=>onStepFileChange(idx,e)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:10}}><button type="button" className="mg-create-btn" onClick={addStep}>Thêm bước</button></div>
              </div>

              <div className="field row">
                <div style={{flex:1}}>
                  <label className="field-label">Loại cây (chọn)</label>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:6}}>
                    {availablePlantTags.map(t=>{
                      const sel = plantTags.includes(t);
                      return (
                        <button key={t} type="button" className={`tag-chip ${sel? 'selected':''}`} onClick={()=>{
                          setPlantTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev,t]);
                        }}>{t}</button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-right">
              <div className="preview-box">
                <div className="preview-image" style={{backgroundImage:`url(${imagePreview||placeholderImg})`}} />
                <div className="preview-caption">Ảnh minh họa</div>
              </div>

              <div className="field">
                <label className="field-label">Chọn ảnh</label>
                <input type="file" accept="image/*" onChange={onFileChange} />
              </div>

              <div style={{marginTop:20}}>
                <button type="submit" className="mg-create-btn" disabled={saving}>{saving? 'Đang lưu...':'Lưu thay đổi'}</button>
                <button type="button" className="mg-btn mg-cancel" onClick={() => navigate('/managerguides')} style={{marginLeft:12}}>Hủy</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
