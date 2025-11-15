import React, { useEffect, useState } from "react";
import axiosClient from "../../api/shared/axiosClient";
import ModeratorLayout from "../../components/ModeratorLayout";

import {
    Row,
    Col,
    Card,
    Typography,
    Button,
    Skeleton,
    Space,
    Flex,
} from "antd";

import {
    FileTextOutlined,
    WarningOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export default function ModeratorHome() {
    const [loading, setLoading] = useState(true);
    const [postCount, setPostCount] = useState(0);
    const [reportCount, setReportCount] = useState(0);

    useEffect(() => {
        let mounted = true;

        const fetchCounts = async () => {
            try {
                const [pRes, rRes] = await Promise.all([
                    axiosClient.get("/admin/managerpost?limit=1"),
                    axiosClient.get("/admin/managerpost/reported?limit=1"),
                ]);

                if (!mounted) return;

                const pTotal =
                    pRes?.data?.data?.meta?.total ||
                    pRes?.data?.data?.total ||
                    pRes?.data?.meta?.total ||
                    0;

                const rTotal =
                    rRes?.data?.data?.meta?.total ||
                    rRes?.data?.data?.total ||
                    rRes?.data?.meta?.total ||
                    0;

                setPostCount(pTotal);
                setReportCount(rTotal);
            } catch (err) {
                console.warn("ModeratorHome: failed to fetch counts", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchCounts();
        return () => (mounted = false);
    }, []);

    return (
        <ModeratorLayout>
            <div style={{ padding: 24 }}>
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Bảng điều khiển Moderator
                    </Title>
                    <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                        Tổng quan nội dung và báo cáo vi phạm từ người dùng.
                    </Paragraph>
                </Space>

                <Row gutter={[16, 16]}>
                    {/* Bài viết */}
                    <Col xs={24} sm={12} md={6}>
                        <Card hoverable>
                            {loading ? (
                                <Skeleton
                                    active
                                    title={{ width: 100 }}
                                    paragraph={{ rows: 2, width: ["70%", "80%"] }}
                                />
                            ) : (
                                <>
                                    <Flex align="center" gap={12}>
                                        <div
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 8,
                                                background: "#e6f4ff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <FileTextOutlined style={{ fontSize: 20, color: "#1677ff" }} />
                                        </div>

                                        <div>
                                            <Text type="secondary">Bài viết</Text>
                                            <Title level={2} style={{ margin: "6px 0 0" }}>
                                                {postCount}
                                            </Title>
                                        </div>
                                    </Flex>

                                    <Paragraph type="secondary" style={{ marginTop: 12 }}>
                                        Tổng số bài viết cần kiểm duyệt / quản lý
                                    </Paragraph>
                                </>
                            )}

                            <Button
                                type="primary"
                                size="small"
                                href="/moderator/managerpost"
                            >
                                Quản lý bài viết
                            </Button>
                        </Card>
                    </Col>

                    {/* Báo cáo */}
                    <Col xs={24} sm={12} md={6}>
                        <Card hoverable>
                            {loading ? (
                                <Skeleton
                                    active
                                    title={{ width: 120 }}
                                    paragraph={{ rows: 2, width: ["70%", "80%"] }}
                                />
                            ) : (
                                <>
                                    <Flex align="center" gap={12}>
                                        <div
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 8,
                                                background: "#fff1f0",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <WarningOutlined style={{ fontSize: 20, color: "#cf1322" }} />
                                        </div>

                                        <div>
                                            <Text type="secondary">Báo cáo</Text>
                                            <Title level={2} style={{ margin: "6px 0 0" }}>
                                                {reportCount}
                                            </Title>
                                        </div>
                                    </Flex>

                                    <Paragraph type="secondary" style={{ marginTop: 12 }}>
                                        Lượt báo cáo vi phạm từ người dùng
                                    </Paragraph>
                                </>
                            )}

                            <Button
                                type="primary"
                                size="small"
                                href="/moderator/managerreport"
                            >
                                Xem báo cáo
                            </Button>
                        </Card>
                    </Col>
                </Row>
            </div>
        </ModeratorLayout>
    );
}
