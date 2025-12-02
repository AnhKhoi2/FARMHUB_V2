import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";

import {
  Card,
  Button,
  Row,
  Col,
  Popconfirm,
  Pagination,
  Empty,
  Spin,
  Typography,
  Image,
  message,
  Table,
  Space,
} from "antd";

import {
  RollbackOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

import placeholderImg from "../../assets/placeholder.svg";
import HeaderExpert from "../../components/shared/HeaderExpert";

const { Title, Text } = Typography;

export default function TrashGuides() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTrash = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const res = await axiosClient.get("/guides/trash", {
          params: { page: p, limit },
        });

        const data = res.data || {};
        const docs = data.data || data.docs || [];
        const meta = data.meta || {};

        setGuides(docs);
        setTotalPages(meta.pages || 1);
      } catch (e) {
        message.error("Không thể tải thùng rác.");
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  useEffect(() => {
    fetchTrash(page);
  }, [page, fetchTrash]);

  const onRestore = async (id) => {
    try {
      await axiosClient.post(`/guides/${id}/restore`);
      message.success("Đã khôi phục.");
      fetchTrash(page);
    } catch (e) {
      message.error("Khôi phục thất bại");
    }
  };

  const onPermanentDelete = async (id) => {
    try {
      await axiosClient.delete(`/guides/${id}/permanent`);
      message.success("Đã xóa vĩnh viễn");

      const remaining = guides.length - 1;
      if (remaining <= 0 && page > 1) {
        setPage(page - 1);
      } else {
        fetchTrash(page);
      }
    } catch (e) {
      message.error("Xóa vĩnh viễn thất bại");
    }
  };

  return (
    <>
          <HeaderExpert />
    
    <div style={{ padding: 24 }}>
      {/* --- Header --- */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          Thùng rác – Hướng dẫn đã xóa
        </Title>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            type="default"
            onClick={() => navigate(-1)}
          >
            Quay lại danh sách
          </Button>
        </div>
      </Row>

      {/* --- Loading Spinner --- */}
      {loading ? (
        <Spin
          tip="Đang tải..."
          size="large"
          style={{ width: "100%", marginTop: 50 }}
        />
      ) : guides.length === 0 ? (
        <Empty
          description="Không có hướng dẫn đã xóa"
          style={{ marginTop: 80 }}
        />
      ) : (
        <Table
          rowKey={(r) => r._id}
          dataSource={guides}
          pagination={false}
          bordered
          columns={[
            {
              title: "Ảnh",
              dataIndex: "image",
              key: "image",
              width: 140,
              render: (val) => (
                <Image
                  src={val || placeholderImg}
                  alt="thumb"
                  width={120}
                  height={80}
                  preview={false}
                  style={{ objectFit: "cover", borderRadius: 6 }}
                />
              ),
            },
            {
              title: "Tiêu đề",
              dataIndex: "title",
              key: "title",
              render: (t, r) => <Text strong>{t}</Text>,
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              key: "description",
              render: (d) => <Text type="secondary">{d || "Không có mô tả"}</Text>,
            },
            {
              title: "Hành động",
              key: "actions",
              width: 160,
              align: "center",
              render: (_t, record) => (
                <Space>
                  <Popconfirm
                    title="Khôi phục?"
                    okText="Có"
                    cancelText="Không"
                    onConfirm={() => onRestore(record._id)}
                  >
                    <Button type="link">Khôi phục</Button>
                  </Popconfirm>

                </Space>
              ),
            },
          ]}
        />
      )}

      {/* --- Pagination --- */}
      <Pagination
        style={{ marginTop: 24, textAlign: "center" }}
        current={page}
        total={totalPages * limit}
        pageSize={limit}
        onChange={(p) => setPage(p)}
        showSizeChanger={false}
      />
    </div>
        </>

  );
}
