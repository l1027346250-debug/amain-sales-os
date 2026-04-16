import {
  IconApi,
  IconBrandAnthropic,
  IconBrandMistral,
  IconBrandXai,
  IconGoogle,
  IconServer,
  IconProviderOpenai,
  IconRobot,
  IconSparkles,
  IconWorld,
  type IconComponent,
} from 'twenty-ui/display';

export const PROVIDER_ICON_CONFIG: Record<string, { Icon: IconComponent }> = {
  openai: { Icon: IconProviderOpenai },
  anthropic: { Icon: IconBrandAnthropic },
  bedrock: { Icon: IconRobot },
  google: { Icon: IconGoogle },
  mistral: { Icon: IconBrandMistral },
  xai: { Icon: IconBrandXai },
  openrouter: { Icon: IconWorld },
  minimax: { Icon: IconApi },
  moonshot: { Icon: IconSparkles },
  siliconflow: { Icon: IconApi },
  'bytedance-ark': { Icon: IconApi },
  ollama: { Icon: IconServer },
  'openai-compatible': { Icon: IconProviderOpenai },
};
