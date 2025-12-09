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
import usersApi from "../../api/usersApi";
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
        // If some guides reference users only by id (e.g. expert_id is a string), try to fetch those users
        (async () => {
          try {
            const idSet = new Set();
            docs.forEach((d) => {
              const v = d.expert_id || d.author || d.user || d.createdBy || d.created_by || d.owner;
              if (v && typeof v === "string") idSet.add(v);
              // sometimes array or object with id
              if (v && typeof v === "object" && (v._id || v.id)) {
                const id = v._id || v.id;
                if (id && typeof id === "string") idSet.add(id);
              }
            });

            if (idSet.size === 0) return;

            const idArr = Array.from(idSet);
            // fetch each user detail (no bulk endpoint available)
            const users = await Promise.all(
              idArr.map((id) => usersApi.detail(id).catch(() => null))
            );
            const map = {};
            users.forEach((u) => {
              if (u && (u._id || u.id)) map[u._id || u.id] = u;
            });

            const updated = docs.map((d) => {
              const v = d.expert_id || d.author || d.user || d.createdBy || d.created_by || d.owner;
              let id = null;
              if (v && typeof v === "string") id = v;
              if (v && typeof v === "object") id = v._id || v.id || null;
              const u = id ? map[id] : null;
              return { ...d, _resolvedAuthor: u || null };
            });

            setGuides(updated);
          } catch (e) {
            console.warn("Failed to resolve guide authors", e);
          }
        })();
        setTotalPages(Math.max(1, Math.ceil(tot / limit)));
        setPage(p);
      } catch (e) {
        console.error(e);
        setError("Không thể tải guides");
      } finally {
        setLoading(false);
      }
    },
    {
      title: "Người chỉnh sửa",
      dataIndex: "updatedBy",
      width: 180,
      render: (_, record) => {
        const editor = getEditorName(record);
        const t = record.updatedAt || record.modifiedAt || record.updated_at || record.modified_at || record.lastModified;
        return editor ? (
          <div>
            <div style={{ fontWeight: 600 }}>{editor}</div>
            {t ? <div style={{ fontSize: 12, color: NATURE_COLORS.textMuted }}>{new Date(t).toLocaleDateString('vi-VN')}</div> : null}
          </div>
        ) : (
          <span style={{ color: NATURE_COLORS.textMuted }}>—</span>
        );
      },
      onHeaderCell: () => ({ style: { color: NATURE_COLORS.darkText } }),
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
      render: (_, record) => {
        const name = getAuthorName(record);
        return name ? (
          <div style={{ fontWeight: 600 }}>{name}</div>
        ) : (
          <Tag color="default">Admin/Guest</Tag>
        );
      },
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
              navigate(`/admin/adminGuideEdit/${record._id || record.id}`, { state: { page } });
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

  // Helper to extract a readable author name from a guide record
  const getAuthorName = (record) => {
    if (!record) return null;
    // prefer pre-resolved author
    if (record._resolvedAuthor) {
      const ra = record._resolvedAuthor;
      return (ra.username || ra.fullName || ra.name || ra.email || null) || null;
    }
    const tryPaths = [
      () => record.expert_id?.username,
      () => record.expert_id?.name,
      () => record.author?.username,
      () => record.author?.name,
      () => record.user?.username,
      () => record.user?.fullName,
      () => record.createdBy?.username,
      () => record.createdBy?.name,
      () => record.created_by?.username,
      () => record.created_by?.name,
      () => record.owner?.username,
      () => record.owner?.name,
      () => record.authorName,
      () => record.creatorName,
      () => record.postedBy,
      () => record.author,
    ];

    for (const fn of tryPaths) {
      try {
        const v = fn();
        if (v && typeof v === "string" && v.trim()) return v.trim();
      } catch (e) {
        // ignore
      }
    }

    return null;
  };

  // Helper to extract the last editor's name from a guide record
  const getEditorName = (record) => {
    if (!record) return null;
    const tryPaths = [
      () => record.updatedBy?.username,
      () => record.updatedBy?.name,
      () => record.updated_by?.username,
      () => record.updated_by?.name,
      () => record.modifiedBy?.username,
      () => record.modifiedBy?.name,
      () => record.modified_by?.username,
      () => record.modified_by?.name,
      () => record.editor?.username,
      () => record.editor?.name,
      () => record.editedBy,
      () => record.lastEditedBy,
      () => record.lastModifiedBy,
      () => record.updaterName,
      () => record.editorName,
    ];

    for (const fn of tryPaths) {
      try {
        const v = fn();
        if (v && typeof v === "string" && v.trim()) return v.trim();
        if (v && typeof v === "object") {
          // object with username/name
          const candidate = v.username || v.name || v.fullName;
          if (candidate && String(candidate).trim()) return String(candidate).trim();
        }
      } catch (e) { }
    }

    return null;
  };

  return (
    <AdminLayout>
      <Card
        title={
          <h4 style={{ margin: 0, color: NATURE_COLORS.darkText, fontWeight: 600 }}>
            HƯỚNG DẪN TRỒNG
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
                navigate(`/admin/adminGuidecreate`);
              }}
            >
              Thêm mới
            </Button>
            <Button
              icon={<InboxOutlined />}
              // Accent Green
              style={{ color: NATURE_COLORS.darkText, borderColor: NATURE_COLORS.neutralBorder }}
              onClick={() => navigate("/admin/guides/trash")}
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
            onChange={(p) => fetchGuides(p)}
            size="default"
            showTotal={(total) => `Tổng ${total} hướng dẫn`}
          />
        </div>
      </Card>


    </AdminLayout>
  );
}
