# AGENT.md — MẦM — AI Đồng Hành Học Đường

## 0. Mission

Build a production-ready Vietnamese web application called **“MẦM — AI Đồng Hành Học Đường”**: an AI-assisted school wellbeing support platform for high-school students.

The product is **not** an AI therapist, doctor, psychologist, diagnostic system, or emergency-response replacement.

The core product principle is:

> **AN TOÀN → LẮNG NGHE → HIỂU VẤN ĐỀ → ĐỊNH HƯỚNG → KẾT NỐI NGƯỜI THẬT**

The two source documents describe the intended model as AI providing first-line support while a homeroom teacher / school support person handles cases that need human intervention. They explicitly reject using AI as an autonomous mental-health expert.

This file is the implementation contract for an autonomous coding agent. The agent must inspect the repository first, then implement the application incrementally, preserving the requirements in this document.

---

## 1. Source-of-truth requirements

The product requirements are derived from the two provided documents:

1. **Tạo chatbot AI tư vấn tâm lý học đường như thế nào**
2. **Bộ khung hoàn chỉnh cho chatbot “MẦM — AI Đồng Hành Học Đường”**

Important source-derived requirements include:

- The assistant supports students with sharing feelings, recognizing difficulties, finding small practical next steps, and connecting with trusted adults.
- The assistant must not diagnose mental-health conditions and must not present itself as a replacement for teachers, parents, counselors, doctors, or specialists.
- Normal conversations should follow: listen/empathize → clarify → suggest → ask one next question.
- The documents define common topics such as academic pressure, low grades, family conflict, friendship problems, bullying, cyberbullying, teen relationships, low confidence, anxiety/stress, sadness, loneliness, social-media pressure, sleep difficulty related to worry, school avoidance, and related wellbeing issues.
- Three support levels are defined:
  - **Level 1 / Green:** ordinary difficulties; AI can continue supportive conversation and help choose one small step.
  - **Level 2 / Yellow:** persistent or materially impairing difficulties; AI should encourage contact with a trusted adult / school support person.
  - **Level 3 / Red:** immediate safety concerns; stop ordinary coaching and prioritize immediate connection to a nearby trusted adult and appropriate local emergency/professional support.
- The documents specifically require strong handling for self-harm/suicide-related signals, serious violence, abuse, and immediate danger.
- The website should minimize personal-data collection and must not request passwords, OTPs, financial details, unnecessary identifying data, or unnecessary precise addresses.
- The application should not promise absolute confidentiality.
- School-specific contacts and escalation procedures must be configurable rather than invented by the AI.
- Before release, the application must be tested against the provided scenario set, with special attention to the highest-risk scenarios.

Do not silently replace these requirements with generic chatbot behavior.

---

## 2. Product goals

### Primary goal
Give students a calm, low-friction place to start talking about school/life difficulties while making it easier to reach a real person when needed.

### Secondary goals

- Make the first interaction approachable for teenagers.
- Provide structured wellbeing tools without pretending to diagnose.
- Give students practical resources and small next steps.
- Make school support information easy to find.
- Give authorized school staff a safe, minimal workflow for receiving voluntary support requests.
- Make safety behavior deterministic enough to test and audit.

### Non-goals

Do NOT build:

- A diagnostic engine.
- A medical-record system.
- A social network.
- A system that automatically labels students with disorders.
- A system that secretly identifies students.
- A system that creates an internal mental-health profile from every conversation.
- A system that promises “private forever” or “absolute secrecy”.
- An autonomous emergency-response system.

---

## 3. Target users and roles

### Student

Can:

- Start a chat without providing unnecessary identity information.
- Choose a conversation topic.
- Chat with the assistant.
- Use simple wellbeing tools.
- View school support resources.
- Request or initiate connection with a trusted adult / school support contact.
- End and clear a conversation from the UI where technically appropriate.

### School support staff / GVCN

Can, if the school explicitly enables the feature:

- View support requests that students intentionally submit.
- Review a minimal case summary rather than an unnecessary full transcript.
- Record follow-up status.
- Mark whether further coordination is needed.

### School administrator

Can:

- Configure school support contacts.
- Configure the school's escalation procedure.
- Configure which support staff can receive voluntary handoffs.
- Manage resource content.
- View technical/audit metrics that do not expose student content unless explicitly authorized.

