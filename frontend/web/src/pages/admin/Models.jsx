import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import axiosClient from "../../api/shared/axiosClient";
import {
  Table,
  Button,
  Space,
  Tag,
  Form,
  Input,
  InputNumber,
  Select,
  Checkbox,
  Spin,
  Typography,
  Pagination,
  Row,
  Col,
  Drawer
} from "antd";
import { FiEdit, FiTrash2, FiRotateCcw } from 'react-icons/fi';
import { PlusOutlined, InboxOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Text } = Typography;

export default function AdminModels() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [current, setCurrent] = useState(null);
  const [showTrash, setShowTrash] = useState(false);
  const [layouts, setLayouts] = useState([]);

  const fetchItems = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('page', String(p));
      const res = await axiosClient.get(`/admin/models?${params.toString()}`);
      const data = res.data?.data || res.data || {};
      const tot = data.total || data.meta?.total || (data.meta?.pages ? data.meta.pages * limit : items.length);
      setItems(data);
      setTotal(Number(tot || 0));
      setPage(Number(p));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(page); }, [page]);

  useEffect(() => {
    let mounted = true;
    const fetchLayouts = async () => {
      try {
        const res = await axiosClient.get('/layouts');
        const data = res.data?.data || res.data || [];
        if (mounted) setLayouts(data || []);
      } catch (err) {
        console.error('Failed to load layouts', err);
      }
    };
    fetchLayouts();
    return () => { mounted = false; };
  }, []);

  const handleCreate = async (payload) => {
    await axiosClient.post("/admin/models", payload);
    setShowCreate(false);
    fetchItems();
  };

  const handleEdit = async (id, payload) => {
    await axiosClient.put(`/admin/models/${id}`, payload);
    setShowEdit(false);
    setCurrent(null);
    fetchItems();
  };

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      render: (_, __, idx) => (page - 1) * limit + idx + 1,
      width: 60
    },
    { title: 'Diện tích', dataIndex: 'area' },
    { title: 'Đất', dataIndex: 'soil' },
    { title: 'Khí hậu', dataIndex: 'climate' },
    { title: 'Tưới', dataIndex: 'irrigation' },
    {
      title: 'Bố trí',
      dataIndex: 'layouts',
      render: (layoutIds) => (
        <>
          {(layoutIds || []).map((id) => {
            const found = layouts.find(l => Number(l.layout_id) === Number(id));
            return found ? <Tag color="#8BC34A" key={id}>{found.layout_name}</Tag> : null;
          })}
        </>
      )
    },
    {
      title: 'Hành động',
      render: (_, record) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <button
            className="btn btn-sm btn-link"
            title="Chỉnh sửa"
            onClick={() => { setCurrent(record); setShowEdit(true); }}
            aria-label={`edit-${record._id}`}
            style={{ color: '#4CAF50', padding: 4, margin: 0, lineHeight: 1 }}
          >
            <FiEdit size={16} />
          </button>

          {!record.isDeleted ? (
            <button
              className="btn btn-sm btn-link"
              title="Xóa"
              onClick={async () => {
                try {
                  await axiosClient.patch(`/admin/models/${record._id}/hide`);
                  fetchItems();
                } catch (err) {
                  console.error(err);
                }
              }}
              aria-label={`delete-${record._id}`}
              style={{ color: '#FF4D4F', padding: 4, margin: 0, lineHeight: 1 }}
            >
              <FiTrash2 size={16} />
            </button>
          ) : (
            <button
              className="btn btn-sm btn-link"
              title="Hoàn tác"
              onClick={async () => {
                try {
                  await axiosClient.patch(`/admin/models/${record._id}/restore`);
                  fetchItems();
                } catch (err) {
                  console.error(err);
                }
              }}
              aria-label={`restore-${record._id}`}
              style={{ color: '#1890ff', padding: 4, margin: 0, lineHeight: 1 }}
            >
              <FiRotateCcw size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <AdminLayout style={{ backgroundColor: '#F9FBE7', minHeight: '100vh', padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <h3 style={{ color: '#2E7D32' }}>Mô hình trồng</h3>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50', fontWeight: 500 }}
            onClick={() => setShowCreate(true)}
          >
            Thêm mới
          </Button>
          <Button
            icon={<InboxOutlined />}
            style={{ color: '#2E7D32', borderColor: '#E0E0E0', background: '#fff' }}
            onClick={() => setShowTrash(true)}
          >
            Thùng rác
          </Button>
          
        </Space>
      </Row>

      {loading ? <Spin /> : (
        <Table
          columns={columns}
          dataSource={items}
          rowKey="_id"
          pagination={false}
        />
      )}

      <Pagination
        current={page}
        total={total}
        pageSize={limit}
        showSizeChanger={false}
        onChange={setPage}
        style={{ marginTop: 16, textAlign: 'right' }}
      />

      {/* Drawer Create */}
      <Drawer
        title="Tạo mô hình"
        placement="right"
        width={700}
        onClose={() => setShowCreate(false)}
        open={showCreate}
        bodyStyle={{ backgroundColor: '#F9FBE7' }}
      >
        <ModelDrawerForm
          layouts={layouts}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      </Drawer>

      {/* Drawer Edit */}
      <Drawer
        title="Sửa mô hình"
        placement="right"
        width={700}
        onClose={() => { setShowEdit(false); setCurrent(null); }}
        open={showEdit}
        bodyStyle={{ backgroundColor: '#F9FBE7' }}
      >
        {current && (
          <ModelDrawerForm
            layouts={layouts}
            initial={current}
            onClose={() => { setShowEdit(false); setCurrent(null); }}
            onSubmit={(data) => handleEdit(current._id, data)}
          />
        )}
      </Drawer>

      {/* Drawer Trash */}
      <Drawer
        title="Thùng rác - Mô hình đã xóa"
        placement="right"
        width={700}
        onClose={() => setShowTrash(false)}
        open={showTrash}
        bodyStyle={{ backgroundColor: '#F9FBE7' }}
      >
        <TrashDrawer onClose={() => setShowTrash(false)} />
      </Drawer>
    </AdminLayout>
  );
}

function ModelDrawerForm({ layouts = [], initial = {}, onClose, onSubmit }) {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      area: initial.area,
      soil: initial.soil,
      climate: initial.climate,
      irrigation: initial.irrigation,
      sunHours: initial.sunHours,
      sunIntensity: initial.sunIntensity,
      wind: initial.wind,
      hasRoof: initial.hasRoof,
      floorMaterial: initial.floorMaterial,
      description: initial.description,
      layouts: initial.layouts ? initial.layouts.map(l => Number(l)) : []
    });
  }, [initial]);

  const submit = () => {
    form.validateFields().then(values => {
      if (!values.layouts || values.layouts.length !== 3) {
        return Form.warning?.({ title: 'Cảnh báo', content: 'Vui lòng chọn đúng 3 cách bố trí.' });
      }
      onSubmit(values);
      onClose();
    });
  };

  return (
    <Form form={form} layout="vertical">
      <Form.Item label="Diện tích" name="area" rules={[{ required: true, message: 'Vui lòng nhập diện tích' }]}>
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item label="Loại đất" name="soil"><Input /></Form.Item>
      <Form.Item label="Khí hậu" name="climate"><Input /></Form.Item>
      <Form.Item label="Tưới" name="irrigation"><Input /></Form.Item>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="Thời gian có nắng (giờ)" name="sunHours">
            <InputNumber min={0} max={24} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Cường độ ánh sáng" name="sunIntensity">
            <Select allowClear>
              <Option value="Yếu">Yếu</Option>
              <Option value="Vừa">Vừa</Option>
              <Option value="Nắng gắt">Nắng gắt</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Mức độ gió" name="wind">
            <Select allowClear>
              <Option value="Yếu">Yếu</Option>
              <Option value="Vừa">Vừa</Option>
              <Option value="Mạnh">Mạnh</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="hasRoof" valuePropName="checked">
        <Checkbox>Có mái che</Checkbox>
      </Form.Item>
      <Form.Item label="Chất liệu nền" name="floorMaterial">
        <Select allowClear>
          <Option value="Gạch">Gạch</Option>
          <Option value="Xi măng">Xi măng</Option>
          <Option value="Gỗ">Gỗ</Option>
          <Option value="Chống thấm">Chống thấm</Option>
          <Option value="Khác">Khác</Option>
        </Select>
      </Form.Item>
      <Form.Item label="Mô tả" name="description"><Input.TextArea /></Form.Item>
      <Form.Item label="Chọn 3 bố trí tham khảo" name="layouts" rules={[{ required: true, message: 'Chọn 3 bố trí' }]}>
        <Select mode="multiple" placeholder="Chọn 3 bố trí" maxTagCount={3}>
          {layouts.map(l => <Option key={l.layout_id} value={Number(l.layout_id)}>{l.layout_name} ({l.area_min}-{l.area_max} m²)</Option>)}
        </Select>
      </Form.Item>
      <Space style={{ marginTop: 16 }}>
        <Button style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50', color: '#fff' }} onClick={submit}>Lưu</Button>
        <Button style={{ backgroundColor: '#81C784', borderColor: '#81C784', color: '#fff' }} onClick={onClose}>Hủy</Button>
      </Space>
    </Form>
  );
}

function TrashDrawer({ onClose }) {
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/admin/models/trash?limit=200');
      setTrash(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrash(); }, []);

  const handleRestore = async (id) => {
    try {
      await axiosClient.patch(`/admin/models/${id}/restore`);
      fetchTrash();
    } catch (err) {
      console.error(err);
    }
  };

  return loading ? <Spin /> : (
    <div>
      {trash.length === 0 ? <Text>Không có mô hình đã xóa</Text> : trash.map(t => (
        <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #E0E0E0' }}>
          <div>
            <Text>Diện tích: {t.area} m² — {t.soil}</Text><br />
            <Text type="secondary">{t.description}</Text>
          </div>
          <Button style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50', color: '#fff' }} onClick={() => handleRestore(t._id)}>Hoàn tác</Button>
        </div>
      ))}
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button style={{ backgroundColor: '#81C784', borderColor: '#81C784', color: '#fff' }} onClick={onClose}>Đóng</Button>
      </div>
    </div>
  );
}
