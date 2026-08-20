# Spendly Backend — Tài liệu REST API

Tài liệu này dành cho đội Frontend/App tích hợp với Spendly backend. Nội dung được trích xuất
trực tiếp từ source code (controllers, DTOs, usecases, Prisma schema) tại thời điểm viết —
nếu có sai khác với thực tế khi API thay đổi, ưu tiên đọc lại source code trong `src/modules/*`.

---

## 0. Quy ước chung (đọc trước khi dùng)

### 0.1. Base path

Base path chung: **`/api/v1`** (trừ health check dùng `/health`, không có prefix `/api/v1`).

Swagger UI (chỉ bật ở môi trường non-production): `GET /docs`.

### 0.2. Authentication

- Áp dụng `JwtAuthGuard` toàn cục. Endpoint đánh dấu `@Public()` thì bỏ qua xác thực.
- **Endpoint public** (không cần Bearer token): toàn bộ nhóm Auth, và `GET /health`, `GET /health/live`.
- Mọi endpoint khác **bắt buộc** header `Authorization: Bearer <accessToken>`.
- Access token hết hạn theo `JWT_ACCESS_EXPIRY` (mặc định `15m`).
- Refresh token: chuỗi ngẫu nhiên, hết hạn theo `JWT_REFRESH_EXPIRY` (mặc định `7d`), có rotation +
  reuse-detection (dùng lại refresh token cũ → revoke toàn bộ token của user, phải đăng nhập lại).

### 0.3. Response envelope (áp dụng cho MỌI response thành công)

```json
{
  "success": true,
  "data": "<kết quả trả về>",
  "meta": { "cursor": "...", "hasMore": true }
}
```

`meta` chỉ xuất hiện ở các endpoint dùng cursor pagination (xem 0.6).

### 0.4. Error envelope (áp dụng cho MỌI lỗi)

```json
{
  "success": false,
  "error": {
    "code": "SCREAMING_SNAKE_CODE",
    "message": "Thông báo lỗi",
    "details": ["optional, mảng message validation nếu có"]
  },
  "path": "/api/v1/...",
  "timestamp": "2026-08-17T00:00:00.000Z"
}
```

Mapping status → code mặc định khi không phải business error tự định nghĩa:

| Status | Code |
|---|---|
| 400 | `VALIDATION_ERROR` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 422 | `BUSINESS_RULE_VIOLATION` |
| 429 | `RATE_LIMITED` |
| khác | `INTERNAL_ERROR` |

Lưu ý: global `ValidationPipe` bật `whitelist + forbidNonWhitelisted` — field lạ trong
body/query sẽ bị reject 400.

### 0.5. Rate limiting

Mặc định 100 req/phút/IP toàn cục. Một số endpoint auth có giới hạn riêng chặt hơn (ghi rõ ở
từng mục). Vượt giới hạn → HTTP 429, code `RATE_LIMITED`.

### 0.6. Cursor pagination

Dùng cho danh sách Transactions và Notifications.

- Query: `cursor?: string`, `limit?: number` (mặc định 20, min 1, max 100).
- Response: `data: T[]`, `meta: { cursor: string | null, hasMore: boolean }`.
- `cursor` là `null` khi hết trang. Truyền `meta.cursor` của response trước vào query `cursor` để
  lấy trang kế tiếp. Thứ tự sort luôn cố định (mới nhất trước) — query param `sort` hiện không có
  tác dụng thực tế, có thể bỏ qua.

### 0.7. Ghi chú kiểu dữ liệu

1. Các số tiền (`amount`, `limitAmount`, `targetAmount`, `initialAmount`) khi trả về **entity thô**
   (create/update trực tiếp không qua tính lại) sẽ serialize thành **string** (Prisma `Decimal`),
   ví dụ response của `POST /transactions`, `POST /budgets`, `POST/PATCH /savings-goals`,
   `POST/PATCH /recurring-transactions`. Ngược lại, các endpoint tổng hợp/tính toán (dashboard,
   period-summary, list categories, list budgets, savings-goals list/detail) trả về `number` thật.
2. Các field ngày giờ Prisma serialize thành ISO 8601 đầy đủ, trừ vài chỗ usecase tự format
   `YYYY-MM-DD` (savings-goal detail: `deadline`, `history[].date`; period-summary: `dateFrom`/
   `dateTo`; daily-summary: `date`).
