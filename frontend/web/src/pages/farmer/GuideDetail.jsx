import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";
import { Card, Button, Tag, Typography, Spin, Divider, Row, Col, Modal } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import placeholderImg from "../../assets/placeholder.svg";
import getColorForKey from "../../utils/colorUtils";
import Header from "../../components/shared/Header";
import HeaderExpert from "../../components/shared/HeaderExpert";
import { useSelector } from "react-redux";
import DetailFooter from "../../components/shared/DetailFooter";
import "./guidetail.css";
const { Title, Text } = Typography;

export default function FarmerGuideDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stepModalVisible, setStepModalVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const user = useSelector((state) => state.auth.user);
  // Deterministic color per plant group
  // Use utility so each group has a consistent color across the app
  // import below
  useEffect(() => {
    let mounted = true;
    axiosClient
      .get(`/guides/${id}`)
      .then((res) => {
        if (!mounted) return;
        setGuide(res.data.data || res.data);
      })
      .catch(() => setGuide(null))
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, [id]);

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        <Spin size="large" />
      </div>
    );

  if (!guide)
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <Text type="danger" strong>
          Không tìm thấy hướng dẫn.
        </Text>
      </div>
    );

  return (
    <>
      {/* Show expert header when an expert user views public guide detail while logged in */}
      {user && user.role === "expert" ? <HeaderExpert /> : <Header />}
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              try {
                // If user came from Home (we set state.fromHome when linking), navigate back to Home and ask Home to scroll to guides
                if (location?.state?.fromHome) {
                  navigate("/", { state: { scrollTo: "guides" } });
                  return;
                }

                // Prefer navigating to the guides list filtered by this guide's plant_group
                const group = guide?.plant_group || (Array.isArray(guide?.plantTags) && guide.plantTags[0]);
                if (group) {
                  const qs = `?category=${encodeURIComponent(group)}&page=1`;
                  navigate(`/guides${qs}`);
                  return;
                }
              } catch (e) {
                // fall through to history back if any issue
              }
              navigate(-1);
            }}
          >
            Quay lại
          </Button>
        </div>

        <Card bordered>
          <div style={{ padding: 8 }}>
            <Title level={2}>{(guide.title || "").toUpperCase()}</Title>

            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
              <Text>
                Tác giả: <b>{guide.expert_id?.username || "Chuyên gia"}</b>
              </Text>
              <Text type="secondary">•</Text>
              <Text type="secondary">{new Date(guide.createdAt).toLocaleDateString()}</Text>
            </div>

            {guide.plantTags?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {guide.plantTags.map((t) => (
                  <Tag color={getColorForKey(t)} key={t}>{t}</Tag>
                ))}
              </div>
            )}

            <Divider />

            {guide.image && (
              <img src={guide.image} alt="guide" style={{ width: "100%", height: 600, borderRadius: 10, marginBottom: 20, objectFit: "cover" }} />
            )}

            <div dangerouslySetInnerHTML={{ __html: guide.content || guide.summary || "" }} />

            {guide.steps?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <Title level={3}>CÁC BƯỚC THỰC HIỆN</Title>
                <Row gutter={[16, 16]}>
                  {guide.steps.map((s, idx) => (
                    <Col xs={24} sm={12} md={8} key={idx} style={{ display: "flex" }}>
                      <Card hoverable style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          <Title level={5}><div style={{ border: "1px solid #3b9c2aff", borderRadius: "50%", width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#2f6122ff" }}> {idx + 1}</div></Title>
                          <img src={s.image || placeholderImg} alt="step" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }} />
                          <div
                            className="glass"
                            style={{
                              borderRadius: 6,
                              border: "1px solid rgba(255,255,255,0.25)",
                              padding: 8,
                              marginTop: 8,
                            }}
                          >
                            <Text strong style={{ display: 'block' }}>{(s.title || `BƯỚC ${idx + 1}`).toUpperCase()}</Text>

                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => { setActiveStep(s); setStepModalVisible(true); }}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  setActiveStep(s);
                                  setStepModalVisible(true);
                                }
                              }}
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                cursor: "pointer",
                                marginTop: 8,
                              }}
                              dangerouslySetInnerHTML={{ __html: s.text || "" }}
                            />
                          </div>

                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>
        </Card>
        <Modal
          title={activeStep ? (<span style={{ fontWeight: 700 }}>{(activeStep.title || 'BƯỚC').toUpperCase()}</span>) : "CHI TIẾT BƯỚC"}
          open={stepModalVisible}
          onCancel={() => setStepModalVisible(false)}
          footer={null}
          width={720}
        >
          {activeStep ? (
            <div>
              {activeStep.image && (
                <div style={{ marginBottom: 12 }}>
                  <img src={activeStep.image} alt={activeStep.title} style={{ width: "100%", borderRadius: 6 }} />
                </div>
              )}
              <div dangerouslySetInnerHTML={{ __html: activeStep.text || activeStep.description || "" }} />
            </div>
          ) : (
            <p>Không có nội dung</p>
          )}
        </Modal>
      </div>
      <DetailFooter />
    </>
  );
}