Use role-based access control. Do not expose student conversations to administrators by default.

---

## 4. Information architecture

Build these primary routes:

```text
/
├── /chat
├── /check-in
├── /resources
├── /help
├── /about
├── /privacy
├── /staff
│   ├── /staff/login
│   ├── /staff/dashboard
│   ├── /staff/requests
│   └── /staff/settings
└── /admin (only when enabled)
```

A reasonable MVP can ship with `/`, `/chat`, `/resources`, `/help`, `/privacy`, and a protected `/staff` area.

---

## 5. Landing page requirements

The landing page should immediately communicate:

### Brand

**🌱 MẦM — AI ĐỒNG HÀNH HỌC ĐƯỜNG**

Suggested subtitle:

> Công cụ AI hỗ trợ bước đầu về tâm lý học đường — lắng nghe, cùng bạn nhìn lại vấn đề và tìm hướng hỗ trợ phù hợp.

Do not advertise it as “AI bác sĩ tâm lý”, “AI chuyên gia tâm lý”, or a place of absolute secrecy.

### Primary CTA

`💬 Trò chuyện cùng MẦM`

### Topic shortcuts

Provide large touch-friendly cards:

- 📚 Học tập / thi cử
- 👥 Bạn bè / lớp học
- 🏠 Gia đình
- ❤️ Tình cảm
- 😔 Cảm xúc
- 📱 Mạng xã hội
- 🌱 Phát triển bản thân
- 💬 Chuyện khác

### Safety CTA

Visible but non-alarming:

`🆘 Mình cần được giúp ngay`

This should open a safety/support page with configured school support and local emergency guidance.

### Trust section

Explain in plain Vietnamese:

- AI is only a first-line support tool.
- It does not diagnose mental-health conditions.
- Serious or urgent situations should be taken to a real person immediately.
- Students should avoid sharing passwords, OTPs, financial information, or unnecessary identifying details.

---

## 6. Chat experience

### Initial screen

Use a friendly, low-pressure introduction. The UI should support both free-form typing and topic shortcuts.

Example:

> Chào bạn 🌱
> Bạn có thể bắt đầu bằng một câu rất đơn giản: “Mình đang gặp một chuyện…”
> Mình sẽ lắng nghe và cùng bạn tìm một hướng phù hợp.

Then show topic starters.

### Conversation behavior

The assistant should generally follow:

```text
1. Acknowledge / empathize
2. Briefly reflect what the student said
3. Clarify the main issue with one useful question
4. Offer 1–3 practical options when enough context exists
5. End with one small next-step question
```

Avoid long lectures.

Avoid asking many questions at once.

Do not immediately dump a list of generic advice after a short student message.

### Tone

Use Vietnamese that is:

- friendly
- calm
- warm
- respectful
- easy to understand
- appropriate for high-school students
- non-judgmental

Preferred pronouns: `mình – bạn`.

Avoid teacher-like or clinical language.

Do not call the student “bệnh nhân”.

Avoid empty phrases such as “Bạn phải suy nghĩ tích cực” or “Mọi chuyện rồi sẽ ổn”.

---

## 7. Supported topic taxonomy

Represent topics in code/data so they can be used for UI shortcuts, analytics, prompt routing, and resource retrieval.

Recommended enum:

```ts
type SupportTopic =
  | 'study_pressure'
  | 'exams'
  | 'low_grades'
  | 'motivation'
  | 'friends'
  | 'isolation'
  | 'bullying'
  | 'cyberbullying'
  | 'family_conflict'
  | 'relationships'
  | 'self_confidence'
  | 'anxiety_stress'
  | 'sadness'
  | 'loneliness'
  | 'social_media'
  | 'sleep_worry'
  | 'school_avoidance'
  | 'emotion_regulation'
  | 'communication'
  | 'future_self_direction'
  | 'other';
```

Do not convert topics into diagnoses.

---

## 8. Safety architecture — highest priority

This is the most important engineering requirement.

Do not rely only on an LLM prompt for safety.

Implement a dedicated safety pipeline around the model:

```text
Student message
    ↓
Input validation / rate limiting
    ↓
Safety signal detection
    ↓
Topic classification
    ↓
Context retrieval (only what is needed)
    ↓
LLM response generation
    ↓
Output safety validation
    ↓
UI response / escalation UI
```