3. Path param `:id` dùng `ParseUUIDPipe` → id sai định dạng UUID trả lỗi 400 `VALIDATION_ERROR`
   (không phải 404).
4. `DELETE` trả `{ deleted: true }` trong `data` (status 200), TRỪ các endpoint sau trả
   **204 No Content** (không có body): `auth/logout`, `auth/resend-otp`, `auth/forgot-password`,
   `auth/reset-password`, `notifications/mark-all-read`, `DELETE notifications/device-tokens`.

---

## 1. Health

| Method | Path | Auth |
|---|---|---|
| GET | `/health` | Public |
| GET | `/health/live` | Public |

`GET /health`: health check tổng hợp (kiểm tra kết nối DB), format chuẩn `@nestjs/terminus`.
`GET /health/live`: `{ status: 'ok' }`.

---

## 2. Auth — `/api/v1/auth` (toàn bộ Public, không cần JWT)

### `POST /auth/register`

Body:
```ts
{ email: string; password: string; firstName: string; lastName: string }
```
- `password`: 8–72 ký tự, phải có ít nhất 1 chữ + 1 số.

Response `data`: `{ userId, email, otpRequired: true }`

Lỗi: `EMAIL_ALREADY_EXISTS` (409) nếu email đã đăng ký và đã verify. Nếu tồn tại nhưng chưa
verify → tự động resend OTP, không báo lỗi.

### `POST /auth/verify-otp`

Body: `{ email: string; code: string }` (code: đúng 6 chữ số)

Response `data`: `{ userId, accessToken, refreshToken, refreshTokenExpiresAt }`

Lỗi: `OTP_INVALID_OR_EXPIRED` (400), `OTP_TOO_MANY_ATTEMPTS` (400, sai quá 5 lần → phải resend).

### `POST /auth/resend-otp`

Giới hạn 3 lần/10 phút. Body: `{ email: string }`. Trả **204**, luôn resolve im lặng dù email
không tồn tại/đã verify.

### `POST /auth/login`

Giới hạn 5 lần/phút. Body: `{ email: string; password: string }`

Response `data`: `{ userId, accessToken, refreshToken, refreshTokenExpiresAt }`

Lỗi: `INVALID_CREDENTIALS` (401), `EMAIL_NOT_VERIFIED` (403 — chuyển sang màn OTP).

### `POST /auth/oauth`

Body: `{ provider: 'GOOGLE' | 'FACEBOOK'; token: string }` (Google ID token / Facebook access
token)

Response `data`: `{ userId, accessToken, refreshToken, refreshTokenExpiresAt }`

### `POST /auth/refresh`

Body: `{ refreshToken: string }`

Response `data`: `{ accessToken, refreshToken, refreshTokenExpiresAt }` (không có `userId`)

Lỗi: `INVALID_REFRESH_TOKEN` (401), `TOKEN_REUSE_DETECTED` (401 — token cũ bị dùng lại, toàn bộ
token của user bị revoke, phải đăng nhập lại).

### `POST /auth/logout`

Body: `{ refreshToken: string }`. Trả **204**. Revoke toàn bộ refresh token chain của user.

### `POST /auth/forgot-password`

Giới hạn 3 lần/giờ. Body: `{ email: string }`. Trả **204**, luôn resolve im lặng.

### `POST /auth/reset-password`

Body: `{ token: string; newPassword: string }`. Trả **204**.

Lỗi: `INVALID_RESET_TOKEN` (400). Thành công → revoke toàn bộ refresh token của user (đăng xuất
mọi thiết bị).

---

## 3. Users — `/api/v1/users` (yêu cầu JWT)

### `GET /users/me`

Response `data`:
```ts
{
  id: string; email: string; firstName: string; lastName: string;
  phone?: string | null; address?: string | null; avatarUrl?: string | null;
  theme: 'LIGHT' | 'DARK'; language: 'VI' | 'EN'; currency: string;
  notificationsEnabled: boolean;
}
```

### `PATCH /users/me`

Body (tất cả optional): `{ firstName?, lastName?, phone?, address?, avatarUrl? }`

Response `data`: giống `GET /users/me` sau update.

### `PATCH /users/me/preferences`

