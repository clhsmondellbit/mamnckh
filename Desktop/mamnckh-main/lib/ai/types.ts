import type {
  ChatHistoryMessage,
  SchoolSupportConfig,
  SupportLevel,
  SupportTopic,
} from '@/lib/types';

export interface ModelInput {
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
  assess(message: string): Promise<Exclude<SupportLevel, 'green'> | null>;
  isOutputSafe(message: string): Promise<boolean | null>;
}
