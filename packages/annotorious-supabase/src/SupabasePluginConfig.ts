export interface SupabasePluginConfig {

  base: string;

  apiKey: string;

  eventsPerSecond?: number;

  channel: string;

}