# Cinematic Story Flow

Bản này đổi cách kể chuyện từ timeline theo năm/tháng thành một mạch phim phi tuyến, nhưng giữ nguyên các paragraph cũ trong `data/story.js`.

## Mạch hiện tại

1. **Cold open ở hiện tại** — những ảnh gần nhất của em xuất hiện trước.
2. **Rewind** — 2026 → 2025 → 2024 → 2023.
3. **I · Trước khi có “chúng mình”** — reveal 14.01.2023 và bức ảnh đầu tiên.
4. **II · Mình tiến gần nhau hơn** — nói chuyện, Hải Phòng, reveal 03.03.2024.
5. **III · Em xuất hiện nhiều hơn** — album bắt đầu đầy ảnh em.
6. **IV · Những ngày bình thường** — chuyển trọng tâm từ cột mốc sang những ngày đời thường; có khoảng lặng “những ngày trong ảnh không có anh”.
7. **V · Những lần đầu tiên** — FIRST BIRTHDAY / FIRST CHRISTMAS / FIRST TẾT / ONE YEAR.
8. **VI · Mình không còn đếm nữa** — tình yêu dần giống cuộc sống; Huế, A80, Tà Xùa, những trải nghiệm mới.
9. **VII · Trở lại hiện tại** — quay về chính các bức ảnh đã xuất hiện ở đầu phim.
10. **Birthday payoff** — reflection → sinh nhật → “Anh đã tìm được điểm bắt đầu. Còn điểm cuối thì chắc chưa.” → lời chúc → future reveal.

## Chỉnh nội dung ở đâu

- **Paragraph/kỷ niệm cũ:** `data/story.js` trong `years` — vẫn giữ nguyên cấu trúc để bạn sửa nội dung như trước.
- **Các câu dẫn mới, chapter, rewind, callback:** `data/story.js` → phần `cinema` ở cuối file.
- **Thứ tự dựng phim / scene nào xuất hiện ở đâu:** `js/app.js` → hàm `buildScenes()`.
- **Giao diện điện ảnh:** `css/scenes.css` → phần `CINEMATIC STORY FLOW`.
- **Laptop/iPad/mobile:** `css/responsive.css` → phần `CINEMATIC FLOW RESPONSIVE TUNING`.

## Điều hướng

Thanh giữa phía trên không còn là năm 2023/2024/2025/2026. Nó là **7 chương I–VII**, để người xem không bị cảm giác đang đọc timeline.

## Ghi chú

Ảnh/video vẫn dùng `object-fit: contain` / kích thước tự nhiên nên không cố cắt ảnh để nhét vào khung. Media của mỗi kỷ niệm tiếp tục mở được lightbox khi bấm vào.
