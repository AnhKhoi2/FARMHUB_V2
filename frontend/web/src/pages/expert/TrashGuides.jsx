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
} from "antd";

import {
  RollbackOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

import placeholderImg from "../../assets/placeholder.svg";

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
        <Row gutter={[16, 16]}>
          {guides.map((g) => (
            <Col xs={24} sm={12} md={8} lg={6} key={g._id}>
              <Card
                hoverable
                cover={
                  <Image
                    src={g.image || placeholderImg}
                    alt="thumbnail"
                    height={160}
                    style={{ objectFit: "cover" }}
                    preview={false}
                  />
                }
                actions={[
                  <Popconfirm
                    title="Khôi phục?"
                    okText="Có"
                    cancelText="Không"
                    onConfirm={() => onRestore(g._id)}
                  >
                    <RollbackOutlined style={{ color: "#1890ff" }} />
                  </Popconfirm>,

                  <Popconfirm
                    title="Xóa vĩnh viễn? Không thể khôi phục."
                    okText="Xóa"
                    cancelText="Hủy"
                    okType="danger"
                    onConfirm={() => onPermanentDelete(g._id)}
                  >
                    <DeleteOutlined style={{ color: "red" }} />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={g.title}
                  description={
                    <Text type="secondary">
                      {g.description || g.summary || "Không có mô tả"}
                    </Text>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
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
  );
}
