'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  hasPrivateVault,
  unlockPrivateVault,
  validateVaultPassphrase,
  VaultError,
  type EncryptedRecord,
  type PrivateVaultSession,
} from '@/lib/privacy/private-vault';

type StudioTab = 'journal' | 'memory' | 'daily' | 'journeys' | 'scenario' | 'perspective' | 'insights' | 'debrief' | 'toolkit' | 'voice';
type Locale = 'vi' | 'en';
type JournalEntry = { id: string; title: string; body: string; category: string; tags: string[]; createdAt: string; updatedAt: string; legacyId?: string };
type MemoryItem = { id: string; title: string; detail: string; category: string; date: string; source: string; relatedId: string; createdAt: string; updatedAt: string };
type DailyEntry = { id: string; date: string; feeling: string; event: string; meaningful: string; learning: string; nextStep: string; createdAt: string };
type JourneyProgress = { id: string; completedSteps: string[]; notes: string; updatedAt: string };
type ScenarioResult = { id: string; scenarioId: string; title: string; difficulty: string; turns: Array<{ prompt: string; choice: string; reflection: string }>; reflection: string; createdAt: string };
type DebriefEntry = { id: string; title: string; discussed: string; shared: string; perspectives: string; explore: string; nextStep: string; createdAt: string };
type ToolkitEntry = { id: string; title: string; category: string; note: string; createdAt: string };
type LocalePreferences = { locale: Locale; fontScale: 'normal' | 'large' | 'largest'; highContrast: boolean };