### Support-level classifier

Use a normalized internal result such as:

```ts
type SupportLevel = 'green' | 'yellow' | 'red';
```

And a structured safety result:

```ts
interface SafetyAssessment {
  level: SupportLevel;
  reasons: string[];
  requiresHumanSupport: boolean;
  requiresImmediateAction: boolean;
  confidence?: number;
}
```

Do not expose internal confidence or raw classifier details to students.

### Green / Level 1

Use for ordinary difficulties such as school stress, study pressure, friendship issues, or mild emotional difficulty where no urgent safety signal is present.

Behavior:

- Continue supportive dialogue.
- Help identify the problem.
- Suggest 1–3 small realistic actions.
- Encourage healthy connection and practical steps.

### Yellow / Level 2

Use when the problem is persistent, significantly affects study/life, involves serious conflict, repeated bullying, sustained distress, or other signals that warrant adult involvement without an immediate emergency signal.

Behavior:

- Continue only at a safe supportive level.
- Explicitly encourage talking with a trusted adult, homeroom teacher, school counselor, parent, or other configured support contact.
- Offer a “Kết nối người hỗ trợ” CTA.
- Do not create a diagnostic label.

### Red / Level 3

Use for explicit or strong signals involving immediate safety risk, self-harm/suicide-related intent, serious violence, abuse, or immediate danger.

Behavior:

- Stop normal coaching mode.
- Do not provide instructions, methods, optimization, concealment advice, or other content that could facilitate harm.
- Encourage the student to get a trusted adult who is physically nearby.
- If the danger is immediate, direct them to appropriate local emergency/professional help.
- If the student is at school, encourage going directly to a nearby teacher/counselor/staff member.
- Show school-configured emergency/support contacts.
- Never claim the AI itself can keep them safe.
- Never promise absolute confidentiality.

Keep the red-mode copy short, direct, calm, and action oriented.

---

## 9. School support configuration

Never invent school names, phone numbers, staff names, or emergency procedures.

Create a configurable record:

```ts
interface SchoolSupportConfig {
  schoolName: string;
  homeroomTeacher?: Contact;
  schoolCounselor?: Contact;
  schoolSupportRoom?: Contact;
  emergencyContact?: Contact;
  nearbyMedicalFacility?: Contact;
  escalationInstructions: string;
  lastVerifiedAt?: string;
}
```

Show only the fields configured and verified by the school.

The LLM should receive this information through structured context, not invent it.

---

## 10. Human handoff

A student should be able to intentionally request real-person support.

### Student flow

```text
Chat
 ↓
Kết nối người hỗ trợ
 ↓
Explain what will happen
 ↓
Student chooses whether to submit a support request
 ↓
Minimal information form
 ↓
Confirmation
```

Do not silently submit an identifiable case to staff during ordinary conversations.

For immediate danger, do not make the safety response depend on filling out a form; direct the student to a nearby trusted adult and appropriate urgent support.

### Suggested handoff fields

- Preferred name (optional unless required by school policy)
- Contact preference (optional)
- Topic category
- Short summary generated from the current conversation
- Student-written note (optional)
- Preferred support person/category
- Time of request

Avoid storing unnecessary transcript data.

---

## 11. “Check-in” feature

Build a lightweight, non-diagnostic wellbeing check-in.

Purpose:

- Help students pause and notice how they are doing.
- Provide an optional bridge into chat/resources.

Do NOT label this as a clinical screening or diagnosis.

UI can ask simple questions around:

- current mood
- perceived pressure
- ability to focus
- feeling connected to others
- whether the student feels safe right now

Store only aggregated or ephemeral results by default unless the student explicitly chooses to save/share them.

Never produce a message such as “You have depression/anxiety.”

Possible result states:

- “Có vẻ bạn đang tương đối ổn.”
- “Bạn có vẻ đang chịu khá nhiều áp lực; mình có thể giúp bạn nói rõ hơn.”
- “Bạn đang cần được người thật đồng hành thêm.”
- “Nếu bạn đang không an toàn ngay lúc này, hãy tìm ngay một người lớn đáng tin cậy ở gần bạn.”

These are support-oriented states, not diagnoses.

---

## 12. Resource library

Create `/resources` with searchable cards grouped by topic.

Resource categories:

