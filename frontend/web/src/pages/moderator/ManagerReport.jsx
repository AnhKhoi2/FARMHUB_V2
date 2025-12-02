import React, { useEffect, useState } from "react";
import ModeratorLayout from "../../components/ModeratorLayout";
import axiosClient from "../../api/shared/axiosClient";
import Swal from "sweetalert2";

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
    ArrowLeftOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { FiRotateCcw } from "react-icons/fi";

const { Title, Text, Paragraph } = Typography;

export default function ManagerReport() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showDetail, setShowDetail] = useState(false);
    const [current, setCurrent] = useState(null);
    const [search, setSearch] = useState("");
    const [lastDeleted, setLastDeleted] = useState(null); // { id, title, timeoutId }

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
        const result = await Swal.fire({
            title: "Xóa bài viết này?",
            text: "Bài viết này sẽ không thể hiển thị.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
        });

        if (result.isConfirmed) {
            try {
                await axiosClient.patch(`/admin/managerpost/${postId}/hide`);

                toast.success("Đã xóa bài viết");

                setShowDetail(false);
                fetchData();

                // Undo logic
                const title = (current && current.title) || "Bài viết";
                if (lastDeleted?.timeoutId) clearTimeout(lastDeleted.timeoutId);

                const timeoutId = setTimeout(() => setLastDeleted(null), 8000);
                setLastDeleted({ id: postId, title, timeoutId });

            } catch (err) {
                toast.error("Không thể xóa bài viết");
            }
        }
    };

    const onUndoDelete = async () => {
        if (!lastDeleted || !lastDeleted.id) return;
        try {
            await axiosClient.patch(`/admin/managerpost/${lastDeleted.id}/restore`);
            message.success('Hoàn tác xóa thành công');
            fetchData();
        } catch (err) {
            console.error('restore post', err);
            message.error('Hoàn tác thất bại');
        } finally {
            if (lastDeleted && lastDeleted.timeoutId) clearTimeout(lastDeleted.timeoutId);
            setLastDeleted(null);
        }
    };

    const onRestorePost = async (postId) => {
        try {
            await axiosClient.patch(`/admin/managerpost/${postId}/restore`);
            message.success('Đã khôi phục bài viết');
            // refresh list and close detail if open for that id
            fetchData();
            if (current && (current._id === postId || current._id === String(postId))) {
                setShowDetail(false);
                setCurrent(null);
            }
        } catch (err) {
            console.error('restore post', err);
            message.error('Không thể khôi phục bài viết');
        }
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

                    {item && item.isDeleted ? (
                        <Button
                            size="small"
                            icon={<FiRotateCcw size={16} />}
                            onClick={() => onRestorePost(item._id)}
                        >
                            Khôi phục
                        </Button>
                    ) : (
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => onHidePost(item._id)}
                        >
                            Xóa
                        </Button>
                    )}
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

            {/* Undo floating button after delete */}
            {lastDeleted && (
                <button
                    title={`Hoàn tác: ${lastDeleted.title}`}
                    onClick={onUndoDelete}
                    style={{
                        position: 'fixed',
                        left: 16,
                        bottom: 24,
                        zIndex: 2000,
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.12)',
                        borderRadius: 28,
                        width: 56,
                        height: 56,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeftOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                </button>
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
                item && item.isDeleted ? (
                    <Button key="restore" icon={
                        <FiRotateCcw size={16} />} onClick={() => onDelete && onRestorePost && onRestorePost(item._id)}>
                        Khôi phục
                    </Button>
                ) : (
                    <Button danger icon={<DeleteOutlined />} onClick={() => onDelete && onDelete(item._id)}>
                        Xóa bài
                    </Button>
                ),
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
