import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";
import { Card, Button, Tag, Typography, Spin, Divider, Row, Col } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import placeholderImg from "../../assets/placeholder.svg";
import getColorForKey from "../../utils/colorUtils";
import Header from "../../components/shared/Header";

const { Title, Text } = Typography;

export default function FarmerGuideDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
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
    <Header/>
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            // Prefer navigating to the guides list filtered by this guide's plant_group
            // so the user returns to the group view instead of the global list.
            try {
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
          <Title level={2}>{guide.title}</Title>

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
              <Title level={3}>Các bước thực hiện</Title>
              <Row gutter={[16, 16]}>
                {guide.steps.map((s, idx) => (
                  <Col xs={24} sm={12} md={8} key={idx}>
                    <Card hoverable>
                      <div>
                        <Title level={5}>Bước {idx + 1}</Title>
                        <img src={s.image || placeholderImg} alt="step" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }} />
                        <Text strong>{s.title || `Bước ${idx + 1}`}</Text>
                        <div dangerouslySetInnerHTML={{ __html: s.text || "" }} />
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </div>
      </Card>
    </div></>
  );
}
