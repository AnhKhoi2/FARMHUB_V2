import React, { useEffect, useState } from "react";
import guidesApi from "../../api/shared/guidesApi";
import { Card, Row, Col, Typography, Spin, message, Input, Pagination } from "antd";
import { Link } from "react-router-dom";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";

const { Title } = Typography;

export default function Guides() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);

  const fetchGuides = async (search = "", pageParam = 1, limitParam = pageSize) => {
    setLoading(true);
    try {
      const res = await guidesApi.getAllGuides({ q: search, page: pageParam, limit: limitParam });
      const payload = res?.data?.data || res?.data || {};

      let items = [];
      let totalCount = 0;

      if (Array.isArray(payload)) {
        items = payload;
        totalCount = payload.length;
      } else if (payload.docs) {
        items = payload.docs;
        totalCount = payload.totalDocs || payload.total || items.length;
      } else if (payload.items) {
        items = payload.items;
        totalCount = payload.total || items.length;
      } else if (payload.items === undefined && payload.docs === undefined) {
        const maybeItems = payload.items || payload.data || [];
        items = Array.isArray(maybeItems) ? maybeItems : [];
        totalCount = payload.total || items.length;
      }

      setGuides(items);
      setTotal(Number(totalCount) || 0);
      setPage(Number(pageParam));
    } catch (err) {
      console.error("Failed to load guides", err);
      message.error("Không thể tải hướng dẫn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides(q, 1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (val) => {
    setQ(val);
    fetchGuides(val, 1, pageSize);
  };

  const onPageChange = (p, pSize) => {
    setPage(p);
    setPageSize(pSize);
    fetchGuides(q, p, pSize);
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

            {total > 0 && (
              <Col span={24} style={{ textAlign: 'center', marginTop: 12 }}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  showQuickJumper
                  onChange={onPageChange}
                  style={{ display: 'inline-block' }}
                />
              </Col>
            )}
          </Row>
        )}
      </div>
      <Footer /> 
    </>
  );
}
