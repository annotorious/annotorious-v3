export interface SupabasePluginConfig {

  base: string;

  apiKey: string;

  eventsPerSecond?: number;

  channel: string;

  user: { id: string, name: string }

}