import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import PortalModal from "../../components/shared/PortalModal";
import axiosClient from "../../api/shared/axiosClient";

export default function AdminModels() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [current, setCurrent] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [layouts, setLayouts] = useState([]);
  const [showTrash, setShowTrash] = useState(false);

  const fetchItems = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('page', String(p));
      const res = await axiosClient.get(`/admin/models?${params.toString()}`);
      const data = res.data?.data || res.data || {};
      const items = data.items || data.docs || res.data?.items || [];
      const tot = data.total || data.meta?.total || (data.meta?.pages ? data.meta.pages * limit : items.length);
      setItems(items);
      setTotal(Number(tot || 0));
      setPage(Number(p));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(page); }, [page]);

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
    <AdminLayout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Mô hình trồng</h3>
          <div className="d-flex align-items-center">
            {/* showHidden removed as requested */}
            <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setShowTrash(true)}>Thùng rác</button>
            {/* Layouts reference removed */}
            <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}>Tạo mô hình</button>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{width:60}}>STT</th>
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
                    <tr><td colSpan={8}>Đang tải...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={8}>Chưa có bản ghi</td></tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={it._id}>
                          <td className="small text-muted">{(page - 1) * limit + idx + 1}</td>
                          <td title={it._id} style={{ fontFamily: 'monospace' }}>{it._id}</td>
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
                            {/* Delete / Trash action: soft delete (isDeleted=true) */}
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
                            {/* Delete button removed as requested */}
                          </td>
                        </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination controls */}
        <div className="d-flex justify-content-between align-items-center mt-2">
          <div className="text-muted small">Tổng: {total} mục</div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              {(() => {
                const totalPages = Math.max(1, Math.ceil(total / limit));
                const pages = [];
                let start = Math.max(1, page - 2);
                let end = Math.min(totalPages, page + 2);
                if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
                for (let p = start; p <= end; p++) pages.push(p);
                if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
                return [
                  <li key="prev" className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => page > 1 && setPage(page - 1)}>Prev</button>
                  </li>,
                  pages.map((p, i) => (
                    typeof p === 'number' ? (
                      <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                      </li>
                    ) : (
                      <li key={`dot-${i}`} className="page-item disabled"><span className="page-link">{p}</span></li>
                    )
                  )),
                  <li key="next" className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => page < totalPages && setPage(page + 1)}>Next</button>
                  </li>
                ];
              })()}
            </ul>
          </nav>
        </div>

        {showCreate && (
          <PortalModal onClose={() => setShowCreate(false)}>
            <ModelModal title="Tạo mô hình" layouts={layouts} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
          </PortalModal>
        )}

        {/* Layouts reference modal removed */}

        {showTrash && (
          <PortalModal onClose={() => setShowTrash(false)}>
            <TrashModal onClose={() => setShowTrash(false)} />
          </PortalModal>
        )}

        {showEdit && current && (
          <PortalModal onClose={() => { setShowEdit(false); setCurrent(null); }}>
            <ModelModal title="Sửa mô hình" layouts={layouts} initial={current} onClose={() => { setShowEdit(false); setCurrent(null); }} onSubmit={(data) => handleEdit(current._id, data)} />
          </PortalModal>
        )}

        {showConfirm && current && (
          <PortalModal onClose={() => { setShowConfirm(false); setCurrent(null); }}>
            <ConfirmModal title="Xóa mô hình" message={`Bạn có chắc muốn xóa mô hình này không?`} onCancel={() => { setShowConfirm(false); setCurrent(null); }} onConfirm={() => handleDelete(current._id)} />
          </PortalModal>
        )}
      </div>
    </AdminLayout>
  );
}

function ModelModal({ title, initial = {}, onClose, onSubmit, layouts = [] }) {
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
    const payload = {
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
    };
    onSubmit(payload);
  };

  return (
    <div>
      <div className="modal-header">
        <h5 className="modal-title">{title}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      </div>
      <div className="modal-body">
        {/* model_id removed */}
        {/* crop removed: model will be inferred when showing suggestions to users */}
        <div className="mb-3">
          <label className="form-label">Diện tích</label>
          <input type="number" step="0.1" className="form-control form-control-sm" value={area} onChange={(e) => setArea(e.target.value)} />
        </div>
        {/* balconyArea removed per request */}
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
              <input className="form-check-input" type="checkbox" checked={hasRoof} onChange={(e) => setHasRoof(e.target.checked)} id="hasRoof" />
              <label className="form-check-label" htmlFor="hasRoof">Có mái che</label>
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
                    <input className="form-check-input" type="checkbox" id={`layout-${id}`} checked={checked} onChange={(e) => {
                      if (e.target.checked) {
                        if (selectedLayouts.length >= 3) return alert('Chỉ được chọn tối đa 3 bố trí');
                        setSelectedLayouts((s) => [...s, id]);
                      } else {
                        setSelectedLayouts((s) => s.filter((x) => x !== id));
                      }
                    }} />
                    <label className="form-check-label" htmlFor={`layout-${id}`}>{l.layout_name} <small className="text-muted">({l.area_min}-{l.area_max} m²)</small></label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-sm btn-secondary" onClick={onClose}>Hủy</button>
        <button className="btn btn-sm btn-primary" onClick={submit}>Lưu</button>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, onCancel, onConfirm }) {
  return (
    <div>
      <div className="modal-header">
        <h5 className="modal-title">{title}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onCancel}></button>
      </div>
      <div className="modal-body">
        <p>{message}</p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-sm btn-secondary" onClick={onCancel}>Hủy</button>
        <button className="btn btn-sm btn-danger" onClick={onConfirm}>Xóa</button>
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

  return (
    <div style={{ minWidth: 700 }}>
      <div className="modal-header">
        <h5 className="modal-title">Tham khảo bố trí</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      </div>
      <div className="modal-body">
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="row g-2">
            {layouts.map((l) => (
              <div className="col-12" key={l.layout_id}>
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">{l.layout_name} <small className="text-muted">(Diện tích: {l.area_min} - {l.area_max} m²)</small></h6>
                    <p className="mb-1"><strong>Phù hợp:</strong> {l.suitable_space}</p>
                    <p className="mb-1"><strong>Ưu điểm:</strong> {l.advantages}</p>
                    <p className="mb-1"><strong>Lưu ý:</strong> {l.notes}</p>
                    <p className="mb-0 text-muted">{l.description}</p>
                  </div>
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
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
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
