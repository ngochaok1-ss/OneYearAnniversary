# Một năm thương nhau

Opening Scene duy nhất cho landing page kỷ niệm một năm. Album 3D bằng CSS, không cần thư viện runtime hoặc bước cài đặt dependencies. Font tiếng Việt được đóng gói tại `public/fonts/` cùng giấy phép SIL Open Font License.

## Chạy tại máy

Yêu cầu Node.js 18+.

```sh
npm run dev
```

Mở `http://127.0.0.1:5173`. Để tạo bản static:

```sh
npm run build
npm start
```

Deploy toàn bộ `dist/` ở gốc domain. Các tài nguyên dùng đường dẫn tuyệt đối từ `/`.

## Nối cảnh tiếp theo

Chỉnh callback đã có ở `src/main.js`:

```js
const scene = new OpeningScene(document.querySelector('#opening-scene'), {
  onOpenComplete: ({ album, scene }) => {
    // Chạy đúng một lần sau khi bìa mở xong.
    // mountMemories({ from: album });
    // scene.destroy(); // Gọi khi tháo cảnh mở đầu khỏi DOM.
  },
});
```

Hoặc lắng nghe sự kiện nổi bọt từ root:

```js
document.addEventListener('album:opened', ({ detail }) => {
  // detail.album: phần tử sách; detail.scene: controller của cảnh.
}, { once: true });
```

Chọn một cách để không gắn trải nghiệm tiếp theo hai lần. Khi chưa nối callback, cảnh giữ nguyên cuốn album đã mở; không thêm gallery, timeline hay section mới. Có thể gọi `window.anniversaryOpening.open()` từ tích hợp bên ngoài; trả về `false` khi thao tác mở đã bắt đầu. Reload trang để xem lại cảnh từ đầu.

## Cấu trúc và điều chỉnh

- `src/album.js`: trạng thái `idle → opening → opened`, bản lề, chuột, bàn phím, callback, pause và vòng đời.
- `src/environment.js`: cánh hoa, bụi sáng, hạt sáng khi mở; mật độ thấp cho điện thoại/thiết bị yếu.
- `src/config.js`: thời gian mở, giới hạn góc nghiêng, mật độ hiệu ứng.
- `src/styles.css`: token màu, typography, hình học sách, ánh sáng, chuyển động và responsive. Thay `:root` để chỉnh hướng thiết kế.
- `index.html`: nội dung tiếng Việt và fallback hiển thị trước khi JavaScript khởi tạo.
- `docs/DESIGN.md`: quyết định thiết kế và hướng dẫn từ skill đã áp dụng.

Hiệu ứng môi trường dừng khi tab ẩn và khi người dùng bấm Tạm dừng. Chúng cũng dừng khi sách/nút có focus. `prefers-reduced-motion` loại bỏ chuyển động trang trí và rút ngắn thao tác mở còn khoảng 180ms. Font được phục vụ nội bộ; trang không gửi dữ liệu tới dịch vụ bên ngoài.

## Kiểm tra trình duyệt

`scripts/qa.mjs` dùng Playwright từ môi trường phát triển (không được đóng gói vào website):

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node scripts/qa.mjs
```

Có thể đặt `CHROME_PATH` và `QA_URL`. Kiểm tra desktop, laptop, tablet, 375px, 320px và landscape; ảnh chụp và kết quả được lưu trong `qa-artifacts/` (gitignored). Bao gồm chống bấm lặp, callback một lần, Enter/Space, pause, reduced motion và mô phỏng tab ẩn.
