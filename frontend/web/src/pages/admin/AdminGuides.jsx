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
} from "@ant-design/icons";
import placeholderImg from "../../assets/placeholder.svg";

// ---------- Theme Colors ----------
const colors = {
  primary: "#4CAF50",
  accent: "#81C784",
  darkGreen: "#2E7D32",
  background: "#F9FBE7",
  neutral: "#E0E0E0",
  highlight: "#8BC34A",
  yellow: "#FFEB3B",
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

  const fetchGuides = useCallback(
    async (p = page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get("/guides", {
          params: { page: p, limit },
        });
        const data = res.data || {};
        const docs = data.data || data.docs || [];
        const meta = data.meta || {};
        const tot =
          data.total ||
          meta.total ||
          (meta.pages ? meta.pages * limit : docs.length);
        setGuides(docs);
        setTotalPages(Math.max(1, Math.ceil(tot / limit)));
      } catch (e) {
        console.error(e);
        setError("Không thể tải guides");
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  useEffect(() => {
    fetchGuides(page);
  }, [page, fetchGuides]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hướng dẫn này?")) return;
    setLoading(true);
    try {
      await axiosClient.delete(`/guides/${id}`);
      message.success("Xóa thành công");
      const remaining = guides.length - 1;
      if (remaining <= 0 && page > 1) {
        setPage(page - 1);
        fetchGuides(page - 1);
      } else {
        fetchGuides(page);
      }
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
      titleStyle: { color: colors.darkGreen },
    },
    {
      title: "Ảnh",
      dataIndex: "image",
      width: 90,
      render: (img) =>
        img ? (
          <img
            src={img}
            alt="thumb"
            style={{
              width: 60,
              height: 60,
              objectFit: "cover",
              borderRadius: 6,
              border: `1px solid ${colors.neutral}`,
            }}
          />
        ) : (
          "—"
        ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      sorter: (a, b) => (a.title || "").localeCompare(b.title || ""),
      render: (t) => t || "(Không có tiêu đề)",
      titleStyle: { color: colors.darkGreen },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      render: (_, record) => record.description || record.summary || "—",
      titleStyle: { color: colors.darkGreen },
    },
    {
      title: "Tác giả",
      dataIndex: "expert_id",
      filters: Array.from(
        new Set(
          guides.map((g) => g.expert_id?.username || g.expert_id?.name)
        )
      )
        .filter(Boolean)
        .map((name) => ({ text: name, value: name })),
      onFilter: (value, record) => {
        const name = record.expert_id?.username || record.expert_id?.name;
        return name === value;
      },
      render: (_, record) =>
        record.expert_id?.username || record.expert_id?.name || "—",
      titleStyle: { color: colors.darkGreen },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      render: (_, record) =>
        record.createdAt ? new Date(record.createdAt).toLocaleString() : "—",
      titleStyle: { color: colors.darkGreen },
    },
    {
      title: "Hành động",
      width: 220,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            style={{ color: colors.primary, borderColor: colors.primary }}
            onClick={() => navigate(`/guides/${record._id || record.id}`)}
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            style={{ color: colors.accent, borderColor: colors.accent }}
            onClick={() => {
              setEditingGuide(record);
              setDrawerVisible(true);
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record._id || record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div
        className="container-fluid"
        style={{ backgroundColor: colors.background, padding: 16 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, color: colors.darkGreen }}>Hướng dẫn</h3>
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
              onClick={() => {
                setEditingGuide(null);
                setDrawerVisible(true);
              }}
            />
            <Button
              size="small"
              icon={<InboxOutlined />}
              style={{ backgroundColor: colors.accent, borderColor: colors.accent }}
              onClick={() => navigate("/managerguides/trash")}
            />
          </Space>
        </div>

        {error && (
          <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <Table
            rowKey={(record) => record._id || record.id}
            dataSource={guides}
            columns={columns}
            pagination={false}
            bordered
            style={{ backgroundColor: colors.background }}
          />
        )}

        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}
        >
          <Pagination
            current={page}
            total={totalPages * limit}
            pageSize={limit}
            onChange={setPage}
            size="small"
            style={{ color: colors.darkGreen }}
          />
        </div>

        <GuideDrawer
          visible={drawerVisible}
          guide={editingGuide}
          onClose={() => setDrawerVisible(false)}
          onSubmit={async (formValues) => {
            try {
              const fd = new FormData();
              Object.entries(formValues).forEach(([k, v]) => {
                if (k === "plantTags") {
                  fd.append(k, JSON.stringify(v));
                } else if (k === "image") {
                  if (v instanceof File) fd.append("image", v);
                } else if (Array.isArray(v)) {
                  fd.append(k, JSON.stringify(v));
                } else if (v !== undefined && v !== null) {
                  fd.append(k, v);
                }
              });

              if (editingGuide) {
                await axiosClient.put(
                  `/guides/${editingGuide._id || editingGuide.id}`,
                  fd,
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
      </div>
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

    return () => {
      if (prevObjectUrlRef.current) {
        URL.revokeObjectURL(prevObjectUrlRef.current);
        prevObjectUrlRef.current = null;
      }
    };
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

  return (
    <Drawer
      title={safeGuide._id ? "Sửa hướng dẫn" : "Tạo hướng dẫn"}
      width={420}
      onClose={() => {
        form.resetFields();
        setPreviewUrl(null);
        onClose();
      }}
      open={visible}
      destroyOnClose={false}
      bodyStyle={{ backgroundColor: colors.background }}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button
            onClick={() => {
              form.resetFields();
              setPreviewUrl(null);
              onClose();
            }}
            style={{
              marginRight: 8,
              backgroundColor: colors.accent,
              borderColor: colors.accent,
              color: "#fff",
            }}
          >
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            style={{
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            }}
          >
            Lưu
          </Button>
        </div>
      }
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item label="Nội dung" name="content">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item label="Thẻ cây trồng (phân bởi dấu phẩy)" name="plantTags">
          <Input />
        </Form.Item>

        <Form.Item label="Ảnh chính" name="image">
          <>
            {previewUrl ? (
              <div style={{ marginBottom: 8 }}>
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{
                    width: "100%",
                    maxHeight: 180,
                    objectFit: "cover",
                    borderRadius: 6,
                    border: `1px solid ${colors.neutral}`,
                  }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: 8, color: "#888" }}>
                <img
                  src={placeholderImg}
                  alt="placeholder"
                  style={{
                    width: "100%",
                    maxHeight: 180,
                    objectFit: "contain",
                    borderRadius: 6,
                    border: `1px dashed ${colors.neutral}`,
                  }}
                />
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ width: "100%" }}
            />
          </>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
