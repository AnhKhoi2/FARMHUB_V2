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
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Header from "../components/shared/Header";

const { TextArea } = Input;
// const countWords = (text) => {
//   return text.trim().split(/\s+/).filter(Boolean).length;
// };

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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const initialFormData = {
    title: "",
    category: "Nông sản",
    description: "",
    price: "",
    location: "",
    contactPhone: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  // listingType: 'sell' | 'exchange' | 'giveaway'
  const [listingType, setListingType] = useState("sell");

  const [uploadImages, setUploadImages] = useState([]);

  // Lưu lỗi validate
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();

  async function fetchListings() {
    setLoading(true);
    try {
      const res = await axiosClient.get("/admin/managerpost/public", {
        params: { q: searchQuery || undefined, limit: 50 },
      });

      const raw = res?.data?.data?.items || res?.data?.data || res?.data || [];

      const approved = raw.filter((x) => x?.status === "approved");
      let items = approved.map(mapAdminPost);

      if (selectedCategory !== "Tất cả") {
        items = items.filter((x) => x.category === selectedCategory);
      }

      setListings(items);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách bài đăng.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const q = searchQuery.toLowerCase();
    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) || l.seller.toLowerCase().includes(q)
    );
  }, [searchQuery, listings]);

  // Chỉ chấp nhận file hình ảnh
  const handleBeforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      toast.error("Chỉ cho phép tải lên tệp hình ảnh (jpg, png, ...)");
      return Upload.LIST_IGNORE;
    }

    // const isLt5M = file.size / 1024 / 1024 < 5;
    // if (!isLt5M) {
    //   toast.error("Hình ảnh phải nhỏ hơn 5MB.");
    //   return Upload.LIST_IGNORE;
    // }

    // return false để antd không tự upload (mình tự handle bằng base64)
    return false;
  };
  // const descWords = countWords(formData.description);
  const validateForm = () => {
    const errors = {};

    // Tiêu đề bắt buộc
    if (!formData.title.trim()) {
      errors.title = "Tiêu đề là bắt buộc.";
    }

    // Mô tả bắt buộc

    // if (!formData.description.trim()) {
    //   errors.description = "Mô tả là bắt buộc.";
    // } else if (descWords > 250) {
    //   errors.description = "Mô tả không được vượt quá 250 từ.";
    // }

    if (!formData.description.trim()) {
  errors.description = "Mô tả là bắt buộc.";
} else if (formData.description.length > 250) {
  errors.description = "Mô tả không được vượt quá 250 ký tự.";
}

    // Giá chỉ bắt buộc khi loại bài là "sell"
    if (listingType === "sell") {
      const priceStr = formData.price?.toString().trim();
      if (!priceStr) {
        errors.price = "Giá bán là bắt buộc.";
      } else if (!/^\d+$/.test(priceStr)) {
        errors.price = "Giá chỉ được chứa chữ số (VNĐ).";
      } else if (Number(priceStr) <= 0) {
        errors.price = "Giá phải lớn hơn 0 VNĐ.";
      }
    }

    // Số điện thoại bắt buộc & đúng định dạng VN
    if (!formData.contactPhone.trim()) {
      errors.contactPhone = "Số điện thoại là bắt buộc.";
    } else {
      const phone = formData.contactPhone.trim();
      // 0xxxxxxxxx (10 số) hoặc +84xxxxxxxxx
      const phoneRegex = /^(0\d{9}|\+84\d{9})$/;
      if (!phoneRegex.test(phone)) {
        errors.contactPhone =
          "Số điện thoại không đúng định dạng. Ví dụ: 0912345678 hoặc +84912345678.";
      }
    }

    // Ít nhất 1 hình ảnh
    if (!uploadImages || uploadImages.length === 0) {
      errors.images = "Vui lòng tải lên ít nhất 1 hình ảnh.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getBase64 = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
    });

  const handleSubmit = async () => {
    // Validate trước khi gửi
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại các thông tin bị lỗi.");
      return;
    }

    try {
      const imagesBase64 = await Promise.all(
        uploadImages.map((f) => getBase64(f.originFileObj))
      );

      // Giá gửi lên backend (chỉ khi Bán)
      const pricePayload =
        listingType === "sell" ? Number(formData.price.toString().trim()) : "";

      await axiosClient.post("/admin/managerpost", {
        title: formData.title.trim(),
        description: formData.description.trim(),
        phone: formData.contactPhone.trim(),
        location: formData.location.trim(),
        images: imagesBase64,
        category: formData.category,
        price: pricePayload,
      });

      toast.success("Bài đăng đang chờ duyệt.");

      // Reset form sau khi gửi
      setFormData(initialFormData);
      setUploadImages([]);
      setFormErrors({});
      setListingType("sell");

      setDrawerOpen(false);
      fetchListings();
    } catch (err) {
      console.error(err);
      toast.error("Gửi bài thất bại.");
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setFormData(initialFormData);
    setUploadImages([]);
    setFormErrors({});
    setListingType("sell");
  };

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
          <Row gutter={[16, 16]}>
            {filteredListings.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                <Card
                  hoverable
                  style={{ height: "100%" }}
                  bodyStyle={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: 16,
                  }}
                  cover={
                    <img
                      src={item.image || "/default-plant.png"}
                      alt=""
                      style={{
                        height: 180,
                        objectFit: "cover",
                        width: "100%",
                      }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/default-plant.png";
                      }}
                    />
                  }
                  onClick={() => navigate(`/posts/${item.id}`)}
                >
                  <Tag
                    color="green"
                    style={{
                      padding: "0 6px",
                      margin: 0,
                      fontSize: 12,
                      alignSelf: "flex-start",
                      height: 22,
                      display: "inline-flex",
                      alignItems: "center",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    {item.category}
                  </Tag>

                  <h3
                    className="clamp-2"
                    style={{ fontWeight: 700, fontSize: 16 }}
                  >
                    {item.title}
                  </h3>

                  <p
                    className="market-card-price"
                    style={{
                      margin: "6px 0",
                      fontWeight: 600,
                      color: "#059669",
                    }}
                  >
                    {item.price ? `${item.price} VNĐ` : "Giá liên hệ"}
                  </p>

                  <p className="clamp-2" style={{ margin: 0 }}>
                    {item.location}
                  </p>

                  <div style={{ marginTop: "auto" }}>
                    <Divider style={{ margin: "8px 0" }} />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        color: "#666",
                      }}
                    >
                      <span>{item.seller}</span>
                      <span>{item.createdAt}</span>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Drawer - Đăng bài */}
      <Drawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        width={500}
        title="Đăng bài mới"
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Loại bài
          </label>
          <Select
            value={listingType}
            onChange={(v) => {
              setListingType(v);
              // đổi category theo loại bài
              if (v === "exchange")
                setFormData((p) => ({
                  ...p,
                  category: "Trao đổi",
                  price: "",
                }));
              else if (v === "giveaway")
                setFormData((p) => ({
                  ...p,
                  category: "Cho tặng",
                  price: "",
                }));
              else
                setFormData((p) => ({
                  ...p,
                  category: p.category || "Nông sản",
                }));
              // reset lỗi giá khi đổi loại
              setFormErrors((prev) => ({ ...prev, price: undefined }));
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

        <div style={{ marginBottom: 12 }}>
          <Input
            placeholder="Tiêu đề *"
            value={formData.title}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, title: value });
              if (formErrors.title) {
                setFormErrors((prev) => ({ ...prev, title: undefined }));
              }
            }}
          />
          {formErrors.title && (
            <div
              style={{
                color: "#dc2626",
                fontSize: 12,
                marginTop: 4,
              }}
            >
              {formErrors.title}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <Select
            style={{ width: "100%" }}
            value={formData.category}
            onChange={(v) => setFormData({ ...formData, category: v })}
            options={UI_CATEGORIES.map((c) => ({
              label: c,
              value: c,
            }))}
            dropdownMatchSelectWidth={false}
            dropdownStyle={{ minWidth: 240 }}
          />
        </div>

        {/* Price only shown for selling items */}
        {listingType === "sell" ? (
          <div style={{ marginBottom: 12 }}>
            <Input
              type="number"
              min={0}
              placeholder="Giá (VNĐ) *"
              value={formData.price}
              onChange={(e) => {
                const raw = e.target.value;
                // chỉ giữ lại số
                const numeric = raw.replace(/[^\d]/g, "");
                setFormData({ ...formData, price: numeric });
                if (formErrors.price) {
                  setFormErrors((prev) => ({ ...prev, price: undefined }));
                }
              }}
            />
            {formErrors.price && (
              <div
                style={{
                  color: "#dc2626",
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                {formErrors.price}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: 12, color: "#4b5563" }}>
            <em>Không cần nhập giá cho mục Trao đổi hoặc Cho tặng.</em>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <TextArea
            rows={4}
            placeholder="Mô tả *"
            value={formData.description}
            onChange={(e) => {
              const text = e.target.value;

              if (text.length <= 250) {
                setFormData({ ...formData, description: text });

                if (formErrors.description) {
                  setFormErrors((prev) => ({
                    ...prev,
                    description: undefined,
                  }));
                }
              }
            }}
          />

          <div style={{ fontSize: 12, marginTop: 4, color: "#555" }}>
            {formData.description.length} / 250 ký tự
          </div>

          {/* <div style={{ fontSize: 12, marginTop: 4, color: "#555" }}>
            {countWords(formData.description)} / 250 từ
          </div> */}

          {formErrors.description && (
            <div
              style={{
                color: "#dc2626",
                fontSize: 12,
                marginTop: 4,
              }}
            >
              {formErrors.description}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <Input
            placeholder="Địa điểm"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <Input
            type="tel"
            placeholder="Số điện thoại *"
            value={formData.contactPhone}
            onChange={(e) => {
              setFormData({ ...formData, contactPhone: e.target.value });
              if (formErrors.contactPhone) {
                setFormErrors((prev) => ({
                  ...prev,
                  contactPhone: undefined,
                }));
              }
            }}
          />
          {formErrors.contactPhone && (
            <div
              style={{
                color: "#dc2626",
                fontSize: 12,
                marginTop: 4,
              }}
            >
              {formErrors.contactPhone}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 4, fontWeight: 600 }}>
          Hình ảnh sản phẩm *{" "}
          <span style={{ fontWeight: 400, fontSize: 12, color: "#6b7280" }}>
            (tối đa 3 ảnh, chỉ nhận file hình ảnh)
          </span>
        </div>
        <Upload
          listType="picture-card"
          fileList={uploadImages}
          onChange={({ fileList }) => {
            setUploadImages(fileList);
            if (formErrors.images) {
              setFormErrors((prev) => ({ ...prev, images: undefined }));
            }
          }}
          beforeUpload={handleBeforeUpload}
        >
          {uploadImages.length >= 3 ? null : "+ Ảnh"}
        </Upload>
        {formErrors.images && (
          <div
            style={{
              color: "#dc2626",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {formErrors.images}
          </div>
        )}

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
