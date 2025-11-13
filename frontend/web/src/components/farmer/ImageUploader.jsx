import React, { useState } from "react";
import "../../css/farmer/ImageUploader.css";

const ImageUploader = ({ onImageSelect, currentImage, label = "Chọn ảnh" }) => {
  const [preview, setPreview] = useState(currentImage || null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh!");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh không được vượt quá 5MB!");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      // Support both accessToken (new) and token (legacy)
      const authToken =
        localStorage.getItem("accessToken") || localStorage.getItem("token");

      if (!authToken) {
        alert("Bạn cần đăng nhập để upload ảnh");
        setPreview(null);
        setUploading(false);
        return;
      }

      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        headers: authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : {},
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        // Provide more detailed error to help debugging
        const serverMsg = data?.message || data?.error || response.statusText;
        if (response.status === 401 || response.status === 403) {
          throw new Error(serverMsg || "Unauthorized - please login");
        }
        throw new Error(serverMsg || `Upload failed (${response.status})`);
      }
      const imageUrl = data.data?.url || data.url;

      // Ensure full URL for display
      const fullImageUrl = imageUrl.startsWith("http")
        ? imageUrl
        : `http://localhost:5000${imageUrl}`;

      // Call parent callback with uploaded URL
      if (onImageSelect) {
        onImageSelect(fullImageUrl);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Không thể upload ảnh. Vui lòng thử lại!");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (onImageSelect) {
      onImageSelect(null);
    }
  };

  return (
    <div className="image-uploader">
      <label className="uploader-label">{label}</label>

      {preview ? (
        <div className="image-preview-container">
          <img src={preview} alt="Preview" className="image-preview" />
          <div className="image-actions">
            <label className="btn-change">
              📷 Đổi ảnh
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                disabled={uploading}
              />
            </label>
            <button
              type="button"
              className="btn-remove"
              onClick={handleRemove}
              disabled={uploading}
            >
              🗑️ Xóa
            </button>
          </div>
        </div>
      ) : (
        <label className="upload-area">
          {uploading ? (
            <div className="uploading-state">
              <div className="spinner"></div>
              <p>Đang upload...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📷</div>
              <p className="upload-text">Click để chọn ảnh</p>
              <p className="upload-hint">hoặc kéo thả ảnh vào đây</p>
              <p className="upload-limit">PNG, JPG, GIF (tối đa 5MB)</p>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
};

export default ImageUploader;
