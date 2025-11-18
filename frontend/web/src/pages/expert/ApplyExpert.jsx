import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/shared/Header.jsx";
import { profileApi } from "../../api/shared/profileApi.js";
import expertApplicationApi from "../../api/shared/expertApplicationApi.js";
import { toast } from "react-toastify";

export default function ApplyExpert() {
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(true);
  const [myApps, setMyApps] = useState([]);
  const [applySaving, setApplySaving] = useState(false);
  const [applyForm, setApplyForm] = useState({
    full_name: "",
    expertise_area: "",
    experience_years: 0,
    description: "",
    phone_number: "",
    certificates: [""],
  });
  const [applyFieldErrors, setApplyFieldErrors] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await profileApi.getProfile();
        const payload = data?.data || {};
        setApplyForm((prev) => ({
          ...prev,
          full_name: payload.fullName || prev.full_name,
          phone_number: payload.phone || prev.phone_number,
        }));
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }

      try {
        setAppsLoading(true);
        const res = await expertApplicationApi.getMine();
        setMyApps(res?.data?.data || []);
      } catch (e) {
        // ignore
      } finally {
        setAppsLoading(false);
      }
    })();
  }, []);

  const onApplyChange = (name, value) => {
    setApplyForm((prev) => ({ ...prev, [name]: value }));
  };

  const addCertField = () => {
    setApplyForm((prev) => ({ ...prev, certificates: [...prev.certificates, ""] }));
  };

  const setCertAt = (i, val) => {
    const next = [...applyForm.certificates];
    next[i] = val;
    setApplyForm((prev) => ({ ...prev, certificates: next }));
  };

  async function submitApplication(e) {
    e.preventDefault();
    if (!applyForm.full_name?.trim() || !applyForm.expertise_area?.trim()) {
      return toast.error("Họ tên + lĩnh vực là bắt buộc.");
    }

    setApplySaving(true);
    setApplyFieldErrors({});
    try {
      const payload = { ...applyForm, certificates: applyForm.certificates.filter(Boolean) };
      await expertApplicationApi.create(payload);
      toast.success("Đã gửi đơn đăng ký Expert!");
      // refresh list and navigate to profile after short delay
      const res = await expertApplicationApi.getMine();
      setMyApps(res?.data?.data || []);
      setTimeout(() => navigate("/profile"), 800);
    } catch (err) {
      const status = err?.response?.status;
      const body = err?.response?.data;
      if (status === 422 || status === 400) {
        const errors = {};
        if (body?.errors && typeof body.errors === "object") {
          Object.assign(errors, body.errors);
        } else if (Array.isArray(body?.details)) {
          body.details.forEach((d) => {
            const path = Array.isArray(d.path) ? d.path.join(".") : d.path;
            errors[path] = d.message;
          });
        }
        setApplyFieldErrors(errors);
        toast.error(body?.message || "Vui lòng kiểm tra các trường");
      } else {
        toast.error(body?.message || body?.error || "Nộp đơn thất bại");
      }
    } finally {
      setApplySaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">Đang tải…</div>
    );
  }

  return (
    <div>
      <Header />
      <div className="agri-theme-container py-8">
        <h1 className="text-2xl font-semibold mb-4 text-agri-primary">✉️ Nộp đơn Expert</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="agri-card lg:col-span-3">
            <form onSubmit={submitApplication} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="agri-label">Họ và tên *</label>
                  <input type="text" className="agri-input" value={applyForm.full_name} onChange={(e)=>onApplyChange('full_name', e.target.value)} />
                  {applyFieldErrors?.full_name && <p className="text-sm text-red-600 mt-1">{applyFieldErrors.full_name}</p>}
                </div>
                <div>
                  <label className="agri-label">Số điện thoại</label>
                  <input type="text" className="agri-input" value={applyForm.phone_number} onChange={(e)=>onApplyChange('phone_number', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="agri-label">Lĩnh vực chuyên môn *</label>
                <input type="text" className="agri-input" value={applyForm.expertise_area} onChange={(e)=>onApplyChange('expertise_area', e.target.value)} />
                {applyFieldErrors?.expertise_area && <p className="text-sm text-red-600 mt-1">{applyFieldErrors.expertise_area}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="agri-label">Số năm kinh nghiệm</label>
                  <input type="number" min="0" className="agri-input" value={applyForm.experience_years} onChange={(e)=>onApplyChange('experience_years', Number(e.target.value)||0)} />
                </div>
              </div>

              <div>
                <label className="agri-label">Giới thiệu</label>
                <textarea rows={4} className="agri-input" value={applyForm.description} onChange={(e)=>onApplyChange('description', e.target.value)} />
              </div>

              <div>
                <label className="agri-label">Chứng chỉ / Portfolio (URL)</label>
                <div className="space-y-2">
                  {applyForm.certificates.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" className="flex-1 agri-input" value={url} onChange={(e)=>setCertAt(i, e.target.value)} />
                      {i === applyForm.certificates.length - 1 && (
                        <button type="button" className="px-3 py-2 rounded-xl border text-agri-primary hover:bg-agri-green-light" onClick={addCertField}>+</button>
                      )}
                      {(applyFieldErrors && (applyFieldErrors[`certificates.${i}`] || applyFieldErrors[`certificates[${i}]`])) ? (
                        <p className="text-sm text-red-600 w-full mt-1">{applyFieldErrors[`certificates.${i}`] || applyFieldErrors[`certificates[${i}]`]}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>navigate(-1)} className="agri-btn-secondary">Hủy</button>
                <button type="submit" disabled={applySaving} className="agri-btn-primary">{applySaving ? 'Đang gửi…' : '✉️ Nộp đơn'}</button>
              </div>
            </form>
          </div>

          <div className="agri-card lg:col-span-3">
            <h3 className="font-semibold mb-2 text-agri-primary">Lịch sử Đơn đã nộp</h3>
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm agri-table">
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Lĩnh vực</th>
                    <th>Kinh nghiệm</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {appsLoading ? (
                    <tr><td colSpan="5" className="p-3 text-center text-agri-gray">Đang tải…</td></tr>
                  ) : myApps.length ? (
                    myApps.map((it) => (
                      <tr key={it._id}>
                        <td>{it.full_name}</td>
                        <td>{it.email}</td>
                        <td>{it.expertise_area}</td>
                        <td>{it.experience_years} năm</td>
                        <td><span className={"status-tag "+(it.status==='pending'?'status-pending':it.status==='approved'?'status-approved':'status-rejected')}>{it.status}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="p-3 text-center text-agri-gray">Chưa có đơn nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
