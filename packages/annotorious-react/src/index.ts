// This ensures the Annotorious stylesheet gets packaged into annotorious-react
import '@annotorious/openseadragon/dist/annotorious-openseadragon.css';

export * from './openseadragon';
export * from './plugins';
export * from './Annotorious';
export * from './AnnotoriousPopup';

// Re-export useful utility functions for convenience
export { defaultColorProvider } from '@annotorious/core';

// Re-export essential Types for convenience
export type { 
  Annotation,
  AnnotationBody,
  Appearance,
  AppearanceProvider,
  PresentUser, 
  User
} from '@annotorious/core';