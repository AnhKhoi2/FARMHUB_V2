# 🌱 Hướng dẫn tạo Plant Template

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Các bước nhập liệu](#các-bước-nhập-liệu)
3. [Chi tiết từng bước](#chi-tiết-từng-bước)
4. [Ví dụ thực tế](#ví-dụ-thực-tế)
5. [Lưu ý quan trọng](#lưu-ý-quan-trọng)

---

## Tổng quan

Plant Template là **bộ mẫu chuẩn** cho từng loại cây trồng, giúp nông dân có hướng dẫn chi tiết về:

- ✅ Giai đoạn phát triển của cây
- ✅ Công việc cần làm hàng ngày
- ✅ Điểm quan sát để đánh giá cây
- ✅ Quy tắc tự động hóa

---

## Các bước nhập liệu

Form có **5 bước** tuần tự:

```
BƯỚC 1: Thông tin cơ bản (📝)
   ↓
BƯỚC 2: Giai đoạn phát triển (🌱)
   ↓
BƯỚC 3: Nhiệm vụ tự động (✅)
   ↓
BƯỚC 4: Điều kiện quan sát (👁️)
   ↓
BƯỚC 5: Quy tắc & Xác nhận (⚙️)
```

---

## Chi tiết từng bước

### 📝 **BƯỚC 1: Thông tin cơ bản**

Nhập thông tin chung về nhóm cây:

#### Các trường cần điền:

| Trường           | Bắt buộc | Mô tả                      | Ví dụ                                |
| ---------------- | -------- | -------------------------- | ------------------------------------ |
| **Tên Template** | ✅       | Tên gọi của bộ mẫu         | "Rau ăn lá cơ bản"                   |
| **Nhóm cây**     | ✅       | Chọn từ dropdown           | Rau ăn lá 🥬                         |
| **Mô tả nhóm**   | ⚪       | Giải thích về nhóm cây này | "Template cho các loại rau ăn lá..." |
| **Ví dụ cây**    | ✅       | Danh sách cây thuộc nhóm   | Xà lách, Rau muống, Cải xanh         |

#### Các nhóm cây có sẵn:

```
🥬 Rau ăn lá      → leaf_vegetable
🥕 Cây củ         → root_vegetable
🥒 Rau/quả ngắn   → fruit_short_term
🍊 Cây quả dài    → fruit_long_term
🫘 Họ đậu         → bean_family
🌿 Cây gia vị     → herb
🥦 Rau ăn hoa     → flower_vegetable
🌱 Khác           → other
```

#### Cách thêm ví dụ cây:

1. Gõ tên cây vào ô input
2. Nhấn nút **"Thêm"** hoặc phím **Enter**
3. Cây sẽ hiện trong danh sách dưới dạng tag
4. Click **X** trên tag để xóa

---

### 🌱 **BƯỚC 2: Giai đoạn phát triển**

Định nghĩa các giai đoạn tăng trưởng của cây.

#### Cấu trúc một giai đoạn:

| Trường            | Bắt buộc | Mô tả                  | Ví dụ                      |
| ----------------- | -------- | ---------------------- | -------------------------- |
| **Tên giai đoạn** | ✅       | Tên của giai đoạn      | "Gieo hạt và nảy mầm"      |
| **Thứ tự**        | ✅       | Số thứ tự (1, 2, 3...) | 1                          |
| **Số ngày**       | ✅       | Thời lượng (ngày)      | 7                          |
| **Mô tả**         | ⚪       | Chi tiết về giai đoạn  | "Hạt nảy mầm và đâm rễ..." |

#### Các nút chức năng:

- **➕ Thêm giai đoạn**: Tạo giai đoạn mới
- **✏️ Sửa**: Chỉnh sửa giai đoạn
- **🗑️ Xóa**: Xóa giai đoạn
- **⬆️⬇️ Sắp xếp**: Đổi thứ tự

#### Ví dụ timeline:

```
Giai đoạn 1: Gieo hạt (7 ngày)
    ↓
Giai đoạn 2: Cây con (14 ngày)
    ↓
Giai đoạn 3: Phát triển (18 ngày)
    ↓
Giai đoạn 4: Thu hoạch (6 ngày)
```

**Tổng thời gian**: 45 ngày

---

### ✅ **BƯỚC 3: Nhiệm vụ tự động**

Thêm công việc cần làm cho từng giai đoạn.

#### Cấu trúc nhiệm vụ:

| Trường        | Bắt buộc | Mô tả                 | Ví dụ                           |
| ------------- | -------- | --------------------- | ------------------------------- |
| **Giai đoạn** | ✅       | Chọn từ dropdown      | Giai đoạn 1                     |
| **Tên task**  | ✅       | Công việc cụ thể      | "Tưới nước 2 lần/ngày"          |
| **Mô tả**     | ⚪       | Hướng dẫn chi tiết    | "Tưới vào sáng sớm và chiều..." |
| **Loại**      | ✅       | daily / weekly / once | daily                           |
| **Bắt buộc**  | ⚪       | Checkbox              | ☑️                              |

#### Các loại task:

```
📅 daily   → Làm mỗi ngày (tưới nước, kiểm tra...)
📆 weekly  → Làm mỗi tuần (bón phân, xịt thuốc...)
1️⃣ once    → Làm 1 lần (gieo hạt, thu hoạch...)
```

#### Ví dụ tasks cho "Giai đoạn 1":

```
✅ Tưới nước 2 lần/ngày        [daily] [bắt buộc]
✅ Kiểm tra độ ẩm đất           [daily]
✅ Bón phân lót                 [once]  [bắt buộc]
```

---

### 👁️ **BƯỚC 4: Điều kiện quan sát**

Định nghĩa các điểm cần quan sát để đánh giá sức khỏe cây.

#### Cấu trúc observation:

| Trường               | Bắt buộc | Mô tả                          | Ví dụ                        |
| -------------------- | -------- | ------------------------------ | ---------------------------- |
| **Giai đoạn**        | ✅       | Chọn từ dropdown               | Giai đoạn 2                  |
| **Tên observation**  | ✅       | Điểm quan sát                  | "Màu sắc lá"                 |
| **Loại**             | ✅       | text / number / select / image | select                       |
| **Giá trị mong đợi** | ⚪       | Kết quả tốt                    | "Xanh đậm, tươi tốt"         |
| **Tùy chọn**         | ⚪\*     | Danh sách lựa chọn             | ["Xanh đậm", "Vàng nhạt"...] |

\*Bắt buộc nếu loại = `select`

#### Các loại observation:

```
📝 text   → Nhập văn bản tự do
🔢 number → Nhập số (chiều cao, số lá...)
☑️ select → Chọn từ danh sách có sẵn
📸 image  → Upload hình ảnh
```

#### Ví dụ observations cho "Giai đoạn 3":

```
👁️ Chiều cao cây            [number]  → Mong đợi: "15-20 cm"
👁️ Màu sắc lá               [select]  → Options: ["Xanh đậm", "Xanh nhạt", "Vàng"]
👁️ Sâu bệnh                 [select]  → Options: ["Không có", "Nhẹ", "Nặng"]
👁️ Hình ảnh tổng thể        [image]   → Upload ảnh
```

---

### ⚙️ **BƯỚC 5: Quy tắc & Xác nhận**

Cấu hình các quy tắc tự động cho template.

#### Các quy tắc:

| Quy tắc             | Mô tả                                | Giá trị |
| ------------------- | ------------------------------------ | ------- |
| **Safe Delay Days** | Số ngày được phép chậm trễ           | 3 ngày  |
| **Auto Skip**       | Tự động bỏ qua giai đoạn khi quá hạn | ☑️ Bật  |
| **Warning Days**    | Cảnh báo trước khi hết hạn           | 1 ngày  |

#### Ví dụ:

```
⏰ Safe Delay: 3 ngày
   → Nông dân có thể chậm 3 ngày mà vẫn đánh dấu hoàn thành

🔄 Auto Skip: BẬT
   → Sau 3 ngày, hệ thống tự động chuyển giai đoạn

⚠️ Warning: 1 ngày
   → Cảnh báo "Sắp hết hạn" trước 1 ngày
```

#### Xem trước:

Bước này hiển thị toàn bộ thông tin đã nhập:

- ✅ Thông tin cơ bản
- ✅ Danh sách giai đoạn
- ✅ Tổng số tasks
- ✅ Tổng số observations
- ✅ Quy tắc

#### Nút cuối cùng:

```
💾 LƯU NHÁP      → Lưu với status = "draft"
✅ KÍCH HOẠT     → Lưu với status = "active" (sẵn sàng dùng)
```

---

## Ví dụ thực tế

### 🥬 Template: "Rau ăn lá cơ bản"

#### BƯỚC 1: Thông tin

```json
{
  "template_name": "Rau ăn lá cơ bản",
  "plant_group": "leaf_vegetable",
  "group_description": "Template cho rau ăn lá ngắn ngày như xà lách, cải, rau muống",
  "plant_examples": ["Xà lách", "Rau muống", "Cải xanh", "Rau dền"]
}
```

#### BƯỚC 2: Giai đoạn

```json
{
  "stages": [
    {
      "stage_number": 1,
      "stage_name": "Gieo hạt và nảy mầm",
      "duration_days": 7,
      "description": "Hạt nảy mầm và đâm rễ ban đầu"
    },
    {
      "stage_number": 2,
      "stage_name": "Cây con",
      "duration_days": 14,
      "description": "Cây phát triển lá đầu tiên"
    },
    {
      "stage_number": 3,
      "stage_name": "Phát triển",
      "duration_days": 18,
      "description": "Cây phát triển mạnh, tăng sinh khối"
    },
    {
      "stage_number": 4,
      "stage_name": "Thu hoạch",
      "duration_days": 6,
      "description": "Thu hoạch và bảo quản"
    }
  ]
}
```

**Tổng thời gian**: 45 ngày

#### BƯỚC 3: Tasks

```json
{
  "tasks_by_stage": {
    "1": [
      {
        "task_name": "Tưới nước 2 lần/ngày",
        "task_type": "daily",
        "is_required": true,
        "description": "Sáng và chiều"
      },
      {
        "task_name": "Gieo hạt",
        "task_type": "once",
        "is_required": true
      }
    ],
    "2": [
      {
        "task_name": "Tưới nước 1-2 lần/ngày",
        "task_type": "daily",
        "is_required": true
      },
      {
        "task_name": "Bón phân lần 1",
        "task_type": "once"
      }
    ],
    "3": [
      {
        "task_name": "Tưới nước đều đặn",
        "task_type": "daily",
        "is_required": true
      },
      {
        "task_name": "Bón phán định kỳ",
        "task_type": "weekly"
      },
      {
        "task_name": "Kiểm tra sâu bệnh",
        "task_type": "daily"
      }
    ],
    "4": [
      {
        "task_name": "Thu hoạch",
        "task_type": "once",
        "is_required": true
      }
    ]
  }
}
```

#### BƯỚC 4: Observations

```json
{
  "observations_by_stage": {
    "1": [
      {
        "observation_name": "Tỷ lệ nảy mầm",
        "observation_type": "number",
        "expected_value": ">80%"
      }
    ],
    "2": [
      {
        "observation_name": "Số lá thật",
        "observation_type": "number",
        "expected_value": "2-4 lá"
      },
      {
        "observation_name": "Màu sắc lá",
        "observation_type": "select",
        "options": ["Xanh đậm", "Xanh nhạt", "Vàng"],
        "expected_value": "Xanh đậm"
      }
    ],
    "3": [
      {
        "observation_name": "Chiều cao cây",
        "observation_type": "number",
        "expected_value": "15-25 cm"
      },
      {
        "observation_name": "Tình trạng sâu bệnh",
        "observation_type": "select",
        "options": ["Không có", "Nhẹ", "Trung bình", "Nặng"],
        "expected_value": "Không có"
      },
      {
        "observation_name": "Hình ảnh cây",
        "observation_type": "image"
      }
    ],
    "4": [
      {
        "observation_name": "Khối lượng thu hoạch",
        "observation_type": "number",
        "expected_value": ">500g/cây"
      }
    ]
  }
}
```

#### BƯỚC 5: Rules

```json
{
  "rules": {
    "safe_delay_days": 3,
    "auto_skip": true,
    "warning_days": 1
  },
  "status": "active",
  "notes": "Template đã được test với 5 lô rau thử nghiệm"
}
```

---

## Lưu ý quan trọng

### ✅ Nên làm:

- ✔️ Đặt tên giai đoạn rõ ràng, dễ hiểu
- ✔️ Ước tính số ngày chính xác dựa trên kinh nghiệm
- ✔️ Thêm đủ tasks cho mỗi giai đoạn
- ✔️ Định nghĩa observations giúp nông dân dễ theo dõi
- ✔️ Lưu nháp trước, test kỹ, rồi mới kích hoạt

### ❌ Tránh:

- ❌ Đặt tên giai đoạn mơ hồ
- ❌ Thời gian giai đoạn quá ngắn hoặc quá dài
- ❌ Quên thêm tasks bắt buộc
- ❌ Quá nhiều observations phức tạp
- ❌ Kích hoạt template chưa được kiểm tra

### 🎯 Mẹo:

1. **Tham khảo templates có sẵn** trong hệ thống
2. **Copy và chỉnh sửa** thay vì tạo từ đầu
3. **Test với 1-2 lô cây** trước khi áp dụng rộng
4. **Cập nhật định kỳ** dựa trên feedback thực tế

---

## Quy trình sử dụng Template

```
📋 Chuyên gia tạo Template
         ↓
💾 Lưu với status "active"
         ↓
🌱 Nông dân chọn template khi tạo Notebook mới
         ↓
📅 Hệ thống tự động sinh tasks + timeline
         ↓
✅ Nông dân làm theo và check-in hàng ngày
         ↓
📊 Hệ thống track tiến độ và cảnh báo
```

---

## API Endpoints

### Tạo template mới:

```
POST /api/expert/plant-templates
Content-Type: application/json

Body: {formData đã điền}
```

### Lấy template để edit:

```
GET /api/expert/plant-templates/:id
```

### Cập nhật template:

```
PUT /api/expert/plant-templates/:id
```

### Xóa template:

```
DELETE /api/expert/plant-templates/:id
```

---

## Liên hệ hỗ trợ

Nếu gặp vấn đề khi nhập liệu:

- 📧 Email: support@farmhub.com
- 💬 Chat: Expert Portal → Help
- 📞 Hotline: 1900-xxxx

---

**Chúc bạn tạo template thành công! 🌱🎉**
