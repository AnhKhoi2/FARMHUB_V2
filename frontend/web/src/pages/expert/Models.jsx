import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Drawer,
  Form,
  Input,
  Checkbox,
  Spin,
  message,
  Typography,
} from "antd";
import { useNavigate } from 'react-router-dom';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RollbackOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import axiosClient from "../../api/shared/axiosClient";
// import Header from "../../components/shared/Header"; // không dùng nữa
import HeaderExpert from "../../components/shared/HeaderExpert";

// ⬇️ Thêm import cho chat
import ChatWidget from "./ChatWidget";
import { MessageCircle } from "lucide-react";

const { TextArea } = Input;
const { Title } = Typography;

export default function ExpertModels() {
  const [items, setItems] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState("create"); // create / edit
  const [currentItem, setCurrentItem] = useState(null);
  const [form] = Form.useForm();

  const navigate = useNavigate();

  // ====== STATE CHAT ======
  const [chatOpen, setChatOpen] = useState(false);
  const handleChatClick = () => setChatOpen(true);

  // Fetch models
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/admin/models?limit=50");
      const data =
        res.data?.data?.items || res.data?.items || res.data?.data || [];
      setItems(data);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu mô hình.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch layouts
  const fetchLayouts = async () => {
    try {
      const res = await axiosClient.get("/layouts");
      const data = res.data?.data || res.data || [];
      setLayouts(data);
    } catch (err) {
      console.error("Không thể tải layouts", err);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchLayouts();
  }, []);

  const openDrawer = (type, item = null) => {
    setDrawerType(type);
    setCurrentItem(item);
    if (item) {
      form.setFieldsValue({
        ...item,
        layouts: item.layouts?.map((l) => Number(l)) || [],
      });
    } else {
      form.resetFields();
    }
    setDrawerVisible(true);
  };

  const handleDelete = async (id, isDeleted) => {
    try {
      if (isDeleted) {
        await axiosClient.patch(`/admin/models/${id}/restore`);
        message.success("Mô hình đã được hoàn tác");
      } else {
        await axiosClient.patch(`/admin/models/${id}/hide`);
        message.success("Mô hình đã xóa");
      }
      fetchItems();
    } catch (err) {
      console.error(err);
      message.error("Thao tác thất bại");
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        layouts: values.layouts.map((v) => Number(v)),
      };
      if (drawerType === "create") {
        await axiosClient.post("/admin/models", payload);
        message.success("Tạo mô hình thành công");
      } else if (drawerType === "edit" && currentItem) {
        await axiosClient.put(`/admin/models/${currentItem._id}`, payload);
        message.success("Cập nhật mô hình thành công");
      }
      setDrawerVisible(false);
      fetchItems();
    } catch (err) {
      console.error(err);
      message.error("Lưu thất bại");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "_id",
      key: "_id",
      render: (_v, _record, index) => String(index + 1).padStart(2, "0"),
    },
    {
      title: "Diện tích",
      dataIndex: "area",
      key: "area",
      sorter: (a, b) => a.area - b.area,
    },
    { title: "Đất", dataIndex: "soil", key: "soil" },
    { title: "Khí hậu", dataIndex: "climate", key: "climate" },
    { title: "Tưới", dataIndex: "irrigation", key: "irrigation" },
    {
      title: "Bố trí",
      dataIndex: "layouts",
      key: "layouts",
      render: (layoutIds) =>
        (layoutIds || []).map((id) => {
          const l = layouts.find(
            (lo) => Number(lo.layout_id) === Number(id)
          );
          return l ? (
            <Tag color="blue" key={id} style={{ marginBottom: 4 }}>
              {l.layout_name}
            </Tag>
          ) : null;
        }),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_v, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openDrawer("edit", record)}
          >
            Sửa
          </Button>
          <Button
            size="small"
            danger={!record.isDeleted}
            type={record.isDeleted ? "default" : "primary"}
            icon={record.isDeleted ? <RollbackOutlined /> : <DeleteOutlined />}
            onClick={() => handleDelete(record._id, record.isDeleted)}
          >
            {record.isDeleted ? "Hoàn tác" : "Xóa"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Header expert có nút Trò chuyện */}
      <HeaderExpert onChatClick={handleChatClick} />

      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Mô hình trồng
            </Title>
          </div>
          <div>
            <Space>
              <Button
                shape="round"
                onClick={() => fetchItems()}
                icon={<ReloadOutlined />}
              >
                Làm mới
              </Button>

              <Button
                shape="round"
                onClick={() => navigate('/experthome/models/trash')}
                icon={<DeleteOutlined />}
              >
                Thùng rác
              </Button>

              <Button
                type="primary"
                shape="round"
                icon={<PlusOutlined />}
                onClick={() => openDrawer("create")}
              >
                Tạo mới
              </Button>
            </Space>
          </div>
        </div>

        {loading ? (
          <Spin
            tip="Đang tải dữ liệu..."
            style={{ width: "100%", padding: 50 }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={items}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            bordered
            scroll={{ x: "max-content" }}
          />
        )}

            {/* Trash is now its own page at /experthome/models/trash */}

        <Drawer
          title={drawerType === "create" ? "Tạo mô hình" : "Sửa mô hình"}
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          width={720}
          bodyStyle={{ paddingBottom: 80 }}
          footer={
            <div style={{ textAlign: "right" }}>
              <Button
                onClick={() => setDrawerVisible(false)}
                style={{ marginRight: 8 }}
              >
                Hủy
              </Button>
              <Button type="primary" onClick={() => form.submit()}>
                Lưu
              </Button>
            </div>
          }
        >
          <Form layout="vertical" form={form} onFinish={handleSubmit}>
            <Form.Item
              label="Diện tích"
              name="area"
              rules={[{ required: true, message: "Nhập diện tích" }]}
            >
              <Input type="number" />
            </Form.Item>
            <Form.Item
              label="Loại đất"
              name="soil"
              rules={[{ required: true, message: "Nhập loại đất" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Khí hậu"
              name="climate"
              rules={[{ required: true, message: "Nhập khí hậu" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Tưới"
              name="irrigation"
              rules={[
                { required: true, message: "Nhập phương pháp tưới" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Mô tả" name="description">
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item
              label="Chọn 3 bố trí"
              name="layouts"
              rules={[
                {
                  required: true,
                  message: "Chọn đúng 3 bố trí",
                  type: "array",
                  len: 3,
                },
              ]}
            >
              <Checkbox.Group>
                <Space direction="vertical">
                  {layouts.map((l) => (
                    <Checkbox key={l.layout_id} value={Number(l.layout_id)}>
                      {l.layout_name} ({l.area_min}-{l.area_max} m²)
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </Form.Item>
          </Form>
        </Drawer>
      </div>

      {/* Nút chat nổi */}
      {!chatOpen && (
        <button
          className="floating-chat-btn"
          onClick={() => setChatOpen(true)}
        >
          <MessageCircle size={26} />
        </button>
      )}

      {/* Chat widget */}
      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
