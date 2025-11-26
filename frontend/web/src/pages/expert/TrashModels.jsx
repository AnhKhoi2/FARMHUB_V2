import React, { useEffect, useState } from "react";
import { Table, Button, Tag, Space, Spin, message, Typography, Popconfirm, Pagination } from "antd";
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from "../../api/shared/axiosClient";
import HeaderExpert from "../../components/shared/HeaderExpert";
import ChatWidget from "./ChatWidget";
import { MessageCircle } from "lucide-react";

const { Title } = Typography;

export default function TrashModels() {
  const [trashItems, setTrashItems] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();

  const fetchLayouts = async () => {
    try {
      const res = await axiosClient.get("/layouts");
      const data = res.data?.data || res.data || [];
      setLayouts(data);
    } catch (err) {
      console.error("Không thể tải layouts", err);
    }
  };

  const fetchTrash = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/admin/models/trash?page=${page}&limit=${limit}`);
      const data = res.data?.data || res.data || {};
      const items = data.items || data || [];
      setTrashItems(items);
      setMeta({ page: data.page || page, pages: data.pages || 1, total: data.total || items.length, limit: data.limit || limit });
    } catch (err) {
      console.error("Không thể tải thùng rác mô hình", err);
      message.error("Không thể tải thùng rác");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayouts();
    fetchTrash(1, meta.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestore = async (id) => {
    try {
      await axiosClient.patch(`/admin/models/${id}/restore`);
      message.success("Đã phục hồi mô hình");
      fetchTrash(meta.page, meta.limit);
    } catch (err) {
      console.error(err);
      message.error("Phục hồi thất bại");
    }
  };

  const handlePermanentDelete = async (id) => {
    try {
      await axiosClient.delete(`/admin/models/${id}`);
      message.success("Đã xóa vĩnh viễn");
      fetchTrash(meta.page, meta.limit);
    } catch (err) {
      console.error(err);
      message.error("Xóa thất bại");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "_id",
      key: "_id",
      width: 80,
      render: (_v, _record, index) => String(index + 1).padStart(2, "0"),
    },
    { title: "Diện tích", dataIndex: "area", key: "area", width: 120 },
    { title: "Đất", dataIndex: "soil", key: "soil", width: 160 },
    { title: "Khí hậu", dataIndex: "climate", key: "climate", width: 160 },
    { title: "Tưới", dataIndex: "irrigation", key: "irrigation", width: 140 },
    {
      title: "Bố trí",
      dataIndex: "layouts",
      key: "layouts",
      render: (layoutIds) =>
        (layoutIds || []).map((id) => {
          const l = layouts.find((lo) => Number(lo.layout_id) === Number(id));
          return l ? (
            <Tag color="blue" key={id} style={{ marginBottom: 4 }}>
              {l.layout_name}
            </Tag>
          ) : null;
        }),
    },
    {
      title: "Hành động",
      key: "action",
      width: 220,
      render: (_v, record) => (
        <Space>
          <Popconfirm title="Bạn có muốn phục hồi mô hình này?" onConfirm={() => handleRestore(record._id)}>
            <Button size="small">Hoàn tác</Button>
          </Popconfirm>
          <Popconfirm title="Xóa vĩnh viễn? Hành động không thể hoàn tác." onConfirm={() => handlePermanentDelete(record._id)}>
            <Button danger size="small">Xóa vĩnh viễn</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <HeaderExpert onChatClick={() => setChatOpen(true)} />

      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button shape="round" icon={<ArrowLeftOutlined />} onClick={() => navigate('/experthome/models')}>
              Quay lại
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              Thùng rác - Mô hình
            </Title>
          </div>
        </div>

        {loading ? (
          <div style={{ width: "100%", padding: 40, textAlign: 'center' }}>
            <Spin tip="Đang tải..." />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 300 }}>
            <div style={{ flex: '1 1 auto', overflow: 'auto' }}>
              <Table
                columns={columns}
                dataSource={trashItems}
                rowKey={(r) => r._id}
                pagination={false}
                bordered
                size="middle"
                scroll={{ x: 'max-content' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
              <Pagination
                current={meta.page}
                total={meta.total}
                pageSize={meta.limit}
                onChange={(p) => fetchTrash(p, meta.limit)}
                showSizeChanger={false}
              />
            </div>
          </div>
        )}
      </div>

      {!chatOpen && (
        <button className="floating-chat-btn" onClick={() => setChatOpen(true)}>
          <MessageCircle size={26} />
        </button>
      )}

      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
