# API DOCUMENTATION — MẦM Phase 2

Tất cả mutation JSON phải dùng `Content-Type: application/json`, same-origin và request body giới hạn. Hầu hết response riêng tư đặt `Cache-Control: no-store`. API errors trả JSON `{ "error": "..." }`.

## Public APIs

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/school-support` | Chỉ hồ sơ active+verified, phone/email theo từng consent. |
| GET | `/api/appointments/slots?contactId=<uuid>` | Slot tương lai có status available. |
| POST | `/api/appointments` | Tạo yêu cầu hỗ trợ/đặt lịch. Cần `consent:true`; manual date + time window tạo pending request. |
| POST | `/api/appointments/:id/cancel` | Hủy bằng `cancellationToken`. |
| PATCH | `/api/appointments/:id` | Yêu cầu đổi lịch bằng token; trở về pending. |
| POST | `/api/cron/purge-support-data` | Trusted scheduler, cần `Authorization: Bearer <CRON_SECRET>`. |

### POST `/api/appointments`

Fields: `contactId`, optional `slotId`, optional `requesterName`, `requesterPhone`, `requesterEmail`, `note`, required `topic`, required `preferredMode`, `requestedDate` + `requestedTimeWindow` when no `slotId`, `consent:true`. Phone values are normalized to VN E.164. Contact info/note are encrypted. Response returns `id`, `status`, `createdAt`, one-time `cancellationToken`.

## Staff authentication

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/staff/auth` | Login with `email`, `password`; sets HttpOnly session cookie. |
| GET | `/api/staff/auth` | Current staff summary. |
| DELETE | `/api/staff/auth` | Logout and clear session cookie. |

## Staff/admin APIs

| Method | Path | Allowed roles / purpose |
|---|---|---|
| GET/POST | `/api/staff/contacts` | Super Admin/Admin list/create contact. |
| PATCH/DELETE | `/api/staff/contacts/:id` | Super Admin/Admin update or deactivate; updates revoke verification. |
| POST | `/api/staff/contacts/:id/verify` | Super Admin/Admin verification attestation + independent avatar/phone/email consent flags. |
| GET/POST | `/api/staff/slots` | GET/POST schedule slots; Admin/Super Admin can choose contact, teacher/counselor only own assigned contact. |
| DELETE | `/api/staff/slots/:id` | Close an available slot; never release reserved slots. |
| GET | `/api/staff/appointments` | Admin sees operations queue; teacher/counselor sees assigned contact only. |
| PATCH | `/api/staff/appointments/:id` | Confirm/reject pending; complete confirmed; same assignment scope. |
| GET/POST | `/api/staff/users` | Admin/Super Admin list/create accounts. Super Admin creation only by Super Admin. |
| PATCH | `/api/staff/users/:id` | Admin/Super Admin update users; Super Admin protection. |
| GET | `/api/staff/audit` | Admin/Super Admin recent access/change metadata. |
| GET | `/api/support-requests` | Legacy unresolved request queue, Admin/Super Admin only. |
| POST | `/api/support-requests` | Deprecated; returns 410 and directs to School Support Center. |

## Roles

- `super_admin`: full system administration; only Super Admin can create/grant this role.
- `admin`: directory, staff accounts excluding Super Admin changes, audit, operational queue.
- `school_counselor`, `teacher`: assigned `support_contact_id` scope.
- `content_manager`, `technical_operator`: roles defined; no knowledge CMS or support payload access implemented in this release.

## Error/status codes

- `400`: invalid schema or invalid state transition.
- `401`: no staff session / unauthorized cron.
- `403`: role/scope/origin violation.
- `410`: deprecated legacy POST route.
- `413`: request body too large.
- `429`: process-local rate limit.
- `503`: missing DB/secret/provider or unavailable dependency.

The database transaction and role checks are source-implemented but not integration-tested in this environment; consult `TESTING.md`.
