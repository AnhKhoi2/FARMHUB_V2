import React, { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";
import Footer from "../../components/shared/Footer";
import {
  Card,
  Button,
  Tag,
  Flex,
  Typography,
  Spin,
  Divider,
  Row,
  Col,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import placeholderImg from "../../assets/placeholder.svg";
import DetailFooter from "../../components/shared/DetailFooter";
import HeaderExpert from "../../components/shared/HeaderExpert";

const { Title, Text } = Typography;

export default function GuideDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stepModalVisible, setStepModalVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(null);

  useEffect(() => {
    axiosClient
      .get(`/guides/${id}`)
      .then((res) => setGuide(res.data.data || res.data))
      .catch(() => setGuide(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <Flex justify="center" align="center" style={{ marginTop: 50 }}>
        <Spin size="large" />
      </Flex>
    );

  if (!guide)
    return (
      <Flex justify="center" align="center" style={{ marginTop: 40 }}>
        <Text type="danger" strong>
          Không tìm thấy hướng dẫn.
        </Text>
      </Flex>
    );

  return (
    <>
      <HeaderExpert />
      <Flex vertical gap={20} style={{ padding: 24 }}>
        {/* HEADER */}
        <Flex justify="space-between" align="center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              // If current URL has search params, go back to manager list with those params
              const qs =
                location.search ||
                (searchParams.toString() ? `?${searchParams.toString()}` : "");
              if (qs) {
                navigate(`/managerguides${qs}`);
                return;
              }

              // Prefer navigation state if present
              if (
                location.state &&
                (location.state.page || location.state.category)
              ) {
                navigate("/managerguides", { state: location.state });
                return;
              }

              // Otherwise, infer category from guide and go to page 1
              const inferredCategory =
                guide?.plant_group ||
                (Array.isArray(guide?.plantTags) && guide.plantTags[0]) ||
                "";
              const params = [];
              if (inferredCategory)
                params.push(`category=${encodeURIComponent(inferredCategory)}`);
              params.push("page=1");
              navigate(`/managerguides?${params.join("&")}`);
            }}
          >
            Quay lại
          </Button>

          <Flex gap={10}>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() =>
                navigate(`/managerguides/edit/${guide._id}`, {
                  state: location.state || {},
                })
              }
            >
              Chỉnh sửa
            </Button>

            <Button
              icon={<UnorderedListOutlined />}
              onClick={() =>
                navigate("/managerguides", { state: location.state || {} })
              }
            >
              Danh sách
            </Button>
          </Flex>
        </Flex>

        {/* MAIN CARD */}
        <Card bordered>
          <Flex vertical gap={10}>
            <Title level={2}>{(guide.title || "").toUpperCase()}</Title>

            <Flex gap={8} wrap>
              <Text>
                Tác giả: <b>{guide.expert_id?.username || "Không rõ"}</b>
              </Text>
              <Text type="secondary">•</Text>
              <Text type="secondary">
                {new Date(guide.createdAt).toLocaleString()}
              </Text>
            </Flex>

            {/* TAGS */}
            {guide.plantTags?.length > 0 && (
              <Flex gap={6} wrap>
                {guide.plantTags.map((t) => (
                  <Tag color="green" key={t}>
                    {t}
                  </Tag>
                ))}
              </Flex>
            )}

            <Divider />

            {/* MAIN CONTENT */}
            {guide.image && (
              <img
                src={guide.image}
                alt="guide"
                style={{
                  width: "100%",
                  borderRadius: 10,
                  marginBottom: 20,
                }}
              />
            )}

            <div
              dangerouslySetInnerHTML={{
                __html: guide.content || guide.summary || "",
              }}
            />

            <Divider />

            {/* STEPS */}
            {guide.steps?.length > 0 && (
              <Flex vertical gap={16}>
                <Title level={3}>CÁC BƯỚC THỰC HIỆN</Title>

                <Row gutter={[16, 16]}>
                  {guide.steps.map((s, idx) => (
                    <Col
                      xs={24}
                      sm={12}
                      md={8}
                      key={idx}
                      style={{ display: "flex" }}
                    >
                      <Card
                        hoverable
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <Flex vertical gap={12} style={{ flex: 1 }}>
                          <Title level={5}>{`BƯỚC ${idx + 1}`}</Title>

                          <img
                            src={s.image || placeholderImg}
                            style={{
                              width: "100%",
                              height: 160,
                              objectFit: "cover",
                              borderRadius: 8,
                            }}
                          />

                          <Text strong>
                            {(s.title || `BƯỚC ${idx + 1}`).toUpperCase()}
                          </Text>

                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setActiveStep(s);
                              setStepModalVisible(true);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                setActiveStep(s);
                                setStepModalVisible(true);
                              }
                            }}
                            style={{
                              // clamp to single line with ellipsis
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              cursor: "pointer",
                            }}
                            dangerouslySetInnerHTML={{ __html: s.text || "" }}
                          />
                        </Flex>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Flex>
            )}
          </Flex>
        </Card>
        {/* Step detail modal */}
        <Modal
          title={
            activeStep ? (
              <span style={{ fontWeight: 700 }}>
                {(activeStep.title || "BƯỚC").toUpperCase()}
              </span>
            ) : (
              "CHI TIẾT BƯỚC"
            )
          }
          open={stepModalVisible}
          onCancel={() => setStepModalVisible(false)}
          footer={null}
          width={720}
        >
          {activeStep ? (
            <div>
              {activeStep.image && (
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={activeStep.image}
                    alt={activeStep.title}
                    style={{ width: "100%", borderRadius: 6 }}
                  />
                </div>
              )}
              <div
                dangerouslySetInnerHTML={{
                  __html: activeStep.text || activeStep.description || "",
                }}
              />
            </div>
          ) : (
            <p>Không có nội dung</p>
          )}
        </Modal>
        {/* Detail-only footer */}
        <DetailFooter />
      </Flex>

      <Footer />
    </>
  );
}
