# Opening scene · Design direction

## Brief

Một món quà riêng tư; duy nhất một cảnh toàn màn hình. Cuốn album ở trung tâm, lời mời và một hành động chính nằm bên dưới. Cảm giác: romantic, dreamy, magical, elegant, intimate.

## Áp dụng UI UX Pro Max

Đã đọc `ui-ux-pro-max/SKILL.md` và chạy các truy vấn:

- Design system: `romantic anniversary elegant immersive`, sau đó thu hẹp thành `wedding invitation romantic elegant` vì kết quả ban đầu đề xuất Swiss/landing thương mại chưa phù hợp.
- Typography: `elegant Vietnamese serif` → Vietnamese Friendly và Classic Elegant là các kết quả liên quan; chọn Be Vietnam Pro cho tính rõ ràng, serif Cormorant Garamond cho bìa và lời mời. Cả hai font thực tế được đóng gói hỗ trợ dấu tiếng Việt.
- UX: `motion reduced pause animation` → Reduced Motion, Excessive Motion và Duration Timing.
- Stack gần nhất: `html-tailwind`; truy vấn đầu không khớp dữ liệu, truy vấn `transition` trả về Transition Duration và Hover Transitions. Áp dụng nguyên tắc phản hồi hover 220ms trong HTML/CSS thuần, không cài Tailwind.

Chỉ giữ các khuyến nghị phù hợp đã kiểm tra: màu hồng/vàng ấm, độ sâu mềm, khoảng thở, serif thanh lịch, focus rõ và giảm chuyển động. Không lưu nguyên kết quả tự động có cấu trúc testimonials/carousel vì nằm ngoài brief. Tài liệu này là bản tổng hợp có chủ đích cho cảnh mở đầu.

## Visual tokens

| Vai trò | Giá trị |
| --- | --- |
| Blush nền | `#FFF5F8` |
| Pastel nền | `#F5DCE7` |
| Dusty rose | `#C985A0` |
| Rose bìa ở vùng chữ | `#99576E` |
| Chữ nền sáng | `#714457` |
| Champagne trang trí | `#E9CBA5` |
| Chữ ép kim | `#FFF1D4` / `#FFF3DC` |
| Nút | `#87516A` |

Bìa được làm đậm hơn màu dusty rose nền để chữ nhỏ màu kem có độ tương phản tốt (khoảng 4.85:1 ở vùng trung tâm). Chữ chính trên nền sáng khoảng 7.38:1; nút khoảng 5.83:1. Champagne mờ chỉ dùng cho viền/huy hiệu trang trí, không dùng cho chữ điều khiển.

## Hình học và chuyển động

- Các mặt CSS có chiều sâu thực: bìa trước/sau, gáy, mặt giấy, mép giấy lặp vạch, ribbon.
- Vân bìa và grain nền là SVG noise nội bộ, không dùng ảnh lớn hoặc canvas render liên tục.
- Intro 1.8 giây; sách lơ lửng chu kỳ 5.8 giây, biên độ dưới 10px.
- Góc chuột bị giới hạn 3° theo X, 5° theo Y; không áp dụng cho touch.
- Bìa xoay quanh mép trái, mở 158°. Sách dịch theo độ rộng của chính nó và thu nhỏ để toàn bộ cuốn mở luôn cân đối.
- Mở khoảng 2.65 giây; reduced motion hoặc chủ động dừng hiệu ứng dùng chuyển tiếp 160–180ms.
- Các lớp hạt/cánh hoa không chặn pointer; thao tác mở có state guard và nút disabled.

## Responsive và khả năng sử dụng

- Kích thước sách phụ thuộc cả chiều ngang và `svh`, có điều chỉnh cho điện thoại thấp và landscape.
- Thiết bị yếu hoặc tiết kiệm dữ liệu: ít cánh hoa/hạt sáng hơn; loại một quỹ đạo trang trí.
- Native button hỗ trợ Enter/Space, focus ring, trạng thái mở qua `aria-expanded`, thông báo qua live region.
- Có pause control, dừng khi focus sách/nút và khi tab ẩn. Tab ẩn cũng dừng tiến trình mở; callback đợi khi người dùng quay lại.
- Không có nhạc tự phát, scroll hijacking hay intro chặn thao tác.
- JavaScript không cần thiết để nhìn thấy nền, album và nội dung chính; khi JavaScript tắt có lời nhắc bật để mở album.
