export interface SupabasePluginConfig {

  apiKey: string;
  
  base: string;

  channel: string;

  layerId: string;

  eventsPerSecond?: number;
  
}