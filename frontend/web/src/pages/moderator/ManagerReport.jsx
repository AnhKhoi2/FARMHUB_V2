import React, { useEffect, useState } from "react";
import ModeratorLayout from "../../components/ModeratorLayout";
import axiosClient from "../../api/shared/axiosClient";

import {
    Card,
    Table,
    Typography,
    Button,
    Tag,
    Space,
    Modal,
    List,
    Spin,
    message,
    Flex,
    Input,
} from "antd";

import {
    WarningOutlined,
    EyeOutlined,
    StopOutlined,
    ReloadOutlined,
    DeleteOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function ManagerReport() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showDetail, setShowDetail] = useState(false);
    const [current, setCurrent] = useState(null);
    const [search, setSearch] = useState("");

    const fetchData = async (q) => {
        setLoading(true);
        try {
            const params = {};
            if (q && String(q).trim()) params.q = q.trim();
            const res = await axiosClient.get("/admin/managerpost/reported", { params });
            const data = res.data?.data || res.data || [];
            setItems(Array.isArray(data) ? data : data.items || []);
        } catch (err) {
            message.error("Không thể tải danh sách báo cáo");
            setItems([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onViewReports = async (postId) => {
        try {
            const res = await axiosClient.get(`/admin/managerpost/${postId}/reports`);
            const data = res.data?.data || res.data || {};
            setCurrent({
                ...data.postOwner,
                reports: data.reports,
                _id: postId,
            });
            setShowDetail(true);
        } catch (err) {
            message.error("Không thể tải báo cáo chi tiết");
        }
    };

    const onHidePost = async (postId) => {
        Modal.confirm({
            title: "Xóa bài viết này?",
            content: "Bài viết sẽ được đưa vào thùng rác.",
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    await axiosClient.patch(`/admin/managerpost/${postId}/hide`);
                    message.success("Đã xóa bài viết");
                    setShowDetail(false);
                    fetchData();
                } catch (err) {
                    message.error("Không thể xóa bài viết");
                }
            },
        });
    };

    const columns = [
        {
            title: "STT",
            width: 70,
            render: (_, __, idx) => idx + 1,
        },
        {
            title: "Tiêu đề",
            dataIndex: "title",
            width: 300,
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: "Người đăng",
            render: (item) =>
                item.userId?.username || item.userId?.email || "—",
        },
        {
            title: "Số báo cáo",
            render: (item) => (
                <Tag color="red">{item.reports?.length || 0}</Tag>
            ),
        },
        {
            title: "Ngày cập nhật",
            dataIndex: "updatedAt",
            render: (d) => (d ? new Date(d).toLocaleString() : "—"),
        },
        {
            title: "",
            render: (item) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => onViewReports(item._id)}
                    >
                        Xem báo cáo
                    </Button>

                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onHidePost(item._id)}
                    >
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <ModeratorLayout>
            <Card style={{ padding: 16 }}>
                <Flex justify="space-between" align="center">
                    <div>
                        <Title level={3} style={{ margin: 0 }}>
                            Báo cáo vi phạm
                        </Title>
                        <Text type="secondary">
                            Danh sách bài viết bị người dùng báo cáo
                        </Text>
                    </div>

                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <Input.Search
                            placeholder="Tìm kiếm tiêu đề hoặc người đăng..."
                            allowClear
                            enterButton
                            style={{ width: 360 }}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                if (e.target.value === "") fetchData("");
                            }}
                            onSearch={(val) => fetchData(val)}
                        />

                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={() => fetchData(search)}
                        >
                            Làm mới
                        </Button>
                    </div>
                </Flex>

                <Table
                    className="mt-3"
                    rowKey="_id"
                    dataSource={items}
                    columns={columns}
                    loading={loading}
                    pagination={false}
                    size="middle"
                />
            </Card>

            {showDetail && current && (
                <DetailModal
                    open={showDetail}
                    item={current}
                    onClose={() => {
                        setShowDetail(false);
                        setCurrent(null);
                    }}
                    onDelete={onHidePost}
                />
            )}
        </ModeratorLayout>
    );
}

function DetailModal({ open, item, onClose, onDelete }) {
    return (
        <Modal
            open={open}
            title="Báo cáo chi tiết"
            onCancel={onClose}
            footer={[
                <Button key="close" onClick={onClose}>
                    Đóng
                </Button>,
                <Button danger icon={<DeleteOutlined />} onClick={() => onDelete && onDelete(item._id)}>
                    Xóa bài
                </Button>,
            ]}
            width={700}
        >
            <Card bordered={false}>
                {item.title && (
                    <Title level={4} style={{ marginTop: 0 }}>
                        {item.title}
                    </Title>
                )}

                {item.userId && (
                    <Paragraph>
                        <strong>Người đăng:</strong>{" "}
                        {item.userId?.username || item.userId?.email}
                    </Paragraph>
                )}

                {item.description && (
                    <>
                        <strong>Mô tả:</strong>
                        <Paragraph>{item.description}</Paragraph>
                    </>
                )}

                <Title level={5} style={{ marginTop: 20 }}>
                    Báo cáo ({item.reports?.length})
                </Title>

                <List
                    itemLayout="vertical"
                    dataSource={item.reports}
                    renderItem={(r) => (
                        <List.Item>
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <Text strong>
                                    {r.userId?.username ||
                                        r.userId?.email ||
                                        "Người dùng"}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {new Date(r.createdAt).toLocaleString()}
                                </Text>

                                <Text type="secondary">{r.reason}</Text>
                                <Paragraph>{r.message}</Paragraph>
                            </Space>
                        </List.Item>
                    )}
                />
            </Card>
        </Modal>
    );
}
