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
  Row,
  Col,
  Avatar,
} from "antd";
import {
  EnvironmentOutlined,
  HeartOutlined,
  MessageOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  // index ảnh đang được chọn
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`/admin/managerpost/public/${id}`);
        const payload = res.data?.data || res.data;
        if (!mounted) return;
        setPost(payload);
        setCurrentImageIndex(0);
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

  if (!post) {
    return null;
  }

  // Chuẩn hóa hình: luôn thành mảng
  const imagesArray = Array.isArray(post.images)
    ? post.images
    : post.images
    ? [post.images]
    : [];

  const hasImages = imagesArray.length > 0;
  const safeIndex = hasImages
    ? Math.min(currentImageIndex, imagesArray.length - 1)
    : 0;

  const handlePrevImage = () => {
    if (!hasImages) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? imagesArray.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!hasImages) return;
    setCurrentImageIndex((prev) =>
      prev === imagesArray.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <>
      <Header />
      <div style={{ maxWidth: 1200, margin: "30px auto", padding: "0 16px" }}>
        {/* Nút quay lại */}
        <Button
          type="default"
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16, fontSize: 16, color: "#1890ff" }}
        >
          Quay lại
        </Button>

        <Row gutter={[24, 24]}>
          {/* Cột trái: Hình ảnh */}
          <Col xs={24} lg={12}>
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
              bodyStyle={{ padding: 0, width: "100%" }}
            >
              {hasImages ? (
                <Image.PreviewGroup>
                  <div style={{ width: "100%", position: "relative" }}>
                    {/* Ảnh lớn hiện tại */}
                    <Image
                      src={imagesArray[safeIndex]}
                      alt={`Hình ${safeIndex + 1} của ${post.title}`}
                      style={{
                        width: "100%",
                        height: 420, // ✨ KHUNG CỐ ĐỊNH
                        objectFit: "contain", // ✨ Không méo hình, ảnh fit vào khung
                        backgroundColor: "#f5f5f5", // nền giúp nhìn ảnh nhỏ không thấy trống
                        cursor: "pointer",
                      }}
                      preview={true}
                    />

                    {/* Nút điều hướng ảnh nếu có >1 ảnh */}
                    {imagesArray.length > 1 && (
                      <>
                        {/* Prev */}
                        <button
                          type="button"
                          onClick={handlePrevImage}
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: 12,
                            transform: "translateY(-50%)",
                            borderRadius: "999px",
                            border: "none",
                            padding: "6px 10px",
                            cursor: "pointer",
                            background: "rgba(0,0,0,0.45)",
                            color: "#fff",
                            fontSize: 18,
                            lineHeight: 1,
                          }}
                        >
                          ‹
                        </button>

                        {/* Next */}
                        <button
                          type="button"
                          onClick={handleNextImage}
                          style={{
                            position: "absolute",
                            top: "50%",
                            right: 12,
                            transform: "translateY(-50%)",
                            borderRadius: "999px",
                            border: "none",
                            padding: "6px 10px",
                            cursor: "pointer",
                            background: "rgba(0,0,0,0.45)",
                            color: "#fff",
                            fontSize: 18,
                            lineHeight: 1,
                          }}
                        >
                          ›
                        </button>

                        {/* Chỉ số ảnh */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: 10,
                            right: 12,
                            backgroundColor: "rgba(0,0,0,0.55)",
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                          }}
                        >
                          {safeIndex + 1}/{imagesArray.length}
                        </div>
                      </>
                    )}

                    {/* Thumbnails tất cả ảnh */}
                    {imagesArray.length > 1 && (
                      <div
                        style={{
                          padding: 12,
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(80px, 1fr))",
                          gap: 8,
                          borderTop: "1px solid #f0f0f0",
                          background: "#fafafa",
                        }}
                      >
                        {/* {imagesArray.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            style={{
                              overflow: "hidden",
                              borderRadius: 4,
                              height: 80,
                              border:
                                idx === safeIndex
                                  ? "2px solid #1890ff"
                                  : "1px solid #f0f0f0",
                              cursor: "pointer",
                            }}
                          >
                            <Image
                              src={img}
                              alt={`Thumbnail ${idx + 1}`}
                              preview={false}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        ))} */}
                      </div>
                    )}
                  </div>
                </Image.PreviewGroup>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 260,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                  }}
                >
                  Không có hình ảnh
                </div>
              )}
            </Card>
          </Col>

          {/* Cột phải: Thông tin sản phẩm và người bán */}
          <Col xs={24} lg={12}>
            <Card
              style={{
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                marginBottom: 24,
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

              {/* Thông tin người bán + nút gọi / báo cáo */}
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
                      href={`tel:${post.posterPhone || post.phone || ""}`}
                      disabled={!post.posterPhone && !post.phone}
                    >
                      <span role="img" aria-label="call">
                        📞
                      </span>{" "}
                      {post.posterPhone || post.phone
                        ? `Gọi ${post.posterPhone || post.phone}`
                        : "Không có SĐT"}
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button
                      block
                      size="large"
                      style={{
                        backgroundColor: "#FFD333",
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
            </Card>

            {/* Card mô tả chi tiết */}
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
