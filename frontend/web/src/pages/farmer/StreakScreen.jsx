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
} from "antd";
import axiosClient from "../../api/shared/axiosClient";
import Header from "../../components/shared/Header";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;

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

export default function StreakScreen() {
  const [streakInfo, setStreakInfo] = useState(null);
  const currentRef = useRef(null);
  const user = useSelector((state) => state.auth.user);

  const fetchStreak = async () => {
    try {
      const res = await axiosClient.get("/admin/streaks/me");
      setStreakInfo(res.data.data.item);
    } catch {
      message.error("Không tải được streak.");
    }
  };
  // write switch case for streak levels them hinh

  const getStreakLevel = (streak) => {
    switch (true) {
      case streak >= 369:
        return { title: "Người Giữ Rừng", icon: "/streak/forest.png" };
      case streak >= 300:
        return { title: "Bậc Thầy (Vườn Tược)", icon: "/streak/master.png" };
      case streak >= 200:
        return { title: "Chuyên Gia (Bonsai)", icon: "/streak/bonsai.png" };
      case streak >= 150:
        return { title: "Nghệ Nhân", icon: "/streak/craft.png" };
      case streak >= 100:
        return { title: "Thợ Vườn", icon: "/streak/tree.png" };
      case streak >= 76:
        return { title: "Mát Tay", icon: "/streak/tree-small.png" };
      case streak >= 42:
        return { title: "Tay Chăm", icon: "/streak/plant.png" };
      case streak >= 22:
        return { title: "Bạn Của Đất", icon: "/streak/sprout.png" };
      case streak >= 11:
        return { title: "Người Gieo", icon: "/streak/seed.png" };
      default:
        return { title: "Mới Bắt Đầu", icon: "/streak/none.png" };
    }
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

  if (!streakInfo) return <Text>Đang tải...</Text>;

  const currentStreak = streakInfo.current_streak;
  const maxStreak = streakLevels[streakLevels.length - 1].point;
  const currentLevel =
    streakLevels.filter((lv) => lv.point <= currentStreak).slice(-1)[0] ||
    streakLevels[0];

  return (
    <>
      <Header />
      <Card
        style={{
          maxWidth: "100%",
          borderRadius: 20,
          padding: "40px 30px",
          background: "linear-gradient(145deg, #fff3e0, #e0f7fa)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <Title
          level={2}
          style={{ color: "#ff6f00", textShadow: "1px 1px 2px #fff" }}
        >
          Chuỗi ngày siêng năng
        </Title>
        {/* hiện streak theo current streak */}
        <img
          src={getStreakLevel(currentStreak).icon}
          alt={getStreakLevel(currentStreak).title}
          style={{
            display: "block",
            margin: "0 auto 20px",
            width: 150,
            height: 150,
            borderRadius: "50%",
          }}
        />
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <Text style={{ fontSize: 16, color: "#555" }}>
            Cấp độ hiện tại của bạn:
          </Text>
          <Button
            type="primary"
            style={{
              display: "block",
              margin: "0 auto 20px",
              backgroundColor: "#ff6f00",
              borderColor: "#ff6f00",
              fontWeight: "bold",
              marginBottom: 20,
            }}
          >
            {getStreakLevel(currentStreak).title}
          </Button>
        </div>
        <div
          style={{
            textAlign: "center",
            marginBottom: 30,
            fontSize: 18,
            color: "#333",
          }}
        >
          {user.username.toUpperCase()}, bạn đã duy trì chuỗi siêng năng được{" "}
          <strong>{currentStreak} ngày</strong> liên tiếp! Hãy tiếp tục phát huy
          nhé!
        </div>
        {/* Vòng tròn current streak */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 25,
          }}
        >
          <Progress
            type="line"
            percent={Math.min((currentStreak / maxStreak) * 100, 100)}
            format={() => (
              <div
                style={{ fontSize: 32, fontWeight: "bold", color: "#ff6f00" }}
              >
                {currentStreak}
                <div style={{ fontSize: 14, fontWeight: 400 }}>ngày</div>
              </div>
            )}
            strokeWidth={16}
            strokeColor={{
              "0%": "#ffe57f",
              "100%": "#ff6f00",
            }}
            width={180}
          />
        </div>
        {/* Các mốc danh hiệu */}
        <div>
          <Title level={3} style={{ color: "#00796b", marginBottom: 20 }}>
            Các mốc tiếp theo
          </Title>
          <Row gutter={[20, 20]} justify="center">
            {streakLevels.map((lv) => {
              const isReached = currentStreak >= lv.point;
              const isCurrent = lv.point === currentLevel.point;

              return (
                <Col key={lv.point}>
                  <Badge
                    count={lv.point}
                    style={{
                      backgroundColor: isCurrent
                        ? "#ff6f00"
                        : isReached
                        ? "#69f0ae"
                        : "#ccc",
                      color: "white",
                      fontSize: 14,
                      minWidth: 28,
                      height: 28,
                    }}
                  >
                    <div
                      ref={isCurrent ? currentRef : null}
                      style={{
                        width: 150,
                        height: 150,
                        borderRadius: "50%",
                        border: isCurrent
                          ? "3px solid #ff6f00"
                          : "1px solid #ddd",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        backgroundColor: "#fff",
                        padding: 8,
                        boxShadow: isCurrent
                          ? "0 0 15px rgba(255,111,0,0.5)"
                          : "0 3px 6px rgba(0,0,0,0.1)",
                        transition: "transform 0.3s",
                      }}
                    >
                      {lv.icon && (
                        <img
                          src={lv.icon}
                          alt={lv.title}
                          style={{
                            width: 50,
                            height: 50,
                            marginBottom: 6,
                            borderRadius: "50%",
                          }}
                        />
                      )}
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isCurrent
                            ? "#ff6f00"
                            : isReached
                            ? "#00796b"
                            : "#999",
                          textAlign: "center",
                        }}
                      >
                        {lv.title}
                      </Text>
                    </div>
                  </Badge>
                </Col>
              );
            })}
          </Row>
        </div>
      </Card>
    </>
  );
}
