import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Table,
  Button,
  Drawer,
  Input,
  Form,
  message,
  Space,
  Pagination,
  Spin,
  Tag,
  Card,
} from "antd";
import AdminLayout from "../../components/AdminLayout";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  InboxOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import placeholderImg from "../../assets/placeholder.svg";
import { FaBook } from "react-icons/fa";

// ---------- Theme Colors: Green & Nature Palette ----------
const NATURE_COLORS = {
  // Primary Palette
  primary: "#4CAF50",      // Fresh Green (Nút chính)
  accent: "#81C784",       // Light Leaf (Secondary button, Hover)
  darkText: "#2E7D32",     // Forest Deep (Text nổi bật, Tiêu đề)
  background: "#F9FBE7",   // Nature Ivory (Nền content)
  neutralBorder: "#E0E0E0",// Soft Stone (Border, Khung)
  highlight: "#8BC34A",    // Lime Touch (Tag, Highlight)
  
  // Secondary/Utility Palette
  warning: "#FFEB3B",      // Sunlight (Warning/Good status)
  danger: "#FF4D4F",       // Ant Red (Xóa)
  cardBg: "#FFFFFF",       // Nền Card
  textMuted: "#6c757d",    // Text phụ
};


export default function AdminGuides() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchGuides = useCallback(
    async (p = page, term = searchTerm) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get("/guides", {
          params: { page: p, limit, search: term },
        });
        const data = res.data || {};
        const docs = data.data || data.docs || [];
        const meta = data.meta || {};
        const tot = data.total || meta.total || (meta.pages ? meta.pages * limit : docs.length);
        
        setGuides(docs);
        setTotalPages(Math.max(1, Math.ceil(tot / limit)));
        setPage(p);
      } catch (e) {
        console.error(e);
        setError("Không thể tải guides");
      } finally {
        setLoading(false);
      }
    },
    [limit, searchTerm]
  );

  useEffect(() => {
    fetchGuides(1); 
  }, [searchTerm, fetchGuides]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hướng dẫn này?")) return;
    setLoading(true);
    try {
      await axiosClient.delete(`/guides/${id}`);
      message.success("Xóa thành công");
      
      const remaining = guides.length - 1;
      let targetPage = page;
      if (remaining === 0 && page > 1) {
        targetPage = page - 1;
      }
      fetchGuides(targetPage);

    } catch (e) {
      console.error(e);
      message.error("Xóa không thành công");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "STT",
      width: 60,
      render: (_, __, idx) => (page - 1) * limit + idx + 1,
      align: "center",
      // Tiêu đề cột dùng màu Dark Text
      onHeaderCell: () => ({ style: { color: NATURE_COLORS.darkText } }),
    },
    {
      title: "Ảnh",
      dataIndex: "image",
      width: 90,
      render: (img) => (
        <img
          src={img || placeholderImg}
          alt="thumb"
          style={{
            width: 60,
            height: 60,
            objectFit: "cover",
            borderRadius: 4,
            border: `1px solid ${NATURE_COLORS.neutralBorder}`,
          }}
        />
      ),
      onHeaderCell: () => ({ style: { color: NATURE_COLORS.darkText } }),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      sorter: (a, b) => (a.title || "").localeCompare(b.title || ""),
      render: (t) => t || (
        <Tag color="error">
            KHÔNG TIÊU ĐỀ
        </Tag>
      ),
      onHeaderCell: () => ({ style: { color: NATURE_COLORS.darkText } }),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      render: (_, record) => {
        const text = record.description || record.summary || "—";
        return <span style={{ color: NATURE_COLORS.textMuted }}>{text.length > 50 ? text.substring(0, 50) + "..." : text}</span>;
      },
      onHeaderCell: () => ({ style: { color: NATURE_COLORS.darkText } }),
    },
    {
      title: "Tác giả",
      dataIndex: "expert_id",
      width: 150,
      render: (_, record) =>
        record.expert_id?.username || record.expert_id?.name || (
            <Tag color="default">
                Admin/Guest
            </Tag>
        ),
      onHeaderCell: () => ({ style: { color: NATURE_COLORS.darkText } }),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      render: (_, record) =>
        record.createdAt ? new Date(record.createdAt).toLocaleDateString("vi-VN") : "—",
      onHeaderCell: () => ({ style: { color: NATURE_COLORS.darkText } }),
    },
    {
      title: "Hành động",
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            type="text"
            style={{ color: NATURE_COLORS.darkText }} // Icon xem dùng Dark Text để nổi bật
            title="Xem chi tiết"
            onClick={() => navigate(`/admin/guides/${record._id || record.id}`)}
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            type="text"
            style={{ color: NATURE_COLORS.highlight }} // Icon sửa dùng Highlight
            title="Chỉnh sửa"
            onClick={() => {
              setEditingGuide(record);
              setDrawerVisible(true);
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            type="text"
            title="Xóa"
            onClick={() => handleDelete(record._id || record.id)}
          />
        </Space>
      ),
      onHeaderCell: () => ({ style: { color: NATURE_COLORS.darkText } }),
    },
  ];

  return (
    <AdminLayout>
      <Card
        title={
          <h4 style={{ margin: 0, color: NATURE_COLORS.darkText, fontWeight: 600 }}>
            <FaBook style={{ marginRight: 8 }} /> Quản Lý Hướng Dẫn Trồng Trọt
          </h4>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              // Primary Green
              style={{ backgroundColor: NATURE_COLORS.primary, borderColor: NATURE_COLORS.primary, fontWeight: 500 }}
              onClick={() => {
                setEditingGuide(null);
                setDrawerVisible(true);
              }}
            >
              Thêm mới
            </Button>
            <Button
              icon={<InboxOutlined />}
              // Accent Green
              style={{ color: NATURE_COLORS.darkText, borderColor: NATURE_COLORS.neutralBorder }}
              onClick={() => navigate("/managerguides/trash")}
            >
              Thùng rác
            </Button>
          </Space>
        }
        // Thiết lập Card style
        style={{ margin: 0, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", backgroundColor: NATURE_COLORS.cardBg }}
      >
        {/* Thanh tìm kiếm */}
        <Input
          placeholder="Tìm kiếm theo tiêu đề..."
          prefix={<SearchOutlined style={{ color: NATURE_COLORS.darkText }} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onPressEnter={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: 16, width: 300, borderRadius: 4 }}
          allowClear
        />

        {error && (
          <div style={{ color: NATURE_COLORS.danger, marginBottom: 12, fontWeight: 500 }}>{error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" style={{ color: NATURE_COLORS.primary }} />
          </div>
        ) : (
          <Table
            rowKey={(record) => record._id || record.id}
            dataSource={guides}
            columns={columns}
            pagination={false}
            bordered={false}
            size="middle"
          />
        )}

        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
        >
          <Pagination
            current={page}
            total={totalPages * limit}
            pageSize={limit}
            onChange={fetchGuides}
            size="default"
            showTotal={(total) => `Tổng ${total} hướng dẫn`}
          />
        </div>
      </Card>

      <GuideDrawer
        visible={drawerVisible}
        guide={editingGuide}
        onClose={() => setDrawerVisible(false)}
        onSubmit={async (formValues) => {
          try {
            const fd = new FormData();
            Object.entries(formValues).forEach(([k, v]) => {
              if (k === "plantTags" || Array.isArray(v)) {
                fd.append(k, JSON.stringify(v));
              } else if (k === "image") {
                if (v instanceof File) fd.append("image", v);
              } else if (v !== undefined && v !== null) {
                fd.append(k, v);
              }
            });

            if (editingGuide) {
              await axiosClient.put(
                `/guides/${editingGuide._id || editingGuide.id}`, fd,
                { headers: { "Content-Type": "multipart/form-data" } }
              );
              message.success("Cập nhật thành công");
            } else {
              await axiosClient.post("/guides", fd, {
                headers: { "Content-Type": "multipart/form-data" },
              });
              message.success("Tạo mới thành công");
            }

            setDrawerVisible(false);
            setEditingGuide(null);
            fetchGuides(page);

          } catch (e) {
            console.error(e);
            message.error("Thao tác không thành công");
          }
        }}
      />
    </AdminLayout>
  );
}

// ---------------- GuideDrawer Component ----------------
function GuideDrawer({ visible, guide, onClose, onSubmit }) {
  const safeGuide = guide || {};
  const [form] = Form.useForm();
  const [previewUrl, setPreviewUrl] = useState(null);
  const prevObjectUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (prevObjectUrlRef.current) {
        URL.revokeObjectURL(prevObjectUrlRef.current);
        prevObjectUrlRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    form.setFieldsValue({
      title: safeGuide.title || "",
      description: safeGuide.description || safeGuide.summary || "",
      content: safeGuide.content || "",
      plantTags: Array.isArray(safeGuide.plantTags)
        ? safeGuide.plantTags.join(", ")
        : "",
      image: null,
    });

    setPreviewUrl(safeGuide.image || null);

  }, [safeGuide, form, visible]);


  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    form.setFieldValue("image", file);

    if (prevObjectUrlRef.current) {
      URL.revokeObjectURL(prevObjectUrlRef.current);
      prevObjectUrlRef.current = null;
    }

    if (file) {
      const objUrl = URL.createObjectURL(file);
      prevObjectUrlRef.current = objUrl;
      setPreviewUrl(objUrl);
    } else {
      setPreviewUrl(safeGuide.image || null);
    }
  };

  const handleFinish = (values) => {
    const payload = {
      ...values,
      plantTags: values.plantTags
        ? values.plantTags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };
    onSubmit(payload);
  };

  const handleClose = () => {
    form.resetFields();
    setPreviewUrl(null);
    onClose();
  };

  return (
    <Drawer
      title={<span style={{ color: NATURE_COLORS.darkText, fontWeight: 600 }}>{safeGuide._id ? "Sửa Hướng Dẫn" : "Tạo Hướng Dẫn Mới"}</span>}
      width={window.innerWidth > 768 ? 480 : "100%"}
      onClose={handleClose}
      open={visible}
      destroyOnClose={false}
      bodyStyle={{ paddingBottom: 80, backgroundColor: NATURE_COLORS.background }} // Nền Drawer dùng Nature Ivory
      footerStyle={{ borderTop: `1px solid ${NATURE_COLORS.neutralBorder}` }}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button
            onClick={handleClose}
            style={{ marginRight: 8, color: NATURE_COLORS.darkText, borderColor: NATURE_COLORS.neutralBorder }}
          >
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            // Primary Green
            style={{
              backgroundColor: NATURE_COLORS.primary,
              borderColor: NATURE_COLORS.primary,
              fontWeight: 500
            }}
          >
            Lưu
          </Button>
        </div>
      }
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Form.Item
          label={<span style={{ fontWeight: 500, color: NATURE_COLORS.darkText }}>Tiêu đề</span>}
          name="title"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input placeholder="Ví dụ: Kỹ thuật trồng Cà Chua" />
        </Form.Item>

        <Form.Item label={<span style={{ fontWeight: 500, color: NATURE_COLORS.darkText }}>Mô tả ngắn</span>} name="description">
          <Input.TextArea rows={2} placeholder="Tóm tắt ngắn gọn về hướng dẫn" />
        </Form.Item>

        <Form.Item label={<span style={{ fontWeight: 500, color: NATURE_COLORS.darkText }}>Nội dung chi tiết</span>} name="content">
          <Input.TextArea rows={6} placeholder="Nhập toàn bộ nội dung hướng dẫn tại đây" />
        </Form.Item>

        <Form.Item 
            label={<span style={{ fontWeight: 500, color: NATURE_COLORS.darkText }}>Thẻ cây trồng (Tags)</span>} 
            name="plantTags"
            tooltip="Phân cách bằng dấu phẩy (ví dụ: cà chua, rau xanh, thủy canh)"
        >
          <Input placeholder="cà chua, rau xanh, thủy canh" />
        </Form.Item>

        <Form.Item label={<span style={{ fontWeight: 500, color: NATURE_COLORS.darkText }}>Ảnh đại diện</span>} name="image">
          <>
            <div style={{ marginBottom: 8 }}>
                <img
                  src={previewUrl || placeholderImg}
                  alt="preview/placeholder"
                  style={{
                    width: "100%",
                    maxHeight: 200,
                    objectFit: "cover",
                    borderRadius: 6,
                    border: `1px solid ${NATURE_COLORS.neutralBorder}`,
                    marginBottom: 8
                  }}
                />
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              // Tinh chỉnh style input file
              style={{ width: "100%", padding: 6, border: `1px solid ${NATURE_COLORS.neutralBorder}`, borderRadius: 4 }}
            />
            {previewUrl && <small style={{ color: NATURE_COLORS.textMuted }}>* Ảnh mới sẽ thay thế ảnh cũ.</small>}
          </>
        </Form.Item>
      </Form>
    </Drawer>
  );
}