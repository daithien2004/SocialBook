# Git Flow - SocialBook

## Cấu trúc Branch

```
main       ← production, luôn ổn định, chỉ merge khi release
develop    ← tích hợp, base để tạo feature/fix branch
feature/*  ← phát triển tính năng mới
fix/*      ← sửa bug thường trên develop
hotfix/*   ← sửa bug khẩn trên production
```

## Flow Tổng Quan

```
feature/* ──PR──► develop ──PR──► main (khi release)
fix/*     ──PR──► develop

                    ┌──PR──► main
hotfix/*  ──────────┤
                    └──PR──► develop
```

---

## 1. Phát Triển Tính Năng Mới

```bash
# 1. Tạo branch từ develop
git checkout develop
git pull origin develop
git checkout -b feature/ten-tinh-nang

# 2. Code & commit
git add .
git commit -m "feat: mô tả tính năng"
git push origin feature/ten-tinh-nang
```

> Tạo Pull Request trên GitHub: `feature/ten-tinh-nang` → `develop`
> Merge kiểu: **Squash and merge** → xóa branch sau khi merge

---

## 2. Sửa Bug Thường (trên develop)

```bash
# 1. Tạo branch từ develop
git checkout develop
git pull origin develop
git checkout -b fix/ten-bug

# 2. Fix & commit
git add .
git commit -m "fix: mô tả bug"
git push origin fix/ten-bug
```

> Tạo Pull Request: `fix/ten-bug` → `develop`
> Merge kiểu: **Squash and merge**

---

## 3. Release (develop → main)

```bash
# Sau khi develop đã ổn định, tạo PR trên GitHub:
# develop → main
# Merge xong, tag version:

git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

---

## 4. Hotfix (Bug Khẩn trên Production)

```bash
# 1. Tạo branch từ main
git checkout main
git pull origin main
git checkout -b hotfix/ten-bug

# 2. Fix & commit
git add .
git commit -m "hotfix: mô tả bug"
git push origin hotfix/ten-bug
```

> Tạo **2 Pull Request**:
> - `hotfix/ten-bug` → `main`
> - `hotfix/ten-bug` → `develop`

---

## Quy Ước Đặt Tên Branch

| Prefix | Mục đích | Ví dụ |
|--------|----------|-------|
| `feature/` | Tính năng mới | `feature/book-recommendation` |
| `fix/` | Bug thường | `fix/login-validation` |
| `hotfix/` | Bug khẩn production | `hotfix/payment-crash` |

## Quy Ước Commit Message

| Prefix | Mục đích |
|--------|----------|
| `feat:` | Tính năng mới |
| `fix:` | Sửa bug |
| `hotfix:` | Sửa bug khẩn |
| `refactor:` | Refactor code |
| `docs:` | Cập nhật tài liệu |
| `chore:` | Công việc khác (config, dependencies...) |

## Lưu Ý

- Luôn dùng **Squash and merge** khi merge feature/fix vào `develop`
- Không commit trực tiếp lên `main` hay `develop`
- Xóa branch sau khi merge xong
- Tag version mỗi lần release lên `main`
