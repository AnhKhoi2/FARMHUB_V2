import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";
import placeholderImg from "../../assets/placeholder.svg";
import {
  Form,
  Input,
  Button,
  Upload,
  Card,
  Row,
  Col,
  Space,
  Checkbox,
  Spin,
  message,
  Divider,
  Typography,
  Tag,
  Tooltip,
} from "antd";
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  FileImageOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function GuideEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState([]);
  const [plantTags, setPlantTags] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [file, setFile] = useState(null);

  const availablePlantTags = [
    "Rau củ dễ chăm",
    "Trái cây ngắn hạn",
    "Cây gia vị",
    "Trồng trong chung cư",
    "Ít thời gian chăm sóc",
    "Cây leo nhỏ",
  ];

  useEffect(() => {
    let mounted = true;
    const fetchGuide = async () => {
      if (!id) {
        setTitle("");
        setDescription("");
        setImagePreview(null);
        setSteps([{ title: "", text: "", imagePreview: null, file: null }]);
        setPlantTags([]);
        setLoading(false);
        return;
      }

      try {
        const res = await axiosClient.get(`/guides/${id}`);
        const g = res.data.data || res.data;
        if (!mounted) return;
        setTitle(g.title || "");
        setDescription(g.description || "");
        setImagePreview(g.image || placeholderImg);

        const loadedSteps =
          g.steps && Array.isArray(g.steps)
            ? g.steps.map((s) => ({
                title: s.title || "",
                text: s.text || "",
                imagePreview: s.image || null,
                file: null,
              }))
            : [];

        setSteps(
          loadedSteps.length
            ? loadedSteps
            : [{ title: "", text: "", imagePreview: null, file: null }]
        );
        setPlantTags(g.plantTags || []);
      } catch (err) {
        console.warn(err);
        setError("Không thể tải hướng dẫn");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchGuide();
    return () => (mounted = false);
  }, [id]);

  const handleMainUpload = (info) => {
    const f = info?.file?.originFileObj;
    if (f) {
      setFile(f);
      setImagePreview(URL.createObjectURL(f));
    }
  };

  const handleStepUpload = (info, index) => {
    const f = info?.file?.originFileObj;
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        file: f,
        imagePreview: f ? URL.createObjectURL(f) : copy[index].imagePreview,
      };
      return copy;
    });
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { title: "", text: "", imagePreview: null, file: null },
    ]);
  };

  const removeStep = (index) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index, field, value) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const onSubmit = async () => {
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("description", description);
      if (file) form.append("image", file);
      const stepsPayload = steps.map((s) => ({
        title: s.title,
        text: s.text,
        image: s.imagePreview,
      }));
      form.append("steps", JSON.stringify(stepsPayload));
      steps.forEach((s, idx) => {
        if (s.file) form.append(`stepImage_${idx}`, s.file);
      });
      form.append("plantTags", JSON.stringify(plantTags));

      if (id) {
        await axiosClient.put(`/guides/${id}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axiosClient.post("/guides", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      message.success("Lưu hướng dẫn thành công");
      navigate("/managerguides");
    } catch (err) {
      console.warn(err);
      message.error("Lưu thất bại");
      setError("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: 60 }}>
        <Spin size="large" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );

  return (
    <Card
      bordered={false}
      style={{
        padding: 24,
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        borderRadius: 12,
      }}
    >
      <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
        <Col>
          <Space direction="vertical" size={2}>
            <Title level={3} style={{ margin: 0 }}>
              {id ? "✏️ Chỉnh sửa hướng dẫn" : "🪴 Tạo hướng dẫn mới"}
            </Title>
            <Text type="secondary">
              {id
                ? "Cập nhật nội dung, ảnh minh họa và các bước hướng dẫn chi tiết."
                : "Thêm hướng dẫn gieo trồng mới cho người dùng."}
            </Text>
          </Space>
        </Col>
        <Col>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </Col>
      </Row>

      <Divider />

      {error && (
        <Card type="inner" style={{ marginBottom: 16 }} title="Lỗi">
          <Text type="danger">{error}</Text>
        </Card>
      )}

      <Form layout="vertical" onFinish={onSubmit}>
        <Row gutter={24}>
          {/* LEFT SIDE */}
          <Col xs={24} lg={16}>
            <Card
              title="🌱 Thông tin cơ bản"
              size="small"
              bordered={true}
              style={{
                marginBottom: 24,
                borderRadius: 10,
              }}
            >
              <Form.Item label="Tiêu đề" required>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề hướng dẫn..."
                />
              </Form.Item>

              <Form.Item label="Mô tả ngắn">
                <TextArea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập mô tả ngắn gọn..."
                />
              </Form.Item>

              <Form.Item label="Loại cây (chọn)">
                <Checkbox.Group
                  options={availablePlantTags}
                  value={plantTags}
                  onChange={(v) => setPlantTags(v)}
                />
              </Form.Item>
            </Card>

            <Card
              title="📋 Các bước hướng dẫn"
              size="small"
              bordered={true}
              style={{
                marginBottom: 24,
                borderRadius: 10,
              }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                {steps.map((step, idx) => (
                  <Card
                    key={idx}
                    type="inner"
                    title={
                      <Space>
                        <Tag color="green">Bước {idx + 1}</Tag>
                        <Text strong>{step.title || "Chưa đặt tiêu đề"}</Text>
                      </Space>
                    }
                    extra={
                      <Tooltip title="Xóa bước này">
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeStep(idx)}
                        />
                      </Tooltip>
                    }
                    style={{
                      borderRadius: 8,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <Form.Item label="Tiêu đề bước">
                      <Input
                        value={step.title}
                        onChange={(e) =>
                          updateStep(idx, "title", e.target.value)
                        }
                        placeholder="Nhập tiêu đề..."
                      />
                    </Form.Item>

                    <Form.Item label="Mô tả chi tiết">
                      <TextArea
                        rows={3}
                        value={step.text}
                        onChange={(e) =>
                          updateStep(idx, "text", e.target.value)
                        }
                        placeholder="Nhập mô tả cho bước này..."
                      />
                    </Form.Item>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                      }}
                    >
                      <img
                        src={step.imagePreview || placeholderImg}
                        alt="preview"
                        style={{
                          width: 120,
                          height: 80,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #f0f0f0",
                        }}
                      />
                      <Upload
                        beforeUpload={() => false}
                        showUploadList={false}
                        onChange={(info) => handleStepUpload(info, idx)}
                        accept="image/*"
                      >
                        <Button icon={<FileImageOutlined />}>
                          Chọn ảnh minh họa
                        </Button>
                      </Upload>
                    </div>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={addStep}
                  style={{ width: 200, borderRadius: 8 }}
                >
                  Thêm bước mới
                </Button>
              </Space>
            </Card>
          </Col>

          {/* RIGHT SIDE */}
          <Col xs={24} lg={8}>
            <Card
              title="Ảnh minh họa chính"
              size="small"
              bordered={true}
              style={{
                textAlign: "center",
                borderRadius: 10,
              }}
            >
              <img
                src={imagePreview || placeholderImg}
                alt="preview"
                style={{
                  width: "100%",
                  height: 220,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid #f0f0f0",
                  marginBottom: 12,
                }}
              />
              <Upload
                beforeUpload={() => false}
                showUploadList={false}
                onChange={handleMainUpload}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Tải ảnh chính</Button>
              </Upload>
            </Card>

            <Card
              style={{ marginTop: 20, borderRadius: 10 }}
              bordered={false}
              bodyStyle={{ textAlign: "center" }}
            >
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  icon={<SaveOutlined />}
                  style={{ minWidth: 140 }}
                >
                  {saving ? "Đang lưu..." : "Lưu hướng dẫn"}
                </Button>
                <Button onClick={() => navigate("/managerguides")}>
                  Hủy
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
