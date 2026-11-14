# Bài 28 · Xưởng tạo hình

Webapp dạy học tương tác bằng tiếng Việt: cắt giấy, ghép hình và gấp thuyền theo các hoạt động trang 113–115.

## Mở và sử dụng

Tải file **Bai-28-Tao-hinh.html**, rồi mở bằng Chrome, Edge hoặc trình duyệt trên điện thoại. File có đủ hình, giao diện, hoạt ảnh và nhạc nền; không cần cài đặt hay kết nối Internet.

- Ba hoạt động trên trang chủ.
- Cắt và ghép các mảnh, xoay bằng chuột hoặc cảm ứng.
- Gấp thuyền qua 8 bước, có tự gấp và thanh kéo xem chuyển động.
- Lưu vị trí đang xem khi tải lại trang.
- Nhạc nền bật/tắt riêng, thông báo và pháo hoa khi hoàn thành.
- Bố cục cho máy tính và điện thoại.

Nhạc bắt đầu sau lần chạm/bấm đầu tiên theo cơ chế của trình duyệt. Việc lưu tiến độ phụ thuộc vào bộ nhớ cục bộ của trình duyệt.

## Chỉnh sửa và đóng gói

Mã nguồn nằm trong `dist/`. Sau khi chỉnh sửa, chạy bằng Python 3:

```sh
python make-standalone.py
```

Lệnh tạo lại `Bai-28-Tao-hinh.html` và `index.html` ở thư mục gốc. `index.html` có thể dùng với dịch vụ lưu trữ trang tĩnh.

Có thể xem mã nguồn tại máy bằng:

```sh
python -m http.server 4173 --directory dist
```

Các kiểm tra JavaScript nằm trong `tests/`, chạy bằng Node.js, ví dụ:

```sh
node tests/folding.cjs
node tests/tangram-fit.cjs
node tests/resume.cjs
```

## Giáo viên Tổ 5

- Trần Minh Hằng
- Hoàng Thị Như Ban
- Phạm Ngọc Chung
