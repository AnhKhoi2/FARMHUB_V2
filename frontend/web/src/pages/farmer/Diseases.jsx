import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";
import { FaBug, FaSearch, FaFilter, FaExclamationTriangle } from "react-icons/fa";
import AIResponseView from "../../components/AIResponseView";
import "../../css/farmer/Diseases.css";

const Diseases = () => {
  const [categories, setCategories] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [filteredDiseases, setFilteredDiseases] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatResult, setChatResult] = useState(null);
  const [chatMessages, setChatMessages] = useState([]); // local history of messages
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterDiseases();
  }, [selectedCategory, searchTerm, selectedSeverity, diseases]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, diseasesRes] = await Promise.all([
        axiosClient.get("/disease-categories?limit=100"),
        axiosClient.get("/diseases?limit=100")
      ]);

      const categoriesData = categoriesRes.data?.data?.items || categoriesRes.data?.items || [];
      const diseasesData = diseasesRes.data?.data?.items || diseasesRes.data?.items || [];

      setCategories(categoriesData);
      setDiseases(diseasesData);
      setFilteredDiseases(diseasesData);
      console.log("[Diseases] fetched", { categories: categoriesData.length, diseases: diseasesData.length, sample: diseasesData.slice(0,2) });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterDiseases = () => {
    let filtered = [...diseases];

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(disease => {
        // disease.category may be a slug or a name depending on data.
        // Match against selectedCategory (we store slug in the select value).
        if (!disease?.category) return false;
        if (String(disease.category) === String(selectedCategory)) return true;
        // fallback: compare lowercase name
        return String(disease.category).toLowerCase() === String(selectedCategory).toLowerCase();
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(disease =>
        disease.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (disease.description && disease.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by severity
    if (selectedSeverity !== "all") {
      filtered = filtered.filter(disease => disease.severity === selectedSeverity);
    }

    setFilteredDiseases(filtered);
  };

  const getSeverityBadge = (severity) => {
    const severityMap = {
      low: { class: "bg-success", text: "Nhẹ" },
      medium: { class: "bg-warning", text: "Trung bình" },
      high: { class: "bg-danger", text: "Cao" }
    };
    const config = severityMap[severity] || { class: "bg-secondary", text: severity };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getSeverityIcon = (severity) => {
    if (severity === "high") return "🔴";
    if (severity === "medium") return "🟡";
    return "🟢";
  };

  return (
    <>
      <Header />
      <div className="diseases-page">
        {/* Hero Section */}
        <section className="hero-section-diseases">
          <div className="container">
            <div className="hero-content text-center text-white">
              <FaBug size={64} className="mb-3" />
              <h1 className="display-4 fw-bold">Bệnh Cây Trồng</h1>
              <p className="lead">
                Tìm hiểu về các loại bệnh phổ biến trên cây trồng và cách phòng trừ hiệu quả
              </p>
            </div>
          </div>
        </section>

        <div className="container my-5">
          {/* Search and Filter Bar */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-5">
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm kiếm bệnh..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">Tất cả danh mục</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.slug || cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                  >
                    <option value="all">Mức độ nghiêm trọng</option>
                    <option value="low">Nhẹ</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Overview */}
          <section className="categories-section mb-5">
            <h2 className="section-title mb-4">
              <FaFilter className="me-2" />
              Danh Mục Bệnh
            </h2>
            <div className="row g-3">
              <div className="col-md-3">
                <div
                  className={`category-card ${selectedCategory === "all" ? "active" : ""}`}
                  onClick={() => setSelectedCategory("all")}
                >
                  <div className="category-icon">🌿</div>
                  <h5>Tất cả</h5>
                  <p className="text-muted mb-0">{diseases.length} bệnh</p>
                </div>
              </div>
              {categories.slice(0, 7).map(cat => (
                <div key={cat._id} className="col-md-3">
                  <div
                    className={`category-card ${selectedCategory === (cat.slug || cat.name) ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.slug || cat.name)}
                  >
                    <div className="category-icon">{cat.icon || "🦠"}</div>
                    <h5>{cat.name}</h5>
                    <p className="text-muted mb-0">
                      {diseases.filter(d => String(d.category) === String(cat.slug) || String(d.category).toLowerCase() === String(cat.name).toLowerCase()).length} bệnh
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Diseases List */}
          <section className="diseases-section">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="section-title mb-0">
                <FaBug className="me-2" />
                Danh Sách Bệnh
              </h2>
              <span className="badge bg-primary fs-6">
                {filteredDiseases.length} kết quả
              </span>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
              </div>
            ) : filteredDiseases.length === 0 ? (
              <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                  <FaBug size={64} className="text-muted mb-3 opacity-50" />
                  <h4 className="text-muted">Không tìm thấy bệnh nào</h4>
                  <p className="text-muted">
                    Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                  </p>
                </div>
              </div>
            ) : (
              <>
              <div className="row g-4">
                {filteredDiseases.map(disease => (
                  <div key={disease._id} className="col-md-6 col-lg-4">
                    <div className="card disease-card h-100 shadow-sm hover-card">
                      <div className="card-header bg-white border-bottom">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <span className="severity-icon">
                              {getSeverityIcon(disease.severity)}
                            </span>
                            <span className="badge bg-light text-dark ms-2">
                              {/* display friendly name when possible */}
                              {(() => {
                                const map = Object.fromEntries(categories.map(c => [String(c.slug || c.name), c.name]));
                                return map[String(disease.category)] || disease.category || "Chưa phân loại";
                              })()}
                            </span>
                          </div>
                          {getSeverityBadge(disease.severity)}
                        </div>
                      </div>
                      <div className="card-body">
                        <h5 className="card-title fw-bold text-success">
                          {disease.name}
                        </h5>
                        <p className="card-text text-muted small">
                          {disease.description
                            ? disease.description.substring(0, 100) + "..."
                            : "Chưa có mô tả chi tiết"}
                        </p>
                        {disease.plantTypes && disease.plantTypes.length > 0 && (
                          <div className="mb-3">
                            <strong className="small text-muted">Cây bị ảnh hưởng:</strong>
                            <div className="mt-1">
                              {disease.plantTypes.slice(0, 3).map((plant, idx) => (
                                <span key={idx} className="badge bg-light text-dark me-1 mb-1">
                                  {plant}
                                </span>
                              ))}
                              {disease.plantTypes.length > 3 && (
                                <span className="badge bg-light text-dark">
                                  +{disease.plantTypes.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {disease.symptoms && disease.symptoms.length > 0 && (
                          <div className="symptoms-preview">
                            <FaExclamationTriangle className="text-warning me-1" />
                            <small className="text-muted">
                              {disease.symptoms.length} triệu chứng
                            </small>
                          </div>
                        )}
                      </div>
                      <div className="card-footer bg-white border-top">
                        <button className="btn btn-outline-success btn-sm w-100">
                          Xem Chi Tiết
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </section>

          {/* Info Banner removed as requested */}

          {/* Chat modal (simple inline) */}
          {showChat && (
            <div className="ai-chat-modal" style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000}}>
              <div className="card" style={{ width: 'min(920px, 96%)', maxHeight: '90vh', overflow: 'auto' }}>
                <div className="card-header d-flex justify-content-between align-items-center">
                  <strong>Chat AI - Chuẩn đoán bệnh</strong>
                  <div>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => { setChatResult(null); setChatMessages([]); setChatInput(''); }}>
                      Clear
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setShowChat(false)}>Đóng</button>
                  </div>
                </div>
                <div className="card-body">
                  <p className="text-muted">Ghi mô tả triệu chứng hoặc upload ảnh (hiện chưa hỗ trợ upload trong chat). Ví dụ: "Lá có đốm nâu, dần vàng và rụng"</p>

                  <div className="mb-3">
                    <textarea className="form-control" rows={4} value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Mô tả triệu chứng của cây..." />
                  </div>

                  <div className="d-flex gap-2 mb-3">
                    <button className="btn btn-success" disabled={sending || !chatInput.trim()} onClick={async () => {
                      try {
                        setSending(true);
                        const userMsg = { role: 'user', content: chatInput };
                        const newHistory = [...chatMessages, userMsg];
                        setChatMessages(newHistory);

                        const res = await axiosClient.post('/ai/chat', { messages: newHistory });
                        const result = res.data?.data?.result || res.data?.result || null;
                        setChatResult(result);
                        // push assistant message
                        const assistantMsg = { role: 'assistant', content: result?.text || '' };
                        setChatMessages(prev => [...prev, assistantMsg]);
                      } catch (err) {
                        console.error('AI chat error', err);
                        setChatResult({ text: 'Lỗi khi gọi AI. Vui lòng thử lại sau.', provider: 'error' });
                      } finally {
                        setSending(false);
                      }
                    }}>{sending ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>
                    <button className="btn btn-outline-secondary" onClick={() => { setChatInput(''); }}>Xóa</button>
                  </div>

                  {chatResult && (
                    <div className="mb-3">
                      <AIResponseView result={chatResult} />
                    </div>
                  )}

                  {/* Conversation history */}
                  {chatMessages.length > 0 && (
                    <div>
                      <h6>Lịch sử (tạm)</h6>
                      <div style={{ maxHeight: 220, overflow: 'auto' }}>
                        {chatMessages.map((m, i) => (
                          <div key={i} className={`p-2 mb-2 ${m.role === 'user' ? 'bg-light' : 'bg-white'}`}>
                            <small className="text-muted">{m.role}</small>
                            <div>{m.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Diseases;
