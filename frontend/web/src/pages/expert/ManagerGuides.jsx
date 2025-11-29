import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import HeaderExpert from "../../components/shared/HeaderExpert";

// ⬇️ Thêm import cho chat
import ChatWidget from "./ChatWidget";
import { MessageCircle } from "lucide-react";

const { Content } = Layout;
const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function ManagerGuides() {
  const navigate = useNavigate();

  // ====== STATE DANH SÁCH HƯỚNG DẪN ======
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [plantSearch, setPlantSearch] = useState("");
  const [category, setCategory] = useState("");
  // availablePlantTags: array of { value: slug, label: displayName }
  const [availablePlantTags, setAvailablePlantTags] = useState([]);
  // ====== STATE CHAT ======
  const [chatOpen, setChatOpen] = useState(false);
  const handleChatClick = () => setChatOpen(true);

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

  const fetchGuides = useCallback(
    async (p = 1, l = limit, cat) => {
      setLoading(true);
      try {
        const params = { page: p, limit: l };
        if (plantSearch) params.plant = plantSearch;
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
      } catch (err) {
        console.error("fetchGuides", err);
        message.error("Không thể tải danh sách hướng dẫn");
      } finally {
        setLoading(false);
      }
    },
    [limit, plantSearch, category]
  );

  useEffect(() => {
    fetchGuides(1, limit);
  }, [fetchGuides, limit]);

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
  const onView = (id) => navigate(`/guides/${id}`);
  const onEdit = (id) => navigate(`/managerguides/edit/${id}`);

  const onDelete = async (id) => {
    try {
      await axiosClient.delete(`/guides/${id}`);
      message.success("Xóa thành công");
      fetchGuides(page, limit);
    } catch (err) {
      console.error("delete", err);
      message.error("Xóa không thành công");
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
      title: "Ảnh",
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
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
      ...getColumnSearchProps("title", "Tìm theo tiêu đề"),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      ...getColumnSearchProps("description", "Tìm trong mô tả"),
      render: (t) => t || "—",
    },
    {
      title: "Loại cây",
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
      render: (_cat, record) => (
        <Tag color="green">{record.category || (Array.isArray(record.plantTags) && record.plantTags[0]) || "Không có"}</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime(),
      render: (val) =>
        val ? new Date(val).toLocaleDateString("vi-VN") : "—",
    },
    {
      title: "Hành động",
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
                  Quản lý hướng dẫn trồng cây
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
                    Làm mới
                  </Button>
                  <Button
                    shape="round"
                    icon={<DeleteOutlined />}
                    onClick={() => navigate("/managerguides/trash")}
                  >
                    Thùng rác
                  </Button>
                  <Button
                    type="primary"
                    shape="round"
                    icon={<PlusOutlined />}
                    onClick={onCreate}
                  >
                    Tạo mới
                  </Button>
                </Space>
              </Col>
            </Row>

            <Divider />

            <Space
              style={{ marginBottom: 16, flexWrap: "wrap" }}
              size="middle"
            >
              <Search
                placeholder="Tìm theo tên cây hoặc tiêu đề"
                onSearch={(v) => {
                  setPlantSearch(v);
                  // When searching via the main Search button, ignore current category
                  // so the search is performed across all categories.
                  fetchGuides(1, limit, "");
                }}
                allowClear
                enterButton={<SearchOutlined />}
                style={{ minWidth: 280 }}
              />

              <Select
                value={category}
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
                {availablePlantTags.map(({ value, label }) => (
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

      {/* Chat widget */}
      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
