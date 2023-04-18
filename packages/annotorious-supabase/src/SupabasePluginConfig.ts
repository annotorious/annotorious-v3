export interface SupabasePluginConfig {

  apiKey: string;
  
  base: string;

  channel: string;

  eventsPerSecond?: number;
  
}