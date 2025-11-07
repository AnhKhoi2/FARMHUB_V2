import React, { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import "../css/ExpertContent.css";

const API_BASE = "http://localhost:5000";
const APP_LIST_API = `${API_BASE}/api/expert-applications`;
const APP_DETAIL_API = (id) => `${API_BASE}/api/expert-applications/${id}`;
const APP_APPROVE_API = (id) => `${API_BASE}/api/expert-applications/${id}/approve`;
const APP_REJECT_API = (id) => `${API_BASE}/api/expert-applications/${id}/reject`;

const PAGE_SIZE = 6;
const REVIEW_STATUSES = ["pending", "approved", "rejected", "banned", "inactive"];
const cx = (...xs) => xs.filter(Boolean).join(" ");

// ---------- Modal ----------
function Modal({ open, title, onClose, children, narrow = false }) {
  if (!open) return null;
  return (
    <>
      <div className="ec-modal-backdrop" onClick={onClose} />
      <div className="ec-modal">
        <div className={`ec-modal-card ${narrow ? "confirm-card" : ""}`}>
          <div className="ec-modal-head">
            <div className="ec-modal-title">{title}</div>
            <button className="ec-x" onClick={onClose}>✕</button>
          </div>
          <div className="ec-modal-body">{children}</div>
        </div>
      </div>
    </>
  );
}

// ---------- helpers ----------
function parseListResponse(j) {
  if (j?.data && Array.isArray(j.data.items)) {
    return { items: j.data.items, total: Number(j.data.total ?? j.data.items.length), page: Number(j.data.page ?? 1), limit: Number(j.data.limit ?? PAGE_SIZE), serverPaged: true };
  }
  if (Array.isArray(j?.data)) return { items: j.data, total: j.data.length, page: 1, limit: j.data.length, serverPaged: false };
  if (Array.isArray(j)) return { items: j, total: j.length, page: 1, limit: j.length, serverPaged: false };
  return { items: [], total: 0, page: 1, limit: PAGE_SIZE, serverPaged: false };
}

const toFECerts = (arr) => (Array.isArray(arr) ? arr.map((c) => c?.url || c).filter(Boolean) : []);

// ===================================================================
// Component
// ===================================================================
export default function ExpertContent() {
  // Tabs
  const [tab, setTab] = useState("experts"); // "experts" | "pending"

  // ===== EXPERTS LIST =====
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // filters (match BE)
  const [q, setQ] = useState("");
  const [reviewStatus, setReviewStatus] = useState(""); // '' = all
  const [isPublic, setIsPublic] = useState(""); // '', 'true', 'false'
  const [minExp, setMinExp] = useState("");
  const [maxExp, setMaxExp] = useState("");
  const [page, setPage] = useState(1);

  // delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  // view (read-only)
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (reviewStatus) sp.set("review_status", reviewStatus);
    if (isPublic !== "") sp.set("is_public", isPublic);
    if (minExp !== "") sp.set("min_exp", String(minExp));
    if (maxExp !== "") sp.set("max_exp", String(maxExp));
    sp.set("page", String(page));
    sp.set("limit", String(PAGE_SIZE));
    return sp.toString();
  }, [q, reviewStatus, isPublic, minExp, maxExp, page]);

  async function fetchList() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/experts?${queryString}`);
      if (!res.ok) throw new Error("Failed to load list");
      const j = await res.json();
      const parsed = parseListResponse(j);
      let list = parsed.items || [];

      if (parsed.serverPaged) {
        setItems(list);
        setTotal(parsed.total || list.length);
      } else {
        list = list.slice().reverse();
        setTotal(list.length);
        const start = (page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        setItems(list.slice(start, end));
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load experts");
      setItems([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (tab === "experts") fetchList(); /* eslint-disable */ }, [queryString, tab]);

  // View (read-only)
  async function openView(row) {
    try {
      setViewLoading(true);
      setViewOpen(true);
      const id = row.expert_id || row._id || row.id;
      const res = await fetch(`${API_BASE}/api/experts/${id}`);
      if (!res.ok) throw new Error("Failed to load detail");
      const j = await res.json(); const d = j.data || j;
      setViewData({
        ...d,
        certificates: toFECerts(d.certificates),
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load expert detail");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  }

  function askDelete(row) {
    setRowToDelete(row);
    setConfirmOpen(true);
  }
  async function confirmDelete() {
    if (!rowToDelete) return;
    try {
      const id = rowToDelete.expert_id || rowToDelete._id || rowToDelete.id;
      const res = await fetch(`${API_BASE}/api/experts/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");
      toast.success("Delete successfully");
      setConfirmOpen(false); setRowToDelete(null);
      fetchList();
    } catch (e) { console.error(e); toast.error("Delete failed"); }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 1; const canNext = page < pageCount;

  // ===== PENDING (applications via review flow) =====
  const [apps, setApps] = useState([]);
  const [appsTotal, setAppsTotal] = useState(0);
  const [appsPage, setAppsPage] = useState(1);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsQ, setAppsQ] = useState("");

  const appsQS = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("status", "pending");
    if (appsQ) sp.set("q", appsQ);
    sp.set("page", String(appsPage));
    sp.set("limit", String(PAGE_SIZE));
    return sp.toString();
  }, [appsQ, appsPage]);

  async function fetchApps() {
    try {
      setAppsLoading(true);
      const res = await fetch(`${APP_LIST_API}?${appsQS}`);
      if (!res.ok) throw new Error("Failed to load pending");
      const j = await res.json();
      const parsed = parseListResponse(j);
      let list = parsed.items || [];
      if (parsed.serverPaged) {
        setApps(list);
        setAppsTotal(parsed.total || list.length);
      } else {
        list = list.slice().reverse();
        setAppsTotal(list.length);
        const start = (appsPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        setApps(list.slice(start, end));
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load applications");
      setApps([]); setAppsTotal(0);
    } finally { setAppsLoading(false); }
  }
  useEffect(() => { if (tab === "pending") fetchApps(); /* eslint-disable */ }, [appsQS, tab]);

  const appsPageCount = Math.max(1, Math.ceil(appsTotal / PAGE_SIZE));
  const appsPrev = appsPage > 1; const appsNext = appsPage < appsPageCount;

  // review modal (approve/reject)
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [activateExpert, setActivateExpert] = useState(true); // set is_public when approve

  async function openReview(row) {
    try {
      const id = row._id || row.id;
      const res = await fetch(APP_DETAIL_API(id));
      if (!res.ok) throw new Error("Failed to load detail");
      const j = await res.json();
      const d = j.data || j;
      setCurrentApp(d);
      setReviewNotes("");
      setActivateExpert(true);
      setReviewOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load application detail");
    }
  }

  async function approveApp() {
    if (!currentApp) return;
    try {
      setReviewing(true);
      const id = currentApp._id || currentApp.id;
      const res = await fetch(APP_APPROVE_API(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activate_expert: !!activateExpert,
          review_notes: reviewNotes || "",
        }),
      });
      if (!res.ok) throw new Error("Approve failed");
  
      toast.success("Approved successfully");
      setReviewOpen(false);
      setCurrentApp(null);
  
      // ✅ Xóa item khỏi danh sách pending ngay tại client
      setApps(prev => prev.filter(x => (x._id || x.id) !== id));
  
      // Nếu đang ở tab "experts" thì reload lại danh sách chuyên gia
      if (tab === "experts") fetchList();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Approve failed");
    } finally {
      setReviewing(false);
    }
  }

  async function rejectApp() {
    if (!currentApp) return;
    try {
      setReviewing(true);
      const id = currentApp._id || currentApp.id;
      const res = await fetch(APP_REJECT_API(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reviewNotes.trim() || "Rejected by admin",
        }),
      });
      if (!res.ok) throw new Error("Reject failed");
  
      toast.success("Rejected application");
      setReviewOpen(false);
      setCurrentApp(null);
  
      // ✅ Xóa khỏi danh sách pending
      setApps(prev => prev.filter(x => (x._id || x.id) !== id));
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Reject failed");
    } finally {
      setReviewing(false);
    }
  }

  return (
    <div className="ec-wrap">
      <Toaster position="top-right" />

      {/* Tabs */}
      <div className="ec-tabs" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className={cx("ec-tab", tab === "experts" && "active")} onClick={() => setTab("experts")}>
          Experts
        </button>
        <button className={cx("ec-tab", tab === "pending" && "active")} onClick={() => setTab("pending")}>
          Applications (Pending)
        </button>
      </div>

      {/* ===== EXPERTS VIEW (no add, no edit) ===== */}
      {tab === "experts" && (
        <>
          {/* Filters */}
          <div className="ec-filters">
            <div className="col-2">
              <input className="ec-input" placeholder="Search by name / expertise / description…"
                value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
            </div>

            <select className="ec-select" value={reviewStatus} onChange={(e) => { setPage(1); setReviewStatus(e.target.value); }}>
              <option value="">All review statuses</option>
              {REVIEW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select className="ec-select" value={isPublic} onChange={(e) => { setPage(1); setIsPublic(e.target.value); }}>
              <option value="">All visibility</option>
              <option value="true">Public</option>
              <option value="false">Private</option>
            </select>

            <input type="number" className="ec-input" placeholder="Min exp" min="0" value={minExp}
              onChange={(e) => { setPage(1); setMinExp(e.target.value); }} />

            <input type="number" className="ec-input" placeholder="Max exp" min="0" value={maxExp}
              onChange={(e) => { setPage(1); setMaxExp(e.target.value); }} />
          </div>

          {/* Table */}
          <div className="ec-card">
            <table className="ec-table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Phone</th><th>Expertise</th>
                  <th>Exp(Y)</th><th>Review</th><th>Public</th><th className="txt-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && items.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: "24px", color: "#6b7280" }}>No data</td></tr>
                )}
                {items.map((it) => (
                  <tr key={it._id || it.id || it.expert_id}>
                    <td>{it.full_name}</td>
                    <td>{it?.user?.email || "—"}</td>
                    <td>{it.phone_number || "—"}</td>
                    <td>{it.expertise_area || "—"}</td>
                    <td>{it.experience_years ?? "-"}</td>
                    <td>
                      <span className={cx("badge",
                        it.review_status === "approved" && "green",
                        it.review_status === "pending" && "amber",
                        it.review_status === "rejected" && "red",
                        it.review_status === "banned" && "red",
                        it.review_status === "inactive" && "gray"
                      )}>
                        {it.review_status}
                      </span>
                    </td>
                    <td>{it.is_public ? "Yes" : "No"}</td>
                    <td className="txt-right">
                      <div className="ec-actions">
                        <button className="ec-chip" onClick={() => openView(it)}>View</button>
                        <button className="ec-chip del" onClick={() => askDelete(it)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loading && (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: "24px" }}>Loading…</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="ec-pagi">
            <div>Total: {total}</div>
            <div className="group" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="ec-iconbtn" disabled={!canPrev} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
              <span>Page {page}/{pageCount}</span>
              <button className="ec-iconbtn" disabled={!canNext} onClick={() => setPage(p => Math.min(pageCount, p + 1))}>›</button>
            </div>
          </div>
        </>
      )}

      {/* ===== PENDING (Applications) — approve/reject only ===== */}
      {tab === "pending" && (
        <>
          {/* Filters */}
          <div className="ec-filters">
            <div className="col-2">
              <input className="ec-input" placeholder="Search pending by name / expertise / description…"
                value={appsQ} onChange={(e) => { setAppsPage(1); setAppsQ(e.target.value); }} />
            </div>
          </div>

          {/* Table */}
          <div className="ec-card">
            <table className="ec-table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Phone</th><th>Expertise</th>
                  <th>Exp(Y)</th><th>Status</th><th className="txt-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!appsLoading && apps.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#6b7280" }}>No pending applications</td></tr>
                )}
                {apps.map((ap) => (
                  <tr key={ap._id || ap.id || ap.expert_id}>
                    <td>{ap.full_name}</td>
                    <td>{ap.email || ap?.user?.email || "—"}</td>
                    <td>{ap.phone_number || "—"}</td>
                    <td>{ap.expertise_area || "—"}</td>
                    <td>{ap.experience_years ?? "-"}</td>
                    <td>
                      <span className={cx(
                        "badge",
                        ap.status === "approved" && "green",
                        ap.status === "pending" && "amber",
                        ap.status === "rejected" && "red"
                      )}>
                        {ap.status}
                      </span> </td>
                    <td className="txt-right">
                      <div className="ec-actions">
                        <button className="ec-chip" onClick={() => openReview(ap)}>Review</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {appsLoading && (
                  <tr><td colSpan="7" style={{ textAlign: "center", padding: "24px" }}>Loading…</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="ec-pagi">
            <div>Total: {appsTotal}</div>
            <div className="group" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="ec-iconbtn" disabled={!appsPrev} onClick={() => setAppsPage(p => Math.max(1, p - 1))}>‹</button>
              <span>Page {appsPage}/{appsPageCount}</span>
              <button className="ec-iconbtn" disabled={!appsNext} onClick={() => setAppsPage(p => Math.min(appsPageCount, p + 1))}>›</button>
            </div>
          </div>
        </>
      )}

      {/* View Expert (read-only) */}
      <Modal open={viewOpen} title={"Expert detail"} onClose={() => setViewOpen(false)}>
        {!viewData || viewLoading ? (
          <div>Loading…</div>
        ) : (
          <div className="form" style={{ display: "grid", gap: 12 }}>
            <div className="form-grid-2">
              <div className="field">
                <label className="label">Full name</label>
                <div className="ec-static">{viewData.full_name || "—"}</div>
              </div>
              <div className="field">
                <label className="label">Email</label>
                <div className="ec-static">{viewData?.user?.email || "—"}</div>
              </div>
              <div className="field">
                <label className="label">Phone</label>
                <div className="ec-static">{viewData.phone_number || "—"}</div>
              </div>
              <div className="field">
                <label className="label">Expertise area</label>
                <div className="ec-static">{viewData.expertise_area || "—"}</div>
              </div>
              <div className="field">
                <label className="label">Experience years</label>
                <div className="ec-static">{viewData.experience_years ?? "—"}</div>
              </div>
              <div className="field">
                <label className="label">Review status</label>
                <div className="ec-static">{viewData.review_status || "—"}</div>
              </div>
              <div className="field">
                <label className="label">Public</label>
                <div className="ec-static">{viewData.is_public ? "Yes" : "No"}</div>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="label">Description</label>
                <div className="ec-static">{viewData.description || "—"}</div>
              </div>
            </div>

            {Array.isArray(viewData.certificates) && viewData.certificates.length > 0 && (
              <div className="field">
                <label className="label">Certificates</label>
                <div className="cert-list">
                  {viewData.certificates.map((u, i) => (
                    <div key={i} className="cert-card">
                      <img src={u} alt="" className="cert-img" />
                      <div className="cert-actions">
                        <a className="btn-link" href={u} target="_blank" rel="noreferrer">Open</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm Delete */}
      <Modal open={confirmOpen} title="Confirm delete" onClose={() => setConfirmOpen(false)} narrow>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ color: '#334155', lineHeight: 1.6 }}>
            Are you sure you want to delete <b>{rowToDelete?.full_name}</b>?
          </div>
          <div className="form-actions">
            <button className="ec-btn" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="ec-btn btn-danger" onClick={confirmDelete}>Delete</button>
          </div>
        </div>
      </Modal>

      {/* Review (Approve / Reject) */}
      <Modal open={reviewOpen} title="Review application" onClose={() => setReviewOpen(false)}>
        {!currentApp ? (
          <div>Loading…</div>
        ) : (
          <div className="form" style={{ display: "grid", gap: 12 }}>
            <div className="form-grid-2">
              <div className="field">
                <label className="label">Full name</label>
                <div className="ec-static">{currentApp.full_name}</div>
              </div>
              <div className="field">
                <label className="label">Email</label>
                <div className="ec-static">{currentApp?.user?.email || "—"}</div>
              </div>
              <div className="field">
                <label className="label">Phone</label>
                <div className="ec-static">{currentApp.phone_number || "—"}</div>
              </div>
              <div className="field">
                <label className="label">Expertise area</label>
                <div className="ec-static">{currentApp.expertise_area}</div>
              </div>
              <div className="field">
                <label className="label">Experience years</label>
                <div className="ec-static">{currentApp.experience_years ?? "-"}</div>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="label">Profile / Motivation</label>
                <div className="ec-static">{currentApp.description || "-"}</div>
              </div>
            </div>

            {Array.isArray(currentApp.certificates) && currentApp.certificates.length > 0 && (
              <div className="field">
                <label className="label">Certificates</label>
                <div className="cert-list">
                  {currentApp.certificates.map((c, i) => {
                    const url = c?.url || c;
                    return (
                      <div key={i} className="cert-card">
                        <img src={url} alt="" className="cert-img" />
                        <div className="cert-actions">
                          <a className="btn-link" href={url} target="_blank" rel="noreferrer">Open</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="ec-divider" />

            <div className="field" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input id="activateExpert" type="checkbox" checked={activateExpert}
                onChange={(e) => setActivateExpert(e.target.checked)} />
              <label htmlFor="activateExpert">Make public right after approval</label>
            </div>

            <div className="field">
              <label className="label">Review notes (optional)</label>
              <textarea className="ec-textarea" rows={3} placeholder="Reason when rejecting (optional)"
                value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} />
            </div>

            <div className="form-actions">
              <button className="ec-btn" onClick={() => setReviewOpen(false)}>Close</button>
              <button className="ec-btn btn-danger" disabled={reviewing} onClick={rejectApp}>
                {reviewing ? "Processing…" : "Reject"}
              </button>
              <button className="ec-btn pri" disabled={reviewing} onClick={approveApp}>
                {reviewing ? "Processing…" : "Approve"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
