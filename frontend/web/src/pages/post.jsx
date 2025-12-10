"use client";

import { useEffect, useMemo, useState } from "react";
import axiosClient from "../api/shared/axiosClient";
import { toast } from "react-toastify";
import Footer from "../components/shared/Footer";

import {
  Button,
  Card,
  Modal,
  Drawer,
  Input,
  Select,
  Upload,
  Tag,
  Row,
  Col,
  Spin,
  Empty,
  Segmented,
  Divider,
  Pagination,
} from "antd";
import { PlusOutlined, SearchOutlined, PhoneFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Header from "../components/shared/Header";

const { TextArea } = Input;

const UI_CATEGORIES = [
  "Nông sản",
  "Hạt giống",
  "Phân bón",
  "Thiết bị",
  "Dịch vụ",
  "Trao đổi",
  "Cho tặng",
  "Khác",
];

function mapAdminPost(dto) {
  const img = dto?.images?.[0] || "/placeholder.svg";

  return {
    id: dto?._id,
    title: dto?.title || "",
    category: dto?.category || "Khác",
    price: dto?.price || dto?.priceText || "",
    phone: dto?.phone || "",
    location:
      typeof dto?.location === "string"
        ? dto.location
        : dto?.location?.address ||
          dto?.location?.city ||
          dto?.location?.province ||
          "",
    image: img,
    seller: dto?.userId?.username || "Người bán",
    createdAt: dto?.createdAt
      ? new Date(dto.createdAt).toLocaleString("vi-VN")
      : new Date().toLocaleString("vi-VN"),
    views: 0,
    status: dto?.status || "pending",
    _raw: dto,
  };
}

export default function Post() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 12; // Show 12 items per page

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "Nông sản",
    description: "",
    price: "",
    location: "",
    contactPhone: "",
  });

  // listingType: 'sell' | 'exchange' | 'giveaway' — controls price visibility and semantics
  const [listingType, setListingType] = useState("sell");

  const [uploadImages, setUploadImages] = useState([]);

  const navigate = useNavigate();

  async function fetchListings() {
    setLoading(true);
    try {
      // Build category filter - send to backend if not "Tất cả"
      const categoryFilter = selectedCategory !== "Tất cả" ? selectedCategory : undefined;
      
      const res = await axiosClient.get("/admin/managerpost/public", {
        params: { 
          q: searchQuery || undefined,
          category: categoryFilter,
          page: currentPage,
          limit: pageSize 
        },
      });

      console.log("API Response:", res?.data); // Debug log

      const raw =
        res?.data?.data?.items || res?.data?.data || res?.data || [];
      
      // Try multiple paths for total
      const total = res?.data?.data?.total || 
                    res?.data?.total || 
                    res?.data?.data?.meta?.total ||
                    res?.data?.meta?.total ||
                    0;

      console.log("Total items:", total, "Current page items:", raw.length); // Debug log

      // Only filter approved posts
      const approved = raw.filter((x) => x?.status === "approved");
      const items = approved.map(mapAdminPost);

      setListings(items);
      setTotalItems(total || items.length);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách bài đăng.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when category or search changes
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, currentPage, searchQuery]);

  // No need for client-side filtering since backend already handles search
  const filteredListings = listings;

  const handleSubmit = async () => {
    try {
      const imagesBase64 = await Promise.all(
        uploadImages.map((f) => getBase64(f.originFileObj))
      );

      await axiosClient.post("/admin/managerpost", {
        title: formData.title,
        description: formData.description,
        phone: formData.contactPhone,
        location: formData.location,
        images: imagesBase64,
        category: formData.category,
        price: formData.price,
      });

      toast.success("Bài đăng đang chờ duyệt.");
      setDrawerOpen(false);
      fetchListings();
    } catch (err) {
      toast.error("Gửi bài thất bại.");
    }
  };

  const getBase64 = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
    });

  return (
    <>
      <Header />

      <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h1 style={{ fontWeight: 700, fontSize: 26 }}>GIAO LƯU & TRAO ĐỔI</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            Đăng bài
          </Button>
        </div>

        {/* Search */}
        <Input
          size="large"
          prefix={<SearchOutlined />}
          placeholder="Tìm kiếm bài đăng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: 16 }}
          allowClear
        />

        {/* Filter */}
        <Segmented
          block
          options={["Tất cả", ...UI_CATEGORIES]}
          value={selectedCategory}
          onChange={setSelectedCategory}
          style={{ marginBottom: 20 }}
        />

        {/* List */}
        {loading ? (
          <Spin size="large" />
        ) : filteredListings.length === 0 ? (
          <Empty description="Không có bài đăng" />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {filteredListings.map((item) => (
                <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                  <Card
                    hoverable
                    style={{ height: '100%' }}
                    bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 16 }}
                    cover={
                      <img
                        src={item.image || '/default-plant.png'}
                        alt=""
                        style={{ height: 180, objectFit: 'cover', width: '100%' }}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default-plant.png'; }}
                      />
                    }
                    onClick={() => navigate(`/posts/${item.id}`)}
                  >
                    <Tag
                      color="green"
                      style={{
                        padding: '0 6px',
                        margin: 0,
                        fontSize: 12,
                        alignSelf: 'flex-start',
                        height: 22,
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      {item.category}
                    </Tag>

                    <h3 className="clamp-2" style={{ fontWeight: 700, fontSize: 16 }}>
                      {item.title}
                    </h3>

                    <p className="market-card-price" style={{ margin: '6px 0', fontWeight: 600, color: '#059669' }}>
                      {item.price ? `${item.price} VNĐ` : 'Giá liên hệ'}
                    </p>

                    <p className="clamp-2" style={{ margin: 0 }}>{item.location}</p>

                    <div style={{ marginTop: 'auto' }}>
                      <Divider style={{ margin: '8px 0' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666' }}>
                        <span>{item.seller}</span>
                        <span>{item.createdAt}</span>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, marginBottom: 24 }}>
              <Pagination
                current={currentPage}
                total={totalItems}
                pageSize={pageSize}
                onChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                showSizeChanger={false}
                showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} bài đăng`}
              />
            </div>
          </>
        )}
      </div>

      {/* Drawer - Đăng bài */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={500}
        title="Đăng bài mới"
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Loại bài</label>
          <Select
            value={listingType}
            onChange={(v) => {
              setListingType(v);
              // set category according to the chosen type
              if (v === "exchange") setFormData((p) => ({ ...p, category: "Trao đổi", price: "" }));
              else if (v === "giveaway") setFormData((p) => ({ ...p, category: "Cho tặng", price: "" }));
              else setFormData((p) => ({ ...p, category: p.category || "Nông sản" }));
            }}
            options={[
              { label: "Bán", value: "sell" },
              { label: "Trao đổi", value: "exchange" },
              { label: "Cho tặng", value: "giveaway" },
            ]}
            dropdownMatchSelectWidth={false}
            dropdownStyle={{ minWidth: 220 }}
          />
        </div>

        <Input
          style={{ marginBottom: 12 }}
          placeholder="Tiêu đề"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
        />

        <Select
          style={{ width: "100%", marginBottom: 12 }}
          value={formData.category}
          onChange={(v) => setFormData({ ...formData, category: v })}
          options={UI_CATEGORIES.map((c) => ({
            label: c,
            value: c,
          }))}
          dropdownMatchSelectWidth={false}
          dropdownStyle={{ minWidth: 240 }}
        />

        {/* Price only shown for selling items */}
        {listingType === "sell" ? (
          <Input
            style={{ marginBottom: 12 }}
            placeholder="Giá"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
          />
        ) : (
          <div style={{ marginBottom: 12, color: '#4b5563' }}>
            <em>Không cần nhập giá cho mục Trao đổi hoặc Cho tặng.</em>
          </div>
        )}

        <TextArea
          rows={4}
          placeholder="Mô tả"
          style={{ marginBottom: 12 }}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />

        <Input
          style={{ marginBottom: 12 }}
          placeholder="Địa điểm"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
        />

        <Input
          style={{ marginBottom: 12 }}
          placeholder="Số điện thoại"
          value={formData.contactPhone}
          onChange={(e) =>
            setFormData({ ...formData, contactPhone: e.target.value })
          }
        />

        <Upload
          listType="picture-card"
          fileList={uploadImages}
          onChange={({ fileList }) => setUploadImages(fileList)}
          beforeUpload={() => false}
        >
          {uploadImages.length >= 5 ? null : "+ Ảnh"}
        </Upload>

        <Button
          type="primary"
          block
          style={{ marginTop: 16 }}
          onClick={handleSubmit}
        >
          Đăng bài
        </Button>
      </Drawer>
      <Footer /> 
    </>
  );
}