Body (tất cả optional):
```ts
{ theme?: 'LIGHT'|'DARK'; language?: 'VI'|'EN'; currency?: string; notificationsEnabled?: boolean }
```

Response `data`: giống `GET /users/me` sau update.

---

## 4. Files — `/api/v1/files` (yêu cầu JWT)

`POST /files/upload` là **API upload ảnh dùng chung cho toàn bộ hệ thống** — bất kỳ tính năng
nào cần upload ảnh (avatar, và các tính năng đính kèm ảnh khác trong tương lai) đều gọi cùng
một endpoint này để lấy về `url`, sau đó tự gán `url` đó vào field tương ứng của resource cần
thiết qua API `PATCH`/`POST` của module đó. **Endpoint này không tự lưu ảnh vào bất kỳ entity
nghiệp vụ nào (transaction, category, savings goal...) — nó chỉ upload file lên storage và trả
về URL.**

### `POST /files/upload`

Giới hạn 10 lần/phút. `multipart/form-data`, field `file` (binary), giới hạn cứng **5MB**,
chỉ chấp nhận `image/jpeg | image/png | image/webp`.

Response `data`: `{ id, url, mimeType, size }`

Lỗi: `FILE_REQUIRED` (400), `INVALID_FILE_TYPE` (400), `FILE_TOO_LARGE` (400).

**Flow chuẩn cho FE/App (áp dụng cho mọi tính năng upload ảnh):**
1. Gọi `POST /files/upload` với file ảnh → nhận `url` trong response.
2. Gọi API `PATCH`/`POST` của resource cần gắn ảnh, truyền `url` vừa nhận vào field tương ứng.

Ví dụ hiện tại (avatar người dùng):
```
POST /files/upload  → { id, url, mimeType, size }
PATCH /users/me { avatarUrl: "<url>" }  → cập nhật avatar vào profile
```

⚠️ Lưu ý hiện tại: use case upload đang lưu ảnh theo `folder: "<uploadFolder>/<userId>"` và
`overwrite: true` (Cloudinary) — nghĩa là **mỗi user chỉ giữ được 1 ảnh do endpoint này ghi đè**
lần upload trước đó của cùng user. Điều này phù hợp với avatar (1 ảnh/user). Nếu về sau có thêm
tính năng upload ảnh khác cần giữ nhiều ảnh cùng lúc cho 1 user (ví dụ hoá đơn giao dịch, ảnh bìa
mục tiêu tiết kiệm...), backend cần được cập nhật để không overwrite theo `userId` nữa — FE/App
không cần biết trước điều này, nhưng nếu thấy ảnh cũ bị mất khi upload ảnh mới cho mục đích khác
avatar thì đây là nguyên nhân, cần báo lại để backend tổng quát hoá endpoint.

Hiện tại, `User.avatarUrl` là field ảnh nghiệp vụ **duy nhất** trong hệ thống dùng endpoint này;
chưa có transaction/category/savings-goal/budget/recurring-transaction nào có field ảnh riêng.

---

## 5. Categories — `/api/v1/categories` (yêu cầu JWT)

Category:
```ts
{ id, userId, name, color, icon, type: 'EXPENSE'|'INCOME', isDefault, sortOrder, createdAt, updatedAt }
```

### `GET /categories`

Query: `{ type?: 'EXPENSE' | 'INCOME' }`

Response `data`: `Category[]` (sort theo `sortOrder asc`, không phân trang).

### `GET /categories/:id`

Response `data`: `Category & { transactionCountThisMonth: number }`

### `POST /categories`

Body:
```ts
{
  name: string;        // maxLength 50
  color: string;        // 1 trong: '#4F46E5' | '#F59E0B' | '#22C55E' | '#F43F5E' | '#8B5CF6' | '#0EA5E9'
  icon: string;         // tên icon Material Symbols Rounded, maxLength 50
  type: 'EXPENSE' | 'INCOME';
}
```

Response `data`: `Category` (201)

Lỗi: `CATEGORY_NAME_EXISTS` (409 — trùng tên trong cùng type).

### `PATCH /categories/:id`

Body (optional, không đổi được `type`): `{ name?, color?, icon? }`

Lỗi: 404, `CATEGORY_NAME_EXISTS` (409).

### `DELETE /categories/:id`

