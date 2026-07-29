# Handoff: Spendly — Personal Finance App (Flutter)

## Overview
Full UI/UX prototype for "Spendly", a personal expense-tracking mobile app: income/expense tracking, monthly budget, calendar heatmap of daily spend, reports, and category budgets. Target stack: **Flutter, Material Design 3, Supabase (Auth/Postgres/Storage/Realtime), Google + Email login.**

## About the Design Files
The bundled file `Finance App Prototype.dc.html` is a **design reference built in HTML/React**, not production code. It is a clickable prototype (phone-frame mock with working navigation) meant to communicate exact layout, color, type, spacing, and interaction — **not to be embedded or copied as HTML into the Flutter app**. Recreate every screen natively in Flutter widgets using Material 3 theming, matching this reference pixel-for-pixel where values are given below.

## Fidelity
**High-fidelity.** All colors, type sizes/weights, radii, spacing, and copy (Vietnamese) below are final. Icons are named from **Material Symbols Rounded** — map directly to Flutter's `Icons` (rounded variant) or the `material_symbols_icons` package.

---

## Design Tokens

### Colors (Light)
| Token | Hex | Usage |
|---|---|---|
| Primary | `#4F46E5` | CTAs, active nav, links, chart primary |
| Success | `#22C55E` | Income amounts, under-budget, low-spend days |
| Warning | `#F59E0B` | Secondary chart series, warnings |
| Danger | `#EF4444` | Expense amounts, over-budget, high-spend days |
| Background | `#F8FAFC` | Screen background |
| Surface | `#FFFFFF` | Cards |
| Surface Alt | `#F1F5F9` | Inputs, chips, track backgrounds |
| Border | `#E2E8F0` | Card/input borders |
| Text Primary | `#1E293B` | Headings, body |
| Text Secondary | `#64748B` | Sub-labels |
| Text Tertiary | `#94A3B8` | Placeholders, disabled |
| Primary tint | `#EEF2FF` | Selected chip/category background |
| Success tint | `#ECFDF5` | Income icon bg, under-budget bg |
| Danger tint | `#FEF2F2` | Expense-danger bg, over-budget card bg |

### Colors (Dark)
| Token | Hex |
|---|---|
| Background | `#111827` |
| Surface | `#1F2937` |
| Surface Alt | `#182234` |
| Border | `#2D3748` |
| Text Primary | `#F1F5F9` |
| Text Secondary | `#94A3B8` |
| Text Tertiary | `#64748B` |
| Primary | `#818CF8` |
| Success | `#34D399` |
| Warning | `#FBBF24` |
| Danger | `#F87171` |

### Category chart palette (fixed hues, used consistently across Pie charts)
Ăn uống `#4F46E5` · Shopping `#F59E0B` · Đi lại `#22C55E` · Giải trí `#F43F5E` · Gia đình `#8B5CF6` · Khác `#94A3B8`

### Typography
- Family: **Inter** (400/500/600/700/800) for all UI text.
- Family: **IBM Plex Mono** (400/500) for all monetary amounts and small meta/mono labels (structural accent).
- Scale used: 10–11px (meta/chips) · 12–13px (secondary/body-small) · 14–15px (body/labels) · 17–19px (screen titles) · 22–30px (hero numbers/headlines).

### Shape & elevation
- Card radius: **20px**. Small controls (chips, inputs, icon buttons): **12–16px**. Pills/segmented controls/avatars: **999px**.
- Card shadow (light): `0 20px 44px rgba(15,23,42,0.10)`. Card shadow (dark): `0 20px 44px rgba(0,0,0,0.5)`.
- Card border: 1px solid Border token, always paired with the shadow (soft "floating card" look — no heavy borders alone).

### Spacing
Base unit 2px; common paddings 8/10/12/14/16/18px; screen horizontal padding **16px** (auth screens 18px); top padding 56px (auth 90px); bottom padding 96–116px on tabbed screens to clear nav + FAB; gaps between stacked cards **12–14px**.

### Icons
Material Symbols Rounded, filled (`FILL 1`), 15–26px depending on context. Bottom nav icons 22px, list-row icons 20px, category-grid icons 22px.

### Touch targets
Minimum 48×48px on all tappable controls (buttons, nav items, list rows, chips) per accessibility requirement. Where a control must look smaller than its hit area, keep the **icon** small and pad the button out to size — e.g. the day-sheet delete icon renders a 17px glyph inside a 44×44px button, and preset chips are 44px tall with 12px text.

