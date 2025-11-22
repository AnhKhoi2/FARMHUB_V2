// import React, { useEffect, useState } from "react";
// import ModeratorLayout from "../../components/ModeratorLayout";
// import axiosClient from "../../api/shared/axiosClient";

// import {
// 	Table,
// 	Button,
// 	Space,
// 	Tag,
// 	Typography,
// 	Pagination,
// 	Modal,
// 	List,
// 	Spin,
// 	message,
// 	Input,
// 	Card,
// } from "antd";

// import {
// 	EyeOutlined,
// 	CheckOutlined,
// 	CloseOutlined,
// 	DeleteOutlined,
// 	UndoOutlined,
// 	WarningOutlined,
// 	StopOutlined,
// 	ReloadOutlined,
// } from "@ant-design/icons";

// const { Title, Text, Paragraph } = Typography;

// export default function ManagerPost() {
// 	const [items, setItems] = useState([]);
// 	const [loading, setLoading] = useState(true);
// 	const [page, setPage] = useState(1);
// 	const [limit] = useState(10);
// 	const [total, setTotal] = useState(0);
// 	const [search, setSearch] = useState("");

// 	const [showTrash, setShowTrash] = useState(false);
// 	const [showReports, setShowReports] = useState(false);
// 	const [showDetail, setShowDetail] = useState(false);
// 	const [current, setCurrent] = useState(null);

// 	const fetchItems = async (p = page) => {
// 		setLoading(true);
// 		try {
// 			const params = { limit, page: p };
// 			if (search) params.q = search;

// 			let res = await axiosClient.get("/admin/managerpost", { params });

// 			const data = res.data?.data || res.data || {};
// 			const list = data.items || data.data?.items || data.docs || [];
// 			const tot = data.total || data.meta?.total || 0;

// 			setItems(list);
// 			setTotal(Number(tot));
// 			setPage(Number(p));
// 		} catch (err) {
// 			message.error("Không thể tải danh sách bài viết");
// 		}
// 		setLoading(false);
// 	};

// 	useEffect(() => {
// 		fetchItems(page);
// 	}, [page]);

// 	const handleHide = async (id) => {
// 		try {
// 			await axiosClient.patch(`/admin/managerpost/${id}/hide`);
// 			message.success("Đã chuyển vào thùng rác");
// 			fetchItems();
// 		} catch {
// 			message.error("Không thể xóa bài viết");
// 		}
// 	};

// 	const handleRestore = async (id) => {
// 		try {
// 			await axiosClient.patch(`/admin/managerpost/${id}/restore`);
// 			message.success("Đã khôi phục");
// 			fetchItems();
// 		} catch {
// 			message.error("Không thể hoàn tác");
// 		}
// 	};

// 	const changeStatus = async (id, status) => {
// 		try {
// 			await axiosClient.patch(`/admin/managerpost/${id}/status`, { status });
// 			message.success("Đã cập nhật trạng thái");
// 			fetchItems();
// 		} catch {
// 			message.error("Không thể cập nhật");
// 		}
// 	};

// 	const columns = [
// 		{
// 			title: "STT",
// 			dataIndex: "index",
// 			width: 60,
// 			align: "center",
// 			render: (_, __, idx) => (page - 1) * limit + idx + 1,
// 		},
// 		{
// 			title: "Tiêu đề",
// 			dataIndex: "title",
// 			render: (text) => <Text strong>{text}</Text>,
// 		},
// 		{
// 			title: "Người đăng",
// 			dataIndex: "userId",
// 			render: (u) => u?.username || u?.email || "—",
// 		},
// 		{
// 			title: "SĐT",
// 			dataIndex: "phone",
// 			render: (t) => t || "—",
// 		},
// 		{
// 			title: "Địa điểm",
// 			dataIndex: "location",
// 			render: (l) => l?.address || "—",
// 		},
// 		{
// 			title: "Ngày",
// 			dataIndex: "createdAt",
// 			render: (d) => (d ? new Date(d).toLocaleString() : "—"),
// 		},
// 		{
// 			title: "Trạng thái",
// 			dataIndex: "status",
// 			render: (s) => (
// 				<Tag color={s === "approved" ? "green" : s === "rejected" ? "volcano" : "default"}>
// 					{s}
// 				</Tag>
// 			),
// 		},
// 		{
// 			title: "Hành động",
// 			width: 280,
// 			render: (_, it) => (
// 				<Space wrap>
// 					<Button
// 						size="small"
// 						icon={<EyeOutlined />}
// 						onClick={() => {
// 							setCurrent(it);
// 							setShowDetail(true);
// 						}}
// 					>
// 						Xem
// 					</Button>

