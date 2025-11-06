import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/ExpertHome.css'
import axiosClient from '../api/axiosClient'

export default function PlantModelForm() {
  const emptyForm = { crop: '', area: '', soil: '', climate: '', irrigation: '', description: '' }
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  function handleChange(e) {
    const { name, value } = e.target
    setForm(s => ({ ...s, [name]: value }))
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    if (!form.crop || !form.crop.trim()) {
      setError("Trường 'Cây trồng' là bắt buộc.")
      setLoading(false)
      return
    }
    try {
      await axiosClient.post('/plant-models', form)
      navigate('/plantmodels')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Lỗi khi tạo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content-container">
      <section className="welcome-section">
        <h2 className="welcome-title">Tạo Mô hình Trồng</h2>
        <p className="welcome-subtitle">Điền thông tin để tạo một mô hình trồng mới.</p>
      </section>

      <div className="panel">
        <div className="card">
          {error && <p style={{ color: 'var(--color-error)' }}>{error}</p>}
          <form onSubmit={handleSubmit} className="form-grid">
            <div>
              <label>Cây trồng *</label>
              <input name="crop" value={form.crop} onChange={handleChange} required placeholder="Ví dụ: Cà chua" />
            </div>
            <div>
              <label>Diện tích (m²)</label>
              <input name="area" value={form.area} onChange={handleChange} type="number" placeholder="Ví dụ: 100" />
            </div>
            <div>
              <label>Đất</label>
              <input name="soil" value={form.soil} onChange={handleChange} placeholder="Ví dụ: Đất tơi xốp" />
            </div>
            <div>
              <label>Khí hậu</label>
              <input name="climate" value={form.climate} onChange={handleChange} placeholder="Ví dụ: Nhiệt đới ẩm" />
            </div>
            <div>
              <label>Tưới</label>
              <input name="irrigation" value={form.irrigation} onChange={handleChange} placeholder="Ví dụ: Nhỏ giọt" />
            </div>
            <div>
              <label>Mô tả</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Thêm ghi chú hoặc hướng dẫn sơ bộ" />
            </div>
            <div className="cta-row">
              <button className="btn btn-secondary" type="button" onClick={() => navigate('/plantmodels')}>Hủy</button>
              <button className="btn btn-primary" type="submit" disabled={loading}>Tạo</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
