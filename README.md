# Birthday Story V3 — Data-driven Timeline

Bản V3 tách **nội dung**, **media** và **giao diện** để `index.html` không bị phình to dù dùng toàn bộ ảnh/video.

## Chạy project

Khuyên dùng VS Code + **Live Server**, mở `index.html`.

## Cấu trúc

```text
birthday_story_v3/
├── index.html                 # chỉ là khung trang
├── assets/media/
│   ├── 2023/                  # media năm 2023
│   ├── 2024/                  # media năm 2024
│   ├── 2025/                  # media năm 2025
│   ├── 2026/                  # media năm 2026
│   └── special/               # ảnh đặc biệt (AI wedding)
├── data/
│   ├── story.js               # SỬA CÂU CHỮ / TITLE / CAPTION Ở ĐÂY
│   └── media.js               # danh sách 114 media, auto-generated
├── js/app.js                  # Story Engine / render scene / lightbox / navigation
├── css/
│   ├── base.css
│   ├── components.css
│   ├── scenes.css
│   └── responsive.css
└── tools/build-media-manifest.py
```

## Cách timeline hoạt động

JavaScript tự tạo scene theo:

**Intro → 2023 → từng tháng có ảnh → 2024 → từng tháng → 2025 → từng tháng → 2026 → từng tháng → Birthday Letter → AI Wedding Surprise**.

Hiện project tạo khoảng hơn 30 scene, nhưng `index.html` vẫn rất nhỏ vì scene được render từ dữ liệu.

Chỉ **scene hiện tại** được đưa vào DOM. Vì vậy dù dùng 114 media, trình duyệt không phải render tất cả cùng lúc.

## Muốn sửa lời kể

Mở:

```text
data/story.js
```

Ví dụ sửa nội dung tháng 6/2024 ở:

```js
2024: {
  months: {
    6: {
      title: "...",
      note: "...",
      ending: "..."
    }
  }
}
```

## Muốn thêm ảnh mới

1. Chép ảnh vào đúng folder năm, ví dụ:

```text
assets/media/2026/2026_08_15.jpg
```

2. Giữ format tên file ưu tiên:

```text
YYYY_MM_DD.jpg
YYYY_MM_DD(1).jpg
```

3. Chạy:

```bash
python tools/build-media-manifest.py
```

`data/media.js` sẽ được tạo lại tự động. Không cần sửa HTML.

## Nhạc

Trong `index.html`, thay URL trong `<audio id="music">` bằng file nhạc của hai bạn, ví dụ:

```html
<source src="assets/audio/our-song.mp3" type="audio/mpeg" />
```

## Ghi chú

- Toàn bộ **114 media gốc trong image.zip** đã được đưa vào timeline.
- Ảnh cưới AI được đổi tên an toàn thành `assets/media/special/ai-wedding.jpg`.
- Ảnh/video trong một tháng được hiển thị thành film strip; click để mở full-screen.
- Có nút nhảy nhanh 2023 / 2024 / 2025 / 2026.
- Mobile có swipe ngang để xem ảnh trong từng tháng.
