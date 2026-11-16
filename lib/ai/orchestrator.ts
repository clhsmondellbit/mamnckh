import { normalizeVietnamese } from '@/lib/safety/classify';
import type { ConversationMode, ConversationStrategy } from '@/lib/ai/types';
import type { SupportTopic } from '@/lib/types';

export type AssistantModule =
  | 'chat'
  | 'study_support'
  | 'emotional_support'
  | 'reflection'
  | 'communication'
  | 'knowledge'
  | 'human_support_routing';

export interface OrchestrationDecision {
  module: AssistantModule;
  topicHint?: SupportTopic;
  strategy: ConversationStrategy;
  mode: ConversationMode;
}

type IntentRule = {
  module: AssistantModule;
  topic: SupportTopic;
  terms: string[];
};

/**
 * Transparent routing hints, not a psychological assessment. Multiple signals
 * are scored so one incidental word does not automatically determine a route.
 * The selected module is still only prompt guidance and is never persisted.
 */
const intentRules: IntentRule[] = [
  {
    module: 'study_support',
    topic: 'study_pressure',
    terms: [
      'bai tap', 'lich hoc', 'ke hoach hoc tap', 'lap ke hoach',
      'phan chia nhiem vu', 'kiem tra', 'thi cu', 'diem so',
      'qua tai viec hoc', 'mat dong luc hoc', 'bai kiem tra',
    ],
  },
  {
    module: 'communication',
    topic: 'communication',
    terms: [
      'noi chuyen', 'giao tiep', 'tu choi', 'xin loi', 'bat dong',
      'trinh bay', 'dat gioi han', 'noi dieu minh nghi',
    ],
  },
  {
    module: 'reflection',
    topic: 'emotion_regulation',
    terms: [
      'nhat ky', 'tu nhin nhan', 'phan tu', 'suy nghi',
      'cam xuc cua minh', 'hieu ban than', 'gia tri cua minh',
    ],
  },
  {
    module: 'emotional_support',
    topic: 'anxiety_stress',
    terms: [
      'lo lang', 'cang thang', 'met moi', 'buon', 'co don',
      'ap luc', 'so hai', 'that vong', 'khong thoai mai',
    ],
  },
  {
    module: 'human_support_routing',
    topic: 'other',
    terms: [
      'muon gap thay co', 'tim nguoi ho tro', 'tu van hoc duong',
      'goi lai', 'can noi voi nguoi lon', 'muon dat lich',
    ],
  },
  {
    module: 'knowledge',
    topic: 'other',
    terms: [
      'kien thuc', 'la gi', 'giai thich', 'tai lieu',
      'nguon tham khao', 'co nghia la gi',
    ],
  },
];

const topicModule: Record<SupportTopic, AssistantModule> = {
  study_pressure: 'study_support',
  exams: 'study_support',
  low_grades: 'study_support',
  motivation: 'study_support',
  friends: 'communication',
  isolation: 'emotional_support',
  bullying: 'human_support_routing',
  cyberbullying: 'human_support_routing',
  family_conflict: 'emotional_support',
  relationships: 'communication',
  self_confidence: 'reflection',
  anxiety_stress: 'emotional_support',
  sadness: 'emotional_support',
  loneliness: 'emotional_support',
  social_media: 'reflection',
  sleep_worry: 'emotional_support',
  school_avoidance: 'human_support_routing',
  emotion_regulation: 'reflection',
  communication: 'communication',
  future_self_direction: 'reflection',
  other: 'chat',
};

function inferMode(module: AssistantModule): ConversationMode {
  if (module === 'communication') return 'social_relationships';
  if (module === 'reflection') return 'self_understanding';
  if (module === 'emotional_support' || module === 'human_support_routing') return 'emotional_support';
  if (module === 'knowledge') return 'problem_exploration';
  return 'free_talk';
}

function chooseStrategy(
  message: string,
  module: AssistantModule,
  mode: ConversationMode,
): ConversationStrategy {
  const text = normalizeVietnamese(message);

  if (module === 'human_support_routing') return 'human_support';
  if (mode === 'decision_support') return 'decision_support';
  if (mode === 'problem_exploration') return 'problem_analysis';
  if (mode === 'self_understanding') return 'reflective';
  if (mode === 'social_relationships' || module === 'communication') return 'communication_support';

  const decisionSignals = [
    'nen chon', 'nen lam gi', 'nen quyet dinh', 'phan van',
    'lua chon nao', 'so sanh cac lua chon',
  ];
  if (decisionSignals.some((signal) => text.includes(signal))) return 'decision_support';

  const analysisSignals = [
    'phan tich', 'vi sao', 'tai sao', 'dieu gi dang xay ra',
    'khong hieu vi sao', 'nhin tu nhieu goc do',
  ];
  if (analysisSignals.some((signal) => text.includes(signal))) return 'problem_analysis';

  if (module === 'reflection') return 'reflective';

  const clarificationSignals = [
    'khong biet bat dau tu dau', 'khong biet phai lam sao',
    'minh cung khong ro', 'co the hoi minh',
  ];
  if (clarificationSignals.some((signal) => text.includes(signal))) return 'clarifying';

  return 'active_listening';
}

export function orchestrateSupportRequest(
  message: string,
  selectedTopic?: SupportTopic,
  selectedMode?: ConversationMode,
): OrchestrationDecision {
  if (selectedTopic) {
    const module = topicModule[selectedTopic];
    const mode = selectedMode || inferMode(module);
    return {
      module,
      topicHint: selectedTopic,
      strategy: chooseStrategy(message, module, mode),
      mode,
    };
  }

  const text = normalizeVietnamese(message);
  const ranked = intentRules
    .map((rule, index) => ({
      ...rule,
      index,
      score: rule.terms.reduce((score, term) => score + (text.includes(normalizeVietnamese(term)) ? 1 : 0), 0),
    }))
    .filter((rule) => rule.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const best = ranked[0];
  const module = best?.module || 'chat';
  const mode = selectedMode || inferMode(module);
  return {
    module,
    topicHint: best?.topic,
    strategy: chooseStrategy(message, module, mode),
    mode,
  };
}
