import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/shared/axiosClient";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";

import {
  Card,
  Typography,
  Button,
  Image,
  Space,
  Modal,
  message,
  Spin,
  Divider,
  Tag,
  Row, // Import Row
  Col, // Import Col
  Avatar, // Import Avatar cho người bán
} from "antd";
import {
  EnvironmentOutlined, // Icon địa điểm
  HeartOutlined, // Icon trái tim cho Lưu tin
  MessageOutlined, // Icon tin nhắn cho Chat
  UserOutlined, // Icon người dùng mặc định cho Avatar
  ClockCircleOutlined, // Icon đồng hồ cho thời gian
} from "@ant-design/icons"; // Import các icon cần thiết

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
        // Lưu ý: Đường dẫn API nên là chuỗi template
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
    return () => (mounted = false);
  }, [id]);

  const handleReport = async () => {
    try {
      // Lưu ý: Đường dẫn API nên là chuỗi template
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
        <div
          style={{
            padding: 80,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin size="large" tip="Đang tải bài viết..." />
        </div>
      </>
    );

  if (error)
    return (
      <>
        <Header />
        <div
          style={{
            padding: 40,
            color: "red",
            textAlign: "center",
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      </>
    );

  return (
    <>
      <Header />
      <div style={{ maxWidth: 1200, margin: "30px auto", padding: "0 16px" }}>
        {/* Nút quay lại - giữ nguyên */}
        <Button
          type="default"
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16, fontSize: 16, color: "#1890ff" }}
        >
           Quay lại
        </Button>

        {/* Breadcrumb (nếu có, có thể thêm vào đây) */}
        {/* Ví dụ: <Text type="secondary" style={{marginBottom: 16, display: 'block'}}>Trang chủ > Tủ, Kệ gia đình > Tủ 3 cánh màu xám nhựa Đài Loan</Text> */}

        <Row gutter={[24, 24]}>
          {/* Cột trái: Hình ảnh */}
          <Col xs={24} lg={14}>
            {" "}
            {/* Chiếm 14/24 trên màn hình lớn */}
            <Card
              style={{
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                display: "flex",
                height: "100%",
              }}
              bodyStyle={{ padding: 0 }}
            >
              {/* Ảnh chính */}
              {post.images && (
                <div
                  style={{
                    width: "100%",
                  }}
                >
                  <Image
                    src={post.images}
                    alt={`Hình chính của ${post.title}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      cursor: "pointer",
                    }}
                    preview={true}
                  />
                  {/* Số lượng ảnh */}
                  {/* <div
                    style={{
                      position: "absolute",
                      bottom: 10,
                      right: 10,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    1/{post.images?.length || 1}
                  </div> */}
                </div>
              )}
              {/* Grid ảnh phụ */}
              {/* {post.images && (
                <div
                  style={{
                    padding: 12,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                    gap: 8,
                    borderTop: "1px solid #f0f0f0",
                  }}
                >
                  <div
                    style={{
                      overflow: "hidden",
                      borderRadius: 4,
                      height: 80,
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <Image
                      src={post.images}
                      alt={`Hình ${post.images}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        cursor: "pointer",
                      }}
                      preview={true}
                    />
                  </div>
                </div>
              )} */}
            </Card>
          </Col>

          {/* Cột phải: Thông tin sản phẩm và người bán */}
          <Col xs={24} lg={10}>
            {" "}
            {/* Chiếm 10/24 trên màn hình lớn */}
            <Card
              style={{
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                marginBottom: 24, // Khoảng cách với card tiếp theo (nếu có)
              }}
              bodyStyle={{ padding: 24 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <Title
                  level={3}
                  style={{
                    margin: 0,
                    lineHeight: 1.3,
                    flex: 1,
                    marginRight: 10,
                    color: "#1e3e26ff",
          
                  }}
                >
                  {post.title}
                </Title>
              </div>

              {/* Giá */}
              {post.price && (
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#f5222d",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  {post.price}
                </Text>
              )}

              {/* Địa điểm và thời gian */}
              <div style={{ marginBottom: 16 }}>
                <Text
                  type="secondary"
                  style={{ fontSize: 14, display: "block", marginBottom: 4 }}
                >
                  <EnvironmentOutlined style={{ marginRight: 5 }} />
                  {post.address || "Chưa có địa chỉ"}
                </Text>
                <Text
                  type="secondary"
                  style={{ fontSize: 14, display: "block" }}
                >
                  <ClockCircleOutlined style={{ marginRight: 5 }} />
                  Cập nhật {new Date(post.createdAt).toLocaleString()}
                </Text>
              </div>

              <Divider style={{ margin: "16px 0" }} />

              {/* Thông tin người bán */}
              <Card
                bordered={false}
                style={{ backgroundColor: "#f9f9f9", borderRadius: 8 }}
                bodyStyle={{ padding: 16 }}
              >
               
                <Row gutter={8}>
                  <Col span={12}>
                    <Button
                      block
                      size="large"
                      style={{
                        background: "#52c41a",
                        borderColor: "#52c41a",
                        color: "white",
                        borderRadius: 8,
                        fontWeight: 600,
                      }}
                      href={`tel:${post.phone || ""}`}
                      disabled={!post.phone}
                    >
                      <span role="img" aria-label="call">
                        📞
                      </span>{" "}
                      {post.phone
                        ? `Gọi ${post.phone.slice(0, 6)}****`
                        : "Không có SĐT"}
                    </Button>
                  </Col>
                  <Col span={12}>
                    {/* <Button
                      block
                      size="large"
                      icon={<MessageOutlined />}
                      style={{
                        backgroundColor: "#FFD333", // Màu vàng đặc trưng của Chợ Tốt
                        borderColor: "#FFD333",
                        color: "#333",
                        borderRadius: 8,
                        fontWeight: 600,
                      }}
                    >
                      Chat
                    </Button> */}
                    <Button
                      block
                      size="large"
                      style={{
                        backgroundColor: "#FFD333", // Màu vàng đặc trưng của Chợ Tốt
                        borderColor: "#FFD333",
                        color: "#333",
                        borderRadius: 8,
                        fontWeight: 600,
                      }}
                      onClick={() => setReportOpen(true)}
                    >
                      <span role="img" aria-label="report">
                        🚨
                      </span>{" "}
                      Báo cáo tin này
                    </Button>
                  </Col>
                </Row>
              </Card>

              {/* Nút Báo cáo */}
            </Card>
            {/* Card Mô tả chi tiết (tách riêng để có khung riêng) */}
            <Card
              style={{
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
                Mô tả chi tiết
              </Title>
              <Paragraph
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "#333",
                  whiteSpace: "pre-wrap",
                }}
              >
                {post.description}
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>

      {/* REPORT MODAL */}
      <Modal
        title="Báo cáo bài viết"
        open={reportOpen}
        okText="Gửi báo cáo"
        cancelText="Hủy"
        onCancel={() => setReportOpen(false)}
        onOk={handleReport}
        okButtonProps={{
          style: {
            backgroundColor: "#f5222d",
            borderColor: "#f5222d",
            fontWeight: 600,
          },
        }}
        destroyOnClose={true}
      >
        <Text>Lý do báo cáo:</Text>
        <textarea
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          rows={4}
          placeholder="Nhập lý do báo cáo chi tiết..."
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            marginTop: 8,
            border: "1px solid #d9d9d9",
            fontSize: 14,
            resize: "vertical",
          }}
        />
      </Modal>
      <Footer /> 
    </>
  );
}