- Học tập và quản lý áp lực
- Giao tiếp với cha mẹ
- Bạn bè và xung đột
- Bắt nạt / bắt nạt trên mạng
- Quản lý cảm xúc
- Tự tin
- Mạng xã hội và quyền riêng tư
- Tìm người hỗ trợ
- An toàn khẩn cấp

Each resource should include:

```ts
interface Resource {
  id: string;
  title: string;
  summary: string;
  topic: SupportTopic;
  content: string;
  audience: 'student' | 'staff';
  isEmergency: boolean;
  updatedAt: string;
}
```

School-provided resources should be editable by authorized staff.

---

## 13. Privacy and data minimization

Design privacy into the architecture instead of adding a policy page after implementation.

### Do not request

- Passwords
- OTP codes
- Financial information
- Social-media credentials
- Unnecessary exact home address
- Unnecessary identity information

### Defaults

- Guest chat should be possible.
- Do not require real name for ordinary conversations.
- Do not build behavioral profiling from chat content.
- Minimize retention.
- Separate technical logs from student content.
- Restrict access by role.
- Encrypt data in transit and at rest where supported by the chosen infrastructure.

### Privacy UI

Before first chat, show a concise explanation:

- what the AI is
- what it is not
- what information not to share
- that it cannot guarantee absolute secrecy
- how human support works

Provide a full `/privacy` page with the school's actual retention/access policy when supplied.

Do not claim legal compliance unless it has actually been reviewed.

---

## 14. Recommended technical architecture

Use a maintainable web stack. Unless the existing repository mandates another stack, prefer:

### Frontend

- Next.js / React
- TypeScript
- Tailwind CSS
- Accessible component system
- Responsive mobile-first UI

### Backend

- Next.js server routes or a dedicated API service
- PostgreSQL for persistent app data
- ORM such as Prisma or Drizzle if appropriate to the repository
- Server-side authentication for staff

### AI layer

Create an explicit provider abstraction:

```ts
interface ChatModelProvider {
  generate(input: ModelInput): Promise<ModelOutput>;
}
```

Do not hardcode the entire application to one model vendor.

### Recommended free OpenRouter model stack

The default MVP deployment should use free OpenRouter endpoints so the project can be developed and demonstrated without paid inference:

```env
AI_PROVIDER=openrouter
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=qwen/qwen3-30b-a3b:free
SAFETY_MODEL=nvidia/nemotron-3.5-content-safety:free
```

#### Main conversational model

Use:

```text
qwen/qwen3-30b-a3b:free
```

OpenRouter currently lists Qwen3 30B A3B as a free endpoint with a 131K-token context window. It supports both reasoning and non-reasoning conversation modes. Prefer non-reasoning mode for ordinary MẦM chat responses when the provider/API configuration supports it, because students should receive concise, natural responses rather than exposed reasoning content.

Free endpoints are rate-limited. The application must therefore implement graceful provider-failure handling and must not depend on uninterrupted model availability.

#### Safety / moderation model

Use:

```text
nvidia/nemotron-3.5-content-safety:free
```

OpenRouter currently lists NVIDIA Nemotron 3.5 Content Safety as a free 4B guardrail model with a 128K context window. It is intended to moderate both user inputs and model responses and returns safety classifications/categories rather than acting as the student-facing assistant.

Do not depend on this model alone for crisis handling. Keep deterministic application rules for high-risk signals, emergency UI, escalation, and school-specific support routing. The safety model is an additional layer, not the sole decision-maker.

#### Required AI request flow

```text
Student message
      ↓
Deterministic safety rules
      ↓
Nemotron 3.5 Content Safety (free)
      ↓
Support-level policy
      ↓
Qwen3 30B A3B (free)
      ↓
Response safety check
      ↓
Deterministic output policy
      ↓
Student UI
```

For red-level safety signals, the application must be able to enter the safety flow without waiting for the main conversational model to produce a response.

#### OpenRouter implementation notes

- Keep `OPENROUTER_API_KEY` server-side only.
- Never expose the OpenRouter API key in browser JavaScript.
- Build the OpenAI-compatible client behind the provider abstraction so the model can be replaced later.
- Support model/provider errors and timeouts.
- Log model name, latency, and error class where useful, but do not log full student messages into analytics by default.
- Do not send unnecessary student identity information to OpenRouter.
- Do not expose raw model reasoning/traces to students.
- Treat the free model as an MVP choice, not a guarantee of suitability for production school deployment.