type SpeechRecognitionResultItem = { transcript: string };
type SpeechRecognitionEventLike = { results: ArrayLike<ArrayLike<SpeechRecognitionResultItem>> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

const tabs: Array<{ id: StudioTab; vi: string; en: string; icon: string }> = [
  { id: 'journal', vi: 'Story Journal', en: 'Story Journal', icon: '📖' },
  { id: 'memory', vi: 'Memory Graph', en: 'Memory Graph', icon: '🧩' },
  { id: 'daily', vi: 'Daily Reflection', en: 'Daily Reflection', icon: '☀️' },
  { id: 'journeys', vi: 'Guided Journeys', en: 'Guided Journeys', icon: '🌱' },
  { id: 'scenario', vi: 'Scenario Lab', en: 'Scenario Lab', icon: '🎭' },
  { id: 'perspective', vi: 'Perspective Explorer', en: 'Perspective Explorer', icon: '🔎' },
  { id: 'insights', vi: 'Insight Studio', en: 'Insight Studio', icon: '📊' },
  { id: 'debrief', vi: 'Conversation Debrief', en: 'Conversation Debrief', icon: '📝' },
  { id: 'toolkit', vi: 'Personal Toolkit', en: 'Personal Toolkit', icon: '🧰' },
  { id: 'voice', vi: 'MẦM Voice', en: 'MẦM Voice', icon: '🎙️' },
];

const journeys = [
  { id: 'self', title: 'Understanding Myself', description: 'Khám phá điều quan trọng, điểm mạnh và nhu cầu của bản thân.', steps: ['Điều gì đang quan trọng với mình?', 'Những nguồn lực nào đang giúp mình?', 'Một điều mình muốn hiểu thêm về bản thân'] },
  { id: 'emotion', title: 'Emotional Awareness', description: 'Tập nhận biết và diễn đạt cảm xúc theo cách của riêng bạn.', steps: ['Gọi tên cảm xúc đang có', 'Nhận ra tình huống đi kèm', 'Chọn cách chăm sóc phù hợp'] },
  { id: 'study', title: 'Managing Academic Stress', description: 'Sắp xếp áp lực học tập thành những bước có thể cân nhắc.', steps: ['Liệt kê điều đang gây áp lực', 'Tách việc trong và ngoài khả năng kiểm soát', 'Chọn một bước nhỏ có thể thử'] },
  { id: 'communication', title: 'Communication Skills', description: 'Chuẩn bị cách nói rõ ràng, tôn trọng và chân thật.', steps: ['Điều mình muốn người kia hiểu', 'Lắng nghe quan điểm khác', 'Thử diễn đạt nhu cầu bằng câu “mình”'] },
  { id: 'confidence', title: 'Self-confidence', description: 'Ghi nhận năng lực và tiến bộ theo cách không phán xét.', steps: ['Một việc mình đã cố gắng', 'Một kỹ năng muốn luyện tập', 'Một người có thể hỗ trợ mình'] },
  { id: 'values', title: 'Personal Values', description: 'Nhận diện những giá trị bạn muốn ưu tiên.', steps: ['Chọn ba giá trị quan trọng', 'Nhìn lại một quyết định gần đây', 'Một hành động phù hợp với giá trị'] },
  { id: 'relationships', title: 'Healthy Relationships', description: 'Khám phá sự tôn trọng, ranh giới và kết nối an toàn.', steps: ['Điều gì khiến mình cảm thấy được tôn trọng?', 'Ranh giới nào mình muốn diễn đạt?', 'Ai là người mình có thể tin cậy?'] },
  { id: 'decision', title: 'Decision Making', description: 'Cân nhắc lựa chọn mà không cần người khác quyết định thay.', steps: ['Những lựa chọn mình đang có', 'Điều quan trọng với mình', 'Bước tìm hiểu tiếp theo'] },
];

const scenarios = [
  {
    id: 'misunderstanding', title: 'Làm rõ hiểu lầm với bạn cùng lớp', intro: 'Một người bạn hiểu nhầm ý bạn sau một cuộc trao đổi. Bạn muốn nói rõ mà không đổ lỗi.',
    turns: [
      { prompt: 'Bạn của bạn nói: “Mình nghĩ cậu cố ý làm vậy.” Bạn sẽ bắt đầu thế nào?', options: [
        { label: '“Mình muốn hiểu điều gì khiến cậu nghĩ vậy. Mình có thể giải thích phần mình nhìn thấy không?”', reflection: 'Cách mở đầu này thể hiện mong muốn tìm hiểu và xin cơ hội giải thích.' },
        { label: '“Cậu luôn hiểu sai mình.”', reflection: 'Câu nói khái quát có thể làm cuộc trao đổi căng hơn; hãy thử nói về sự việc cụ thể.' },
        { label: '“Thôi bỏ qua đi.”', reflection: 'Tạm dừng có thể hữu ích, nhưng nếu vấn đề còn quan trọng, bạn có thể hẹn nói lại lúc phù hợp.' },
      ] },
      { prompt: 'Người bạn vẫn chưa đồng ý với cách bạn nhìn nhận. Bạn có thể làm gì tiếp?', options: [
        { label: 'Nhắc lại điều bạn hiểu từ phía bạn ấy rồi nói rõ điều mình biết.', reflection: 'Tóm tắt trước khi trả lời giúp kiểm tra xem hai bên có đang hiểu đúng nhau không.' },
        { label: 'Yêu cầu bạn ấy phải đồng ý ngay.', reflection: 'Không phải cuộc trò chuyện nào cũng cần kết thúc bằng sự đồng ý; hãy tập trung vào hiểu nhau.' },
        { label: 'Đề nghị tạm nghỉ và chọn thời điểm khác.', reflection: 'Tạm nghỉ là lựa chọn phù hợp khi cả hai đang quá căng thẳng.' },
      ] },
    ],
  },
  {
    id: 'boundary', title: 'Từ chối điều mình không thoải mái', intro: 'Một người quen liên tục đề nghị bạn làm điều bạn không muốn. Bạn muốn thể hiện ranh giới.',
    turns: [
      { prompt: 'Người đó nói: “Có gì đâu, làm đi.” Bạn phản hồi thế nào?', options: [
        { label: '“Mình không thoải mái với việc đó nên mình sẽ không tham gia.”', reflection: 'Ranh giới được diễn đạt rõ và không cần giải thích quá mức.' },
        { label: '“Được, miễn là cậu đừng nói với ai.”', reflection: 'Bạn không cần đồng ý với điều khiến mình không thoải mái để giữ quan hệ.' },
        { label: 'Im lặng và rời khỏi tình huống nếu thấy không an toàn.', reflection: 'Rời đi và tìm người đáng tin cậy hỗ trợ là lựa chọn hợp lý khi có áp lực hoặc rủi ro.' },
      ] },
      { prompt: 'Người đó tiếp tục gây áp lực. Điều gì có thể giúp bạn?', options: [
        { label: 'Lặp lại ranh giới ngắn gọn và tìm người hỗ trợ nếu cần.', reflection: 'Lặp lại nhất quán và có hỗ trợ giúp bạn không phải tự xử lý một mình.' },
        { label: 'Tranh cãi để chứng minh mình đúng.', reflection: 'Bạn không cần thắng một cuộc tranh luận để có quyền nói không.' },
        { label: 'Tạm dừng trao đổi và chuyển tới nơi có người đáng tin.', reflection: 'Ưu tiên cảm giác an toàn quan trọng hơn việc tiếp tục giải thích.' },
      ] },
    ],
  },
  {
    id: 'teacher', title: 'Trao đổi với thầy cô về việc học', intro: 'Bạn chưa hiểu một phần bài học và muốn xin thầy cô giải thích thêm.',
    turns: [
      { prompt: 'Bạn sắp gặp thầy cô sau giờ học. Bạn mở lời thế nào?', options: [
        { label: '“Em đang chưa rõ phần này. Thầy/cô có thể gợi ý để em hiểu cách làm không ạ?”', reflection: 'Yêu cầu cụ thể giúp người hỗ trợ hiểu bạn đang cần gì.' },
        { label: '“Em không hiểu gì cả.”', reflection: 'Bạn có thể thu hẹp phần chưa rõ để cuộc trao đổi dễ bắt đầu hơn.' },
        { label: 'Chờ đến khi mọi thứ tự hết khó.', reflection: 'Chờ đợi đôi khi không giải quyết được thắc mắc; một câu hỏi nhỏ cũng là khởi đầu.' },
      ] },
      { prompt: 'Thầy cô đang bận và đề nghị bạn quay lại sau. Bạn chọn gì?', options: [
        { label: 'Hỏi thời điểm phù hợp để quay lại hoặc cách gửi câu hỏi.', reflection: 'Đề xuất thời điểm khác giúp giữ cuộc trao đổi cụ thể và tôn trọng lịch của cả hai.' },
        { label: 'Cho rằng thầy cô không muốn giúp.', reflection: 'Có thể có nhiều lý do khiến thầy cô bận; chưa đủ thông tin để kết luận.' },
        { label: 'Nhờ một người lớn đáng tin cậy hỗ trợ tìm cách trao đổi.', reflection: 'Tìm người hỗ trợ khác là một lựa chọn phù hợp nếu bạn vẫn cần giúp đỡ.' },
      ] },
    ],
  },
];

const starterTools = [
  { id: 'grounding', title: 'Grounding 5 giác quan', category: 'Calm Space', note: 'Quan sát điều bạn nhìn, nghe và cảm nhận; bỏ qua bước nào không thoải mái.' },
  { id: 'thought', title: 'Tách sự kiện và suy nghĩ', category: 'Reflection', note: 'Viết điều đã quan sát được và điều mình đang diễn giải.' },
  { id: 'boundary', title: 'Câu nói ranh giới', category: 'Communication', note: '“Mình không thoải mái với việc đó nên mình sẽ không tham gia.”' },
  { id: 'priorities', title: 'Ba ưu tiên nhỏ', category: 'Planning', note: 'Chọn tối đa ba việc thực tế, có thể điều chỉnh nếu cần.' },
  { id: 'support', title: 'Danh sách người hỗ trợ', category: 'Human Support', note: 'Ghi tên vai trò hoặc người đáng tin cậy mà bạn có thể chủ động liên hệ.' },
  { id: 'values', title: 'Nhìn lại giá trị', category: 'Self-understanding', note: 'Điều gì quan trọng với mình trong tình huống đang cân nhắc?' },
];

const labels = {
  vi: {
    title: 'Không gian riêng tư MẦM', subtitle: 'Một nơi để ghi lại, phản tư và phát triển theo nhịp của bạn.',
    privacy: 'Dữ liệu được mã hóa trên thiết bị bằng cụm mật khẩu riêng. Nội dung trong kho này không được gửi tới MẦM AI hoặc máy chủ.',
    createVault: 'Tạo kho riêng tư', unlockVault: 'Mở khóa kho riêng tư', passphrase: 'Cụm mật khẩu riêng', confirm: 'Xác nhận cụm mật khẩu',
    create: 'Tạo và mở khóa', unlock: 'Mở khóa', lock: 'Khóa kho', erase: 'Xóa vĩnh viễn kho này',
    lockedWarning: 'Không thể khôi phục nếu quên cụm mật khẩu. Hãy lưu cụm mật khẩu ở nơi an toàn mà chỉ bạn truy cập.',
    newRecord: 'Tạo mới', save: 'Lưu', delete: 'Xóa', edit: 'Sửa', cancel: 'Hủy', search: 'Tìm kiếm', noData: 'Chưa có dữ liệu.',
    localOnly: 'Chỉ lưu trên thiết bị này', unlocked: 'Kho đã mở khóa', export: 'Xuất dữ liệu đã giải mã', language: 'Ngôn ngữ giao diện',
  },
  en: {
    title: 'MẦM Private Studio', subtitle: 'A private space to record, reflect and grow at your own pace.',
    privacy: 'Data is encrypted on this device using your passphrase. Content in this vault is not sent to MẦM AI or the server.',
    createVault: 'Create private vault', unlockVault: 'Unlock private vault', passphrase: 'Private passphrase', confirm: 'Confirm passphrase',
    create: 'Create and unlock', unlock: 'Unlock', lock: 'Lock vault', erase: 'Permanently erase this vault',
    lockedWarning: 'This vault cannot be recovered if you forget the passphrase. Keep it somewhere safe that only you can access.',
    newRecord: 'New entry', save: 'Save', delete: 'Delete', edit: 'Edit', cancel: 'Cancel', search: 'Search', noData: 'No records yet.',
    localOnly: 'Stored on this device only', unlocked: 'Vault unlocked', export: 'Export decrypted data', language: 'Interface language',
  },
};

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function PersonalStudio() {
  const [vaultExists, setVaultExists] = useState<boolean | null>(null);
  const [vault, setVault] = useState<PrivateVaultSession | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [vaultError, setVaultError] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<StudioTab>('journal');
  const [locale, setLocale] = useState<Locale>('vi');
  const [fontScale, setFontScale] = useState<LocalePreferences['fontScale']>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [journeyProgress, setJourneyProgress] = useState<JourneyProgress[]>([]);
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult[]>([]);
  const [debriefs, setDebriefs] = useState<DebriefEntry[]>([]);
  const [toolkitEntries, setToolkitEntries] = useState<ToolkitEntry[]>([]);
  const [notice, setNotice] = useState('');
  const t = labels[locale];

  useEffect(() => {
    hasPrivateVault().then(setVaultExists).catch((error: unknown) => {
      setVaultError(error instanceof Error ? error.message : 'Không thể kiểm tra kho riêng tư.');
      setVaultExists(false);
    });
    try {
      const saved = localStorage.getItem('mam-studio-preferences-v1');
      if (saved) {
        const preferences = JSON.parse(saved) as Partial<LocalePreferences>;
        if (preferences.locale === 'vi' || preferences.locale === 'en') setLocale(preferences.locale);
        if (preferences.fontScale === 'normal' || preferences.fontScale === 'large' || preferences.fontScale === 'largest') setFontScale(preferences.fontScale);
        if (typeof preferences.highContrast === 'boolean') setHighContrast(preferences.highContrast);
      }
    } catch { /* Preferences are optional and contain no journal content. */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('mam-studio-preferences-v1', JSON.stringify({ locale, fontScale, highContrast })); }
    catch { /* The workspace remains usable when local preference storage is disabled. */ }
  }, [locale, fontScale, highContrast]);

  useEffect(() => () => { vault?.close(); }, [vault]);

  async function reloadRecords(session: PrivateVaultSession) {
    const [journal, memory, daily, journeysSaved, scenariosSaved, debriefSaved, toolkit] = await Promise.all([
      session.list<JournalEntry>('journal'), session.list<MemoryItem>('memory'), session.list<DailyEntry>('daily'),
      session.list<JourneyProgress>('journey'), session.list<ScenarioResult>('scenario'), session.list<DebriefEntry>('debrief'), session.list<ToolkitEntry>('toolkit'),
    ]);
    setEntries(journal.map((item) => item.value));
    setMemories(memory.map((item) => item.value));
    setDailyEntries(daily.map((item) => item.value));
    setJourneyProgress(journeysSaved.map((item) => item.value));
    setScenarioResults(scenariosSaved.map((item) => item.value));
    setDebriefs(debriefSaved.map((item) => item.value));
    setToolkitEntries(toolkit.map((item) => item.value));
  }

  async function submitVault(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVaultError('');
    const validation = validateVaultPassphrase(passphrase);
    if (validation) { setVaultError(validation); return; }
    if (!vaultExists && passphrase !== confirmPassphrase) { setVaultError('Hai cụm mật khẩu chưa trùng khớp.'); return; }
    setBusy(true);
    try {
      const session = await unlockPrivateVault(passphrase);
      await reloadRecords(session);
      setVault(session);
      setPassphrase('');
      setConfirmPassphrase('');
      setNotice('Kho riêng tư đã sẵn sàng.');
    } catch (error) {
      setVaultError(error instanceof VaultError ? error.message : 'Không thể mở kho dữ liệu.');
    } finally { setBusy(false); }
  }

  function lockVault() {
    vault?.close();
    setVault(null);
    setEntries([]); setMemories([]); setDailyEntries([]); setJourneyProgress([]);
    setScenarioResults([]); setDebriefs([]); setToolkitEntries([]);
    setNotice('Kho riêng tư đã được khóa.');
  }

  async function saveRecord<T extends { id: string }>(kind: string, value: T) {
    if (!vault) return;
    const now = new Date().toISOString();
    const id = `${kind}:${value.id}`;
    const existing = await vault.list<T>(kind);
    const prior = existing.find((record) => record.id === id);
    await vault.put<T>({ id, kind, value, createdAt: prior?.createdAt || now, updatedAt: now });
    await reloadRecords(vault);
  }

  async function removeRecord(kind: string, id: string) {
    if (!vault) return;
    await vault.delete(`${kind}:${id}`);
    await reloadRecords(vault);
  }

  async function importLegacyJournal() {
    if (!vault) return;
    let raw: string | null = null;
    try { raw = localStorage.getItem('mam-private-journal-v1'); }
    catch { setNotice('Trình duyệt không cho phép đọc bản nhật ký cũ.'); return; }
    if (!raw) { setNotice('Không tìm thấy bản nhật ký cũ trên thiết bị.'); return; }
    if (raw.length > 2_000_000) { setNotice('Bản nhật ký cũ vượt quá giới hạn nhập an toàn.'); return; }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Invalid legacy records');
      const valid = parsed.filter((item): item is { id: string; title: string; content: string; topic: string; tags?: string[]; createdAt: string; updatedAt?: string } =>
        Boolean(item && typeof item === 'object'
          && typeof (item as { id?: unknown }).id === 'string'
          && typeof (item as { title?: unknown }).title === 'string'
          && typeof (item as { content?: unknown }).content === 'string'
          && typeof (item as { topic?: unknown }).topic === 'string'
          && typeof (item as { createdAt?: unknown }).createdAt === 'string'),
      ).slice(0, 300);
      if (!valid.length) { setNotice('Không có mục nhật ký hợp lệ để nhập.'); return; }
      if (!window.confirm(`Nhập ${valid.length} ghi chú cũ vào kho mã hóa? Bản cũ chưa mã hóa sẽ được giữ nguyên cho tới khi bạn tự chọn xóa.`)) return;
      const now = new Date().toISOString();
      const existingJournal = await vault.list<JournalEntry>('journal');
      const importedLegacyIds = new Set(existingJournal.map((record) => record.value.legacyId).filter((value): value is string => Boolean(value)));
      let importedCount = 0;
      for (const entry of valid) {
        if (importedLegacyIds.has(entry.id)) continue;
        const value: JournalEntry = {
          id: makeId(), legacyId: entry.id.slice(0, 120), title: entry.title.slice(0, 120), body: entry.content.slice(0, 12000),
          category: entry.topic.slice(0, 60), tags: Array.isArray(entry.tags) ? entry.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 12) : [],
          createdAt: entry.createdAt, updatedAt: entry.updatedAt || now,
        };
        await vault.put({ id: `journal:${value.id}`, kind: 'journal', value, createdAt: value.createdAt, updatedAt: value.updatedAt });
        importedLegacyIds.add(entry.id);
        importedCount += 1;
      }
      await reloadRecords(vault);
      setNotice(importedCount ? `Đã nhập ${importedCount} ghi chú mới vào kho mã hóa; các mục đã nhập trước đó được bỏ qua.` : 'Các ghi chú hợp lệ đã được nhập trước đó; không tạo bản sao.');
      if (window.confirm('Bạn có muốn xóa bản nhật ký cũ chưa mã hóa khỏi localStorage không?')) {
        localStorage.removeItem('mam-private-journal-v1');
        setNotice(`Đã nhập ${valid.length} ghi chú và xóa bản cũ chưa mã hóa theo lựa chọn của bạn.`);
      }
    } catch {
      setNotice('Không thể nhập bản nhật ký cũ. Bản gốc vẫn được giữ nguyên.');
    }
  }

  async function exportVault() {
    if (!vault) return;
    downloadJson(`mam-private-export-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      note: 'Export contains decrypted private data. Store it carefully and delete it when no longer needed.',
      records: await vault.exportAll(),
    });
  }

  async function eraseVault() {
    if (!vault || !window.confirm('Xóa vĩnh viễn tất cả dữ liệu trong kho trên thiết bị này? Hành động không thể hoàn tác.')) return;
    await vault.eraseEverything();
    setVault(null); setVaultExists(false); setEntries([]); setMemories([]); setDailyEntries([]);
    setJourneyProgress([]); setScenarioResults([]); setDebriefs([]); setToolkitEntries([]);
    setNotice('Kho dữ liệu đã được xóa khỏi IndexedDB của ứng dụng.');
  }

  const panelClass = `rounded-3xl border p-5 sm:p-6 ${highContrast ? 'border-slate-800 bg-white text-black' : 'border-moss-100 bg-white text-ink'}`;
  const inputClass = 'mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400';
  const actionClass = 'button-primary text-sm disabled:cursor-not-allowed disabled:opacity-50';
  const secondaryClass = 'button-secondary text-sm';

  const tabButtons = <div role="tablist" aria-label="Công cụ trong không gian riêng tư" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
    {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${activeTab === tab.id ? 'border-moss-700 bg-moss-700 text-white' : 'border-moss-100 bg-white text-moss-700 hover:bg-moss-50'}`}><span className="mr-2" aria-hidden="true">{tab.icon}</span>{locale === 'vi' ? tab.vi : tab.en}</button>)}
  </div>;

  return (
    <div className={`mt-8 space-y-5 ${fontScale === 'large' ? 'text-[1.075rem]' : fontScale === 'largest' ? 'text-[1.15rem]' : 'text-base'}`}>
      <section className="rounded-3xl border border-moss-100 bg-moss-50 p-5 sm:p-6" aria-labelledby="studio-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl"><p className="eyebrow">PRIVATE BY DESIGN</p><h2 id="studio-title" className="mt-2 text-2xl font-extrabold text-ink">{t.title}</h2><p className="mt-2 text-sm leading-6 text-slate-700">{t.subtitle}</p></div>
          <div className="flex flex-wrap gap-2">
            <label className="text-xs font-semibold text-slate-700">{t.language}<select className="mt-1 block rounded-xl border border-slate-300 bg-white px-3 py-2" value={locale} onChange={(event) => setLocale(event.target.value as Locale)}><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label>
            <label className="text-xs font-semibold text-slate-700">Cỡ chữ<select className="mt-1 block rounded-xl border border-slate-300 bg-white px-3 py-2" value={fontScale} onChange={(event) => setFontScale(event.target.value as LocalePreferences['fontScale'])}><option value="normal">Bình thường</option><option value="large">Lớn</option><option value="largest">Rất lớn</option></select></label>
            <label className="flex items-center gap-2 self-end rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"><input type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)} /> Tương phản cao</label>
          </div>
        </div>
        <p className="mt-4 rounded-2xl border border-moss-100 bg-white p-3 text-xs leading-5 text-slate-700"><strong>🔐 {t.localOnly}.</strong> {t.privacy} Không dùng kho này trên thiết bị dùng chung. Mã hóa tại trình duyệt không bảo vệ khỏi mã độc, tiện ích trình duyệt độc hại hoặc XSS.</p>
        {notice ? <p role="status" className="mt-3 text-sm font-medium text-moss-700">{notice}</p> : null}
      </section>

      {!vault ? (
        <section className={`${panelClass} mx-auto max-w-xl`}>
          <h3 className="text-lg font-bold">{vaultExists ? t.unlockVault : t.createVault}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t.lockedWarning}</p>
          <form onSubmit={submitVault} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold">{t.passphrase}<input required autoComplete="current-password" type="password" minLength={12} maxLength={256} className={inputClass} value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></label>
            {!vaultExists ? <label className="block text-sm font-semibold">{t.confirm}<input required autoComplete="new-password" type="password" minLength={12} maxLength={256} className={inputClass} value={confirmPassphrase} onChange={(event) => setConfirmPassphrase(event.target.value)} /></label> : null}
            {vaultError ? <p role="alert" className="text-sm text-red-700">{vaultError}</p> : null}
            <button type="submit" disabled={busy || vaultExists === null} className={actionClass}>{busy ? 'Đang xử lý…' : vaultExists ? t.unlock : t.create}</button>
          </form>
          <p className="mt-4 text-xs leading-5 text-slate-500">Không có tài khoản khôi phục hoặc dịch vụ khôi phục mật khẩu. Nếu quên cụm mật khẩu, nội dung đã mã hóa không thể đọc lại.</p>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-moss-700" role="status"><span aria-hidden="true">🔓 </span>{t.unlocked} · Dữ liệu không được gửi tới máy chủ</p>
            <div className="flex flex-wrap gap-2"><button type="button" className={secondaryClass} onClick={exportVault}>{t.export}</button><button type="button" className={secondaryClass} onClick={lockVault}>{t.lock}</button><button type="button" className="button-danger text-xs" onClick={eraseVault}>{t.erase}</button></div>
          </div>
          {tabButtons}
          <section role="tabpanel" className={panelClass}>
            {activeTab === 'journal' ? <JournalPanel entries={entries} onSave={(value) => saveRecord('journal', value)} onDelete={(id) => removeRecord('journal', id)} onImportLegacy={importLegacyJournal} /> : null}
            {activeTab === 'memory' ? <MemoryPanel memories={memories} onSave={(value) => saveRecord('memory', value)} onDelete={(id) => removeRecord('memory', id)} /> : null}
            {activeTab === 'daily' ? <DailyPanel entries={dailyEntries} onSave={(value) => saveRecord('daily', value)} onDelete={(id) => removeRecord('daily', id)} /> : null}
            {activeTab === 'journeys' ? <JourneyPanel progress={journeyProgress} onSave={(value) => saveRecord('journey', value)} /> : null}
            {activeTab === 'scenario' ? <ScenarioPanel results={scenarioResults} onSave={(value) => saveRecord('scenario', value)} onDelete={(id) => removeRecord('scenario', id)} /> : null}
            {activeTab === 'perspective' ? <PerspectivePanel onSave={(value) => saveRecord('journal', value)} /> : null}
            {activeTab === 'insights' ? <InsightPanel entries={entries} memories={memories} daily={dailyEntries} progress={journeyProgress} /> : null}
            {activeTab === 'debrief' ? <DebriefPanel entries={debriefs} onSave={(value) => saveRecord('debrief', value)} onDelete={(id) => removeRecord('debrief', id)} /> : null}
            {activeTab === 'toolkit' ? <ToolkitPanel entries={toolkitEntries} onSave={(value) => saveRecord('toolkit', value)} onDelete={(id) => removeRecord('toolkit', id)} /> : null}
            {activeTab === 'voice' ? <VoicePanel onSaveTranscript={(body) => saveRecord('journal', { id: makeId(), title: `Ghi chú giọng nói · ${new Date().toLocaleDateString('vi-VN')}`, body, category: 'voice-note', tags: ['voice'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })} locale={locale} /> : null}
          </section>
        </>
      )}
    </div>
  );
}

