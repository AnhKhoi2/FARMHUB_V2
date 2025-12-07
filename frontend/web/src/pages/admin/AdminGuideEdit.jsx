import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  Alert,
  Spin,
  notification,
  Modal,
  Divider,
  Typography,
  Tag,
  Tooltip,
  Image,
  message,
} from "antd";
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  FileImageOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import HeaderExpert from "../../components/shared/HeaderExpert";
import AdminLayout from "../../components/AdminLayout";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AdminGuideEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState([]);
  const [plantTags, setPlantTags] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [saved, setSaved] = useState(false);
  const duplicateCheckRef = React.useRef({ timer: null });
  const [plantName, setPlantName] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [mainFile, setMainFile] = useState(null);
  const [mainFileList, setMainFileList] = useState([]);

  const [availablePlantTags, setAvailablePlantTags] = useState([]);
  const [slugToLabelMap, setSlugToLabelMap] = useState({});
  const [labelToSlugMap, setLabelToSlugMap] = useState({});
  // create group modal state
  const [createGroupVisible, setCreateGroupVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Load plant groups from backend and map to checkbox options (label/value both = display name)
  const fetchPlantGroups = async () => {
    try {
      const res = await axiosClient.get('/api/plant-groups');
      const data = res.data?.data || [];
      const opts = [];
      const s2l = {};
      const l2s = {};
      data.forEach((d) => {
        if (!d) return;
        const name = typeof d === 'string' ? d : (d.name || d.slug || d._id);
        const slug = typeof d === 'string' ? d : (d.slug || (d._id && String(d._id)) || name);
        opts.push({ label: name, value: slug });
        s2l[slug] = name;
        l2s[name] = slug;
      });
      setAvailablePlantTags(opts);
      setSlugToLabelMap(s2l);
      setLabelToSlugMap(l2s);
      return { opts, s2l, l2s };
    } catch (e) {
      console.warn('Failed to load plant groups', e?.message || e);
      return { opts: [], s2l: {}, l2s: {} };
    }
  };

  useEffect(() => {
    fetchPlantGroups();
  }, []);

  const openCreateGroup = () => {
    setNewGroupName("");
    setCreateGroupVisible(true);
  };

  const createPlantGroup = async () => {


    if (!newGroupName || !newGroupName.trim()) {
      message.error('Vui lòng nhập tên nhóm cây');
      return;
    }
    try {
      setCreatingGroup(true);
      const payload = { name: newGroupName.trim() };

      const res = await axiosClient.post('/api/plant-groups', payload);
      toast.success('Đã tạo nhóm cây mới');
  
      setCreateGroupVisible(false);
      // refresh available groups and select the created one if slug returned
      const created = res.data?.data || res.data || null;
      await fetchPlantGroups();
      const slug = created?.slug || created?._id || created?.id || payload.slug;
      if (slug) {
        // include the new slug in plantTags selection
        setPlantTags((prev) => Array.from(new Set([slug, ...(prev || [])])));
      }
    } catch (err) {
   
    } finally {
      setCreatingGroup(false);
    }
  };

  // ==================== LOAD DỮ LIỆU ====================
  useEffect(() => {
    let mounted = true;

    const fetchGuide = async () => {
      // Ensure plant groups are loaded first so label<->slug mapping is available
      try {
        await fetchPlantGroups();
      } catch (e) {
        // ignore — fetchPlantGroups already logs
      }
      if (!id) {
        setTitle("");
        setDescription("");
        setImagePreview(null);
        setMainFileList([]);
        setSteps([
          {
            id: Date.now(),
            title: "",
            text: "",
            imagePreview: null,
            file: null,
            fileList: [],
          },
        ]);
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
        setPlantName(g.plant_name || "");
        // convert loaded plantTags (labels) to slugs for checkbox values
        const incomingTags = Array.isArray(g.plantTags) ? g.plantTags : [];
        const selSlugs = incomingTags.map((lab) => labelToSlugMap[lab] || lab);
        setPlantTags(selSlugs);

        // Ảnh chính cũ
        if (g.image) {
          setImagePreview(g.image);
          setMainFileList([
            {
              uid: "-1",
              name: "current-image.jpg",
              status: "done",
              url: g.image,
            },
          ]);
        }

        // Các bước
        const loadedSteps = Array.isArray(g.steps)
          ? g.steps.map((s) => ({
            id: Date.now() + Math.random(),
            title: s.title || "",
            text: s.text || "",
            imagePreview: s.image || null,
            file: null,
            fileList: s.image
              ? [
                {
                  uid: "-1",
                  name: "step-image.jpg",
                  status: "done",
                  url: s.image,
                },
              ]
              : [],
          }))
          : [];

        setSteps(
          loadedSteps.length > 0
            ? loadedSteps
            : [
              {
                id: Date.now(),
                title: "",
                text: "",
                imagePreview: null,
                file: null,
                fileList: [],
              },
            ]
        );
      } catch (err) {
        console.error(err);
        setError("Không thể tải hướng dẫn");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchGuide();
    return () => {
      mounted = false;
    };
  }, [id]);

  // ==================== UPLOAD ẢNH CHÍNH ====================
  const handleMainUpload = ({ fileList }) => {
    const newList = fileList.slice(-1);
    setMainFileList(newList);

    if (newList.length > 0 && newList[0].originFileObj) {
      const file = newList[0].originFileObj;
      setMainFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else if (newList.length === 0) {
      setMainFile(null);
      setImagePreview(null);
    }
  };

  // ==================== UPLOAD ẢNH TỪNG BƯỚC ====================
  const handleStepUploadChange = ({ fileList }, index) => {
    const newList = fileList.slice(-1);

    setSteps((prev) =>
      prev.map((step, i) => {
        if (i !== index) return step;

        const file = newList[0]?.originFileObj || null;
        return {
          ...step,
          file,
          fileList: newList,
          imagePreview: file ? URL.createObjectURL(file) : null,
        };
      })
    );
  };

  // ==================== THÊM / XÓA / CẬP NHẬT BƯỚC ====================
  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: "",
        text: "",
        imagePreview: null,
        file: null,
        fileList: [],
      },
    ]);
  };

  const removeStep = (index) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index, field, value) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, [field]: value } : step))
    );
  };

  // ==================== SUBMIT ====================
  const onSubmit = async () => {
    console.log("ádá");

    if (!title.trim()) return toast.error("Vui lòng nhập tiêu đề!");

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);

      // ảnh chính
      formData.append("image", mainFile || "");

      // steps
      const stepsPayload = steps.map((s) => ({
        title: s.title?.trim() || "",
        text: s.text?.trim() || "",
        image: s.file ? undefined : s.imagePreview || undefined,
      }));
      formData.append("steps", JSON.stringify(stepsPayload));

      steps.forEach((s, idx) => {
        if (s.file) formData.append(`stepImage_${idx}`, s.file);
      });

      // plantTags
      const labelsToSend = (plantTags || []).map(
        (s) => slugToLabelMap[s] || s
      );
      formData.append("plantTags", JSON.stringify(labelsToSend));

      // plant_group
      if (plantTags?.length) {
        const first = plantTags[0];
        let slug = slugToLabelMap[first] || labelToSlugMap[first] || first;
        formData.append("plant_group", slug);
      }

      formData.append("plant_name", plantName || title);

      let savedGuideId = id || null;

      // ========== UPDATE ==========
      if (id) {
        await axiosClient.put(`/guides/${id}`, formData);

        toast.success("Cập nhật hướng dẫn thành công!", {
          autoClose: 1500,
        });

        // delay nhẹ để người dùng nhìn thấy toast
        setTimeout(() => {
          navigate("/admin/managerguides", {
            state: {
              saved: true,
              page: location.state?.page || 1,
            },
          });
        }, 300);

        return;
      }

      // ========== CREATE ==========
      const res = await axiosClient.post("/guides", formData);
      const created = res.data?.data || res.data;
      savedGuideId = created?._id || created?.id || null;

      toast.success("Tạo hướng dẫn mới thành công!", {
        autoClose: 1500,
      });

      setTimeout(() => {
        navigate("/admin/managerguides", {
          state: { saved: true },
        });
      }, 300);

    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message || "Lưu thất bại, vui lòng thử lại!";
      toast.error(msg, { autoClose: 2000 });
    } finally {
      setSaving(false);
    }
  };

  // ==================== DUPLICATE CHECK (UI WARNING) ====================
  // Warn the user as soon as they type a plant name/title — search across all categories
  // if no category is selected, otherwise limit to the primary selected category.
  useEffect(() => {
    // If we're editing an existing guide (have an id), skip duplicate-name warning
    if (id) {
      setDuplicateWarning(null);
      return;
    }

    // debounce check when title, plantName or plantTags change
    if (duplicateCheckRef.current.timer) clearTimeout(duplicateCheckRef.current.timer);
    duplicateCheckRef.current.timer = setTimeout(async () => {
      setDuplicateWarning(null);
      const checkName = (plantName || title || '').trim();
      if (!checkName) return;

      const params = { plant: checkName, limit: 3 };
      const primary = Array.isArray(plantTags) && plantTags.length ? plantTags[0] : null;
      if (primary) params.category = primary;

      try {
        const res = await axiosClient.get('/guides', { params });
        const data = res.data || {};
        const docs = data.data || data.docs || data.guides || [];
        if (Array.isArray(docs) && docs.length > 0) {
          const count = docs.length;
          // collect distinct group display names for message
          const groups = Array.from(
            new Set(
              docs.map((d) => d.category || d.category_slug || (Array.isArray(d.plantTags) && d.plantTags[0]) || "Không rõ")
            )
          );
          if (primary) {
            setDuplicateWarning(`Đã tồn tại ${count} hướng dẫn tương tự trong nhóm đã chọn (${groups.join(", ")}).`);
          } else {
            setDuplicateWarning(`Đã tìm thấy ${count} hướng dẫn tương tự trong nhóm: ${groups.join(", ")}.`);
          }
        }
      } catch (e) {
        // ignore errors silently
      }
    }, 600);
    return () => {
      if (duplicateCheckRef.current.timer) clearTimeout(duplicateCheckRef.current.timer);
    };
  }, [title, plantTags, plantName]);

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spin size="large" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <>
      <AdminLayout>
        <Card
          bordered={false}
          style={{
            padding: 24,
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            borderRadius: 12,
          }}
        >
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Space direction="vertical" size={4}>
                <Title level={3} style={{ margin: 0 }}>
                  {id ? "Chỉnh sửa hướng dẫn" : "Tạo hướng dẫn mới"}
                </Title>
                <Text type="secondary">
                  {id
                    ? "Cập nhật nội dung, ảnh và các bước hướng dẫn."
                    : "Thêm hướng dẫn trồng cây mới cho người dùng."}
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
              {/* ==================== CỘT TRÁI ==================== */}
              <Col xs={24} lg={16}>
                <Card
                  title="Thông tin cơ bản"
                  size="small"
                  bordered
                  style={{ marginBottom: 24, borderRadius: 10 }}
                >
                  <Form.Item label="Tiêu đề" required>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Nhập tiêu đề..."
                    />
                  </Form.Item>

                  <Form.Item label="Mô tả ngắn">
                    <TextArea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Mô tả ngắn gọn về hướng dẫn..."
                    />
                  </Form.Item>

                  <Form.Item label="Tên cây (tùy chọn)">
                    <Input
                      value={plantName}
                      onChange={(e) => setPlantName(e.target.value)}
                      placeholder="Tên cây (ví dụ: Dâu tây)"
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span>
                        Loại cây (chọn nhiều){" "}
                        <Button
                          type="text"
                          size="small"
                          icon={<ReloadOutlined />}
                          onClick={() => fetchPlantGroups()}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => setCreateGroupVisible(true)}
                          title="Tạo nhóm cây mới"
                        />
                      </span>
                    }
                  >
                    <Checkbox.Group
                      options={availablePlantTags}
                      value={plantTags}
                      onChange={setPlantTags}
                    />
                  </Form.Item>
                  {duplicateWarning && (
                    <Alert
                      style={{ marginBottom: 12 }}
                      type="warning"
                      message={duplicateWarning}
                    />
                  )}
                </Card>

                <Card
                  title="Các bước hướng dẫn"
                  size="small"
                  bordered
                  style={{ marginBottom: 24, borderRadius: 10 }}
                >
                  <Space direction="vertical" style={{ width: "100%" }} size={16}>
                    {steps.map((step, idx) => (
                      <Card
                        key={step.id}
                        type="inner"
                        title={
                          <Space>
                            <Tag color="green">Bước {idx + 1}</Tag>
                            <Text strong>{step.title || "Chưa đặt tiêu đề"}</Text>
                          </Space>
                        }
                        extra={
                          steps.length > 1 && (
                            <Tooltip title="Xóa bước">
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => removeStep(idx)}
                              />
                            </Tooltip>
                          )
                        }
                        style={{ borderRadius: 8 }}
                      >
                        <Form.Item label="Tiêu đề bước">
                          <Input
                            value={step.title}
                            onChange={(e) =>
                              updateStep(idx, "title", e.target.value)
                            }
                            placeholder="VD: Chuẩn bị đất trồng"
                          />
                        </Form.Item>

                        <Form.Item label="Mô tả chi tiết">
                          <TextArea
                            rows={4}
                            value={step.text}
                            onChange={(e) =>
                              updateStep(idx, "text", e.target.value)
                            }
                            placeholder="Mô tả chi tiết bước này..."
                          />
                        </Form.Item>

                        <div
                          style={{
                            display: "flex",
                            gap: 16,
                            alignItems: "flex-start",
                          }}
                        >
                          <Image
                            src={step.imagePreview || placeholderImg}
                            alt="preview"
                            width={180}
                            height={130}
                            style={{
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid #f0f0f0",
                            }}
                            fallback={placeholderImg}
                          />

                          <Upload
                            listType="picture-card"
                            fileList={step.fileList}
                            onChange={(info) => handleStepUploadChange(info, idx)}
                            beforeUpload={() => false}
                            maxCount={1}
                            onRemove={() => {
                              setSteps((prev) =>
                                prev.map((s, i) =>
                                  i === idx
                                    ? {
                                      ...s,
                                      file: null,
                                      fileList: [],
                                      imagePreview: null,
                                    }
                                    : s
                                )
                              );
                            }}
                          >
                            {step.fileList.length === 0 && (
                              <div>
                                <FileImageOutlined style={{ fontSize: 20 }} />
                                <div style={{ marginTop: 8, fontSize: 12 }}>
                                  Ảnh minh họa
                                </div>
                              </div>
                            )}
                          </Upload>
                        </div>
                      </Card>
                    ))}

                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={addStep}
                      block
                      style={{ maxWidth: 300 }}
                    >
                      Thêm bước mới
                    </Button>
                  </Space>
                </Card>
              </Col>

              {/* ==================== CỘT PHẢI ==================== */}
              <Col xs={24} lg={8}>
                <Card
                  title="Ảnh minh họa chính"
                  size="small"
                  bordered
                  style={{ borderRadius: 10 }}
                >
                  <Image
                    src={imagePreview || placeholderImg}
                    alt="Ảnh chính"
                    style={{
                      width: "100%",
                      height: 240,
                      objectFit: "cover",
                      borderRadius: 10,
                      border: "1px solid #f0f0f0",
                      marginBottom: 16,
                    }}
                    fallback={placeholderImg}
                  />

                  <Upload
                    listType="picture-card"
                    fileList={mainFileList}
                    onChange={handleMainUpload}
                    beforeUpload={() => false}
                    maxCount={1}
                    onRemove={() => {
                      setMainFile(null);
                      setImagePreview(null);
                      setMainFileList([]);
                    }}
                  >
                    {mainFileList.length === 0 && (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8, fontSize: 12 }}>
                          Tải ảnh chính
                        </div>
                      </div>
                    )}
                  </Upload>
                </Card>

                <Card
                  style={{ marginTop: 24, textAlign: "center" }}
                  bordered={false}
                >
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={saving}
                      icon={<SaveOutlined />}
                      size="large"
                    >
                      {saving ? "Đang lưu..." : "Lưu hướng dẫn"}
                    </Button>
                    <Button onClick={() => navigate("/managerguides", { state: location.state || {} })} size="large">
                      Hủy
                    </Button>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Form>
        </Card>
        {/* Create group modal */}
        <Modal
          title="Tạo nhóm cây mới"
          open={createGroupVisible}
          onCancel={() => setCreateGroupVisible(false)}
          onOk={createPlantGroup}
          okText="Tạo"
          confirmLoading={creatingGroup}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Input
              placeholder="Tên nhóm (ví dụ: Rau gia vị)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
          </div>
        </Modal>
      </AdminLayout>
    </>
  );
}
