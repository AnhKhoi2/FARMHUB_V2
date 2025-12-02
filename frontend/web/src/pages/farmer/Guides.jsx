import React, { useEffect, useState } from "react";
import guidesApi from "../../api/shared/guidesApi";
import axiosClient from "../../api/shared/axiosClient";
import { Card, Row, Col, Typography, Spin, message, Input, Pagination, Select, Button, Tag } from "antd";
import { Link } from "react-router-dom";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";
import getColorForKey from "../../utils/colorUtils";

const { Title } = Typography;

export default function Guides() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [categories, setCategories] = useState([]);
  const [availablePlantTags, setAvailablePlantTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [total, setTotal] = useState(0);

  const fetchGuides = async (search = "", pageParam = 1, limitParam = pageSize, categoryParam = "") => {
    setLoading(true);
    try {
      // Use `search` param (backend expects this) and prefer server meta for total count
      const params = { search: search, page: pageParam, limit: limitParam };
      if (categoryParam) params.category = categoryParam;
      const res = await guidesApi.getAllGuides(params);
      const body = res?.data || {};
      const payload = body.data || body;
      const meta = body.meta || {};

      let items = [];
      if (Array.isArray(payload)) {
        items = payload;
      } else if (payload.docs) {
        items = payload.docs;
      } else if (payload.items) {
        items = payload.items;
      } else {
        const maybeItems = payload.items || payload.data || [];
        items = Array.isArray(maybeItems) ? maybeItems : [];
      }

      const totalCount = Number(meta.total || payload.totalDocs || payload.total || items.length) || 0;

      setGuides(items);

      setTotal(totalCount);
      setPage(Number(pageParam));

      // derive available categories from returned items (unique non-empty categories)
      try {
        const cats = Array.from(new Set(items.map((it) => (it.category || "")).filter(Boolean)));
        setCategories(cats);
        // if selectedCategory is not in cats anymore, reset to empty
        if (selectedCategory && !cats.includes(selectedCategory)) {
          setSelectedCategory("");
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error("Failed to load guides", err);
      message.error("Không thể tải hướng dẫn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides(q, 1, pageSize, selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch plant groups from backend API and normalize to { label, value }
  const fetchPlantGroups = async () => {
    try {
      const res = await axiosClient.get("/api/plant-groups");
      const data = res.data?.data || [];

      const items = (data || [])
        .map((d) => {
          if (!d) return null;
          if (typeof d === "string") return { label: d, value: d };
          const name = d.name || d.slug || d._id;
          const value = d.slug || d._id || name;
          return { label: name, value };
        })
        .filter(Boolean);
      const withAll = [{ label: "TẤT CẢ", value: "" }, ...items];
      setAvailablePlantTags(withAll);
    } catch (e) {
      console.warn("Failed to load plant groups", e?.message || e);
    }
  };

  useEffect(() => {
    fetchPlantGroups();
  }, []);

  const onSearch = (val) => {
    setQ(val);
    fetchGuides(val, 1, pageSize, selectedCategory);
  };

  const onPageChange = (p, pSize) => {
    setPage(p);
    setPageSize(pSize);
    fetchGuides(q, p, pSize, selectedCategory);
  };

  const onCategoryChange = (val) => {
    setSelectedCategory(val);
    // when category changes, fetch page 1
    fetchGuides(q, 1, pageSize, val);
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
          <div style={{ flexGrow: 1, maxWidth: 520, marginTop: 8, display: 'flex', gap: 8 }}>
            <Select
              value={selectedCategory}
              onChange={onCategoryChange}
              placeholder="Tất cả danh mục"
              style={{ minWidth: 160 }}
              options={availablePlantTags.length ? availablePlantTags : [{ label: 'TẤT CẢ', value: '' }]}
              allowClear
              showSearch
              optionFilterProp="label"
              dropdownMatchSelectWidth={false}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto', zIndex: 2000 }}
              getPopupContainer={(trigger) => document.body}
              onDropdownVisibleChange={(open) => {
                if (open) fetchPlantGroups();
              }}
            />
            <Input.Search
              placeholder="Tìm rau/cây trồng..."
              allowClear
              enterButton
              onSearch={onSearch}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ flex: 1 }}
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
                    bodyStyle={{ padding: "12px 8px", minHeight: 100 }}
                  >
                    <Title level={5} style={{ margin: 0 }}>
                      {g.title}
                    </Title>
                    <Tag style={{ margin: 0, fontSize: 12, color: getColorForKey(g.plantTags) }}>{g.plantTags}</Tag>
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
