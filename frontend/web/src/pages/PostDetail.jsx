import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/shared/axiosClient";
import Header from "../components/shared/Header";

import {
  Card,
  Typography,
  Button,
  Image,
  Space,
  Modal,
  message,
  Spin,
  Tag,
  Row,
  Col,
  Divider,
} from "antd";

const { Title, Text, Paragraph } = Typography;

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`/admin/managerpost/public/${id}`);
        const payload = res.data?.data || res.data;
        if (!mounted) return;
        setPost(payload);
      } catch (err) {
        setError(err?.response?.data?.message || "Không tải được bài viết");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleReport = async () => {
    try {
      await axiosClient.post(`/admin/managerpost/${id}/report`, {
        reason: reportReason,
        message: "",
      });
      message.success("Đã gửi báo cáo. Cảm ơn bạn!");
      setReportOpen(false);
      setReportReason("");
    } catch (err) {
      message.error(err?.response?.data?.message || "Không gửi được báo cáo");
    }
  };

  if (loading)
    return (
      <>
        <Header />
        <div className="center" style={{ padding: 40, textAlign: "center" }}>
          <Spin size="large" />
        </div>
      </>
    );

  if (error)
    return (
      <>
        <Header />
        <div style={{ padding: 24, color: "red" }}>{error}</div>
      </>
    );

  return (
    <>
      <Header />

      <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
        <Button type="link" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>

        <Card
          style={{
            borderRadius: 16,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
          bodyStyle={{ padding: 24 }}
        >
          <Title level={2} style={{ color: "#2E7D32", marginBottom: 4 }}>
            {post.title}
          </Title>

          <Text type="secondary">
            {post.userId?.username || "Người đăng"} •{" "}
            {new Date(post.createdAt).toLocaleString()}
          </Text>

          <Divider />

          {/* HÌNH ẢNH */}
          {post.images?.length > 0 && (
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
              {post.images.map((src, i) => (
                <Col key={i} xs={12} sm={8}>
                  <Image
                    src={src}
                    alt="image"
                    style={{
                      borderRadius: 12,
                      width: "100%",
                      height: 160,
                      objectFit: "cover",
                    }}
                    preview={true}
                  />
                </Col>
              ))}
            </Row>
          )}

          {/* MÔ TẢ */}
          <Paragraph style={{ fontSize: 16, whiteSpace: "pre-wrap" }}>
            {post.description}
          </Paragraph>

          <Divider />

          {/* NÚT HÀNH ĐỘNG */}
          <Space>
            <Button
              type="primary"
              size="large"
              style={{
                background: "#4CAF50",
              }}
              href={`tel:${post.phone || ""}`}
            >
              📞 Gọi: {post.phone || "—"}
            </Button>

            <Button
              danger
              size="large"
              type="default"
              style={{
                borderColor: "#d32f2f",
                color: "#d32f2f",
              }}
              onClick={() => setReportOpen(true)}
            >
              🚨 Báo cáo
            </Button>
          </Space>
        </Card>
      </div>

      {/* REPORT MODAL */}
      <Modal
        title="Báo cáo bài viết"
        open={reportOpen}
        okText="Gửi báo cáo"
        cancelText="Hủy"
        onCancel={() => setReportOpen(false)}
        onOk={handleReport}
      >
        <Text>Lý do báo cáo:</Text>
        <textarea
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          rows={4}
          className="form-control"
          placeholder="Nhập lý do báo cáo..."
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 6,
            marginTop: 8,
            border: "1px solid #ccc",
          }}
        />
      </Modal>
    </>
  );
}