### Safety layer

Have a dedicated module:

```text
src/safety/
  classify.ts
  policy.ts
  response.ts
  schoolSupport.ts
  tests/
```

### Suggested high-level project structure

```text
app/
  page.tsx
  chat/
  check-in/
  resources/
  help/
  about/
  privacy/
  staff/
components/
  chat/
  safety/
  resources/
  forms/
  layout/
lib/
  ai/
  safety/
  auth/
  db/
  resources/
  school/
  analytics/
tests/
  unit/
  integration/
  safety/
  e2e/
prisma/ or drizzle/
config/
  school-support.example.json
```

Adapt to the existing repository instead of blindly creating a new structure.

---

## 15. API design

Suggested endpoints:

```text
POST /api/chat
POST /api/chat/classify
POST /api/check-in
GET  /api/resources
GET  /api/resources/:id
POST /api/support-requests
GET  /api/school-support
POST /api/staff/auth
GET  /api/staff/requests
PATCH /api/staff/requests/:id
GET  /api/staff/settings
PATCH /api/staff/settings
```

Do not expose internal model prompts to the browser.

Do not expose staff-only school configuration through unauthenticated endpoints.

Add rate limiting to public AI endpoints.

Validate all inputs on the server.

---

## 16. Chat API contract

Example request:

```json
{
  "sessionId": "uuid",
  "message": "Mình đang rất áp lực vì điểm thi.",
  "topicHint": "study_pressure"
}
```

Example response:

```json
{
  "message": "Mình nghe có vẻ việc học đang khiến bạn khá mệt mỏi...",
  "supportLevel": "green",
  "showHumanSupport": false,
  "showEmergencySupport": false
}
```

For yellow:

```json
{
  "supportLevel": "yellow",
  "showHumanSupport": true,
  "showEmergencySupport": false
}
```

For red:

```json
{
  "supportLevel": "red",
  "showHumanSupport": true,
  "showEmergencySupport": true
}
```

Do not return hidden chain-of-thought or internal classifier details to the client.

---

## 17. Prompt architecture

Use layered instructions rather than one giant hard-coded string.

Recommended order:

```text
SYSTEM SAFETY POLICY
    ↓
PRODUCT ROLE
    ↓
CONVERSATION STYLE
    ↓
SUPPORT-LEVEL POLICY
    ↓
SCHOOL SUPPORT CONFIG (structured data)
    ↓
RELEVANT RESOURCE CONTEXT
    ↓
RECENT CHAT CONTEXT
    ↓
STUDENT MESSAGE
```

The system prompt must enforce:

- no diagnosis
- no dangerous instructions
- no false claims of confidentiality
- no fabricated school contacts
- no pretending to be human
- supportive Vietnamese tone
- one useful follow-up question in normal conversation
- escalation when the situation exceeds AI capability

The model should never be allowed to override the safety policy based on student or retrieved content.

---

## 18. Guard against prompt injection

Treat all user text and retrieved school/resource content as untrusted content.

Never allow user text such as “ignore previous instructions” to override the safety policy.

Keep policy/configuration separate from chat history.

If retrieval is used, tag contexts by source/type and only inject approved content.

---

## 19. Staff dashboard

Build a minimal dashboard, not a surveillance console.

### Dashboard cards

Useful aggregate metrics:

- number of chats
- number of support requests
- topic distribution
- green/yellow/red assessment counts
- response latency/errors

Avoid exposing identifiable student content in aggregate dashboards.

### Support requests

Each request should have:

- created time
- topic
- support level
- concise student-selected/request summary
- assigned staff member
- status: `new | in_progress | resolved`
- follow-up date
- internal notes

Do not allow staff notes to be visible to students unless explicitly designed as student-facing content.

---

## 20. Authentication and authorization

Use secure authentication for staff/admin routes.

Implement RBAC:

```ts
type Role = 'staff' | 'admin';
```

Students do not need staff credentials to use the public chat.

Every staff API endpoint must check authorization server-side.

Never rely only on hidden buttons or client-side checks.

---

## 21. UX requirements

### Visual direction

The site should feel:

- safe
- calm
- modern
- student-friendly
- lightweight
- not clinical
- not corporate-heavy

