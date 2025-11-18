import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Drawer,
  Space,
  Pagination,
  Spin,
  Tag,
  Typography,
  message,
  Empty,
} from "antd";
import AdminLayout from "../../components/AdminLayout";
import axiosClient from "../../api/shared/axiosClient";
import {
  EyeOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  UndoOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

export default function AdminPost() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerContent, setDrawerContent] = useState(null); // post details or reports

  const fetchPosts = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        let res;
        const params = { limit, page: p };
        try {
          res = await axiosClient.get(`/admin/managerpost`, { params });
        } catch {
          res = await axiosClient.get(`/admin/managerpost/public`, { params });
        }
        const data = res.data?.data || res.data || {};
        const items = data.items || data.data?.items || data.docs || [];
        const tot = data.total || data.meta?.total || items.length;
        setPosts(items);
        setTotal(Number(tot || 0));
        setPage(Number(p));
      } catch (err) {
        console.error(err);
        message.error("Không thể tải bài viết");
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  useEffect(() => {
    fetchPosts(page);
  }, [page, fetchPosts]);

  const changeStatus = async (id, status) => {
    try {
      await axiosClient.patch(`/admin/managerpost/${id}/status`, { status });
      message.success(`Đã chuyển trạng thái thành ${status}`);
      fetchPosts(page);
    } catch (err) {
      console.error(err);
      message.error("Không thể thay đổi trạng thái");
    }
  };

  const handleHide = async (id) => {
    try {
      await axiosClient.patch(`/admin/managerpost/${id}/hide`);
      message.success("Đã xóa bài viết");
      fetchPosts(page);
    } catch (err) {
      console.error(err);
      message.error("Không thể xóa bài viết");
    }
  };

  const handleRestore = async (id) => {
    try {
      await axiosClient.patch(`/admin/managerpost/${id}/restore`);
      message.success("Đã hoàn tác");
      fetchPosts(page);
    } catch (err) {
      console.error(err);
      message.error("Không thể hoàn tác");
    }
  };

  const columns = [
    {
      title: "STT",
      width: 60,
      render: (_, __, idx) => (page - 1) * limit + idx + 1,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      render: (t) => t || "(Không có tiêu đề)",
    },
    {
      title: "Người đăng",
      dataIndex: "userId",
      render: (u) => u?.username || u?.email || "—",
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      render: (p) => p || "—",
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      render: (l) => l?.address || "—",
    },
    {
      title: "Ngày",
      dataIndex: "createdAt",
      render: (d) => (d ? new Date(d).toLocaleString() : "—"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s) => {
        let color = "default";
        if (s === "approved") color = "green";
        else if (s === "rejected") color = "volcano";
        else color = "gold";
        return <Tag color={color}>{s}</Tag>;
      },
      filters: [
        { text: "approved", value: "approved" },
        { text: "rejected", value: "rejected" },
        { text: "pending", value: "pending" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Hành động",
      width: 280,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setDrawerContent({ type: "detail", post: record });
              setDrawerVisible(true);
            }}
          />
          {record.status !== "approved" && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => changeStatus(record._id, "approved")}
              style={{ backgroundColor: "#4CAF50", borderColor: "#4CAF50" }}
            >
              Duyệt
            </Button>
          )}
          {record.status !== "rejected" && (
            <Button
              type="default"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => changeStatus(record._id, "rejected")}
              style={{ backgroundColor: "#FFEB3B", borderColor: "#FFEB3B" }}
            >
              Từ chối
            </Button>
          )}
          {!record.isDeleted ? (
            <Button
              type="default"
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleHide(record._id)}
            >
              Xóa
            </Button>
          ) : (
            <Button
              type="default"
              size="small"
              icon={<UndoOutlined />}
              onClick={() => handleRestore(record._id)}
            >
              Hoàn tác
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý bài viết</Title>
        <Space>
          <Button onClick={() => fetchPosts(page)}>Làm mới</Button>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : posts.length === 0 ? (
        <Empty description="Chưa có bài đăng" />
      ) : (
        <>
          <Table
            rowKey={(record) => record._id || record.id}
            dataSource={posts}
            columns={columns}
            pagination={false}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <Pagination
              current={page}
              total={total}
              pageSize={limit}
              onChange={(p) => setPage(p)}
              size="small"
              showSizeChanger={false}
            />
          </div>
        </>
      )}

      <PostDrawer
        visible={drawerVisible}
        content={drawerContent}
        onClose={() => {
          setDrawerVisible(false);
          setDrawerContent(null);
        }}
      />
    </AdminLayout>
  );
}

function PostDrawer({ visible, content, onClose }) {
  if (!content) return null;
  const { type, post } = content;

  return (
    <Drawer
      title={type === "detail" ? "Chi tiết bài đăng" : "Thông tin"}
      width={600}
      onClose={onClose}
      open={visible}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button onClick={onClose}>Đóng</Button>
        </div>
      }
    >
      {type === "detail" && post && (
        <>
          <Title level={5}>{post.title}</Title>
          <Text strong>Người đăng: </Text>
          <Text>{post.userId?.username || post.userId?.email || "—"}</Text>
          <br />
          <Text strong>Điện thoại: </Text>
          <Text>{post.phone || "—"}</Text>
          <br />
          <Text strong>Địa điểm: </Text>
          <Text>{post.location?.address || "—"}</Text>
          <br />
          {post.description && (
            <>
              <Text strong>Mô tả:</Text>
              <p>{post.description}</p>
            </>
          )}
          {post.reports && post.reports.length > 0 && (
            <>
              <Title level={5}>Báo cáo ({post.reports.length})</Title>
              {post.reports.map((r, i) => (
                <div key={i} style={{ marginBottom: 8, padding: 8, border: "1px solid #eee", borderRadius: 4 }}>
                  <Text strong>{r.userId?.username || r.userId?.email || "Người dùng"}</Text>
                  <br />
                  <Text type="secondary">{new Date(r.createdAt).toLocaleString()}</Text>
                  <p>{r.reason}</p>
                  <Text>{r.message}</Text>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </Drawer>
  );
}
