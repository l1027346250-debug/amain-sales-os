import { type AiSdkPackage } from 'twenty-shared/ai';
import {
  IconApi,
  IconBrandAnthropic,
  IconGoogle,
  IconPlug,
  IconProviderOpenai,
  IconServer,
  IconSparkles,
  IconWorld,
  type IconComponent,
} from 'twenty-ui/display';

export type OpenClawProviderPreset = {
  id: string;
  label: string;
  subtitle: string;
  Icon: IconComponent;
  npm: AiSdkPackage;
  providerName?: string;
  baseUrl?: string;
};

export const OPENCLAW_PROVIDER_PRESETS: OpenClawProviderPreset[] = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    subtitle: 'Claude native provider',
    Icon: IconBrandAnthropic,
    npm: '@ai-sdk/anthropic',
    providerName: 'anthropic',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    subtitle: 'GPT native provider',
    Icon: IconProviderOpenai,
    npm: '@ai-sdk/openai',
    providerName: 'openai',
  },
  {
    id: 'google',
    label: 'Google',
    subtitle: 'Gemini native provider',
    Icon: IconGoogle,
    npm: '@ai-sdk/google',
    providerName: 'google',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    subtitle: 'OpenAI-compatible gateway',
    Icon: IconWorld,
    npm: '@ai-sdk/openai-compatible',
    providerName: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'minimax-cn',
    label: 'MiniMax (CN)',
    subtitle: 'China endpoint preset',
    Icon: IconApi,
    npm: '@ai-sdk/openai-compatible',
    providerName: 'minimax',
    baseUrl: 'https://api.minimax.chat/v1',
  },
  {
    id: 'moonshot-cn',
    label: 'Moonshot (CN)',
    subtitle: 'Kimi / Moonshot endpoint',
    Icon: IconSparkles,
    npm: '@ai-sdk/openai-compatible',
    providerName: 'moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
  },
  {
    id: 'siliconflow-cn',
    label: 'SiliconFlow (CN)',
    subtitle: 'China inference gateway',
    Icon: IconApi,
    npm: '@ai-sdk/openai-compatible',
    providerName: 'siliconflow',
    baseUrl: 'https://api.siliconflow.cn/v1',
  },
  {
    id: 'minimax-global',
    label: 'MiniMax (Global)',
    subtitle: 'Global endpoint preset',
    Icon: IconWorld,
    npm: '@ai-sdk/openai-compatible',
    providerName: 'minimax',
    baseUrl: 'https://api.minimaxi.chat/v1',
  },
  {
    id: 'bytedance-ark',
    label: 'ByteDance Ark',
    subtitle: 'Volcengine Ark endpoint',
    Icon: IconApi,
    npm: '@ai-sdk/openai-compatible',
    providerName: 'bytedance-ark',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  },
  {
    id: 'ollama',
    label: 'Ollama',
    subtitle: 'Local model runtime',
    Icon: IconServer,
    npm: '@ai-sdk/openai-compatible',
    providerName: 'ollama',
    baseUrl: 'http://127.0.0.1:11434/v1',
  },
  {
    id: 'custom',
    label: 'Custom',
    subtitle: 'Bring your own endpoint',
    Icon: IconPlug,
    npm: '@ai-sdk/openai-compatible',
  },
];
