import type {
  ChatHistoryMessage,
  SchoolSupportConfig,
  SupportLevel,
  SupportTopic,
} from '@/lib/types';

export type ConversationMode =
  | 'free_talk'
  | 'emotional_support'
  | 'self_understanding'
  | 'problem_exploration'
  | 'decision_support'
  | 'social_relationships';

export type ConversationStrategy =
  | 'active_listening'
  | 'clarifying'
  | 'reflective'
  | 'problem_analysis'
  | 'decision_support'
  | 'communication_support'
  | 'human_support';

export interface ModelInput {
  assistantModule?: import('@/lib/ai/orchestrator').AssistantModule;
  conversationStrategy?: ConversationStrategy;
  conversationMode?: ConversationMode;
  message: string;
  history: ChatHistoryMessage[];
  supportLevel: Exclude<SupportLevel, 'red'>;
  topicHint?: SupportTopic;
  schoolSupport: SchoolSupportConfig;
}

export interface ModelOutput {
  text: string;
  model: string;
}

export interface ChatModelProvider {
  generate(input: ModelInput): Promise<ModelOutput>;
}

export interface SafetyModelProvider {
  /** null means the safety check could not be completed; it is never equivalent to green. */
  assess(message: string): Promise<SupportLevel | null>;
  isOutputSafe(message: string): Promise<boolean | null>;
}
