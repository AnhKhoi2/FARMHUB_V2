# NOTEBOOK AUTO-TEMPLATE & IMAGE UPLOAD - COMPLETION GUIDE

## ✅ Các Tính Năng Mới

### 1. **Tự Động Gợi Ý Template**

Khi người dùng nhập loại cây trồng, hệ thống tự động:

- Tìm kiếm template phù hợp theo `plant_group`
- Hiển thị notification xác nhận
- Cho phép chấp nhận hoặc bỏ qua

### 2. **Upload Ảnh Từ Máy Tính**

- Upload file ảnh trực tiếp (không cần URL)
- Preview ảnh realtime
- Hỗ trợ JPEG, PNG, GIF (tối đa 5MB)
- Drag & drop (có thể thêm sau)

---

## 📦 Files Đã Tạo/Sửa

### Backend

#### 1. `backend/utils/upload.js` ✅ MỚI

- Multer configuration
- File storage strategy
- File validation (type, size)
- Tạo thư mục `uploads/notebooks/`

#### 2. `backend/controllers/uploadController.js` ✅ MỚI

- `uploadImage()` - Upload single image
- `uploadMultipleImages()` - Upload multiple images
- Return image URL sau khi upload

#### 3. `backend/routes/upload.js` ✅ MỚI

```javascript
POST /api/upload           → Upload single image
POST /api/upload/multiple  → Upload multiple images
```

#### 4. `backend/server.js` ✅ ĐÃ SỬA

- Added upload routes
- Static file serving cho `/uploads`

### Frontend

#### 5. `frontend/web/src/components/shared/ImageUploader.jsx` ✅ MỚI

- Component upload ảnh
- Preview ảnh realtime
- Loading state
- Error handling
- Props:
  - `onImageSelect(url)` - Callback khi upload xong
  - `currentImage` - URL ảnh hiện tại
  - `label` - Label hiển thị

#### 6. `frontend/web/src/components/shared/ImageUploader.css` ✅ MỚI

- Styling cho upload component
- Dashed border with hover
- Preview container
- Loading spinner
- Responsive design

#### 7. `frontend/web/src/pages/farmer/NotebookCreate.jsx` ✅ ĐÃ SỬA

**Tính năng mới:**

- Auto-match template khi nhập `plant_type`
- Template confirmation UI
- ImageUploader integration
- Xóa input URL thủ công

**State mới:**

```javascript
const [autoMatchedTemplate, setAutoMatchedTemplate] = useState(null);
const [showTemplateConfirm, setShowTemplateConfirm] = useState(false);
```

**Functions mới:**

```javascript
autoMatchTemplate(plantType); // Tìm template phù hợp
handleConfirmTemplate(confirm); // Xác nhận/bỏ qua template
handleImageSelect(imageUrl); // Callback từ ImageUploader
```

#### 8. `frontend/web/src/pages/farmer/NotebookEdit.jsx` ✅ ĐÃ SỬA

- ImageUploader integration
- Xóa input URL thủ công
- handleImageSelect() callback

#### 9. `frontend/web/src/css/farmer/NotebookForm.css` ✅ ĐÃ SỬA

- Template suggestion styles
- Slide down animation
- Confirm/Skip buttons
- Green theme matching

---

## 🔄 Data Flow

### Upload Flow:

```
User selects file
  ↓
ImageUploader validates (type, size)
  ↓
Create preview (FileReader)
  ↓
Upload to server:
  POST /api/upload
  FormData with "image" field
  ↓
Backend (uploadController):
  - Multer saves to uploads/notebooks/
  - Generate unique filename
  - Return image URL
  ↓
Frontend receives URL
  ↓
Call onImageSelect(url)
  ↓
Parent component updates formData.cover_image
```

### Auto-Template Flow:

