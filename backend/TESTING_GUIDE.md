# HƯỚNG DẪN KIỂM TRA VÀ CHẠY AI CHAT

## 🎯 MỤC TIÊU
Kiểm tra chức năng AI Chat đã được implement trong backend và đảm bảo nó hoạt động với Gemini API.

## 📝 CÁC BƯỚC THỰC HIỆN

### BƯỚC 1: Khởi động lại Backend Server

**Cách 1: Tự động (Khuyến nghị)**
```powershell
cd e:\hoc\Ky9\DOAN\W9\FARMHUB_V2\backend
.\restart_server.ps1
```

**Cách 2: Thủ công**
1. Mở Terminal mới trong VS Code (Ctrl + Shift + `)
2. Chạy lệnh:
```powershell
cd e:\hoc\Ky9\DOAN\W9\FARMHUB_V2\backend
npm run dev
```

3. Đợi đến khi thấy:
```
Server is running on 5000
MongoDB connected
```

### BƯỚC 2: Kiểm tra Backend đang chạy

**Mở Terminal MỚI** (quan trọng - không dùng terminal đang chạy server), sau đó:

```powershell
cd e:\hoc\Ky9\DOAN\W9\FARMHUB_V2\backend
node test_ai_chat.mjs
```

Kết quả mong đợi:
- ✅ Login successful
- ✅ AI Response received
- Hiển thị câu trả lời từ Gemini AI

### BƯỚC 3: Test bằng Postman (Phương án thay thế)

Nếu script không chạy được, sử dụng Postman:

**3.1. Đăng nhập**
- Method: POST
- URL: `http://localhost:5000/auth/login`
- Body (JSON):
```json
{
  "email": "haonguyen",
  "password": "Passw0rd!"
}
```
- Lấy `accessToken` từ response

**3.2. Test AI Chat**
- Method: POST
- URL: `http://localhost:5000/ai/chat`
- Headers:
```
Authorization: Bearer <accessToken_từ_bước_trước>
Content-Type: application/json
```
- Body (JSON):
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Cây cà chua của tôi bị vàng lá và có đốm nâu. Đây có phải là bệnh gì?"
    }
  ]
}
```

## 🔍 TROUBLESHOOTING

### Lỗi: "Unable to connect" hoặc "fetch failed"

**Nguyên nhân:** Server chưa khởi động hoặc bị kẹt

**Giải pháp:**
1. Kiểm tra xem server có đang chạy không:
```powershell
netstat -ano | findstr :5000
```

2. Nếu thấy dòng với "LISTENING", server đang chạy tốt
3. Nếu KHÔNG thấy "LISTENING", hãy khởi động lại server (Bước 1)

### Lỗi: "AI API error: 404"

**Nguyên nhân:** GEMINI_API_URL không đúng (model/phiên bản không hỗ trợ)

**Giải pháp:**
1. Mở file `.env`
2. Dùng 1 trong các URL sau (khuyên dùng `-latest`):
```
# Nhanh, chi phí thấp
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent

# Chất lượng cao hơn
; GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent
```
3. Backend đã có cơ chế tự fallback sang `v1beta` + `-latest` nếu gặp 404, nhưng bạn vẫn nên đặt đúng URL để ổn định.

### Lỗi: "AI API error: 401" với nội dung "API keys are not supported by this API"

**Nguyên nhân phổ biến:**
- Dùng API key từ Google Cloud Console (không phải AI Studio), hoặc key bị hạn chế API không cho `Generative Language API`.
- Project/API chưa bật quyền phù hợp cho kiểu xác thực bằng API key.

**Giải pháp:**
1. Lấy API key từ AI Studio: https://aistudio.google.com/app/apikey (không phải Cloud Console).
2. Nếu key có hạn chế (API restrictions), hãy:
  - Tạm thời để "Don’t restrict key" để thử; hoặc
  - Hạn chế theo API nhưng phải CHỌN đúng "Generative Language API".
3. Dùng URL dạng `v1beta` + `-latest` như ở mục 404.
4. Khởi động lại backend sau khi đổi `.env`.

Nếu vẫn 401 và bạn muốn chạy qua OAuth/Service Account:
```
# Bỏ GEMINI_API_KEY (không dùng key nữa)
# Cung cấp Service Account JSON (nội dung file .json, dạng chuỗi)
GEMINI_SA={...json_service_account...}
# (Tuỳ chọn) hoặc nếu đã có access token OAuth, dùng trực tiếp:
; GEMINI_BEARER=ya29....
```
Code sẽ tự xin Bearer từ GEMINI_SA qua `google-auth-library` và gắn Authorization: Bearer ...

### Lỗi: "PERMISSION_DENIED" hoặc "API_KEY_INVALID"

**Nguyên nhân:** GEMINI_API_KEY không hợp lệ hoặc hết hạn

**Giải pháp:**
1. Truy cập: https://aistudio.google.com/app/apikey
2. Tạo API Key mới
3. Cập nhật vào file `.env`:
```
GEMINI_API_KEY=<your_new_api_key>
```
4. Khởi động lại server

## 📊 KẾT QUẢ MONG ĐỢI

Khi test thành công, bạn sẽ thấy:

```
=== Testing AI Chat Functionality ===

[1/3] Logging in...
✅ Login successful! Token obtained.

[2/3] Sending chat request to AI...
✅ AI Response received!

[3/3] AI Response:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dựa trên triệu chứng lá vàng và đốm nâu trên cây cà chua...
[Câu trả lời chi tiết từ Gemini AI]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 Provider: gemini
✅ Success: true

=== Test Complete ===
```

## 🎉 SAU KHI TEST THÀNH CÔNG

Backend của bạn đã sẵn sàng! Bạn có thể:

1. **Chạy Frontend:**
```powershell
cd e:\hoc\Ky9\DOAN\W9\FARMHUB_V2\frontend\web
npm run dev
```

2. **Truy cập Chat UI:**
- Mở trình duyệt: http://localhost:5173
- Đăng nhập với tài khoản `haonguyen`
- Vào trang Chat để test giao diện

## 📞 HỖ TRỢ

Nếu vẫn gặp vấn đề, hãy cung cấp:
1. Output của lệnh `netstat -ano | findstr :5000`
2. Log từ terminal đang chạy `npm run dev`
3. Kết quả khi chạy `node test_ai_chat.mjs`
