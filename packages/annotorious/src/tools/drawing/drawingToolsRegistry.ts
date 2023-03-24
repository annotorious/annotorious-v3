import type { SvelteComponent } from 'svelte';
import { RubberbandRectangle } from './rectangle';
import { RubberbandPolygon } from './polygon';

const REGISTERED = new Map<string, typeof SvelteComponent>([
  ['box', RubberbandRectangle],
  ['polygon', RubberbandPolygon]
]);

export const listTools = () => [...REGISTERED.keys()];

export const getTool = (name: string) => REGISTERED.get(name);