```
User types plant_type: "Cà chua"
  ↓
handleInputChange() triggers
  ↓
autoMatchTemplate("Cà chua")
  ↓
Search templates:
  - Match plant_group (case-insensitive)
  - Partial match ("Cà chua" includes "Cà")
  ↓
If found:
  - setAutoMatchedTemplate(template)
  - setShowTemplateConfirm(true)
  - Show green notification
  ↓
User clicks "Sử dụng bộ mẫu này":
  - setSelectedTemplate(template._id)
  - setShowTemplateConfirm(false)
  ↓
User clicks "Bỏ qua":
  - setShowTemplateConfirm(false)
  - Template not selected
  ↓
On form submit:
  - If selectedTemplate exists → assignTemplate()
```

---

## 🚀 Testing Guide

### Test Upload Ảnh:

1. **Start backend:**

```powershell
cd backend
npm start
```

2. **Start frontend:**

```powershell
cd frontend/web
npm run dev
```

3. **Test upload:**

- Navigate to: http://localhost:5174/farmer/notebooks/create
- Scroll to "Ảnh Bìa"
- Click vào khu vực upload
- Chọn file ảnh từ máy
- **Expected:**
  - Ảnh preview hiện ra
  - Không có lỗi console
  - Form có giá trị cover_image (URL từ server)

4. **Test validation:**

- Try upload file không phải ảnh → Alert "Vui lòng chọn file ảnh!"
- Try upload file > 5MB → Alert "Kích thước ảnh không được vượt quá 5MB!"

5. **Test remove:**

- Click nút "Xóa" → Preview biến mất

6. **Test change:**

- Click "Đổi ảnh" → Select file mới → Preview update

### Test Auto-Template:

1. **Navigate to create page:**
   http://localhost:5174/farmer/notebooks/create

2. **Test với template tồn tại:**

- Type "Cà chua" vào "Loại Cây Trồng"
- **Expected:**
  - Green notification xuất hiện
  - Show template name: "Cà chua mùa hè" (or similar)
  - 2 buttons: "✓ Sử dụng bộ mẫu này" và "× Bỏ qua"

3. **Click "Sử dụng bộ mẫu này":**

- Notification biến mất
- Template dropdown tự động chọn template đó

4. **Test với plant type không có template:**

- Type "Dưa hấu" (nếu không có template)
- **Expected:** Không có notification

5. **Test partial match:**

- Type "Cà" → Should match "Cà chua"
- Type "Rau" → Should match "Rau xà lách" (if exists)

6. **Submit form:**

- Click "Tạo Nhật Ký"
- Navigate to detail page
- **Verify:**
  - Template assigned
  - Timeline shows stages
  - Checklist generated
  - Cover image displays

---

## 🔧 Configuration

### Backend Upload Settings

**File:** `backend/utils/upload.js`

```javascript
// Thay đổi upload directory:
const uploadsDir = path.join(__dirname, "../uploads/notebooks");

// Thay đổi file size limit (hiện tại 5MB):
limits: {
  fileSize: 5 * 1024 * 1024, // 5MB
}

// Thay đổi allowed file types:
const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
```

### Frontend Upload URL

**File:** `frontend/web/src/components/shared/ImageUploader.jsx`

```javascript
// Line 30 - Change upload endpoint:
const response = await fetch("http://localhost:5000/api/upload", {
```

### Template Matching Logic

**File:** `frontend/web/src/pages/farmer/NotebookCreate.jsx`

```javascript
// Line 47 - Customize matching algorithm:
const matched = templates.find(
  (template) =>
    template.plant_group.toLowerCase().includes(plantType.toLowerCase()) ||
    plantType.toLowerCase().includes(template.plant_group.toLowerCase())
);
```

---

## 🐛 Troubleshooting

### Issue 1: Upload fails with 404

**Cause:** Route not registered in server.js
**Solution:**

```javascript
// backend/server.js
import uploadRoutes from "./routes/upload.js";
app.use("/api/upload", uploadRoutes);
```

### Issue 2: Images don't display

**Cause:** Static files not served
**Solution:**

```javascript
// backend/server.js
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
```

### Issue 3: "Cannot find module 'multer'"

**Solution:**

```powershell
cd backend
npm install multer
```

