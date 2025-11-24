import React, { useEffect, useState } from "react";
import ModeratorLayout from "../../components/ModeratorLayout";
import { profileApi } from "../../api/shared/profileApi.js";
import axiosClient from '../../api/shared/axiosClient';
import { Button, Modal, Form, Input, Tabs, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '../../redux/authSlice';

export default function ModeratorProfile() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [form] = Form.useForm();
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await profileApi.getProfile();
        const payload = res.data?.data || {};
        if (!mounted) return;
        setUser(payload.user || null);
        setProfile(payload || null);
        try {
          if (typeof window !== 'undefined' && payload) {
            if (payload.avatar) localStorage.setItem('profile_avatar', payload.avatar);
            if (payload.fullName) localStorage.setItem('profile_fullName', payload.fullName);
          }
        } catch (e) { }
      } catch (err) {
        console.error(err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const openEdit = () => {
    form.setFieldsValue({
      name: profile?.fullName || user?.username || '',
      address: profile?.address || '',
      mobilePhone: profile?.phone || user?.phone || '',
      email: user?.email || ''
    });
    setPhotoPreview(profile?.avatar || user?.avatar || null);
    setEditVisible(true);
  };

  const handlePhotoChange = ({ file }) => {
    const f = file.originFileObj || file;
    setPhotoFile(f);
    const url = URL.createObjectURL(f);
    setPhotoPreview(url);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      let payload = {};
      if (values.name) payload.fullName = values.name;
      if (values.mobilePhone) payload.phone = values.mobilePhone;
      if (values.address) payload.address = values.address;
      if (values.dob) payload.dob = values.dob;
      if (values.gender) payload.gender = values.gender;
      if (values.bio) payload.bio = values.bio;

      if (photoFile) {
        try {
          const fd = new FormData();
          fd.append('image', photoFile);
          const upRes = await axiosClient.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          let returnedUrl = upRes?.data?.data?.url;
          if (returnedUrl) {
            if (!/^https?:\/\//i.test(returnedUrl)) {
              const base = axiosClient.defaults?.baseURL || (typeof window !== 'undefined' && window.location.origin) || '';
              returnedUrl = (base.replace(/\/$/, '') || '') + (returnedUrl.startsWith('/') ? returnedUrl : '/' + returnedUrl);
            }
            payload.avatar = returnedUrl;
          } else {
            console.warn('Upload succeeded but no url returned', upRes);
            message.error('Upload ảnh thất bại: không nhận được đường dẫn ảnh');
            return;
          }
        } catch (upErr) {
          console.error('Upload error', upErr);
          message.error('Không thể upload ảnh. Vui lòng thử lại.');
          return;
        }
      }

      await profileApi.updateProfile(payload);

      message.success('Cập nhật hồ sơ thành công');
      setEditVisible(false);
      setLoading(true);
      const res = await profileApi.getProfile();
      const refreshed = res.data?.data || null;
      setUser(refreshed?.user || null);
      setProfile(refreshed || null);
      try {
        if (typeof window !== 'undefined' && refreshed) {
          if (refreshed.avatar) localStorage.setItem('profile_avatar', refreshed.avatar);
          if (refreshed.fullName) localStorage.setItem('profile_fullName', refreshed.fullName);

          // Also update persisted `user` object and Redux store so Header reflects new avatar immediately
          try {
            const raw = localStorage.getItem('user');
            let storedUser = raw ? JSON.parse(raw) : null;
            if (storedUser) {
              storedUser.profile = storedUser.profile || {};
              if (refreshed.avatar) storedUser.profile.avatar = refreshed.avatar;
              if (refreshed.fullName) storedUser.profile.fullName = refreshed.fullName;
              localStorage.setItem('user', JSON.stringify(storedUser));
              // update redux auth user
              dispatch(loginSuccess({ user: storedUser, accessToken }));
            }
          } catch (e2) {
            console.warn('Failed to update persisted user after profile save', e2);
          }
        }
      } catch (e) { }
      setLoading(false);
    } catch (err) {
      console.error('Save profile failed', err);
      const msg = err?.response?.data?.message || err?.message || 'Cập nhật không thành công';
      message.error(msg);
    }
  };

  return (
    <ModeratorLayout>
      <div className="container-fluid">
        <div style={{height:120, borderRadius:12, background: 'linear-gradient(120deg, #23622B, #2e7d32)', position:'relative', boxShadow: '0 4px 8px rgba(0,0,0,0.06)'}}>
          <Button size="small" type="primary" onClick={openEdit} style={{position:'absolute', top:12, right:16, borderRadius:6, fontWeight:600, background:'#205018', borderColor:'#0f6f29', color:'#fff'}}>Chỉnh sửa</Button>

          <div style={{position:'absolute', bottom:-40, left:32, width:90, height:90, borderRadius:'50%', background:'#fff', padding:6, boxShadow:'0 4px 10px rgba(0,0,0,0.12)'}}>
            <div style={{width:'100%', height:'100%', borderRadius:'50%', background:'#eee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, fontWeight:700, color:'#444'}}>
              {photoPreview || profile?.avatar ? (
                <img src={photoPreview || profile?.avatar} alt="avatar" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} />
              ) : (
                (profile?.fullName || user?.username || 'M')[0]?.toUpperCase()
              )}
            </div>
          </div>
        </div>

        <div className="card border-0 mt-5" style={{borderRadius:12}}>
          <div className="card-body px-4 py-4">
            <h4 className="fw-bold mb-1" style={{marginLeft:5}}>{profile?.fullName || user?.username}</h4>
            <div className="text-muted" style={{fontSize:14, marginLeft:5, lineHeight:'22px'}}>
              📍 Việt Nam <span className="mx-2">|</span> Role: <span style={{color:'#00ff4c', fontWeight:700}}>Moderator</span>
            </div>

            <hr className="my-4" />

            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="profile-row">
                  <span className="profile-label">Họ và tên</span>
                  <span className="profile-value">{profile?.fullName || '-'}</span>
                </div>

                <div className="profile-row">
                  <span className="profile-label">Địa chỉ</span>
                  <span className="profile-value">{profile?.address || '-'}</span>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="profile-row">
                  <span className="profile-label">Số Điện Thoại</span>
                  <span className="profile-value">{profile?.phone || '-'}</span>
                </div>

                <div className="profile-row">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{user?.email || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .profile-row { display:flex; margin-bottom:10px }
          .profile-label { width:120px; color:#666; font-weight:600 }
          .profile-value { font-weight:500; color:#222 }
        `}</style>

        <Modal title="Chỉnh sửa hồ sơ" open={editVisible} onCancel={() => setEditVisible(false)} onOk={handleSave} okText="Lưu" cancelText="Hủy" width={820}>
          <div style={{display:'flex', gap:20}}>
            <div style={{width:220}}>
              <div style={{textAlign:'center'}}>
                <div style={{width:140, height:140, borderRadius:'50%', overflow:'hidden', margin:'0 auto 12px', border:'1px solid #eaeaea'}}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="avatar" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                  ) : (
                    <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f5'}}>No Photo</div>
                  )}
                </div>
                <Upload showUploadList={false} beforeUpload={() => false} onChange={handlePhotoChange} accept="image/*">
                  <Button icon={<UploadOutlined />}>Thay ảnh</Button>
                </Upload>
              </div>
            </div>

            <div style={{flex:1}}>
              <Tabs defaultActiveKey="personal">
                <Tabs.TabPane tab="Personal" key="personal">
                  <Form form={form} layout="vertical">
                    <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter name' }]}>
                      <Input />
                    </Form.Item>

                    <Form.Item name="address" label="Địa chỉ"><Input /></Form.Item>
                    <Form.Item name="mobilePhone" label="Số Điện Thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }, { pattern: /^[0-9]{9,12}$/, message: 'Số điện thoại không hợp lệ (9-12 chữ số)' }]}>
                      <Input placeholder="Ví dụ: 0912345678" />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }, { required: true, message: 'Vui lòng nhập email' }]}>
                      <Input />
                    </Form.Item>
                  </Form>
                </Tabs.TabPane>
              </Tabs>
            </div>
          </div>
        </Modal>
      </div>
    </ModeratorLayout>
  );
}