Response `data`: `{ deleted: true }`. Soft-delete; transaction thuộc category bị chuyển sang
category mặc định "Khác" cùng type; budget gắn category này bị soft-delete theo.

Lỗi: `DEFAULT_CATEGORY_CANNOT_BE_DELETED` (422 — không thể xoá category "Khác").

> Mỗi user được seed sẵn category mặc định: 8 EXPENSE + 1 "Khác" (EXPENSE), 3 INCOME + 1 "Khác"
> (INCOME).

---

## 6. Transactions — `/api/v1/transactions` (yêu cầu JWT)

Transaction:
```ts
{
  id, userId, categoryId, type: 'EXPENSE'|'INCOME';
  amount: string;        // Decimal -> string, ví dụ "150000.00"
  note: string | null; occurredAt: string;   // ngày, không giờ
  createdAt, updatedAt;
}
```

⚠️ Lưu ý route `summary/daily` và `summary/period` khai báo TRƯỚC `:id` — không bị nhầm khi gọi.

### `GET /transactions/summary/daily`

Query: `{ month: string }` — bắt buộc, format `YYYY-MM`.

Response `data`: `Array<{ date: string /* YYYY-MM-DD */; total: number }>` — đủ mọi ngày trong
tháng (tổng chi tiêu EXPENSE theo ngày, ngày không giao dịch → `total: 0`).

### `GET /transactions/summary/period`

Query: `{ period: 'week' | 'month' | 'year'; date: string }` — `date` là ISO date bất kỳ trong kỳ
muốn xem.

Response `data`:
```ts
{
  period: 'week' | 'month' | 'year';
  dateFrom: string; dateTo: string;   // YYYY-MM-DD
  income: number; expense: number;
  savingsRate: number;   // %
  avgPerDay: number;
  topCategory: { categoryId, name, color, amount, percent } | null;
  highestSpendDay: { date, total } | null;
  categoryBreakdown: Array<{ categoryId, name, color, amount, percent }>;
  chart: { labels: string[]; values: number[] };
}
```

### `POST /transactions`

Body:
```ts
{
  type: 'EXPENSE' | 'INCOME';
  categoryId: string;    // UUID
  amount: number;        // > 0, tối đa 2 số thập phân
  note?: string;         // maxLength 500
  occurredAt: string;    // ISO date, VD "2026-07-29"
}
```

Response `data`: `Transaction` (không kèm category)

Lỗi: 404 `NOT_FOUND` (categoryId không hợp lệ).

⚠️ Side-effect: nếu `type === EXPENSE`, hệ thống tự kiểm tra ngân sách và có thể sinh notification
`BUDGET_ALERT` khi vừa vượt ngưỡng 80% ngân sách category/tháng đó (chỉ fire 1 lần khi crossing).

### `GET /transactions`

Query (cursor pagination, xem mục 0.6), thêm:
```ts
{
  type?: 'EXPENSE' | 'INCOME';
  categoryId?: string;
  dateFrom?: string; dateTo?: string;   // ISO date
  amountMin?: number; amountMax?: number;
  search?: string;   // maxLength 200, tìm trong note hoặc tên category
}
```

Response: `data: (Transaction & { category: Category })[]`, `meta: { cursor, hasMore }`.

### `GET /transactions/:id`

Response `data`: `Transaction` (không kèm category). Lỗi: 404.

### `PATCH /transactions/:id`

Body (optional, không đổi được `type`): `{ categoryId?, amount?, note?, occurredAt? }`

Không trigger lại kiểm tra ngân sách. Lỗi: 404.

### `DELETE /transactions/:id`

Response `data`: `{ deleted: true }` (soft-delete). Lỗi: 404.

---

## 7. Budgets — `/api/v1/budgets` (yêu cầu JWT)

### `GET /budgets`

Query: `{ month: string }` — bắt buộc, `YYYY-MM`.

Response `data`:
```ts
Array<{
  id: string; month: string;
  category: { id, name, color, icon };
  limitAmount: number; spentAmount: number;
  usedPercent: number; isOverBudget: boolean;
}>
```

### `POST /budgets`

Body: `{ categoryId: string; month: string; limitAmount: number }` (`categoryId` phải là category
**EXPENSE**)

Response `data`: `Budget` entity thô (không kèm `spentAmount`)

