import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  Progress,
  Row,
  Col,
  Typography,
  message,
  Badge,
  Button,
  Spin, // Thêm Spin để thay thế Text "Đang tải"
} from "antd";
import axiosClient from "../../api/shared/axiosClient";
import Header from "../../components/shared/Header";
import { useSelector } from "react-redux";
import { FireFilled, TrophyFilled } from "@ant-design/icons"; // Thêm icon


const { Title, Text } = Typography;

// Giữ nguyên level streak
const streakLevels = [
  { point: 0, title: "Mới Bắt Đầu", icon: "/streak/none.png" },
  { point: 11, title: "Người Gieo", icon: "/streak/seed.png" },
  { point: 22, title: "Bạn Của Đất", icon: "/streak/sprout.png" },
  { point: 42, title: "Tay Chăm", icon: "/streak/plant.png" },
  { point: 76, title: "Mát Tay", icon: "/streak/tree-small.png" },
  { point: 100, title: "Thợ Vườn", icon: "/streak/tree.png" },
  { point: 150, title: "Nghệ Nhân", icon: "/streak/craft.png" },
  { point: 200, title: "Chuyên Gia (Bonsai)", icon: "/streak/bonsai.png" },
  { point: 300, title: "Bậc Thầy (Vườn Tược)", icon: "/streak/master.png" },
  { point: 369, title: "Người Giữ Rừng", icon: "/streak/forest.png" },
];

// Định nghĩa màu sắc Chợ Tốt cơ bản
const CHOTOT_GREEN = "#00b25e"; // Màu xanh lá cây chủ đạo của Chợ Tốt
const CHOTOT_GREY_LIGHT = "#f8f8f8"; // Màu nền nhẹ