---

## Global Chrome

### Bottom Navigation (Dashboard, Calendar, Budget, Reports, Profile, Settings)
5 equal tabs, height **72px** + safe-area padding, `Surface`/`#151c2b`(dark) background, 1px top border. Tabs: `home` Trang chủ · `calendar_month` Lịch · `account_balance_wallet` Ngân sách · `bar_chart` Báo cáo · `person` Cá nhân. Icons 22px, labels 10px; active tab in Primary, inactive Text Tertiary.

### Floating Add Button (FAB)
52px circular Primary FAB with a white `add` icon, pinned **bottom-right** (16px inset), shadow `0 8px 20px rgba(79,70,229,.4)`. Shown on **every screen except** Splash, Language Select, Login, Register, Forgot Password, and the Add/Edit Transaction screen itself. Sits 86px from the bottom on screens with the bottom nav, 28px on screens without it. Opens Add Transaction (Expense tab).

### Snackbar (success confirmation)
Appears bottom-anchored above the nav bar after saving a transaction, auto-dismiss 2.5s: dark pill, `check_circle` (Success color) + "Đã lưu khoản chi" / "Đã lưu khoản thu".

---

## Screens

### 1b. Language Select (first-launch, shown right after Splash)
**Purpose:** let the user pick app language before reaching Login.
**Layout:** gradient hero (same tokens as Splash) with a `language` icon tile, "Chọn ngôn ngữ" / "Select your preferred language" → two side-by-side language cards (code badge VI/EN, native name, English/Vietnamese subtitle; selected = primary border + shadow + check badge) → Primary "Tiếp tục" button → footnote "Bạn có thể thay đổi ngôn ngữ sau trong Cài đặt".
**Behavior:** selection is also editable later from Settings → Chung → Ngôn ngữ.

### 1. Splash
**Purpose:** brand moment while Supabase session/auth state resolves.
**Layout:** full-bleed gradient `135deg, Primary → #8B5CF6` (light) / `→ #3730A3` (dark), centered column: 84px rounded-24 icon tile (`savings` icon, white, 44px) → app name "Spendly" 28px/800 white → tagline 14px white 75% opacity → state-dependent footer (see States).hite → tagline 14px white 75% opacity → 3 pulsing dots.
**Behavior:** auto-navigate to Login after ~2s if no session, or Dashboard if session valid.
**States:**
- **Loading** (default): 3 pulsing dots, opacity 0.9/0.5/0.25.
- **Error**: `error` icon (28px, white) + "Không thể kết nối máy chủ. Vui lòng thử lại." + translucent-white "Thử lại" retry button.
- **Offline**: `wifi_off` icon + "Mất kết nối mạng. Kiểm tra Wi-Fi hoặc dữ liệu di động." + same retry button.

