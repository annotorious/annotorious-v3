import type { User } from '../model';
import type { Appearance } from './Appearance';
import type { PresentUser } from './PresentUser';
import { DEFAULT_PALETTE } from './Palette';

export interface AppearanceProvider {

  addUser(presenceKey: string, user: User): Appearance;

  removeUser(user: PresentUser): void;

}

export const createDefaultAppearenceProvider = () => {
  const unassignedColors = [...DEFAULT_PALETTE];

  const assignRandomColor = () => {
    const rnd = Math.floor(Math.random() * unassignedColors.length);
    const color = unassignedColors[rnd];

    unassignedColors.splice(rnd, 1);

    return color;
  }

  const addUser = (presenceKey: string, user: User): Appearance => {
    const color = assignRandomColor();

    return {
      label: user.name || user.id,
      avatar: user.avatar,
      color
    };
  }

  const removeUser = (user: PresentUser) =>
    unassignedColors.push(user.appearance.color);

  return { addUser, removeUser }
  
}