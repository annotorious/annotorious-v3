import type { AppearanceProvider } from "@annotorious/core/dist/presence/AppearanceProvider";

export type SupabasePluginConfig = {

  apiKey: string,
  
  base: string,

  channel: string,

  layerId: string,

  eventsPerSecond?: number,

  appearanceProvider?: AppearanceProvider
  
}