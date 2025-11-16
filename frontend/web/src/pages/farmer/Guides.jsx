import React, { useEffect, useState } from "react";
import guidesApi from "../../api/shared/guidesApi";
import { Card, Row, Col, Typography, Spin, message, Input } from "antd";
import { Link } from "react-router-dom";
import Header from "../../components/shared/Header";

const { Title } = Typography;

export default function Guides() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const fetchGuides = async (search = "") => {
    setLoading(true);
    try {
      const res = await guidesApi.getAllGuides({ q: search, limit: 50 });
      const data = res?.data?.data || res?.data || [];
      const list = Array.isArray(data) ? data : data.items || data.docs || [];
      setGuides(list);
    } catch (err) {
      console.error("Failed to load guides", err);
      message.error("Không thể tải hướng dẫn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const onSearch = (val) => {
    setQ(val);
    fetchGuides(val);
  };

  return (
    <>
      <Header />
      <div className="container-fluid" style={{ padding: 24 }}>
        {/* Header & Search */}
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Hướng dẫn trồng trọt
            </Title>
          </div>
          <div style={{ flexGrow: 1, maxWidth: 360, marginTop: 8 }}>
            <Input.Search
              placeholder="Tìm rau/cây trồng..."
              allowClear
              enterButton
              onSearch={onSearch}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : guides.length === 0 ? (
          <p>Chưa có hướng dẫn nào.</p>
        ) : (
          <Row gutter={[16, 16]}>
            {guides.map((g) => (
              <Col xs={12} sm={8} md={6} lg={4} key={g._id || g.id}>
                <Link to={`/guides/${g._id || g.id}`} style={{ textDecoration: "none" }}>
                  <Card
                    hoverable
                    cover={
                      <img
                        src={g.image || "/default-plant.png"}
                        alt={g.title}
                        style={{ height: 140, objectFit: "cover", borderRadius: "8px 8px 0 0" }}
                      />
                    }
                    style={{ borderRadius: 8, overflow: "hidden", textAlign: "center" }}
                    bodyStyle={{ padding: "12px 8px" }}
                  >
                    <Title level={5} style={{ margin: 0 }}>
                      {g.title}
                    </Title>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </>
  );
}