export default function StreakScreen() {
  const [streakInfo, setStreakInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentRef = useRef(null);
  const user = useSelector((state) => state.auth.user);

  const fetchStreak = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/admin/streaks/me");
      const item = res?.data?.data?.item ?? { current_streak: 0, max_streak: 0 };
      setStreakInfo(item);
    } catch (err) {
      message.error("Không tải được streak.");
      setStreakInfo({ current_streak: 0, max_streak: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getStreakLevel = (streak) => {
    for (let i = streakLevels.length - 1; i >= 0; i--) {
      if (streak >= streakLevels[i].point) {
        return streakLevels[i];
      }
    }
    return streakLevels[0];
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [streakInfo]);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" tip="Đang tải..." />
      </div>
    );

  const currentStreak = Number(streakInfo.current_streak || 0);
  const maxStreak = streakLevels[streakLevels.length - 1].point;
  const currentLevel = getStreakLevel(currentStreak);
  const nextLevelIndex = streakLevels.findIndex(
    (lv) => lv.point > currentStreak
  );
  const nextLevel =
    nextLevelIndex !== -1
      ? streakLevels[nextLevelIndex]
      : { point: maxStreak, title: "Đã đạt cấp độ tối đa" };

  // Tính toán phần trăm thanh tiến trình
  const prevLevelPoint = currentLevel.point;
  const nextLevelPoint = nextLevel.point;
  let progressPercent = 0;
  if (nextLevelPoint > prevLevelPoint) {
    progressPercent =
      ((currentStreak - prevLevelPoint) / (nextLevelPoint - prevLevelPoint)) *
      100;
  } else if (currentStreak >= maxStreak) {
    progressPercent = 100;
  }

  return (
    <>
      <Header />
      <div style={{ padding: 15, backgroundColor: CHOTOT_GREY_LIGHT }}>
        <Card
          bordered={false}
          style={{
            maxWidth: 700,
            margin: "20px auto",
            borderRadius: 8,
            padding: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <Title level={3} style={{ color: CHOTOT_GREEN, marginBottom: 5 }}>
              <FireFilled style={{ marginRight: 8 }} />
              Chuỗi Ngày Siêng Năng
            </Title>
            <Text style={{ color: "#777" }}>
              Tiếp tục duy trì để đạt được các danh hiệu cao hơn!
            </Text>
          </div>

          {/* Vùng thông tin Streak hiện tại */}
          <Row gutter={16} align="middle" style={{ marginBottom: 30 }}>
            <Col xs={24} sm={8} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img
                src={currentLevel.icon}
                alt={currentLevel.title}
                style={{
                  width: 100,
                  height: 100,
                  objectFit: "cover",
                  borderRadius: "50%",
                  border: `3px solid ${CHOTOT_GREEN}`,
                  padding: 3,
                  marginBottom: 10,
                }}
              />
              <Text strong style={{ color: CHOTOT_GREEN, fontSize: 16 }}>
                {currentLevel.title}
              </Text>
            </Col>
            <Col xs={24} sm={16}>
              <Text type="secondary" style={{ display: "block", marginBottom: 5 }}>
                Chuỗi hiện tại:
              </Text>
              <Title level={1} style={{ margin: 0, color: CHOTOT_GREEN }}>
                {currentStreak}
                <span style={{ fontSize: 20, fontWeight: 400, marginLeft: 5 }}>
                  ngày
                </span>
              </Title>
              <Text type="secondary" style={{ display: "block", marginTop: 10 }}>
                Kỷ lục cá nhân: **{streakInfo.max_streak || 0} ngày**
              </Text>
              <Text type="secondary" style={{ display: "block" }}>
                Chào mừng,{" "}
                <Text strong style={{ color: CHOTOT_GREEN }}>
                  {user?.username ? user.username.toUpperCase() : "Bạn"}
                </Text>
                !
              </Text>
            </Col>
          </Row>

          {/* Thanh Tiến Trình Level Tiếp Theo */}
          {currentStreak < maxStreak && (
            <div
              style={{
                background: CHOTOT_GREY_LIGHT,
                padding: "15px",
                borderRadius: 8,
                marginBottom: 30,
              }}
            >
              <Text style={{ fontWeight: 600, color: "#333" }}>
                Tiến trình lên cấp {nextLevel.title} (
                {nextLevel.point - currentStreak} ngày nữa)
              </Text>
              <Progress
                percent={progressPercent}
                showInfo={false}
                strokeColor={CHOTOT_GREEN}
                trailColor="#e0e0e0"
                style={{ margin: "5px 0" }}
              />
              <Row justify="space-between">
                <Text style={{ fontSize: 12, color: "#666" }}>
                  {currentLevel.point} ngày
                </Text>
                <Text style={{ fontSize: 12, color: "#666" }}>
                  {nextLevel.point} ngày
                </Text>
              </Row>
            </div>
          )}

          {/* Danh sách các mốc danh hiệu */}
          <Title level={4} style={{ color: "#333", borderBottom: "1px solid #eee", paddingBottom: 10 }}>
            <TrophyFilled style={{ marginRight: 8, color: CHOTOT_GREEN }} />
            Các Mốc Danh Hiệu
          </Title>
          <Row gutter={[16, 16]} justify="center">
            {streakLevels.map((lv) => {
              const isReached = currentStreak >= lv.point;
              const isCurrent = lv.point === currentLevel.point;

              return (
                <Col
                  xs={12}
                  sm={8}
                  md={6}
                  key={lv.point}
                  style={{ textAlign: "center" }}
                >
                  <div
                    ref={isCurrent ? currentRef : null}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: isCurrent
                        ? `2px solid ${CHOTOT_GREEN}`
                        : "1px solid #ddd",
                      backgroundColor: isCurrent
                        ? "#e6ffed"
                        : isReached
                        ? "#f0f0f0"
                        : "#fff",
                      opacity: isReached ? 1 : 0.6,
                      transition: "all 0.3s",
                      boxShadow: isCurrent ? "0 0 8px rgba(0,178,94,0.3)" : "none",
                    }}
                  >
                    <Badge
                      count={lv.point === 0 ? "Bắt đầu" : lv.point + " ngày"}
                      style={{
                        backgroundColor: isCurrent ? CHOTOT_GREEN : isReached ? "#95de64" : "#bfbfbf",
                        color: "white",
                        fontSize: 12,
                        marginBottom: 10,
                      }}
                    />
                    <img
                      src={lv.icon}
                      alt={lv.title}
                      style={{
                        width: 40,
                        height: 40,
                        display: "block",
                        margin: "0 auto 5px",
                      }}
                    />
                    <Text
                      strong
                      style={{
                        fontSize: 13,
                        color: isCurrent
                          ? CHOTOT_GREEN
                          : isReached
                          ? "#333"
                          : "#999",
                        display: "block",
                      }}
                    >
                      {lv.title}
                    </Text>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>
      </div>
      
    </>
  );
}