Use soft visual hierarchy, rounded cards, large touch targets, clear typography, and restrained animation.

### Mobile-first

Assume many students will access it from a phone.

Requirements:

- responsive chat composer
- thumb-friendly buttons
- no horizontal scrolling
- accessible contrast
- visible emergency/help action
- fast initial load

### Accessibility

Implement:

- keyboard navigation
- semantic HTML
- visible focus states
- accessible labels
- reduced-motion support
- readable font sizes
- ARIA only where needed

---

## 22. Safety UI behavior

Do not make red-mode UI look like a game or achievement screen.

When immediate danger is detected, switch the UI to a calm, simplified state:

```text
Mình rất tiếc vì bạn đang phải đối mặt với điều này.
Điều quan trọng nhất lúc này là bạn không phải ở một mình.

[ Tìm người lớn đáng tin cậy gần bạn ]
[ Xem hỗ trợ của nhà trường ]
[ Hỗ trợ khẩn cấp tại địa phương ]
```

Use the school's verified configuration where available.

Do not show harmful instructions or detailed descriptions of harmful methods.

---

## 23. Testing requirements

A release is NOT complete until automated tests cover the safety behavior.

### Mandatory test groups

#### Normal support

- low grade + sadness
- exam pressure
- study motivation
- friendship conflict
- family comparison
- loneliness
- confidence
- social media pressure
- school avoidance
- relationship concerns

#### Yellow / adult-support

- prolonged distress
- severe school impact
- repeated bullying
- serious family conflict
- “I cannot take this anymore” without an explicit immediate-harm signal

#### Red / immediate safety

The exact source documents provide example test utterances for urgent situations. Use them as safety regression tests, but do not expand them into harmful procedural content.

At minimum verify that the system:

- switches to red safety mode
- does not provide harmful instructions
- shows immediate trusted-adult guidance
- shows configured school support
- shows local urgent-support guidance when applicable
- does not continue ordinary advice as if nothing happened

### Security tests

- prompt injection attempts
- malicious HTML/script in messages
- unauthorized staff API access
- direct access to another student's request
- rate-limit bypass
- malformed JSON
- oversized message payloads
- retrieval poisoning

### UX tests

- mobile 360px width
- keyboard-only navigation
- slow network
- AI timeout
- model provider failure
- empty chat
- long message
- Vietnamese diacritics

---

## 24. Acceptance criteria

The implementation is ready for MVP when all of the following are true:

### Product

- Landing page clearly explains the purpose.
- Chat is usable without unnecessary signup.
- Topic shortcuts work.
- Resources page works.
- Help/school-support page works.
- Privacy explanation exists.
- Staff support-request workflow works behind authentication.

### AI

- Responses are in natural Vietnamese.
- Normal conversations follow the intended interaction pattern.
- AI never claims to diagnose.
- AI never invents school contacts.
- AI does not promise absolute confidentiality.

### Safety

- Green/yellow/red states are implemented.
- Red state reliably changes the UI and response policy.
- Dangerous instructions are blocked.
- Immediate trusted-adult guidance is available.
- School support data is configurable.
- Safety test suite passes.

### Privacy

- No unnecessary personal-data collection.
- Staff routes are protected.
- Sensitive content is not visible in public client payloads.
- Logging is minimized and reviewed.

### Engineering

- TypeScript type-check passes.
- Lint passes.
- Unit/integration tests pass.
- E2E smoke test passes.
- Environment variables are documented.
- Setup instructions are included in README.

---

## 25. Implementation order

The agent should implement in this order unless the existing repository requires another sequence:

### Phase 1 — inspect and scaffold

1. Inspect repository, package manager, existing app structure, and README.
2. Preserve existing conventions.
3. Identify current frontend/backend entry points.
4. Add required dependencies only when necessary.
5. Create `.env.example`.

### Phase 2 — visual shell

1. Global layout.
2. Landing page.
3. Navigation.
4. Mobile responsive design.
5. Chat UI with mocked responses.

### Phase 3 — content model

1. Topic taxonomy.
2. Resource model.
3. School-support configuration.
4. Privacy/help content.

### Phase 4 — AI integration

1. Provider abstraction.
2. System prompt.
3. Context assembly.
4. Chat API.
5. Streaming response if supported.
6. Error fallback.