// 					{it.status !== "approved" && (
// 						<Button
// 							size="small"
// 							type="primary"
// 							icon={<CheckOutlined />}
// 							onClick={() => changeStatus(it._id, "approved")}
// 						>
// 							Duyệt
// 						</Button>
// 					)}

// 					{it.status !== "rejected" && (
// 						<Button size="small" icon={<CloseOutlined />} onClick={() => changeStatus(it._id, "rejected")}>
// 							Từ chối
// 						</Button>
// 					)}

// 					{!it.isDeleted ? (
// 						<Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleHide(it._id)}>
// 							Xóa
// 						</Button>
// 					) : (
// 						<Button size="small" icon={<UndoOutlined />} type="dashed" onClick={() => handleRestore(it._id)}>
// 							Hoàn tác
// 						</Button>
// 					)}
// 				</Space>
// 			),
// 		},
// 	];

// 	return (
// 		<ModeratorLayout>
// 			<div style={{ padding: 24 }}>
// 				<Card
// 					style={{
// 						borderRadius: 14,
// 						padding: 20,
// 						marginBottom: 16,
// 						boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
// 					}}
// 				>
// 					<Space direction="vertical" style={{ width: "100%" }}>
// 						<Title level={3} style={{ marginBottom: 0 }}>
// 							Quản lý bài viết
// 						</Title>
// 						<Text type="secondary">Moderator kiểm duyệt & xử lý bài đăng</Text>

// 						<Space style={{ marginTop: 12 }} wrap>
// 							<Input.Search
// 								placeholder="Tìm tiêu đề hoặc người đăng..."
// 								allowClear
// 								size="large"
// 								style={{ width: 340 }}
// 								value={search}
// 								onChange={(e) => setSearch(e.target.value)}
// 								onSearch={() => fetchItems(1)}
// 							/>

// 							<Button icon={<WarningOutlined />} onClick={() => setShowReports(true)}>
// 								Báo cáo
// 							</Button>

// 							<Button onClick={() => setShowTrash(true)}>Thùng rác</Button>

// 							<Button type="primary" icon={<ReloadOutlined />} onClick={() => fetchItems()}>
// 								Làm mới
// 							</Button>
// 						</Space>
// 					</Space>
// 				</Card>

// 				<Card style={{ borderRadius: 14, boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
// 					<Table
// 						rowKey="_id"
// 						dataSource={items}
// 						columns={columns}
// 						loading={loading}
// 						pagination={false}
// 						size="middle"
// 					/>

// 					<Space style={{ marginTop: 16, width: "100%", justifyContent: "space-between" }}>
// 						<Text type="secondary">Tổng: {total} mục</Text>

// 						<Pagination
// 							size="small"
// 							current={page}
// 							total={total}
// 							pageSize={limit}
// 							showSizeChanger={false}
// 							onChange={(p) => setPage(p)}
// 						/>
// 					</Space>
// 				</Card>

// 				<TrashModal open={showTrash} onClose={() => setShowTrash(false)} onRestore={handleRestore} />
// 				<ReportsModal
// 					open={showReports}
// 					onClose={() => setShowReports(false)}
// 					onViewReports={(id) => {}}
// 					onBanUser={(id) => {}}
// 				/>
// 				<DetailModal open={showDetail} item={current} onClose={() => setShowDetail(false)} />
// 			</div>
// 		</ModeratorLayout>
// 	);
// }
