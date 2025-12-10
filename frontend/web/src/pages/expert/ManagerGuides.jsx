import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";
import placeholderImg from "../../assets/placeholder.svg";

// Ant Design
import {
  Layout,
  Table,
  Image,
  Button,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Tag,
} from "antd";
import { toast } from "react-toastify";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { ArrowLeftOutlined } from "@ant-design/icons";

import HeaderExpert from "../../components/shared/HeaderExpert";

// ⬇️ Thêm import cho chat
import ChatWidget from "./ChatWidget";
import { MessageCircle } from "lucide-react";
import Alert from "antd/es/alert/Alert";

const { Content } = Layout;
const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function ManagerGuides() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // ====== STATE DANH SÁCH HƯỚNG DẪN ======
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get('page')) || location.state?.page || 1;
    return Number.isNaN(p) ? 1 : p;
  });
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [plantSearch, setPlantSearch] = useState("");
  const [category, setCategory] = useState(() => {
    return searchParams.get('category') || location.state?.category || "";
  });
  // availablePlantTags: array of { value: slug, label: displayName }
  const [availablePlantTags, setAvailablePlantTags] = useState([]);
  // ====== STATE CHAT ======
  const [chatOpen, setChatOpen] = useState(false);
  const handleChatClick = () => setChatOpen(true);
  const [lastDeleted, setLastDeleted] = useState(null); // { id, title, timeoutId }
  const [showSavedAlert, setShowSavedAlert] = useState(false);

  // Fetch available plant groups/categories from backend
  const fetchPlantGroups = useCallback(async () => {
    let mounted = true;
    try {
      const res = await axiosClient.get("/api/plant-groups");
      const data = res.data?.data || [];
      console.log('[DEBUG] /api/plant-groups response count=', (data || []).length, data);
      // Normalize to { value: slugOrId, label: displayName }
      const items = data
        .map((d) => {
          if (!d) return null;
          if (typeof d === "string") return { value: d, label: d };
          const name = d.name || d.slug || d._id;
          const value = d.slug || d._id || name;
          return { value, label: name };
        })
        .filter(Boolean);
      // Prepend an explicit "TẤT CẢ" option (empty value) so users can select all
      if (mounted) {
        const withAll = [{ value: "", label: "TẤT CẢ" }, ...items];
        setAvailablePlantTags(withAll);
      }
    } catch (err) {
      console.warn("Failed to load plant groups:", err?.message || err);
    }
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    fetchPlantGroups();
  }, [fetchPlantGroups]);

  // Prepare Select options and a display value.
  // If the incoming `category` (often a slug) doesn't match any loaded option,
  // create a temporary option with a friendly label so the Select shows the
  // human-readable name instead of the raw slug from the DB.
  const formatLabelFromSlug = (s) => {
    if (!s) return "";
    try {
      // decode possible URI-encoding and replace underscores/hyphens with spaces
      const dec = decodeURIComponent(String(s));
      const cleaned = dec.replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
      return cleaned
        .toLowerCase()
        .split(' ')
        .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : ''))
        .join(' ');
    } catch (err) {
      return String(s);
    }
  };

  const selectedOption =
    Array.isArray(availablePlantTags) && availablePlantTags.length
      ? availablePlantTags.find((a) => a.value === category) ||
        availablePlantTags.find((a) => String(a.label).toLowerCase() === String(category).toLowerCase())
      : null;

  const computedOptions = Array.isArray(availablePlantTags) ? [...availablePlantTags] : [];
  if (category && !selectedOption) {
    // Prefer a Vietnamese label from any loaded guide's plantTags if present.
    let friendly = null;
    try {
      if (Array.isArray(guides) && guides.length) {
        const guideMatch = guides.find((g) => {
          const vals = [g.category, g.category_slug, g.plant_group].map((v) => String(v || ""));
          return vals.includes(String(category));
        });
        if (guideMatch && Array.isArray(guideMatch.plantTags) && guideMatch.plantTags[0]) {
          friendly = guideMatch.plantTags[0];
        }
      }
    } catch (err) {
      // ignore and fallback
    }

    if (!friendly) friendly = formatLabelFromSlug(category);

    // Add a temporary option so Select can render the friendly label while
    // keeping the internal value (the slug) intact.
    computedOptions.push({ value: category, label: friendly });
  }

  // If we're still hydrating an incoming category (from search params or location state),
  // avoid showing the raw slug — show empty until we've loaded plant groups/guides.
  const [initializingCategory, setInitializingCategory] = useState(() => {
    return Boolean(searchParams.get('category') || location.state?.category);
  });

  const selectValue = initializingCategory ? "" : (selectedOption ? selectedOption.value : category || "");

  // Keep URL in sync when page/category change (so state survives reload/new tab)
  useEffect(() => {
    const params = {};
    if (page && page !== 1) params.page = String(page);
    if (category) params.category = String(category);
    setSearchParams(params, { replace: true });
  }, [page, category]);

  // If navigation brought a `state` with page/category, normalize and restore it
  useEffect(() => {
    // If navigation passed a state or query (category/page), load plant-groups and
    // guides first so we can compute a friendly label before setting `category`.
    (async () => {
      const incomingCat = location.state?.category || searchParams.get('category');
      const incomingPage = location.state?.page || Number(searchParams.get('page')) || undefined;
      // show saved alert if navigation included a saved flag
      if (location.state?.saved) {
        setShowSavedAlert(true);
        // clear the flag after a short time so it doesn't persist across reloads
        setTimeout(() => setShowSavedAlert(false), 2000);
      }
      if (typeof incomingCat !== 'undefined' && incomingCat !== null && incomingCat !== '') {
        try {
          await fetchPlantGroups();
          // fetch guides filtered by incomingCat so `guides` state contains entries
          // that may have `plantTags[0]` (Vietnamese label) we can use
          await fetchGuides(incomingPage || 1, limit, incomingCat);
          if (category !== incomingCat) {
            setCategory(incomingCat);
          }
        } catch (err) {
          // fallback to previous behavior
          if (category !== incomingCat) {
            setCategory(incomingCat);
            fetchGuides(incomingPage || 1, limit, incomingCat);
          }
        } finally {
          setInitializingCategory(false);
        }
        return;
      }

      if (incomingPage && page !== incomingPage) {
        setPage(incomingPage);
        fetchGuides(incomingPage, limit);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, searchParams]);

  const fetchGuides = useCallback(
    async (p = 1, l = limit, cat, search) => {
      setLoading(true);
      try {
        const params = { page: p, limit: l };
        // prefer explicit `search` argument (from the Search control) over state
        const plantToUse = typeof search !== "undefined" ? search : plantSearch;
        if (plantToUse) params.plant = plantToUse;
        const catToUse = typeof cat !== "undefined" ? cat : category;
        if (catToUse) params.category = catToUse;

        const res = await axiosClient.get("/guides", { params });
        const data = res.data || {};
        const docs = data.docs || data.guides || data.data || [];
        const meta = data.meta || {};

        setGuides(docs);
        setTotal(meta.total || meta.count || docs.length || 0);
        setPage(meta.page || p);
        setLimit(meta.limit || l);
        return docs;
      } catch (err) {
        console.error("fetchGuides", err);
        toast.error("Không thể tải danh sách hướng dẫn");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [limit, plantSearch, category]
  );

  useEffect(() => {
    fetchGuides(page, limit);
  }, [fetchGuides, limit, page]);

  const onTableChange = (pagination, _filters, _sorter) => {
    const { current = 1, pageSize = limit } = pagination || {};
    setPage(current);
    setLimit(pageSize);
    // If user used column filters (category), prefer server-side filtering
    const filters = _filters || {};
    if (filters.category && filters.category.length) {
      // AntD passes an array of selected values; take first for single-select behavior
      const sel = Array.isArray(filters.category) ? (filters.category[0] || "") : filters.category;
      setCategory(sel);
      fetchGuides(current, pageSize, sel);
      return;
    }
    fetchGuides(current, pageSize);
  };

  const onCreate = () => navigate("/managerguides/create");
  // include current search params in the detail/edit URLs so browser history contains state
  const currentSearch = () => {
    const qs = [];
    if (page && page !== 1) qs.push(`page=${page}`);
    if (category) qs.push(`category=${encodeURIComponent(category)}`);
    return qs.length ? `?${qs.join('&')}` : '';
  };

  // Open expert manager detail view instead of public guide detail
  const onView = (id) => navigate(`/managerguides/detail/${id}${currentSearch()}`);
  const onEdit = (id) => navigate(`/managerguides/edit/${id}${currentSearch()}`);

  const onDelete = async (id) => {
    try {
      await axiosClient.delete(`/guides/${id}`);
      toast.success("Đã xóa (có thể hoàn tác)");
      // fetchGuides to update list immediately
      fetchGuides(page, limit);

      // Show undo arrow: remember last deleted guide id and title
      // Try to read the guide from current guides list to get title
      const guide = guides.find((g) => (g._id || g.id) === id) || { _id: id, title: 'Hướng dẫn' };
      // clear any existing pending undo
      if (lastDeleted && lastDeleted.timeoutId) clearTimeout(lastDeleted.timeoutId);
      const timeoutId = setTimeout(() => {
        setLastDeleted(null);
      }, 8000); // hide undo button after 8s
      setLastDeleted({ id, title: guide.title || 'Hướng dẫn', timeoutId });
    } catch (err) {
      console.error("delete", err);
      toast.error("Xóa không thành công");
    }
  };

  const onUndoDelete = async () => {
    if (!lastDeleted || !lastDeleted.id) return;
    try {
      await axiosClient.post(`/guides/${lastDeleted.id}/restore`);
      toast.success('Hoàn tác xóa thành công');
      // refresh list
      fetchGuides(page, limit);
    } catch (e) {
      console.error('restore', e);
      toast.error('Hoàn tác thất bại');
    } finally {
      if (lastDeleted && lastDeleted.timeoutId) clearTimeout(lastDeleted.timeoutId);
      setLastDeleted(null);
    }
  };

  // custom text search filter
  const getColumnSearchProps =
    (dataIndex, placeholder = "Tìm kiếm...") =>
    ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => ({
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={placeholder}
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Tìm
            </Button>
            <Button onClick={clearFilters} size="small" style={{ width: 90 }}>
              Xóa
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (value, record) =>
        record[dataIndex]
          ?.toString()
          .toLowerCase()
          .includes(value.toLowerCase()),
    });

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 70,
      render: (_t, _record, idx) => {
        const num = (page - 1) * limit + (idx + 1);
        return <span>{num}</span>;
      },
    },
    {
      title: "ẢNH",
      dataIndex: "image",
      key: "image",
      width: 120,
      render: (val, record) => (
        <Image
          src={val || record.thumbnail || placeholderImg}
          width={100}
          height={64}
          preview={false}
          alt={record.title}
          style={{ borderRadius: 8, objectFit: "cover" }}
        />
      ),
    },
    {
      title: "TIÊU ĐỀ",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
      ...getColumnSearchProps("title", "Tìm theo tiêu đề"),
    },
    {
      title: "MÔ TẢ",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      ...getColumnSearchProps("description", "Tìm trong mô tả"),
      render: (t) => t || "—",
    },
    {
      title: "LOẠI CÂY",
      dataIndex: "category",
      key: "category",
      filters: availablePlantTags.map((t) => ({ text: t.label, value: t.value })),
      // try matching by plantTags label OR by category slug/plant_group
      onFilter: (value, record) => {
        // empty value means "TẤT CẢ" — match all
        if (value === "") return true;
        const label = (availablePlantTags.find((a) => a.value === value) || {}).label || value;
        const byTags = Array.isArray(record.plantTags) && record.plantTags.includes(label);
        const bySlug = (record.category_slug && record.category_slug === value) || (record.plant_group && record.plant_group === value);
        return byTags || bySlug;
      },
      render: (_cat, record) => {
        // Prefer the human-friendly label from computedOptions (which may include
        // the backend-provided label or a temporary formatted label derived from
        // the slug). Fall back to record.category or plantTags.
        const val = record.category || record.category_slug || record.plant_group || "";
        const opt = (computedOptions || []).find((a) => String(a.value) === String(val));
        const display = (opt && opt.label) || record.category || (Array.isArray(record.plantTags) && record.plantTags[0]) || "Không có";
        return <Tag color="green">{display}</Tag>;
      },
    },
    {
      title: "NGÀY TẠO",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime(),
      render: (val) =>
        val ? new Date(val).toLocaleDateString("vi-VN") : "—",
    },
    {
      title: "HÀNH ĐỘNG",
      key: "actions",
      width: 160,
      align: "center",
      render: (_t, record) => (
        <Space>
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={() => onView(record._id || record.id)}
          />
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(record._id || record.id)}
          />
          <Popconfirm
            title="Bạn có chắc muốn xóa hướng dẫn này?"
            okText="Có"
            cancelText="Hủy"
            onConfirm={() => onDelete(record._id || record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Header expert có nút Trò chuyện */}
      <HeaderExpert onChatClick={handleChatClick} />

      <Layout style={{ background: "#fff", padding: 24, borderRadius: 12 }}>
        <Content>
          <Card bordered={false}>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={3} style={{ margin: 0 }}>
                  QUẢN LÝ HƯỚNG DẪN TRỒNG CÂY
                </Title>
              </Col>
              <Col>
                <Space>
                  <Button
                    shape="round"
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setPlantSearch("");
                      setCategory("");
                      fetchGuides(1, limit);
                    }}
                  >
                    LÀM MỚI
                  </Button>
                  
                  <Button
                    shape="round"
                    icon={<DeleteOutlined />}
                    onClick={() => navigate("/managerguides/trash")}
                  >
                    THÙNG RÁC
                  </Button>
                  <Button
                    type="primary"
                    shape="round"
                    icon={<PlusOutlined />}
                    onClick={onCreate}
                  >
                    TẠO MỚI
                  </Button>
                </Space>
              </Col>
            </Row>

            <Divider />
            {showSavedAlert && (
              <div style={{ marginBottom: 12 }}>
                <Alert message="Lưu hướng dẫn thành công" type="success" showIcon />
              </div>
            )} 

            <Space
              style={{ marginBottom: 16, flexWrap: "wrap" }}
              size="middle"
            >
              <Search
                placeholder="Tìm theo tên cây hoặc tiêu đề"
                onSearch={(v) => {
                  setPlantSearch(v);
                  // Call fetchGuides with the explicit search value so the request
                  // uses the freshly typed value immediately (no need to wait for state)
                  fetchGuides(1, limit, "", v);
                }}
                allowClear
                enterButton={<SearchOutlined />}
                style={{ minWidth: 280 }}
              />

              <Select
                value={selectValue}
                onChange={(v) => {
                  setCategory(v);
                  fetchGuides(1, limit, v);
                }}
                onDropdownVisibleChange={(open) => {
                  if (open) fetchPlantGroups();
                }}
                style={{ minWidth: 220 }}
                allowClear
                showSearch
                optionFilterProp="children"
                dropdownMatchSelectWidth={false}
                dropdownStyle={{ maxHeight: 300, overflow: 'auto' }}
                placeholder="-- Lọc theo loại cây --"
              >
                {computedOptions.map(({ value, label }) => (
                  <Option key={value} value={value}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Space>

            <Table
              rowKey={(r) => r._id || r.id}
              columns={columns}
              dataSource={guides}
              loading={loading}
              pagination={{
                current: page,
                pageSize: limit,
                total,
                showSizeChanger: false,
                showTotal: (total) => `Tổng ${total} mục`,
              }}
              locale={{ emptyText: "Không có hướng dẫn" }}
              onChange={onTableChange}
              bordered
              size="middle"
              style={{ marginTop: 12 }}
            />
          </Card>
        </Content>
      </Layout>

      {/* Nút chat nổi */}
      {!chatOpen && (
        <button
          className="floating-chat-btn"
          onClick={() => setChatOpen(true)}
        >
          <MessageCircle size={26} />
        </button>
      )}

      {/* Undo floating button after delete */}
      {lastDeleted && (
        <button
          title={`Hoàn tác: ${lastDeleted.title}`}
          onClick={onUndoDelete}
          style={{
            position: 'fixed',
            left: 16,
            bottom: 24,
            zIndex: 2000,
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 28,
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            cursor: 'pointer'
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        </button>
      )}

      {/* Chat widget */}
      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