Lỗi: 404, `BUDGET_ALREADY_EXISTS` (409 — trùng `categoryId + month`).

### `PATCH /budgets/:id`

Body: `{ limitAmount: number }` (**bắt buộc**, không optional).

Lỗi: 404.

### `DELETE /budgets/:id`

Response `data`: `{ deleted: true }`. Lỗi: 404.

---

## 8. Savings Goals — `/api/v1/savings-goals` (yêu cầu JWT)

> `currentAmount`/`percent` được suy ra từ **toàn bộ** giao dịch thu/chi của user kể từ khi tạo
> goal (không lọc theo category riêng) — nếu có nhiều goal, số dư không loại trừ lẫn nhau.

### `GET /savings-goals`

Response `data`:
```ts
Array<{
  id, name, targetAmount: number; initialAmount: number; deadline: Date;
  currentAmount: number; percent: number;
}>
```

### `POST /savings-goals`

Body:
```ts
{
  name: string;            // maxLength 100
  targetAmount: number;    // > 0
  deadline: string;        // ISO date
  initialAmount?: number;  // >= 0, default 0
}
```

Response `data`: `SavingsGoal` entity thô (không kèm progress), status 201.

### `GET /savings-goals/:id`

Response `data`:
```ts
{
  id, name, targetAmount: number; initialAmount: number;
  currentAmount: number; percent: number;
  deadline: string;          // YYYY-MM-DD
  avgPerMonth: number; contributionCount: number;
  history: Array<{ label: string; date: string; amount: number }>;  // mới nhất trước
}
```

Lỗi: 404.

### `PATCH /savings-goals/:id`

Body (tất cả optional): `{ name?, targetAmount?, deadline?, initialAmount? }`

Lỗi: 404.

### `DELETE /savings-goals/:id`

Response `data`: `{ deleted: true }`. Lỗi: 404.

---

## 9. Dashboard — `/api/v1/dashboard` (yêu cầu JWT)

### `GET /dashboard/summary`

Query: `{ month: string }` — bắt buộc, `YYYY-MM`.

Payload tổng hợp cho màn Dashboard — bao gồm cả **chi tiêu theo ngày** (`dailySpend`, giống hệt
`GET /transactions/summary/daily`), nên FE có thể dùng thẳng field này mà không cần gọi thêm API
riêng.

Response `data`:
```ts
{
  month: string;
  income: number; expense: number; savings: number;   // savings = income - expense
  budget: { totalLimit, totalSpent, usedPercent, remaining };
  savingsGoal: {   // goal nổi bật (deadline gần nhất chưa qua hạn); null-object nếu chưa có goal
    id: string | null; name: string | null; targetAmount: number;
    currentAmount: number; percent: number; deadline: Date | null;
  };
  categoryBreakdown: Array<{ categoryId, name, color, amount, percent }>;  // toàn bộ expense trong tháng, sort giảm dần
  dailySpend: Array<{ date: string; total: number }>;   // ← chi tiêu theo ngày
  recentTransactions: Array<Transaction & { category: Category }>;   // 10 giao dịch gần nhất
  overBudgetAlert: { categoryId: string; name: string; overPercent: number } | null;
}
```

---

## 10. Recurring Transactions — `/api/v1/recurring-transactions` (yêu cầu JWT)

RecurringTransaction:
```ts
{
  id, userId, categoryId, type, label, amount: string;
  dayOfMonth: number; isActive: boolean; lastGeneratedMonth: string | null;
}
```

### `GET /recurring-transactions`

Response `data`: `RecurringTransaction[]` (cả active và paused, không phân trang).

### `POST /recurring-transactions`

Body:
```ts
{
  type: 'EXPENSE' | 'INCOME';
  categoryId: string;     // phải cùng type với category
  label: string;          // maxLength 100
  amount: number;         // > 0
  dayOfMonth: number;     // 1-28
  isActive?: boolean;     // default true
}
```

Response `data`: `RecurringTransaction` (201). Lỗi: 404.

### `GET /recurring-transactions/:id`

Response `data`: `RecurringTransaction`. Lỗi: 404.

### `PATCH /recurring-transactions/:id`

Body (tất cả optional, kể cả `isActive` để pause/resume): giống Create nhưng optional.

Lỗi: 404.

### `DELETE /recurring-transactions/:id`

Response `data`: `{ deleted: true }`. Lỗi: 404.

