# FEATURES — MẦM Phase 2

Trạng thái mô tả source code trong ZIP; không đồng nghĩa đã được chạy trên môi trường production. Mọi phần `BLOCKED` được ghi rõ trong `TESTING.md`.

## Giữ lại từ phiên bản trước

| Feature | Status | Ghi chú |
|---|---|---|
| Chat khách và hội thoại nhiều lượt | Implemented in source | History chỉ user turns, tối đa 8; phiên giữ trong browser memory. |
| Safety deterministic + optional AI guardrail | Implemented in source | Không phải chẩn đoán; urgent path không phụ thuộc provider. |
| Check-in cảm xúc | Implemented in source | Không lưu thành hồ sơ cá nhân. |
| Resource library | Implemented in source | Data bundle tĩnh; operator cần review nội dung và nguồn. |
| Search không phân biệt dấu/bookmarks | Implemented in source | Bookmark lưu localStorage. |
| Help/privacy/about pages | Implemented in source | Nội dung cần cập nhật theo quy trình nhà trường. |

## Chức năng nâng cấp Phase 2

| Feature | Status | Ghi chú |
|---|---|---|
| School Support Center public directory | Implemented in source | DB-backed, chỉ hồ sơ active + verified. Rỗng nếu trường chưa nhập data. |
| Profile with role/department/topics/hours/modes/intake | Implemented in source | Admin CRUD; không gán chuyên môn chưa có căn cứ. |
| Verified phone + consent-gated public field | Implemented in source | Admin attestation; không phải OTP. Mọi sửa đổi thu hồi verification. |
| `tel:` call button and copy phone | Implemented in source | Người dùng chủ động nhấn, không auto call/SMS. |
| Search/filter | Implemented in source | Name/role/department/topics/mode/intake, accent-insensitive. |
| Voluntary support request | Implemented in source | Mỗi trường nhập rõ, consent, no chat/journal auto attach. |
| Encrypted private request fields | Implemented in source | AES-256-GCM; requires `DATA_ENCRYPTION_KEY`. |
| Real slots and manual pending requests | Implemented in source | Slot only if staff opens; manual time is pending, not confirmed booking. |
| Concurrent slot protection | Implemented in source | Advisory lock + overlap check + row lock + partial unique index. DB integration not run. |
| Student cancel/reschedule token | Implemented in source | Raw token shown once; only hash stored; student can later manage using request ID + token on Support Center. |
| Staff personal accounts/RBAC | Implemented in source | scrypt, HMAC cookie, role/contact scope; profile change/deactivation revokes linked counselor/teacher account and sessions. MFA not included. |
| Staff queue / slot management | Implemented in source | Teacher/counselor scoped; admins manage all. |
| Audit list | Implemented in source | Metadata events only; no chat or notes. |
| Retention endpoint | Implemented in source | Needs trusted daily scheduler; not automatic until configured. |
| AI Orchestrator | Implemented in source | Rule-based module prompt routing using one provider pipeline. No student profile. |
| Journal local-only | Implemented in source | Search/delete/export; not sent to AI. Device-shared risk remains. |
| Student tools | Implemented in source | Grounding/task-split/reflection practice. No diagnosis/scoring. |

## Partial / not implemented

| Feature | Status | Reason |
|---|---|---|
| Content CMS | Not implemented | Resource data remains code-managed; no false admin UI was added. |
| RAG / semantic knowledge retrieval with citations | Not implemented | No curated source corpus / embedding store provided. AI knowledge mode is prompt routing only. |
| AI answer ratings/feedback module | Not implemented | No durable feedback backend/privacy specification. |
| Persistent AI conversation summarization | Not implemented | Chat is browser-memory only, max 8 prior student turns. |
| Streaming responses | Not implemented | Current provider returns a complete response. |
| Human support recommendation from AI | Partial | Orchestrator adds human-support prompt intent; it does not automatically match people or transfer data. Student chooses directory manually. |
| Real-time calendar sync | Not implemented | Staff opens slots manually; no school calendar provider supplied. |
| Notifications/reminders/email/SMS/push | Not implemented | No sender/provider/consent/operational configuration available. |
| PWA/offline install | Not implemented | Not part of tested delivery. |
| Content manager workflow | Not implemented | `content_manager` role exists but no CMS page/API. |
| MFA/SSO | Not implemented | Individual staff credentials exist, but enterprise identity required before production. |
| Shared multi-instance rate limiting | Not implemented | In-process limiter only; use WAF/Redis externally. |
| Automated key rotation | Not implemented | `DATA_ENCRYPTION_KEY` rotation needs an explicit re-encryption process. |
| Independent contact OTP verification | Not implemented | Current verification is documented admin attestation only. |

No demo teacher or telephone record is seeded into the directory.
