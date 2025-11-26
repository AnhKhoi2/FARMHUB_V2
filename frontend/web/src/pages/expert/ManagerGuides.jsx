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

  // ====== STATE CHAT ======
  const [chatOpen, setChatOpen] = useState(false);
  const handleChatClick = () => setChatOpen(true);

  const availablePlantTags = [
    "Rau củ dễ chăm",
    "Trái cây ngắn hạn",
    "Cây gia vị",
    "Trồng trong chung cư",
    "Ít thời gian chăm sóc",
    "Cây leo nhỏ",
  ];

  const fetchGuides = useCallback(
    async (p = 1, l = limit) => {
      setLoading(true);
      try {
        const params = { page: p, limit: l };
        if (plantSearch) params.plant = plantSearch;
        if (category) params.category = category;

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
      filters: availablePlantTags.map((t) => ({ text: t, value: t })),
      onFilter: (value, record) => record.category === value,
      render: (cat) => <Tag color="green">{cat || "Không có"}</Tag>,
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
                  fetchGuides(1, limit);
                }}
                allowClear
                enterButton={<SearchOutlined />}
                style={{ minWidth: 280 }}
              />

              <Select
                value={category}
                onChange={(v) => {
                  setCategory(v);
                  fetchGuides(1, limit);
                }}
                style={{ minWidth: 220 }}
                allowClear
                placeholder="-- Lọc theo loại cây --"
              >
                {availablePlantTags.map((t) => (
                  <Option key={t} value={t}>
                    {t}
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
