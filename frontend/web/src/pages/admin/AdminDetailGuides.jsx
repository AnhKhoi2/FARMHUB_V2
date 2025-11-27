import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";
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
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import placeholderImg from "../../assets/placeholder.svg";
import AdminLayout from "../../components/AdminLayout";

const { Title, Text } = Typography;

export default function AdminDetailGuides() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <AdminLayout>
      <Flex vertical gap={20} style={{ padding: 24 }}>
        {/* HEADER */}
        <Flex justify="space-between" align="center">
          <Button
            size="small"
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            title="Quay lại"
          />

          <Flex gap={10}>
            <Button
              size="small"
              type="text"
              icon={<EditOutlined style={{ color: "#4CAF50" }} />}
              onClick={() => navigate(`/managerguides/edit/${guide._id}`)}
              title="Chỉnh sửa"
            />

            <Button
              size="small"
              type="text"
              icon={<UnorderedListOutlined style={{ color: "#2E7D32" }} />}
              onClick={() => navigate("/managerguides")}
              title="Danh sách"
            />
          </Flex>
        </Flex>

        {/* MAIN CARD */}
        <Card bordered>
          <Flex vertical gap={10}>
            <Title level={2}>{guide.title}</Title>

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
                <Title level={3}>Các bước thực hiện</Title>

                <Row gutter={[16, 16]}>
                  {guide.steps.map((s, idx) => (
                    <Col xs={24} sm={12} md={8} key={idx}>
                      <Card hoverable>
                        <Flex vertical gap={12}>
                          <Title level={5}>Bước {idx + 1}</Title>

                          <img
                            src={s.image || placeholderImg}
                            style={{
                              width: "100%",
                              height: 160,
                              objectFit: "cover",
                              borderRadius: 8,
                            }}
                          />

                          <Text strong>{s.title || `Bước ${idx + 1}`}</Text>

                          <div
                            dangerouslySetInnerHTML={{
                              __html: s.text || "",
                            }}
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
      </Flex>
    </AdminLayout>
  );
}