### 2. Login
**Purpose:** fast sign-in, Google/Facebook-first.
**Layout:** centered column — 56px rounded-16 icon tile, centered "Chào bạn trở lại" 26px/800, centered subtitle 14px secondary. Below: email field → password field (both 50px, radius 14, icon + placeholder, Surface bg, Border outline) → "Quên mật khẩu?" link right-aligned (→ Forgot Password screen) → Primary button "Đăng nhập" (52px, radius 16) → "hoặc" divider → outlined **Continue with Google** button (52px, radius 16) → filled **Facebook blue (#1877F2)** "Đăng nhập với Facebook" button, white text/icon → bottom-anchored "Chưa có tài khoản? Đăng ký" link.
**States:** every field is labeled (13px/700 label above the input). Error state gives the input a 1.5px danger border plus an inline message under it with an `error` icon — Login: "Email không đúng định dạng" / "Mật khẩu không đúng". Spinner in the primary button while authenticating. (In the prototype a sidebar "Field validation: Normal / Error" switch toggles these states on all three auth screens.)

### 3. Register
**Purpose:** create account via email.
**Layout:** centered column — same 56px rounded-16 icon tile as Login (no back button), centered "Tạo tài khoản" 26px/800, centered subtitle → 3 labeled stacked fields (each with a 13px/700 label above: Email, Mật khẩu, Xác nhận mật khẩu — same input style as Login) → Primary button "Đăng ký" → bottom link "Đã có tài khoản? Đăng nhập".
**States:** per-field labels + inline errors under the field (danger border + `error` icon): "Email này đã được sử dụng", "Mật khẩu phải từ 8 ký tự trở lên", "Mật khẩu xác nhận không khớp". In the normal state the password field shows a neutral hint instead ("Tối thiểu 8 ký tự, gồm chữ và số"). Button spinner on submit.

### 3b. Forgot Password
**Purpose:** recover access via email reset link.
**Layout:** same centered icon-tile header as Login/Register (no back button) → "Quên mật khẩu?" 26px/800 centered → subtitle → labeled Email field → Primary button "Gửi liên kết đặt lại" → bottom link "Đã nhớ mật khẩu? Đăng nhập".
**Behavior:** submit shows a confirmation snackbar and returns to Login.
**States:** labeled Email field with inline error "Không tìm thấy tài khoản với email này" (danger border + `error` icon); button spinner while sending.

### 4. Dashboard (most important screen)
**Layout, top to bottom, 16px side padding:**
1. Header row: "Xin chào 👋" (13px secondary) + first name (19px/700) left; month chip "Tháng 7, 2026" (pill, Surface Alt) right.
2. **Over-budget alert banner** (only rendered when at least one category is over its limit): warning-tint row, `warning` icon + "<Category> đã vượt ngân sách N%" + "Xem lại hạn mức cho danh mục này" + chevron → Budget. Text and visibility are derived from live budget data.
3. **Hero savings card**: gradient Primary→accent, radius 24, padding 22. Mono-label "TIẾT KIỆM THÁNG NÀY" (11px, 70% white, letterspaced) → big amount `26.500.000 ₫` (30px/800, IBM Plex Mono, white) → 2-up row of translucent-white mini stats: "Thu nhập" `45.000.000` / "Chi tiêu" `18.500.000`.
4. **Quick actions row**: 4 equal cards (icon + 10.5px label) — Ghi chi (danger) → Add Expense, Ghi thu (success) → Add Income, Lịch sử (primary) → Transaction History, Báo cáo (warning) → Reports.
5. **Budget summary row** (tappable → Budget screen): circular progress ring (conic-gradient, Primary for the used arc) with the used % centered, label "Ngân sách tháng" + "Đã dùng N% · còn X ₫", chevron. **All three figures derive from the live budget list** (sum of limits vs sum spent).
6. **Savings goal card**: `flag` icon (success) + "Mục tiêu tiết kiệm 2026" + % right-aligned, progress bar, and "159.000.000 ₫ / 300.000.000 ₫" in mono beneath.
7. **Category pie card**: donut (conic-gradient, category palette) with total `18.5M` centered, legend list (dot + label + %) to the right — categories: Ăn uống 32%, Shopping 22%, Đi lại 16%, Giải trí 12%, Gia đình 12%, Khác 6%.
8. **Daily spend bar card**: 14 thin vertical bars, color-coded (green=low, primary=mid, red=high day).
9. **Recent Transactions**: header row "Giao dịch gần đây" + "Xem tất cả" link → Transaction History. List of up to 10 rows: 42px rounded-12 icon tile (category tint bg/icon color) + name (truncate) + "category · date" (11.5px tertiary) + amount right-aligned in IBM Plex Mono, **green with `+` prefix for income, red with `-` prefix for expense**.
10. FAB (see Global Chrome) always visible, bottom-right.
**States:** Empty (no transactions) — centered illustration icon `receipt_long`, "Chưa có giao dịch nào" + CTA hint. Loading — shimmer blocks in place of chart and each list row.

### 5 & 6. Add Expense / Add Income (implemented as one unified screen, entry point sets default tab)
**Layout (top to bottom):** header with `close` icon-button (returns to Dashboard) + title — **"Thêm giao dịch" for a new entry, "Sửa giao dịch" when opened from an edit action**. Then a segmented control (Surface Alt track, radius 14): **Chi tiêu** / **Thu nhập** — active segment is white/Surface with a colored label (danger for expense, success for income).
- **Amount hero card** (leads the form): floating card, mono-label "SỐ TIỀN", then a large inline amount — a 20px sign glyph (**−** for expense, **+** for income) + 32px/800 IBM Plex Mono value with live "." thousands separators + 18px "₫". The sign and value take the semantic color (danger / success) once a value is entered, Text Tertiary while empty. Beneath: a row of 4 quick-amount chips (50K / 100K / 200K / 500K, 44px tall, mono) that fill the field; the matching chip highlights in Primary tint.
- **Chi tiêu tab:** "Danh mục" label with the selected category name right-aligned ("Chưa chọn" until picked) → 4-column grid of 8 category cards (icon 22px + 10.5px label, radius 16, selected = 2px colored border + tint bg): Ăn uống(restaurant)/Shopping(shopping_bag)/Đi lại(directions_car)/Giải trí(sports_esports)/Y tế(medical_services)/Gia đình(home)/Du lịch(flight)/Thú cưng(pets).
- **Thu nhập tab:** "Nguồn thu" label → **2-column grid** of 4 source cards (icon + label + radio checkmark, 48px tall), selected = 2px Primary border + tint: Lương(payments)/Freelance(laptop_mac)/Bonus(redeem)/Khác(more_horiz).
- **Details card** (both tabs): one grouped card with divider rows — **Ngày** row (leading `event` icon in Primary, trailing date value + expand chevron; opens the date-picker bottom sheet) and **Ghi chú** row (leading `notes` icon, inline text input, optional).
- **Save button**: full-width Primary, label **"Lưu giao dịch"** for a new entry / **"Cập nhật"** when editing. Disabled at 45% opacity until a category/source AND an amount are set; while disabled, a centred hint line beneath states exactly what is missing (e.g. "Chọn danh mục và nhập số tiền để lưu").

**Date-picker bottom sheet:** tapping the date chip opens a bottom sheet (scrim + slide-up, same pattern as the Calendar day sheet) titled "Chọn ngày" with a close (`×`) button, prev/next month arrows, weekday header, and a tappable day grid — **any past or future date is selectable**, not just today. Selected day = filled Primary circle; today (if not selected) = Primary outline ring. Tapping a day selects it and closes the sheet; the date chip label updates to "Hôm nay, DD/MM" for today or "DD/MM/YYYY" otherwise.

**Interaction:** the Add Transaction screen itself is presented as a bottom-sheet-style push (slide-up translateY, ~280ms ease). On save → snackbar + return to Dashboard, fields reset.
**States:** validation only (button disabled state); no separate empty/error state needed.

### 7. Calendar
**Layout:** header row with prev/next month arrow buttons flanking a centered month label 19px/700 + a "Tổng chi: X ₫" subtitle — **both the total and the two stat cards below are derived from live daily data**, so they follow any edit/delete. **Month is navigable to any past or future month.** Below, a floating card (radius 20, shadow) contains: 7-column weekday header (T2..CN), the day grid (leading blank cells for month-start alignment; today gets a 2px primary outline), and a 3-dot legend row (red/primary/green = Chi nhiều/Trung bình/Chi ít) under a divider. Each day cell: rounded-12 square, day number (12.5px/700) + abbreviated amount (8.5px mono, e.g. "1.2M", "250K", "—" for zero) — **tinted red for high-spend (≥1,000,000₫), green for low-spend (>0 and ≤300,000₫), primary for mid-range, neutral surface-alt for 0**. Below the calendar card: two mini stat cards (Trung bình/ngày, Ngày chi nhiều nhất) and a "Top ngày chi tiêu" ranked list (top 3 days, numbered badge + date + amount).
**Day bottom sheet:** tapping a day opens a sheet (scrim fade + slide-up, radius 28 top corners, pinned to the viewport, min 38% / max 80% screen height) with:
- Header: full date "Ngày DD/07/2026" (17px/800) + "N giao dịch · <day total>" and a 36px close button.
- A mono hint line "CHẠM ĐỂ SỬA · N MỤC" (only when the day has transactions).
- One **grouped scrollable list** of compact divider rows (~52px each, so many transactions fit): icon tile + name + category + amount, with a 44×44px trailing `delete` icon button. **Tap the row → the Add/Edit Transaction screen, prefilled and titled "Sửa giao dịch"**; saving there returns to Calendar **with this sheet still open** and every derived figure (row, day total, grid cell + tint, month total, stat cards, top-days list) recalculated.
- `delete` opens the shared confirm dialog before removing the row; the calendar figures update the same way.
- A pinned Primary "Thêm giao dịch" CTA at the bottom of the sheet; tap the scrim to dismiss.
**States:** Loading = skeleton grid (all cells shimmering) in place of the day grid; empty day = illustrated `receipt_long` state ("Không có giao dịch ngày này") inside the sheet.

### 8. Reports
**Layout:** title "Báo cáo" → segmented control **Tuần / Tháng / Năm** (same segmented style as Add Transaction) → 2×2 grid of mini stat cards (Top danh mục, TB mỗi ngày, Ngày chi nhiều nhất [danger color], Tỷ lệ tiết kiệm [success color]) → Pie chart card (same donut + legend pattern as Dashboard) → weekly Bar chart card (4 bars, labeled T1–T4).
**States:** Loading = shimmer per chart card; Empty = light illustration when a period has no data. Filterable by period tab (Week/Month/Year) — swapping tabs should animate chart values (~400ms).

### 9. Budget
**Layout:** title "Ngân sách" + `add_circle` icon button top-right (→ Add Budget); subtitle "Tổng ngân sách: X ₫ · Đã dùng N%" — **both figures derived from the live budget list**, so they follow every edit/delete. Stacked budget cards per category, each **tappable → Edit Budget** (icon + label + colored % + chevron, then a rounded progress bar, then "used / budget" amounts in mono under the bar). **Card flips to danger-tint background + red border + red bar when used > budget.**
**States:** Empty = CTA to set the first budget when the list is blank.

### 9c. Edit Budget
**Purpose:** adjust or remove the monthly limit of an existing category.
**Layout:** `close` header + "Sửa ngân sách" title → **read-only category summary card** (icon tile + category name + "Đã chi X ₫") → "Hạn mức tháng" labeled amount input (same style as Add Budget) with an inline warning when the new limit is **below what's already spent** ("Hạn mức thấp hơn số đã chi — danh mục sẽ báo vượt") → a row of 4 preset chips (2M / 3M / 5M / 8M, 44px) → Primary **"Cập nhật"** (disabled while the amount is 0) → destructive **"Xóa ngân sách này"** button (danger tint) which opens the shared confirm dialog.
**Behavior:** saving returns to Budget with that card's %, bar color, and the screen summary recalculated live; deleting removes the category from the list entirely. The category and spent amount are intentionally read-only — to change category, delete and create a new budget, so recorded spending isn't misattributed.
**States:** validation only (disabled save; inline over-spend warning).

### 9b. Add Budget
**Purpose:** set a new monthly limit for a category that doesn't have one yet.
**Layout:** header with `close` icon-button (→ back to Budget) + "Thêm ngân sách" title → "Danh mục" label → the same 4-column category grid used in Add Expense → "Hạn mức tháng" label → large amount input (same style as Add Transaction's amount field) → Primary "Lưu ngân sách" button, disabled until a category and a non-zero amount are set.
**Behavior:** presented as a full-screen push (not a bottom sheet, since this is a setup action rather than a quick log). On save → snackbar + return to Budget.
**States:** validation only (button disabled state).

### 10. Income Management
**Layout:** title "Thu nhập" + add icon top-right. Horizontal scrollable month chips (active = Primary fill). List of income rows: 42px rounded-12 success-tint icon tile + label + date, amount right-aligned green with `+` prefix.
**Interaction:** tap a row to open it pre-filled in Add Transaction (Income tab) for editing. Swipe a row left to reveal a red delete button (only rendered once swiped, so it never peeks behind a closed row); tapping it opens the confirm-delete dialog before removing the row.
**States:** Empty per selected month when no income recorded.

### 11. Transaction History
**Layout:** title, then a search bar (Surface Alt, `search` icon + text input) + adjacent filter icon-button (`tune`, turns Primary-filled when the filter panel is open). Expandable filter panel: chip row (e.g. "Tuần này", "Ăn uống", "Trên 500K", "Chỉ chi tiêu" — represent Date/Category/Amount range/Type filters). Below: full transaction list (same row style as Dashboard's recent list, longer).
**States:** distinct Empty ("Không tìm thấy giao dịch" for a no-results search, `search_off` icon) vs Loading (shimmer rows).
**Interaction:** tap a row to open it pre-filled in Add Transaction for editing (expense or income, matching its original type). Swipe a row left to reveal a red delete button (only rendered once swiped — never visible behind a closed row); tapping it opens the confirm-delete dialog before removing the row. Same swipe/tap/delete pattern as Income Management, implemented once and reused.

### 12. Profile
**Layout:** title "Hồ sơ". Identity card: 56px circular avatar (initials fallback, Primary bg, white text) + name + email, with an edit icon-button (→ Edit Profile). Menu card (radius 20): Dark mode row with a toggle switch first, then rows for Thông báo (value "Bật"), Đơn vị tiền tệ ("VNĐ"), Ngôn ngữ ("Tiếng Việt"), Ngân sách → Budget, **Danh mục → Category Management**, Quản lý thu nhập → Income Management, Cài đặt → Settings (each: leading icon, label, optional trailing value text, trailing chevron). Danger-tint "Đăng xuất" button full-width at the bottom.
**Behavior:** the Dark Mode toggle here flips the whole app's theme instantly.

### 12b. Edit Profile
**Purpose:** update personal info and avatar.
**Layout:** close button → Profile (discards draft) + "Chỉnh sửa hồ sơ" title → centered 84px avatar with a camera-badge overlay + "Đổi ảnh đại diện" link → labeled fields, each on its own row: Họ, Tên, Số điện thoại, Email, Địa chỉ (labeled "không bắt buộc") → Primary "Lưu thay đổi" button, disabled until Họ/Tên/SĐT/Email are filled.
**Behavior:** Save writes back to the Profile card and Dashboard greeting, shows a confirmation snackbar, returns to Profile. In Flutter, the avatar tap opens an image picker and uploads to Supabase Storage.
**States:** validation only (button disabled state).

### 13. Settings
**Layout:** title "Cài đặt" (no back button — reachable via the bottom nav, which also shows on this screen). Grouped into 3 labeled sections, each its own card with divider rows: **Chung** (Giao diện — tap to expand inline Sáng/Tối picker; Ngôn ngữ — tap to expand inline Tiếng Việt/English picker), **Dữ liệu** (Sao lưu dữ liệu, Quyền riêng tư), **Hỗ trợ** (Về ứng dụng "v1.0.0", Góp ý, Điều khoản). Value column is fixed-width and right-aligned so rows stay aligned regardless of value text length.
**States:** static content aside from the two expandable pickers; no empty/loading needed.

### 14. Category Management
**Purpose:** view and manage the user's expense categories.
**Layout:** back arrow + "Danh mục" title + `add_circle` icon button top-right; subtitle "N danh mục chi tiêu · chạm để sửa". One grouped card of divider rows: 38px rounded-11 icon tile (background = the category's own color at 13% opacity, icon in that color) + name + "N giao dịch tháng này" / "Chưa có giao dịch" + chevron. Below the card, a full-width Primary "Thêm danh mục mới" button (same Primary Button style as every other screen: 52px, radius 16).
**Interaction:** tap a row → Edit Category; + or the CTA → Create Category.
**States:** Empty when every category has been deleted (only the CTA remains).

### 14b. Create / Edit Category
**Purpose:** create a new expense category, or rename / restyle an existing one.
**Layout:** `close` header + title (**"Thêm danh mục"** for new / **"Sửa danh mục"** when editing) → **live preview card** (64px rounded-18 tile tinted with the chosen color + chosen icon, the typed name, caption "Xem trước") → "Tên danh mục" labeled text field → "Màu nhận diện": 6 circular 44px swatches from the palette (`#4F46E5 #F59E0B #22C55E #F43F5E #8B5CF6 #0EA5E9`), selected shows a white check + ring → "Biểu tượng": a horizontally scrollable chip group of icon families (Ăn uống / Mua sắm / Di chuyển / Sinh hoạt / Khác) with the count of icons in that family right-aligned, then a card holding a **5-column icon grid** (Material Symbols Rounded; selected cell gets a 2px border + tint in the chosen color) → Primary **"Tạo danh mục" / "Cập nhật"** → (edit mode only) destructive **"Xóa danh mục này"** which opens the shared confirm dialog ("Xóa danh mục?" / "Các giao dịch cũ vẫn giữ nguyên nhưng sẽ chuyển sang nhóm ĐKhácĐ." / `category` icon).
**Behavior:** the preview updates live with name/color/icon. Saving returns to Category Management with a confirmation snackbar, and the new or renamed category **immediately appears in the Add Expense category grid** — which also carries a dashed "Thêm" tile as a shortcut into this screen.
**States:** save disabled until a name is entered; inline error "Tên danh mục này đã tồn tại" (danger border + `error` icon) on a duplicate name.
**Rationale:** colors are restricted to the existing palette rather than a free color picker so the pie/donut charts stay harmonious, and icons are grouped into families instead of one endless grid.

### 15. Messages & Feedback Kit (component catalog, not a user-facing screen)
**Purpose:** single reference screen cataloging every notification/alert/feedback pattern used across the app, for consistent implementation.
**Layout:** close button → Dashboard, then stacked labeled sections: **Push Notification** (system-style banner preview) → **Snackbar/Toast** (4 semantic variants: success/error/warning/info, always dark pill per Material convention) → **Alert Banner** (4 variants, tinted background per semantic color + icon + title + description + dismiss — intentionally no colored left border, to avoid the generic-AI-card look) → **Validation Messages** (error-state and success-state text field with inline helper text) → **Confirmation Dialog** (static preview of the delete-confirm pattern) → **Notification Center** (list rows with icon, title, timestamp, unread dot) → **Button Feedback States** (normal / loading-spinner / success-confirmed button).
**Reuse:** Snackbar styling matches the real in-app snackbar; the Confirmation Dialog preview matches the real delete-confirm modal (centered circular danger icon badge, centered title/body, Hủy + Xóa pair) — **its title, body and icon switch on what is being deleted**: giao dịch (`delete_forever`), khoản thu, or ngân sách ("Xóa ngân sách?" / "Danh mục này sẽ không còn được theo dõi hạn mức." / `wallet`). Alert Banner tinted style matches the Dashboard over-budget banner and the Budget over-limit card — implement each pattern once in Flutter and reuse everywhere on this list.

---

## Interactions & Animation Summary
- Page transitions: slide-from-right when drilling in (Login→Register, Profile→Settings), duration 250–300ms ease.
- Card entrance: fade + slight slide-up, ~250ms, on screen mount.
- Bottom sheets (Add Transaction, Calendar day list): translateY slide, ease, ~280ms; scrim fades with it.
- Button press: scale to 0.97, ~150ms.
- Progress bars / rings: animate width or arc on mount, ~300ms ease-out.
- Toggle switches: knob position transitions ~200ms.
- All durations should land in the 200–350ms range per the product brief — nothing snappier or slower.

## State Management (Flutter)
Track globally: `currentUser`, `theme (light/dark)`, `currentMonth`. Per-flow local state: `AddTransaction` (type, category/source, amount, date, note, saving/validity), `Calendar` (selectedDay, sheet open), `Reports`/`History` (period/filter selections), `Profile` (toggles). Data comes from Supabase Postgres tables for transactions/budgets/income sources, Supabase Auth for session, Realtime for live balance updates across devices.

## Assets
No custom illustrations or photography used — all iconography is Material Symbols Rounded (map to Flutter's Material icon set). No external images to source.

## Files
- `Finance App Prototype.dc.html` — the full interactive reference. Open directly in a browser to click through it. It contains all screens documented above (13 numbered screens plus Language Select, Forgot Password, Add Budget, Edit Budget, Edit Profile, Category Management, Create/Edit Category, and the Messages & Feedback Kit), light + dark mode, a Normal/Empty/Loading state switcher, a Splash Loading/Error/Offline switcher, an auth field-validation switcher, and a per-screen annotation panel restating each screen's purpose, flow, components, states and notes.
- `Spendly Logo.dc.html` — three app-icon / logo directions (Coin S, Budget Ring, Stack Up), each with gradient icon, light and dark monochrome variants, size-down steps, wordmark lockup, home-screen and splash placements, plus export specs (iOS 1024×1024, Android adaptive safe zone, in-app SVG, minimum sizes, clear space). **A direction has not been chosen yet** — the prototype still uses the interim `savings` glyph.

## Derived vs static data (important for implementation)
The prototype deliberately drives cross-screen figures from shared state rather than hardcoding them, and the Flutter build should preserve those relationships:
- **Daily amounts** drive the calendar grid + tints, month total, avg/day, highest-spend day, top-3 days list, and each day sheet's contents & total.
- **Budget list** (limits + spent) drives the Budget screen summary, each card's % / bar / over-budget styling, the Dashboard budget ring + "còn X ₫", and whether the Dashboard over-budget banner appears at all.
- **Category list** drives the Add Expense category grid, the Category Management rows and count, and each transaction row's icon + tint.
- Mock monthly spend sums to exactly **18.500.000 ₫** so Calendar, the Dashboard hero card, and the category donut agree.