function JournalPanel({ entries, onSave, onDelete, onImportLegacy }: { entries: JournalEntry[]; onSave: (value: JournalEntry) => Promise<void>; onDelete: (id: string) => Promise<void>; onImportLegacy: () => Promise<void> }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [category, setCategory] = useState('daily'); const [tags, setTags] = useState(''); const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const filtered = entries.filter((entry) => `${entry.title} ${entry.body} ${entry.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      await onSave({ id: editing || makeId(), title: title.trim().slice(0, 120), body: body.trim().slice(0, 12000), category, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 12), createdAt: editing ? entries.find((entry) => entry.id === editing)?.createdAt || now : now, updatedAt: now });
      setTitle(''); setBody(''); setTags(''); setEditing(null);
    } finally { setBusy(false); }
  }
  function edit(entry: JournalEntry) { setEditing(entry.id); setTitle(entry.title); setBody(entry.body); setCategory(entry.category); setTags(entry.tags.join(', ')); }
  return <div className="space-y-6"><div><p className="eyebrow">STORY JOURNAL</p><h3 className="mt-1 text-xl font-bold">Nhật ký riêng tư</h3><p className="mt-1 text-sm text-slate-600">Viết theo cách của bạn. Nội dung được mã hóa trong kho riêng tư trên thiết bị.</p></div>
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">Tiêu đề<input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" placeholder="Một điều mình muốn ghi lại" /></label>
      <label className="text-sm font-semibold">Chủ đề<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal"><option value="daily">Hằng ngày</option><option value="emotion">Cảm xúc</option><option value="school">Học đường</option><option value="relationship">Mối quan hệ</option><option value="growth">Phát triển cá nhân</option><option value="voice-note">Ghi chú giọng nói</option></select></label>
      <label className="text-sm font-semibold sm:col-span-2">Nội dung<textarea required maxLength={12000} rows={5} value={body} onChange={(event) => setBody(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" placeholder="Bạn có thể viết những gì mình thấy thoải mái…" /></label>
      <label className="text-sm font-semibold sm:col-span-2">Thẻ, cách nhau bằng dấu phẩy<input maxLength={400} value={tags} onChange={(event) => setTags(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" placeholder="ví dụ: trường học, điều quan trọng" /></label>
      <div className="flex flex-wrap gap-2 sm:col-span-2"><button className="button-primary text-sm" type="submit" disabled={busy}>{busy ? 'Đang lưu…' : editing ? 'Cập nhật ghi chú' : 'Lưu vào nhật ký'}</button>{editing ? <button type="button" className="button-secondary text-sm" onClick={() => { setEditing(null); setTitle(''); setBody(''); setTags(''); }}>Hủy sửa</button> : null}</div>
    </form>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><h4 className="font-bold">Các ghi chú ({entries.length})</h4><button type="button" className="button-secondary text-xs" onClick={() => void onImportLegacy()}>Nhập nhật ký cũ chưa mã hóa</button></div><label className="text-xs font-semibold">Tìm trong nhật ký<input value={query} onChange={(event) => setQuery(event.target.value)} className="ml-2 rounded-xl border border-slate-300 p-2 font-normal" placeholder="Từ khóa" /></label></div>
    {filtered.length ? <div className="grid gap-3 md:grid-cols-2">{filtered.map((entry) => <article key={entry.id} className="rounded-2xl border border-moss-100 bg-moss-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-moss-700">{entry.category} · {new Date(entry.updatedAt).toLocaleString()}</p><h5 className="mt-1 font-bold">{entry.title}</h5></div><span aria-hidden="true">📖</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{entry.body}</p>{entry.tags.length ? <p className="mt-2 text-xs text-moss-700">{entry.tags.map((tag) => `#${tag}`).join(' ')}</p> : null}<div className="mt-3 flex gap-2"><button className="button-secondary text-xs" type="button" onClick={() => edit(entry)}>Sửa</button><button className="button-danger text-xs" type="button" onClick={() => { if (window.confirm('Xóa ghi chú này?')) void onDelete(entry.id); }}>Xóa</button></div></article>)}</div> : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Chưa có ghi chú phù hợp.</p>}
  </div>;
}

function MemoryPanel({ memories, onSave, onDelete }: { memories: MemoryItem[]; onSave: (value: MemoryItem) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [editing, setEditing] = useState<string | null>(null); const [title, setTitle] = useState(''); const [detail, setDetail] = useState(''); const [category, setCategory] = useState('event'); const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [source, setSource] = useState('Tự ghi nhận'); const [relatedId, setRelatedId] = useState('');
  async function submit(event: FormEvent) { event.preventDefault(); if (!title.trim()) return; const now = new Date().toISOString(); await onSave({ id: editing || makeId(), title: title.trim().slice(0, 120), detail: detail.trim().slice(0, 3000), category, date, source: source.slice(0, 120), relatedId, createdAt: memories.find((item) => item.id === editing)?.createdAt || now, updatedAt: now }); setEditing(null); setTitle(''); setDetail(''); setRelatedId(''); }
  function edit(item: MemoryItem) { setEditing(item.id); setTitle(item.title); setDetail(item.detail); setCategory(item.category); setDate(item.date); setSource(item.source); setRelatedId(item.relatedId); }
  return <div className="space-y-6"><div><p className="eyebrow">MEMORY GRAPH</p><h3 className="mt-1 text-xl font-bold">Bản đồ ký ức do bạn tạo</h3><p className="mt-1 text-sm text-slate-600">Mỗi nút là một ghi nhận thủ công. Kết nối chỉ thể hiện mối liên hệ bạn tự chọn, không phải kết luận về tính cách hay tâm lý.</p></div>
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Tên ghi nhận<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" placeholder="Một sự kiện, suy ngẫm hoặc cột mốc" /></label><label className="text-sm font-semibold">Nhóm<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal"><option value="event">Sự kiện</option><option value="reflection">Suy ngẫm</option><option value="goal">Mục tiêu</option><option value="milestone">Cột mốc</option><option value="preference">Sở thích hỗ trợ</option></select></label><label className="text-sm font-semibold">Ngày ghi nhận<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><label className="text-sm font-semibold">Nguồn<input value={source} onChange={(event) => setSource(event.target.value)} maxLength={120} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><label className="text-sm font-semibold sm:col-span-2">Mô tả<textarea value={detail} onChange={(event) => setDetail(event.target.value)} maxLength={3000} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" placeholder="Điều bạn muốn nhớ hoặc ý nghĩa bạn tự gán cho nó…" /></label><label className="text-sm font-semibold sm:col-span-2">Kết nối với một ghi nhận khác<select value={relatedId} onChange={(event) => setRelatedId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal"><option value="">Không kết nối</option>{memories.filter((item) => item.id !== editing).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><div className="flex flex-wrap gap-2 sm:col-span-2"><button className="button-primary text-sm" type="submit">{editing ? 'Cập nhật nút ký ức' : 'Thêm vào Memory Graph'}</button>{editing ? <button className="button-secondary text-sm" type="button" onClick={() => { setEditing(null); setTitle(''); setDetail(''); setRelatedId(''); }}>Hủy</button> : null}</div></form>
    <div className="space-y-3"><h4 className="font-bold">Các nút và kết nối ({memories.length})</h4>{memories.length ? memories.map((item) => { const related = memories.find((candidate) => candidate.id === item.relatedId); return <article key={item.id} className="rounded-2xl border border-moss-100 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><span className="rounded-full bg-moss-50 px-2 py-1 text-xs font-semibold text-moss-700">{item.category}</span><h5 className="mt-2 font-bold">{item.title}</h5><p className="text-xs text-slate-500">{item.date} · Nguồn: {item.source}</p></div><div className="flex gap-2"><button type="button" className="button-secondary text-xs" onClick={() => edit(item)}>Sửa</button><button type="button" className="button-danger text-xs" onClick={() => { if (window.confirm('Xóa ghi nhận này? Các bản ghi khác không bị xóa.')) void onDelete(item.id); }}>Xóa</button></div></div>{item.detail ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.detail}</p> : null}<p className="mt-2 text-xs text-moss-700">{related ? `↔ Kết nối bạn chọn: ${related.title}` : 'Chưa kết nối với ghi nhận khác'}</p></article>; }) : <p className="text-sm text-slate-500">Chưa có ghi nhận nào. Memory Graph chỉ bao gồm nội dung bạn chủ động thêm.</p>}</div>
  </div>;
}

function DailyPanel({ entries, onSave, onDelete }: { entries: DailyEntry[]; onSave: (value: DailyEntry) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [feeling, setFeeling] = useState('Chưa rõ'); const [event, setEvent] = useState(''); const [meaningful, setMeaningful] = useState(''); const [learning, setLearning] = useState(''); const [nextStep, setNextStep] = useState('');
  async function submit(eventObject: FormEvent) { eventObject.preventDefault(); const value = { id: makeId(), date, feeling, event: event.slice(0, 1200), meaningful: meaningful.slice(0, 1200), learning: learning.slice(0, 1200), nextStep: nextStep.slice(0, 1200), createdAt: new Date().toISOString() }; await onSave(value); setEvent(''); setMeaningful(''); setLearning(''); setNextStep(''); }
  return <div className="space-y-5"><div><p className="eyebrow">DAILY REFLECTION</p><h3 className="mt-1 text-xl font-bold">Một vài câu hỏi cho hôm nay</h3><p className="mt-1 text-sm text-slate-600">Bạn có thể trả lời một câu, tất cả hoặc bỏ qua. Không có chuỗi ngày bắt buộc.</p></div><form onSubmit={submit} className="space-y-3"><label className="block text-sm font-semibold">Ngày<input type="date" value={date} onChange={(eventObject) => setDate(eventObject.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><label className="block text-sm font-semibold">How am I feeling? · Mình đang cảm thấy thế nào?<select className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" value={feeling} onChange={(eventObject) => setFeeling(eventObject.target.value)}>{['Vui', 'Bình yên', 'Lo lắng', 'Buồn', 'Bực bội', 'Mệt mỏi', 'Biết ơn', 'Chưa rõ', 'Khác'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="block text-sm font-semibold">What happened today? · Hôm nay có chuyện gì đáng chú ý?<textarea rows={2} maxLength={1200} value={event} onChange={(eventObject) => setEvent(eventObject.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><label className="block text-sm font-semibold">What mattered to me? · Điều gì quan trọng với mình?<textarea rows={2} maxLength={1200} value={meaningful} onChange={(eventObject) => setMeaningful(eventObject.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><label className="block text-sm font-semibold">What did I learn? · Mình nhận ra điều gì?<textarea rows={2} maxLength={1200} value={learning} onChange={(eventObject) => setLearning(eventObject.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><label className="block text-sm font-semibold">What would I like to do next? · Bước tiếp theo mình muốn thử?<textarea rows={2} maxLength={1200} value={nextStep} onChange={(eventObject) => setNextStep(eventObject.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><button type="submit" className="button-primary text-sm">Lưu phản tư hôm nay</button></form><div className="space-y-2"><h4 className="font-bold">Lịch sử ({entries.length})</h4>{entries.map((item) => <article key={item.id} className="rounded-2xl bg-moss-50 p-4"><div className="flex justify-between gap-2"><strong>{item.date} · {item.feeling}</strong><button type="button" className="text-xs font-semibold text-red-700 underline" onClick={() => { if (window.confirm('Xóa phản tư này?')) void onDelete(item.id); }}>Xóa</button></div>{item.event ? <p className="mt-2 text-sm"><strong>Sự kiện:</strong> {item.event}</p> : null}{item.meaningful ? <p className="mt-1 text-sm"><strong>Điều quan trọng:</strong> {item.meaningful}</p> : null}{item.learning ? <p className="mt-1 text-sm"><strong>Điều nhận ra:</strong> {item.learning}</p> : null}{item.nextStep ? <p className="mt-1 text-sm"><strong>Bước tiếp theo:</strong> {item.nextStep}</p> : null}</article>)}</div></div>;
}

function JourneyPanel({ progress, onSave }: { progress: JourneyProgress[]; onSave: (value: JourneyProgress) => Promise<void> }) {
  const [activeId, setActiveId] = useState(journeys[0].id);
  const [notes, setNotes] = useState('');
  const active = journeys.find((journey) => journey.id === activeId) || journeys[0];
  const current = progress.find((item) => item.id === active.id) || { id: active.id, completedSteps: [], notes: '', updatedAt: '' };
  useEffect(() => { setNotes(current.notes); }, [activeId, current.notes]);
  async function toggleStep(step: string) { const completedSteps = current.completedSteps.includes(step) ? current.completedSteps.filter((item) => item !== step) : [...current.completedSteps, step]; await onSave({ ...current, completedSteps, notes, updatedAt: new Date().toISOString() }); }
  async function saveNotes() { await onSave({ ...current, notes: notes.slice(0, 3000), updatedAt: new Date().toISOString() }); }
  return <div className="space-y-5"><div><p className="eyebrow">GUIDED JOURNEYS</p><h3 className="mt-1 text-xl font-bold">Hành trình phát triển theo nhịp riêng</h3><p className="mt-1 text-sm text-slate-600">Mỗi hành trình là các gợi ý phản tư, không phải chương trình điều trị. Bạn có thể dừng hoặc đổi mục tiêu bất cứ lúc nào.</p></div><label className="block text-sm font-semibold">Chọn hành trình<select value={activeId} onChange={(event) => setActiveId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal">{journeys.map((journey) => <option value={journey.id} key={journey.id}>{journey.title}</option>)}</select></label><div className="rounded-2xl bg-moss-50 p-4"><h4 className="font-bold">{active.title}</h4><p className="mt-1 text-sm text-slate-600">{active.description}</p><p className="mt-3 text-xs font-semibold text-moss-700">{current.completedSteps.length}/{active.steps.length} hoạt động đã đánh dấu</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-moss-600" style={{ width: `${current.completedSteps.length / active.steps.length * 100}%` }} /></div></div><div className="space-y-3">{active.steps.map((step, index) => <label key={step} className="flex items-start gap-3 rounded-2xl border border-moss-100 p-4"><input type="checkbox" className="mt-1 size-4" checked={current.completedSteps.includes(step)} onChange={() => void toggleStep(step)} /><span><span className="block text-xs font-semibold text-moss-700">BƯỚC {index + 1}</span><span className="text-sm font-medium">{step}</span></span></label>)}</div><label className="block text-sm font-semibold">Ghi chú riêng<textarea rows={3} maxLength={3000} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" placeholder="Điều bạn muốn ghi nhớ về hành trình này…" /></label><button type="button" className="button-primary text-sm" onClick={() => void saveNotes()}>Lưu ghi chú hành trình</button></div>;
}

function ScenarioPanel({ results, onSave, onDelete }: { results: ScenarioResult[]; onSave: (value: ScenarioResult) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id); const [difficulty, setDifficulty] = useState('Cơ bản'); const [stepIndex, setStepIndex] = useState(0); const [turns, setTurns] = useState<ScenarioResult['turns']>([]); const [reflection, setReflection] = useState(''); const [finished, setFinished] = useState(false);
  const scenario = scenarios.find((item) => item.id === scenarioId) || scenarios[0];
  const stage = scenario.turns[stepIndex];
  function reset() { setStepIndex(0); setTurns([]); setReflection(''); setFinished(false); }
  async function selectOption(option: { label: string; reflection: string }) { const next = [...turns, { prompt: stage.prompt, choice: option.label, reflection: option.reflection }]; setTurns(next); if (stepIndex + 1 < scenario.turns.length) setStepIndex((value) => value + 1); else { setFinished(true); } }
  async function saveResult() { const value = { id: makeId(), scenarioId, title: scenario.title, difficulty, turns, reflection: reflection.slice(0, 1500), createdAt: new Date().toISOString() }; await onSave(value); reset(); }
  return <div className="space-y-5"><div><p className="eyebrow">SCENARIO LAB</p><h3 className="mt-1 text-xl font-bold">Luyện tập tình huống giao tiếp</h3><p className="mt-1 text-sm text-slate-600">Các nhánh là tình huống mô phỏng đã soạn sẵn, không đại diện cho phản ứng chắc chắn của người thật. Không có điểm số về tính cách.</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Tình huống<select value={scenarioId} onChange={(event) => { setScenarioId(event.target.value); reset(); }} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal">{scenarios.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="text-sm font-semibold">Mức độ luyện tập<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal"><option>Cơ bản</option><option>Thử thách hơn</option></select></label></div><div className="rounded-2xl bg-moss-50 p-4"><h4 className="font-bold">{scenario.title}</h4><p className="mt-1 text-sm leading-6">{scenario.intro}</p></div>{!finished ? <div className="space-y-3"><p className="text-xs font-semibold text-moss-700">TÌNH HUỐNG {stepIndex + 1}/{scenario.turns.length}</p><h4 className="font-bold">{stage.prompt}</h4>{stage.options.map((option, index) => <button key={option.label} type="button" className="block w-full rounded-2xl border border-moss-100 p-4 text-left text-sm hover:bg-moss-50" onClick={() => void selectOption(option)}><span className="mr-2 font-bold text-moss-700">{String.fromCharCode(65 + index)}.</span>{option.label}</button>)}</div> : <div className="space-y-4"><h4 className="font-bold">Phản hồi sau mô phỏng</h4>{turns.map((turn, index) => <article key={index} className="rounded-2xl bg-moss-50 p-4"><p className="text-xs font-semibold">{turn.prompt}</p><p className="mt-2 text-sm">Lựa chọn: {turn.choice}</p><p className="mt-2 text-sm leading-6 text-moss-700">Góc nhìn tham khảo: {turn.reflection}</p></article>)}<p className="text-sm font-semibold">Bạn muốn giữ lại điều gì sau tình huống này?</p><textarea rows={3} maxLength={1500} value={reflection} onChange={(event) => setReflection(event.target.value)} className="w-full rounded-xl border border-slate-300 p-3" /><div className="flex flex-wrap gap-2"><button type="button" className="button-primary text-sm" onClick={() => void saveResult()}>Lưu kết quả luyện tập</button><button type="button" className="button-secondary text-sm" onClick={reset}>Luyện lại</button></div></div>}<div className="space-y-2"><h4 className="font-bold">Lịch sử mô phỏng ({results.length})</h4>{results.map((result) => <article key={result.id} className="flex items-center justify-between gap-3 rounded-xl border border-moss-100 p-3"><div><p className="text-sm font-semibold">{result.title}</p><p className="text-xs text-slate-500">{new Date(result.createdAt).toLocaleString()} · {result.turns.length} lượt</p></div><button type="button" className="text-xs font-semibold text-red-700 underline" onClick={() => { if (window.confirm('Xóa kết quả luyện tập?')) void onDelete(result.id); }}>Xóa</button></article>)}</div></div>;
}

function PerspectivePanel({ onSave }: { onSave: (value: JournalEntry) => Promise<void> }) {
  const [situation, setSituation] = useState(''); const [facts, setFacts] = useState(''); const [assumptions, setAssumptions] = useState(''); const [need, setNeed] = useState(''); const [approach, setApproach] = useState(''); const [show, setShow] = useState(false);
  return <div className="space-y-4"><div><p className="eyebrow">PERSPECTIVE EXPLORER</p><h3 className="mt-1 text-xl font-bold">Nhìn một tình huống từ nhiều phía</h3><p className="mt-1 text-sm text-slate-600">Không ai ở đây biết chắc người khác nghĩ gì. Các câu hỏi dưới đây giúp phân biệt dữ kiện với điều mình đang phỏng đoán.</p></div><label className="block text-sm font-semibold">Tình huống<textarea rows={3} value={situation} onChange={(event) => setSituation(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><label className="block text-sm font-semibold">Dữ kiện bạn trực tiếp biết<textarea rows={2} value={facts} onChange={(event) => setFacts(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><label className="block text-sm font-semibold">Những điều bạn đang suy đoán<textarea rows={2} value={assumptions} onChange={(event) => setAssumptions(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><label className="block text-sm font-semibold">Điều gì quan trọng với bạn lúc này?<textarea rows={2} value={need} onChange={(event) => setNeed(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><label className="block text-sm font-semibold">Một cách trao đổi bạn muốn thử<textarea rows={2} value={approach} onChange={(event) => setApproach(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><button className="button-primary text-sm" type="button" onClick={() => setShow(true)} disabled={!situation.trim()}>Mở câu hỏi phản tư</button>{show ? <div className="space-y-3 rounded-2xl bg-moss-50 p-4"><h4 className="font-bold">Các góc nhìn có thể cân nhắc</h4><p className="text-sm"><strong>Góc nhìn của bạn:</strong> Bạn có thể đang cần điều gì để thấy được lắng nghe hoặc tôn trọng?</p><p className="text-sm"><strong>Góc nhìn có thể có của người khác:</strong> Có thông tin nào họ có thể đang có mà bạn chưa biết? Đây chỉ là khả năng, không phải sự thật đã xác nhận.</p><p className="text-sm"><strong>Dữ kiện và giả định:</strong> Những điều nào có thể hỏi lại hoặc kiểm chứng một cách an toàn?</p><p className="text-sm"><strong>Cách tiếp cận:</strong> Bạn có thể nói nhu cầu của mình bằng một câu rõ ràng, không buộc tội như thế nào?</p><button type="button" className="button-secondary text-sm" onClick={() => void onSave({ id: makeId(), title: `Góc nhìn · ${situation.slice(0, 45)}`, body: `Tình huống: ${situation}\nDữ kiện: ${facts}\nĐiều đang suy đoán: ${assumptions}\nĐiều quan trọng: ${need}\nCách tiếp cận: ${approach}`, category: 'perspective', tags: ['reflection'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })}>Lưu phiếu phản tư vào nhật ký</button></div> : null}</div>;
}

function InsightPanel({ entries, memories, daily, progress }: { entries: JournalEntry[]; memories: MemoryItem[]; daily: DailyEntry[]; progress: JourneyProgress[] }) {
  const [days, setDays] = useState(30); const [includeJournal, setIncludeJournal] = useState(true); const [includeMemory, setIncludeMemory] = useState(true); const [includeDaily, setIncludeDaily] = useState(true);
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const recentJournal = includeJournal ? entries.filter((item) => new Date(item.updatedAt).getTime() >= since) : [];
  const recentMemory = includeMemory ? memories.filter((item) => new Date(item.updatedAt).getTime() >= since) : [];
  const recentDaily = includeDaily ? daily.filter((item) => new Date(item.createdAt).getTime() >= since) : [];
  const total = recentJournal.length + recentMemory.length + recentDaily.length;
  const categories = new Map<string, number>();
  for (const item of recentJournal) categories.set(`Nhật ký · ${item.category}`, (categories.get(`Nhật ký · ${item.category}`) || 0) + 1);
  for (const item of recentMemory) categories.set(`Ký ức · ${item.category}`, (categories.get(`Ký ức · ${item.category}`) || 0) + 1);
  for (const item of recentDaily) categories.set(`Phản tư · ${item.feeling}`, (categories.get(`Phản tư · ${item.feeling}`) || 0) + 1);
  return <div className="space-y-5"><div><p className="eyebrow">INSIGHT STUDIO</p><h3 className="mt-1 text-xl font-bold">Thống kê từ dữ liệu bạn chọn</h3><p className="mt-1 text-sm text-slate-600">Đây là thống kê mô tả tại chỗ, không phải phân tích lâm sàng, điểm sức khỏe tâm lý hoặc suy luận nguyên nhân.</p></div><div className="flex flex-wrap gap-4"><label className="text-sm font-semibold">Khoảng thời gian<select value={days} onChange={(event) => setDays(Number(event.target.value))} className="ml-2 rounded-xl border border-slate-300 bg-white p-2"><option value={7}>7 ngày</option><option value={30}>30 ngày</option><option value={90}>90 ngày</option><option value={365}>365 ngày</option></select></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeJournal} onChange={(event) => setIncludeJournal(event.target.checked)} /> Nhật ký</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeMemory} onChange={(event) => setIncludeMemory(event.target.checked)} /> Memory Graph</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeDaily} onChange={(event) => setIncludeDaily(event.target.checked)} /> Daily Reflection</label></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-moss-50 p-4"><p className="text-xs text-slate-600">Bản ghi được chọn</p><p className="mt-1 text-2xl font-extrabold">{total}</p></div><div className="rounded-2xl bg-moss-50 p-4"><p className="text-xs text-slate-600">Hành trình có tiến độ</p><p className="mt-1 text-2xl font-extrabold">{progress.length}</p></div><div className="rounded-2xl bg-moss-50 p-4"><p className="text-xs text-slate-600">Phạm vi</p><p className="mt-1 text-lg font-bold">{days} ngày</p></div></div>{total ? <div className="space-y-2"><h4 className="font-bold">Phân bố theo nhóm ghi nhận</h4>{[...categories.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => <div key={label} className="rounded-xl border border-moss-100 p-3"><div className="flex justify-between gap-3 text-sm"><span>{label}</span><strong>{count}</strong></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-moss-600" style={{ width: `${count / total * 100}%` }} /></div></div>)}</div> : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Chưa có bản ghi trong khoảng thời gian và nguồn bạn chọn.</p>}<p className="text-xs leading-5 text-slate-500">WHY THIS INSIGHT? Số lượng và nhóm được tính trực tiếp từ bản ghi bạn đã chọn trong trình duyệt. Chỉ một số lượng bản ghi nhỏ không đủ để xác định xu hướng ổn định; tương quan không chứng minh quan hệ nhân quả.</p></div>;
}

function DebriefPanel({ entries, onSave, onDelete }: { entries: DebriefEntry[]; onSave: (value: DebriefEntry) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [title, setTitle] = useState(''); const [discussed, setDiscussed] = useState(''); const [shared, setShared] = useState(''); const [perspectives, setPerspectives] = useState(''); const [explore, setExplore] = useState(''); const [nextStep, setNextStep] = useState('');
  async function submit(event: FormEvent) { event.preventDefault(); await onSave({ id: makeId(), title: title.trim() || `Tổng kết · ${new Date().toLocaleDateString('vi-VN')}`, discussed, shared, perspectives, explore, nextStep, createdAt: new Date().toISOString() }); setTitle(''); setDiscussed(''); setShared(''); setPerspectives(''); setExplore(''); setNextStep(''); }
  return <div className="space-y-5"><div><p className="eyebrow">CONVERSATION DEBRIEF</p><h3 className="mt-1 text-xl font-bold">Tổng kết sau một cuộc trò chuyện</h3><p className="mt-1 text-sm text-slate-600">Bản tổng kết do bạn tự điền. MẦM không tự động nhập cuộc trò chuyện hoặc lưu hội thoại vào bộ nhớ dài hạn.</p></div><form onSubmit={submit} className="space-y-3"><label className="block text-sm font-semibold">Tiêu đề<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label>{([[discussed,setDiscussed,'What we discussed · Điều mình đã trao đổi'],[shared,setShared,'What I shared · Điều mình đã chủ động chia sẻ'],[perspectives,setPerspectives,'Different perspectives · Những góc nhìn khác'],[explore,setExplore,'What to explore · Điều muốn tìm hiểu thêm'],[nextStep,setNextStep,'Your next step · Bước tiếp theo do mình chọn']] as const).map(([value,setter,label]) => <label key={label} className="block text-sm font-semibold">{label}<textarea rows={2} maxLength={1600} value={value} onChange={(event) => setter(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label>)}<button type="submit" className="button-primary text-sm">Lưu bản tổng kết</button></form><div className="space-y-2"><h4 className="font-bold">Bản tổng kết đã lưu ({entries.length})</h4>{entries.map((item) => <article key={item.id} className="rounded-2xl bg-moss-50 p-4"><div className="flex justify-between gap-2"><strong>{item.title}</strong><button type="button" className="text-xs text-red-700 underline" onClick={() => { if (window.confirm('Xóa bản tổng kết?')) void onDelete(item.id); }}>Xóa</button></div><p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{[['Đã trao đổi',item.discussed],['Đã chia sẻ',item.shared],['Góc nhìn',item.perspectives],['Muốn tìm hiểu',item.explore],['Bước tiếp theo',item.nextStep]].map(([label,value]) => <p key={label} className="text-sm"><strong>{label}:</strong> {value || 'Chưa ghi'}</p>)}</div></article>)}</div></div>;
}

function ToolkitPanel({ entries, onSave, onDelete }: { entries: ToolkitEntry[]; onSave: (value: ToolkitEntry) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [customTitle, setCustomTitle] = useState(''); const [category, setCategory] = useState('Personal'); const [note, setNote] = useState(''); const [collection, setCollection] = useState('Tất cả');
  const visible = entries.filter((item) => collection === 'Tất cả' || item.category === collection);
  return <div className="space-y-5"><div><p className="eyebrow">PERSONAL TOOLKIT</p><h3 className="mt-1 text-xl font-bold">Bộ công cụ của riêng bạn</h3><p className="mt-1 text-sm text-slate-600">Lưu những bài tập, câu hỏi hoặc cách diễn đạt bạn muốn dùng lại.</p></div><div className="grid gap-3 md:grid-cols-2">{starterTools.map((tool) => <article key={tool.id} className="rounded-2xl border border-moss-100 bg-moss-50 p-4"><p className="text-xs font-semibold text-moss-700">{tool.category}</p><h4 className="mt-1 font-bold">{tool.title}</h4><p className="mt-2 text-sm leading-6 text-slate-700">{tool.note}</p><button type="button" className="button-secondary mt-3 text-xs" disabled={entries.some((entry) => entry.id === tool.id)} onClick={() => void onSave({ ...tool, createdAt: new Date().toISOString() })}>{entries.some((entry) => entry.id === tool.id) ? 'Đã lưu' : 'Lưu vào bộ công cụ'}</button></article>)}</div><form onSubmit={(event) => { event.preventDefault(); if (!customTitle.trim()) return; void onSave({ id: makeId(), title: customTitle.trim(), category, note: note.trim(), createdAt: new Date().toISOString() }).then(() => { setCustomTitle(''); setNote(''); }); }} className="rounded-2xl border border-moss-100 p-4"><h4 className="font-bold">Tạo công cụ cá nhân</h4><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Tên công cụ<input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} maxLength={120} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" required /></label><label className="text-sm font-semibold">Bộ sưu tập<input value={category} onChange={(event) => setCategory(event.target.value)} maxLength={60} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><label className="text-sm font-semibold sm:col-span-2">Ghi chú<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={1000} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label></div><button className="button-primary mt-3 text-sm" type="submit">Lưu công cụ</button></form><div className="flex flex-wrap items-center justify-between gap-3"><h4 className="font-bold">Công cụ đã lưu ({entries.length})</h4><label className="text-xs font-semibold">Lọc theo bộ sưu tập<select value={collection} onChange={(event) => setCollection(event.target.value)} className="ml-2 rounded-xl border border-slate-300 bg-white p-2"><option>Tất cả</option>{[...new Set(entries.map((item) => item.category))].map((item) => <option key={item}>{item}</option>)}</select></label></div>{visible.map((item) => <article key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-moss-50 p-3"><div><strong className="text-sm">{item.title}</strong><p className="text-xs text-slate-500">{item.category}</p><p className="mt-1 text-sm">{item.note}</p></div><button type="button" className="text-xs text-red-700 underline" onClick={() => void onDelete(item.id)}>Bỏ lưu</button></article>)}</div>;
}

function VoicePanel({ onSaveTranscript, locale }: { onSaveTranscript: (transcript: string) => Promise<void>; locale: Locale }) {
  const [consented, setConsented] = useState(false); const [listening, setListening] = useState(false); const [transcript, setTranscript] = useState(''); const [voiceMessage, setVoiceMessage] = useState(''); const recognition = useRef<SpeechRecognitionLike | null>(null);
  function startListening() {
    if (!consented) { setVoiceMessage('Hãy xác nhận bạn đã đọc thông báo quyền riêng tư trước khi bật microphone.'); return; }
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setVoiceMessage('Trình duyệt này không hỗ trợ nhận dạng giọng nói. Bạn vẫn có thể nhập văn bản hoặc dùng chức năng đọc văn bản nếu có.'); return; }
    try {
      const instance = new Recognition(); instance.lang = locale === 'vi' ? 'vi-VN' : 'en-US'; instance.interimResults = false; instance.maxAlternatives = 1;
      instance.onresult = (event) => { const text = Array.from(event.results).map((result) => result[0]?.transcript || '').join(' ').trim(); if (text) setTranscript((current) => `${current}${current ? '\n' : ''}${text}`); };
      instance.onerror = () => { setVoiceMessage('Không thể nhận dạng giọng nói. Kiểm tra quyền microphone hoặc thử nhập văn bản.'); setListening(false); };
      instance.onend = () => setListening(false);
      recognition.current = instance; setVoiceMessage('Microphone đang hoạt động. Bạn có thể dừng bất cứ lúc nào.'); setListening(true); instance.start();
    } catch { setVoiceMessage('Không thể khởi động microphone trong trình duyệt này.'); setListening(false); }
  }
  function stopListening() { recognition.current?.stop(); setListening(false); }
  function speakText() {
    if (!('speechSynthesis' in window)) { setVoiceMessage('Trình duyệt chưa hỗ trợ đọc văn bản.'); return; }
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(transcript); utterance.lang = locale === 'vi' ? 'vi-VN' : 'en-US'; window.speechSynthesis.speak(utterance);
  }
  useEffect(() => () => { recognition.current?.stop(); if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);
  return <div className="space-y-5"><div><p className="eyebrow">MẦM VOICE</p><h3 className="mt-1 text-xl font-bold">Tương tác giọng nói trên trình duyệt</h3><p className="mt-1 text-sm text-slate-600">Nhận dạng giọng nói và đọc văn bản sử dụng khả năng sẵn có của trình duyệt. Đây không phải cuộc gọi thoại realtime với AI.</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Quyền riêng tư:</strong> Trình duyệt hoặc dịch vụ nhận dạng giọng nói mà trình duyệt tích hợp có thể xử lý âm thanh bên ngoài thiết bị. MẦM không lưu tệp âm thanh, nhưng không thể xác nhận chính sách lưu trữ của nhà cung cấp trình duyệt. Không đọc thông tin nhận dạng hoặc nội dung nhạy cảm. Chỉ bật microphone sau khi bạn chủ động chọn.</div><label className="flex items-start gap-3 rounded-xl border border-moss-100 p-3 text-sm"><input className="mt-1" type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} /><span>Mình đã đọc thông báo. Mình hiểu trình duyệt có thể xử lý âm thanh qua dịch vụ bên ngoài và mình không đọc thông tin nhạy cảm.</span></label><div className="flex flex-wrap gap-2"><button type="button" className="button-primary text-sm" onClick={startListening} disabled={listening}>🎙️ Bắt đầu nghe</button><button type="button" className="button-secondary text-sm" onClick={stopListening} disabled={!listening}>Dừng microphone</button><button type="button" className="button-secondary text-sm" onClick={speakText} disabled={!transcript.trim()}>🔊 Đọc văn bản</button><button type="button" className="button-secondary text-sm" onClick={() => { window.speechSynthesis?.cancel(); setVoiceMessage('Đã dừng phát âm thanh.'); }}>Dừng phát</button></div><p className="text-sm" role="status" aria-live="polite">{voiceMessage}</p><label className="block text-sm font-semibold">Bản ghi văn bản<textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} maxLength={8000} rows={6} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" placeholder="Văn bản nhận dạng sẽ xuất hiện ở đây. Bạn cũng có thể nhập trực tiếp." /></label><div className="flex flex-wrap gap-2"><button type="button" className="button-primary text-sm" disabled={!transcript.trim()} onClick={() => void onSaveTranscript(transcript.trim()).then(() => setVoiceMessage('Đã lưu bản ghi văn bản vào nhật ký đã mã hóa.'))}>Lưu bản ghi vào Story Journal</button><button type="button" className="button-secondary text-sm" onClick={() => setTranscript('')}>Xóa bản ghi khỏi màn hình</button></div></div>;
}