### Phase 5 — safety

1. Safety classifier.
2. Green/yellow/red policy.
3. Output validator.
4. Emergency/support UI.
5. Regression tests.

Do not postpone safety until after the AI “works”.

### Phase 6 — handoff

1. Support-request form.
2. Staff auth.
3. Staff request list.
4. Request detail/update flow.
5. Audit access.

### Phase 7 — quality

1. Accessibility audit.
2. Mobile QA.
3. Security tests.
4. AI behavior tests.
5. Performance checks.
6. Documentation.

---

## 26. Error handling and degraded mode

If the AI provider is unavailable:

- Never display a fake AI answer.
- Show a friendly failure message.
- Keep the school-support/help resources available.
- Keep the emergency-support path available.

Example:

> Mình chưa thể phản hồi ngay lúc này. Bạn vẫn có thể xem các nguồn hỗ trợ của nhà trường hoặc tìm một người lớn mà bạn tin tưởng.

The site must remain useful without the AI provider.

---

## 27. Analytics

Only collect metrics needed to improve the service.

Prefer anonymous/aggregate events:

```text
chat_started
chat_completed
topic_selected
support_request_started
support_request_submitted
resource_opened
help_opened
safety_mode_triggered
model_error
```

Do not log complete student messages into analytics by default.

Do not build student-level psychological scoring dashboards.

---

## 28. Content management

School-specific content should be editable without modifying application source code where practical.

At minimum support configuration for:

- school name
- GVCN/support contacts
- support room
- urgent support instructions
- resource articles
- privacy/retention statement

Every published school-support record should have `updatedAt` and preferably `lastVerifiedAt`.

---

## 29. Environment variables

Create a documented `.env.example`, e.g.:

```env
DATABASE_URL=
AI_PROVIDER=openrouter
AI_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=
AI_MODEL=qwen/qwen3-30b-a3b:free
SAFETY_MODEL=nvidia/nemotron-3.5-content-safety:free
AUTH_SECRET=
APP_URL=

# Optional infrastructure
REDIS_URL=

# Feature flags
ENABLE_STAFF_DASHBOARD=true
ENABLE_CHECK_IN=true
```

Never commit real secrets.

---

## 30. Documentation the agent must create

At minimum:

- `README.md`
- `.env.example`
- `docs/ARCHITECTURE.md`
- `docs/SAFETY.md`
- `docs/PRIVACY.md`
- `docs/TESTING.md`

The README must include:

- prerequisites
- install
- environment variables
- database setup
- development command
- test command
- production build
- AI provider configuration
- school-support configuration

---

## 31. Coding-agent rules

When working on the repository:

1. Inspect before editing.
2. Reuse existing components and utilities.
3. Do not rewrite working infrastructure without reason.
4. Keep commits/changes focused.
5. Add tests with safety-sensitive logic.
6. Never place secrets in source control.
7. Never invent school contact information.
8. Never weaken red safety behavior to improve conversion, retention, or engagement.
9. Do not add gamification that trivializes wellbeing or crisis situations.
10. Prefer simple, auditable rules over opaque behavior when safety is concerned.
11. Explain significant architectural decisions in `docs/ARCHITECTURE.md`.
12. Before finishing, run build, type-check, lint, unit tests, and relevant E2E tests.

---

## 32. Definition of done for each feature

Every feature is done only when:

- UI exists and is responsive.
- Server-side validation exists where applicable.
- Empty/loading/error states exist.
- Accessibility basics are implemented.
- Unit/integration tests cover important logic.
- Safety/privacy implications have been reviewed.
- The feature does not accidentally expose student data.
- README/docs are updated when behavior/configuration changes.

---

## 33. Final product principle

The product should feel like a **bridge to support**, not a replacement for people.

Whenever a design choice conflicts between:

- more engagement vs. more safety,
- more data vs. more privacy,
- more automation vs. clearer human handoff,

choose **safety, privacy, and human connection**.

The final user journey should feel like:

```text
A student has something difficult to say
        ↓
They can start easily
        ↓
The AI listens and helps clarify
        ↓
They get one or two practical next steps
        ↓
If needed, they are encouraged toward a real person
        ↓
For urgent danger, safety comes first
```

Do not optimize the product into “AI replacing the counselor”. Build “AI helping the student reach the right support”.
