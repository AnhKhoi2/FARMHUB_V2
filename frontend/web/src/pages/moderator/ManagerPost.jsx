import React, { useEffect, useState } from "react";
import ModeratorLayout from "../../components/ModeratorLayout";
import axiosClient from "../../api/shared/axiosClient";

import {
    Table,
    Button,
    Space,
    Tag,
    Typography,
    Pagination,
    Modal,
    List,
    Spin,
    message,
    Input,
    Select,
    Tooltip,
    Badge
} from "antd";

import {
    EyeOutlined,
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    UndoOutlined,
    WarningOutlined,
    StopOutlined,
    ReloadOutlined,
    FilterOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function ManagerPost() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState(""); // NEW: filter trạng thái

    const [showTrash, setShowTrash] = useState(false);
    const [showReports, setShowReports] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [current, setCurrent] = useState(null);

    const fetchItems = async (p = page) => {
        setLoading(true);
        try {
            const params = { limit, page: p };
            if (search) params.q = search;
            if (status) params.status = status;

            let res;
            try {
                res = await axiosClient.get("/admin/managerpost", { params });
            } catch (e) {
                res = await axiosClient.get("/admin/managerpost/public", { params });
            }

            const data = res.data?.data || res.data || {};
            const list = data.items || data.docs || [];
            const tot = data.total || data.meta?.total || list.length;

            setItems(list);
            setTotal(Number(tot || 0));
            setPage(p);
        } catch (err) {
            console.error("Load posts failed", err);
            message.error("Không thể tải danh sách bài viết");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems(1);
        // eslint-disable-next-line
    }, [status]);

    const changeStatus = async (id, status) => {
        try {
            await axiosClient.patch(`/admin/managerpost/${id}/status`, { status });
            message.success("Cập nhật thành công");
            fetchItems();
        } catch (err) {
            console.error(err);
            message.error("Không thể thay đổi trạng thái");
        }
    };

    const handleHide = async (id) => {
        try {
            await axiosClient.patch(`/admin/managerpost/${id}/hide`);
            message.success("Đã chuyển bài vào thùng rác");
            fetchItems();
        } catch {
            message.error("Không thể xóa");
        }
    };

    const handleRestore = async (id) => {
        try {
            await axiosClient.patch(`/admin/managerpost/${id}/restore`);
            message.success("Đã khôi phục");
            fetchItems();
        } catch {
            message.error("Không thể hoàn tác");
        }
    };

    /* ------------------------- COLUMNS ------------------------- */
    const columns = [
        {
            title: "STT",
            dataIndex: "index",
            width: 60,
            render: (_, __, idx) => (
                <Badge count={(page - 1) * limit + idx + 1} color="#1890ff" />
            ),
        },
        {
            title: "Tiêu đề",
            dataIndex: "title",
            sorter: (a, b) => a.title.localeCompare(b.title),
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: "Người đăng",
            dataIndex: "userId",
            render: (user) => (
                <Tag color="blue">{user?.username || user?.email || "—"}</Tag>
            ),
        },
        {
            title: "Điện thoại",
            dataIndex: "phone",
            render: (phone) => <Text>{phone || "—"}</Text>,
        },
        {
            title: "Địa điểm",
            dataIndex: "location",
            render: (loc) => <Text>{loc?.address || "—"}</Text>,
        },
        {
            title: "Ngày đăng",
            dataIndex: "createdAt",
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            render: (date) => new Date(date).toLocaleString(),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            filters: [
                { text: "Đã duyệt", value: "approved" },
                { text: "Từ chối", value: "rejected" },
                { text: "Chờ duyệt", value: "pending" },
            ],
            onFilter: (val, record) => record.status === val,
            render: (status) => {
                const map = {
                    approved: "green",
                    rejected: "volcano",
                    pending: "geekblue",
                };
                return <Tag color={map[status]}>{status}</Tag>;
            },
        },
        {
            title: "Hành động",
            render: (_, it) => (
                <Space wrap size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => {
                                setCurrent(it);
                                setShowDetail(true);
                            }}
                        />
                    </Tooltip>

                    {it.status !== "approved" && (
                        <Tooltip title="Duyệt bài">
                            <Button
                                size="small"
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => changeStatus(it._id, "approved")}
                            />
                        </Tooltip>
                    )}

                    {it.status !== "rejected" && (
                        <Tooltip title="Từ chối">
                            <Button
                                size="small"
                                danger
                                icon={<CloseOutlined />}
                                onClick={() => changeStatus(it._id, "rejected")}
                            />
                        </Tooltip>
                    )}

                    {!it.isDeleted ? (
                        <Tooltip title="Đưa vào thùng rác">
                            <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleHide(it._id)}
                            />
                        </Tooltip>
                    ) : (
                        <Tooltip title="Khôi phục">
                            <Button
                                size="small"
                                icon={<UndoOutlined />}
                                onClick={() => handleRestore(it._id)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    /* ------------------------- RETURN UI ------------------------- */
    return (
        <ModeratorLayout>
            <div style={{ padding: 24 }}>
                {/* Header */}
                <Space
                    style={{ width: "100%", marginBottom: 20 }}
                    align="center"
                    justify="space-between"
                >
                    <div>
                        <Title level={3} style={{ margin: 0 }}>
                            Quản lý bài viết
                        </Title>
                        <Text type="secondary">
                            Kiểm duyệt – xử lý báo cáo – quản lý nội dung
                        </Text>
                    </div>

                    <Space>
                        <Input.Search
                            placeholder="Tìm kiếm bài viết..."
                            allowClear
                            size="middle"
                            style={{ width: 260 }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onSearch={() => fetchItems(1)}
                        />

                        <Select
                            value={status}
                            onChange={(v) => setStatus(v)}
                            placeholder="Lọc trạng thái"
                            allowClear
                            style={{ width: 160 }}
                            suffixIcon={<FilterOutlined />}
                        >
                            <Option value="pending">Chờ duyệt</Option>
                            <Option value="approved">Đã duyệt</Option>
                            <Option value="rejected">Từ chối</Option>
                        </Select>

                        <Button
                            icon={<WarningOutlined />}
                            onClick={() => setShowReports(true)}
                        >
                            Báo cáo
                        </Button>

                        <Button onClick={() => setShowTrash(true)}>
                            Thùng rác
                        </Button>

                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={() => fetchItems()}
                        >
                            Làm mới
                        </Button>
                    </Space>
                </Space>

                {/* TABLE */}
                <Table
                    rowKey="_id"
                    dataSource={items}
                    columns={columns}
                    loading={loading}
                    pagination={false}
                    size="middle"
                    bordered
                    scroll={{ x: 1100 }}
                    style={{ borderRadius: 12 }}
                />

                {/* FOOTER PAGINATION */}
                <Space
                    style={{
                        marginTop: 16,
                        width: "100%",
                        justifyContent: "space-between",
                    }}
                >
                    <Text type="secondary">Tổng: {total} mục</Text>
                    <Pagination
                        size="small"
                        current={page}
                        total={total}
                        pageSize={limit}
                        showSizeChanger={false}
                        onChange={(p) => setPage(p)}
                    />
                </Space>

                {/* MODALS */}
                <TrashModal open={showTrash} onClose={() => setShowTrash(false)} onRestore={handleRestore} />
                <ReportsModal open={showReports} onClose={() => setShowReports(false)} setCurrent={setCurrent} setShowDetail={setShowDetail} />
                <DetailModal open={showDetail} item={current} onClose={() => setShowDetail(false)} />
            </div>
        </ModeratorLayout>
    );
}

/* -------------------------------------------------------------------
 * TRASH MODAL
 * ------------------------------------------------------------------- */
function TrashModal({ open, onClose, onRestore }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get("/admin/managerpost/trash");
            setItems(res.data?.data || []);
        } catch {
            message.error("Không thể tải thùng rác");
        }
        setLoading(false);
    };

    useEffect(() => {
        if (open) fetch();
    }, [open]);

    return (
        <Modal
            open={open}
            title="Thùng rác - Bài viết"
            onCancel={onClose}
            footer={<Button onClick={onClose}>Đóng</Button>}
            width={700}
        >
            {loading ? (
                <Spin />
            ) : items.length === 0 ? (
                <Paragraph>Không có bài đã xóa</Paragraph>
            ) : (
                <List
                    itemLayout="horizontal"
                    dataSource={items}
                    renderItem={(t) => (
                        <List.Item
                            actions={[
                                <Button
                                    key="restore"
                                    type="primary"
                                    size="small"
                                    icon={<UndoOutlined />}
                                    onClick={() => {
                                        onRestore(t._id);
                                        fetch();
                                    }}
                                >
                                    Khôi phục
                                </Button>,
                            ]}
                        >
                            <List.Item.Meta
                                title={<strong>{t.title}</strong>}
                                description={
                                    <Text type="secondary">{t?.description}</Text>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </Modal>
    );
}

/* -------------------------------------------------------------------
 * REPORTS MODAL
 * ------------------------------------------------------------------- */
function ReportsModal({ open, onClose, setCurrent, setShowDetail }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get("/admin/managerpost/reported");
            setItems(res.data?.data || []);
        } catch {
            message.error("Không thể tải danh sách báo cáo");
        }
        setLoading(false);
    };

    useEffect(() => {
        if (open) fetch();
    }, [open]);

    return (
        <Modal
            open={open}
            title="Danh sách bài bị báo cáo"
            onCancel={onClose}
            footer={<Button onClick={onClose}>Đóng</Button>}
            width={800}
        >
            {loading ? (
                <Spin />
            ) : items.length === 0 ? (
                <Paragraph>Không có bài nào bị báo cáo</Paragraph>
            ) : (
                <List
                    dataSource={items}
                    renderItem={(p) => (
                        <List.Item
                            actions={[
                                <Button
                                    key="view"
                                    size="small"
                                    type="link"
                                    icon={<EyeOutlined />}
                                    onClick={() => {
                                        setCurrent(p);
                                        setShowDetail(true);
                                        onClose();
                                    }}
                                >
                                    Xem
                                </Button>,
                                <Button
                                    key="ban"
                                    size="small"
                                    type="primary"
                                    danger
                                    icon={<StopOutlined />}
                                    onClick={async () => {
                                        if (!window.confirm("Cấm user này?")) return;
                                        try {
                                            await axiosClient.patch(`/admin/managerpost/${p._id}/ban-user`);
                                            message.success("User đã bị cấm");
                                            fetch();
                                        } catch {
                                            message.error("Không thể cấm user");
                                        }
                                    }}
                                >
                                    Cấm user
                                </Button>
                            ]}
                        >
                            <List.Item.Meta
                                title={<strong>{p.title}</strong>}
                                description={
                                    <Text type="secondary">
                                        {p?.reports?.length || 0} báo cáo
                                    </Text>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </Modal>
    );
}

/* -------------------------------------------------------------------
 * DETAIL MODAL
 * ------------------------------------------------------------------- */
function DetailModal({ open, item, onClose }) {
    if (!item) return null;

    const user = item.userId;
    const username = user?.username || user?.email;

    return (
        <Modal
            open={open}
            title="Chi tiết bài đăng"
            onCancel={onClose}
            width={700}
            footer={<Button onClick={onClose}>Đóng</Button>}
        >
            <Title level={5}>{item.title}</Title>

            <Paragraph>
                <strong>Người đăng:</strong> {username}
            </Paragraph>

            {item.phone && (
                <Paragraph>
                    <strong>Điện thoại:</strong> {item.phone}
                </Paragraph>
            )}

            {item.description && (
                <>
                    <strong>Mô tả:</strong>
                    <Paragraph>{item.description}</Paragraph>
                </>
            )}

            {/* Reports */}
            {item.reports && item.reports.length > 0 && (
                <>
                    <Title level={5}>
                        Báo cáo ({item.reports.length})
                    </Title>

                    <List
                        dataSource={item.reports}
                        renderItem={(r) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={`${r.userId?.username || r.userId?.email}`}
                                    description={r.reason}
                                />
                                <div>{r.message}</div>
                            </List.Item>
                        )}
                    />
                </>
            )}
        </Modal>
    );
}