### Issue 4: Template not auto-matching

**Debug:**

```javascript
// Add console.log in autoMatchTemplate():
console.log("Searching for:", plantType);
console.log(
  "Available templates:",
  templates.map((t) => t.plant_group)
);
console.log("Matched:", matched);
```

### Issue 5: CORS error on upload

**Solution:**

```javascript
// backend/server.js
app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);
```

---

## 📝 API Reference

### Upload Endpoints

#### POST `/api/upload`

Upload single image

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**

```javascript
FormData: {
  image: <File>
}
```

**Response:**

```json
{
  "success": true,
  "message": "Upload ảnh thành công",
  "data": {
    "url": "/uploads/notebooks/notebook-1234567890.jpg",
    "filename": "notebook-1234567890.jpg",
    "size": 102400,
    "mimetype": "image/jpeg"
  }
}
```

#### POST `/api/upload/multiple`

Upload multiple images (max 10)

**Body:**

```javascript
FormData: {
  images: [<File>, <File>, ...]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Upload ảnh thành công",
  "data": [
    { "url": "...", "filename": "...", "size": 0, "mimetype": "..." },
    { "url": "...", "filename": "...", "size": 0, "mimetype": "..." }
  ]
}
```

---

## 🎨 UI/UX Details

### Template Suggestion Box

- Background: Light green gradient
- Border-left: 4px solid green
- Animation: Slide down 0.3s
- 2 buttons side by side
- Mobile: Stack vertically

### Image Uploader

- Dashed green border
- Upload icon: 📷 with float animation
- Hover: Border color darker, slight lift
- Loading: Spinner with green accent
- Preview: Rounded corners, shadow
- Actions: Centered buttons below preview

---

## 🚢 Deployment Notes

### Environment Variables

```env
# Backend .env
UPLOAD_DIR=./uploads/notebooks
MAX_FILE_SIZE=5242880
```

### Production Considerations

1. **Cloud Storage:**

   - Consider AWS S3 / Cloudinary
   - Update upload.js to use cloud SDK
   - Return cloud URL instead of local path

2. **Image Optimization:**

   - Add sharp for image compression
   - Generate thumbnails
   - WebP conversion

3. **CDN:**

   - Serve uploads through CDN
   - Update imageUrl to CDN URL

4. **Security:**
   - Validate file content (not just extension)
   - Virus scanning
   - Rate limiting on upload endpoint

---

## ✅ Completion Checklist

- [x] Upload utility created (utils/upload.js)
- [x] Upload controller created
- [x] Upload routes registered
- [x] Static file serving configured
- [x] ImageUploader component created
- [x] ImageUploader CSS styled
- [x] NotebookCreate uses ImageUploader
- [x] NotebookEdit uses ImageUploader
- [x] Auto-template matching implemented
- [x] Template suggestion UI added
- [x] Confirmation workflow working
- [ ] Test all upload scenarios
- [ ] Test template matching edge cases
- [ ] Add drag-drop support (optional)
- [ ] Add cloud storage integration (optional)

---

## 🎯 Next Steps

### Immediate:

1. Test upload with real images
2. Test template matching with all plant types
3. Verify mobile responsive

### Future Enhancements:

1. **Drag & Drop:**

   ```javascript
   // Add to ImageUploader
   onDrop={(e) => {
     e.preventDefault();
     const file = e.dataTransfer.files[0];
     handleFileSelect({ target: { files: [file] } });
   }}
   ```

2. **Multiple Images in Gallery:**

   - Upload nhiều ảnh cho tab Journal
   - Grid gallery with delete buttons

3. **Image Cropper:**

   - Integrate react-image-crop
   - Allow user to crop before upload

4. **Template Score:**

   - Calculate match percentage
   - Show confidence: "90% phù hợp"

5. **AI Template Suggestion:**
   - Use AI to analyze plant type
   - Suggest multiple templates with scores

---

_Document Created: January 2025_
_Status: ✅ COMPLETE_
_Ready for Testing: YES_