> Job nền hàng tháng tự sinh Transaction thật theo `dayOfMonth` cho recurring đang active — các
> transaction này xuất hiện bình thường trong `GET /transactions` và dashboard.

---

## 11. Notifications — `/api/v1/notifications` (yêu cầu JWT)

Notification: `{ id, userId, type, title, body, icon, tone, isRead, createdAt }`
(`type`: `'BUDGET_ALERT' | 'DAILY_REMINDER' | 'RECURRING_GENERATED'`)

### `GET /notifications`

Cursor pagination (xem mục 0.6). Response: `data: Notification[]`, `meta: { cursor, hasMore }`.

### `PATCH /notifications/mark-all-read`

Trả **204**. Đánh dấu toàn bộ notification chưa đọc thành đã đọc.

### `GET /notifications/reminder-settings`

Response `data`:
```ts
{
  userId: string;
  dailyExpenseReminder: boolean;    // default true
  budgetAlertReminder: boolean;     // default true
  recurringAlertReminder: boolean;  // default false
  dailyReminderTime: string;        // default '20:00'
  updatedAt: Date;
}
```

### `PATCH /notifications/reminder-settings`

Body (tất cả optional):
```ts
{
  dailyExpenseReminder?: boolean; budgetAlertReminder?: boolean;
  recurringAlertReminder?: boolean;
  dailyReminderTime?: '08:00' | '12:00' | '20:00';
}
```

### `POST /notifications/device-tokens`

Body: `{ token: string; platform?: 'ios' | 'android' | 'web' }` (dùng để đăng ký FCM push token)

Response `data`: `{ id, userId, token, platform, createdAt, updatedAt }` — upsert theo `token`
(nếu token đã thuộc user khác, sẽ gán lại userId mới).

### `DELETE /notifications/device-tokens`

Body: `{ token: string }`. Trả **204**. Xoá theo `token` toàn cục, không lỗi nếu không tìm thấy.

---

## Tổng hợp toàn bộ error code SCREAMING_SNAKE

| Code | HTTP | Module | Ý nghĩa |
|---|---|---|---|
| `EMAIL_ALREADY_EXISTS` | 409 | Auth | Email đã đăng ký và đã verify |
| `OTP_INVALID_OR_EXPIRED` | 400 | Auth | OTP sai/hết hạn/không tồn tại |
| `OTP_TOO_MANY_ATTEMPTS` | 400 | Auth | Nhập sai OTP quá 5 lần |
| `INVALID_CREDENTIALS` | 401 | Auth | Sai email/mật khẩu |
| `EMAIL_NOT_VERIFIED` | 403 | Auth | Email chưa xác thực |
| `INVALID_REFRESH_TOKEN` | 401 | Auth | Refresh token không hợp lệ/hết hạn/đã revoke |
| `TOKEN_REUSE_DETECTED` | 401 | Auth | Refresh token bị dùng lại — revoke toàn bộ chain |
| `UNAUTHORIZED` | 401 | Auth | User không tồn tại (hiếm) |
| `INVALID_RESET_TOKEN` | 400 | Auth | Token reset password không hợp lệ/hết hạn |
| `FILE_REQUIRED` | 400 | Files | Không có file trong request |
| `INVALID_FILE_TYPE` | 400 | Files | Mimetype không phải JPEG/PNG/WEBP |
| `FILE_TOO_LARGE` | 400 | Files | Vượt kích thước tối đa cho phép |
| `CATEGORY_NAME_EXISTS` | 409 | Categories | Trùng tên trong cùng type |
| `DEFAULT_CATEGORY_CANNOT_BE_DELETED` | 422 | Categories | Không thể xoá category mặc định "Khác" |
| `DEFAULT_CATEGORY_MISSING` | 422 | Categories | Không tìm thấy category "Khác" dự phòng |
| `BUDGET_ALREADY_EXISTS` | 409 | Budgets | Đã có budget cho `categoryId + month` |

Ngoài ra, nhiều endpoint dùng `NotFoundException` chuẩn (code `NOT_FOUND`, message tiếng Anh mặc
định), ví dụ: `"Category not found"`, `"Transaction not found"`, `"Budget not found"`,
`"Savings goal not found"`, `"Recurring transaction not found"`, `"User not found"`.
