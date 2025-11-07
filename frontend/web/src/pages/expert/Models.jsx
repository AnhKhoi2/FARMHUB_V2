import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";

export default function ExpertModels() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [current, setCurrent] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [layouts, setLayouts] = useState([]);
  const [showTrash, setShowTrash] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      const res = await axiosClient.get(`/admin/models?${params.toString()}`);
      const items = res.data?.data?.items || res.data?.items || res.data?.data || [];
      setItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    let mounted = true;
    const fetchLayouts = async () => {
      try {
        const res = await axiosClient.get('/layouts');
        const data = res.data?.data || res.data || [];
        if (mounted) setLayouts(data || []);
      } catch (err) {
        console.error('Failed to load layouts', err);
      }
    };
    fetchLayouts();
    return () => { mounted = false; };
  }, []);

  const handleCreate = async (payload) => {
    await axiosClient.post("/admin/models", payload);
    setShowCreate(false);
    fetchItems();
  };

  const handleEdit = async (id, payload) => {
    await axiosClient.put(`/admin/models/${id}`, payload);
    setShowEdit(false);
    setCurrent(null);
    fetchItems();
  };

  const handleDelete = async (id) => {
    await axiosClient.delete(`/admin/models/${id}`);
    setShowConfirm(false);
    setCurrent(null);
    fetchItems();
  };

  return (
    <div className="container py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Mô hình trồng</h3>
          <div className="d-flex align-items-center">
          {/* showHidden removed */}
          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setShowTrash(true)}>Thùng rác</button>
          {/* Layouts reference removed */}
          <button className="btn btn-sm btn-secondary me-2" onClick={() => navigate('/experthome')}>Quay lại</button>
          <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}>Tạo mô hình</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Diện tích</th>
                  <th>Đất</th>

  
                  <th>Khí hậu</th>
                  <th>Tưới</th>
                  <th>Bố trí</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7}>Đang tải...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={7}>Chưa có bản ghi</td></tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={it._id}>
                      <td title={it._id} style={{ fontFamily: 'monospace' }}>{String(idx + 1).padStart(2, '0')}</td>
                      <td>{it.area}</td>
                      <td>{it.soil}</td>
                      <td>{it.climate}</td>
                      <td>{it.irrigation}</td>
                      <td>
                        {(it.layouts || []).map((id) => {
                          const found = layouts.find((l) => Number(l.layout_id) === Number(id));
                          return found ? <div key={id} className="badge bg-light border text-dark me-1">{found.layout_name}</div> : null;
                        })}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setCurrent(it); setShowEdit(true); }}>Sửa</button>
                        {!it.isDeleted ? (
                          <button className="btn btn-sm btn-outline-danger me-2" onClick={async () => {
                            try {
                              await axiosClient.patch(`/admin/models/${it._id}/hide`);
                              await fetchItems();
                            } catch (err) {
                              console.error('Delete (hide) error', err);
                              alert('Không thể xóa mô hình');
                            }
                          }}>Xóa</button>
                        ) : (
                          <button className="btn btn-sm btn-success me-2" onClick={async () => {
                            try {
                              await axiosClient.patch(`/admin/models/${it._id}/restore`);
                              await fetchItems();
                            } catch (err) {
                              console.error('Restore error', err);
                              alert('Không thể hoàn tác');
                            }
                          }}>Hoàn tác</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Simple modals implemented inline for quick demo */}
      {showCreate && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tạo mô hình</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreate(false)} />
              </div>
              <div className="modal-body">
                <ModelForm layouts={layouts} onSubmit={async (p) => { await handleCreate(p); }} onCancel={() => setShowCreate(false)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showEdit && current && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Sửa mô hình</h5>
                <button type="button" className="btn-close" onClick={() => { setShowEdit(false); setCurrent(null); }} />
              </div>
              <div className="modal-body">
                <ModelForm layouts={layouts} initial={current} onSubmit={async (p) => { await handleEdit(current._id, p); }} onCancel={() => { setShowEdit(false); setCurrent(null); }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && current && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Xác nhận</h5>
                <button type="button" className="btn-close" onClick={() => { setShowConfirm(false); setCurrent(null); }} />
              </div>
              <div className="modal-body">
                <p>Bạn có chắc muốn xóa mô hình này?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-sm btn-secondary" onClick={() => { setShowConfirm(false); setCurrent(null); }}>Hủy</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(current._id)}>Xóa</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Layouts reference modal removed */}
      {showTrash && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <TrashModal onClose={() => setShowTrash(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModelForm({ initial = {}, onSubmit, onCancel, layouts = [] }) {
  const [area, setArea] = useState(initial.area || "");
  const [selectedLayouts, setSelectedLayouts] = useState(initial.layouts ? initial.layouts.map((v) => Number(v)) : []);
  const [soil, setSoil] = useState(initial.soil || "");
  const [climate, setClimate] = useState(initial.climate || "");
  const [irrigation, setIrrigation] = useState(initial.irrigation || "");
  
  const [sunHours, setSunHours] = useState(initial.sunHours || "");
  const [sunIntensity, setSunIntensity] = useState(initial.sunIntensity || "");
  const [wind, setWind] = useState(initial.wind || "");
  const [hasRoof, setHasRoof] = useState(!!initial.hasRoof);
  const [floorMaterial, setFloorMaterial] = useState(initial.floorMaterial || "");
  const [description, setDescription] = useState(initial.description || "");

  const submit = () => {
    if (!selectedLayouts || selectedLayouts.length !== 3) {
      return alert('Vui lòng chọn đúng 3 cách bố trí cho mô hình.');
    }
    onSubmit({
      area: area === "" ? undefined : Number(area),
      soil,
      climate,
      irrigation,
      sunHours: sunHours === "" ? undefined : Number(sunHours),
      sunIntensity: sunIntensity || undefined,
      wind: wind || undefined,
      hasRoof,
      floorMaterial: floorMaterial || undefined,
      description,
      layouts: selectedLayouts,
    });
  };

  return (
    <div>
      {/* model_id removed */}
      {/* crop removed: model selection will be inferred from user inputs when showing to users */}
      <div className="mb-3">
        <label className="form-label">Diện tích</label>
        <input type="number" step="0.1" className="form-control form-control-sm" value={area} onChange={(e) => setArea(e.target.value)} />
      </div>
      {/* balconyArea removed */}
      <div className="mb-3">
        <label className="form-label">Loại đất</label>
        <input className="form-control form-control-sm" value={soil} onChange={(e) => setSoil(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="form-label">Khí hậu</label>
        <input className="form-control form-control-sm" value={climate} onChange={(e) => setClimate(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="form-label">Tưới</label>
        <input className="form-control form-control-sm" value={irrigation} onChange={(e) => setIrrigation(e.target.value)} />
      </div>
      <div className="mb-3 row">
        <div className="col-md-4">
          <label className="form-label">Thời gian có nắng (giờ)</label>
          <input type="number" step="0.1" min="0" max="24" className="form-control form-control-sm" value={sunHours} onChange={(e) => setSunHours(e.target.value)} />
        </div>
        <div className="col-md-4">
          <label className="form-label">Cường độ ánh sáng</label>
          <select className="form-select form-select-sm" value={sunIntensity} onChange={(e) => setSunIntensity(e.target.value)}>
            <option value="">-- Chọn --</option>
            <option value="Yếu">Yếu</option>
            <option value="Vừa">Vừa</option>
            <option value="Nắng gắt">Nắng gắt</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Mức độ gió</label>
          <select className="form-select form-select-sm" value={wind} onChange={(e) => setWind(e.target.value)}>
            <option value="">-- Chọn --</option>
            <option value="Yếu">Yếu</option>
            <option value="Vừa">Vừa</option>
            <option value="Mạnh">Mạnh</option>
          </select>
        </div>
      </div>
      <div className="mb-3 row align-items-center">
        <div className="col-md-4">
          <label className="form-label">Có mái che</label>
          <div className="form-check">
            <input className="form-check-input" type="checkbox" checked={hasRoof} onChange={(e) => setHasRoof(e.target.checked)} id="hasRoofExp" />
            <label className="form-check-label" htmlFor="hasRoofExp">Có mái che</label>
          </div>
        </div>
        <div className="col-md-8">
          <label className="form-label">Chất liệu nền</label>
          <select className="form-select form-select-sm" value={floorMaterial} onChange={(e) => setFloorMaterial(e.target.value)}>
            <option value="">-- Chọn --</option>
            <option value="Gạch">Gạch</option>
            <option value="Xi măng">Xi măng</option>
            <option value="Gỗ">Gỗ</option>
            <option value="Chống thấm">Chống thấm</option>
            <option value="Khác">Khác</option>
          </select>
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label">Mô tả</label>
        <textarea className="form-control form-control-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="form-label">Chọn 3 bố trí tham khảo</label>
        <div className="row g-2">
          {layouts.map((l) => {
            const id = Number(l.layout_id);
            const checked = selectedLayouts.includes(id);
            return (
              <div className="col-6" key={id}>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id={`layout-exp-${id}`} checked={checked} onChange={(e) => {
                    if (e.target.checked) {
                      if (selectedLayouts.length >= 3) return alert('Chỉ được chọn tối đa 3 bố trí');
                      setSelectedLayouts((s) => [...s, id]);
                    } else {
                      setSelectedLayouts((s) => s.filter((x) => x !== id));
                    }
                  }} />
                  <label className="form-check-label" htmlFor={`layout-exp-${id}`}>{l.layout_name} <small className="text-muted">({l.area_min}-{l.area_max} m²)</small></label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="d-flex justify-content-end">
        <button className="btn btn-sm btn-secondary me-2" onClick={onCancel}>Hủy</button>
        <button className="btn btn-sm btn-primary" onClick={submit}>Lưu</button>
      </div>
    </div>
  );
}

function LayoutsModal({ onClose }) {
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get('/layouts');
        const data = res.data?.data || res.data;
        if (mounted) setLayouts(data || []);
      } catch (err) {
        console.error('Failed to load layouts', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, []);

  // Layouts reference removed from expert UI — keep layouts fetching for ModelForm usage
  return null;
}

  function TrashModal({ onClose }) {
    const [trash, setTrash] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTrash = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get('/admin/models/trash?limit=200');
        const items = res.data?.data || res.data || [];
        setTrash(items || []);
      } catch (err) {
        console.error('Failed to load trash', err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => { fetchTrash(); }, []);

    const handleRestore = async (id) => {
      try {
        await axiosClient.patch(`/admin/models/${id}/restore`);
        await fetchTrash();
      } catch (err) {
        console.error('Restore error', err);
        alert('Không thể hoàn tác');
      }
    };

    return (
      <div style={{ minWidth: 700 }}>
        <div className="modal-header">
          <h5 className="modal-title">Thùng rác - Mô hình đã xóa</h5>
          <button type="button" className="btn-close" onClick={onClose} />
        </div>
        <div className="modal-body">
          {loading ? <p>Đang tải...</p> : (
            <div className="list-group">
              {trash.length === 0 ? <p>Không có mô hình đã xóa</p> : trash.map((t) => (
                <div key={t._id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <div>Diện tích: {t.area} m² — {t.soil}</div>
                    <div className="text-muted small">{t.description}</div>
                  </div>
                  <div>
                    <button className="btn btn-sm btn-success me-2" onClick={() => handleRestore(t._id)}>Hoàn tác</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-sm btn-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    );
  }
