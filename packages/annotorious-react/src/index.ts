// This ensures the Annotorious stylesheet gets packaged into annotorious-react
import '@annotorious/openseadragon/dist/annotorious-openseadragon.css';

export * from './openseadragon';
export * from './plugins';
export * from './Annotorious';
export * from './AnnotoriousPopup';

// Re-export useful utilities for convenience
export { 
  defaultColorProvider,
  Visibility 
} from '@annotorious/core';

// Re-export essential Types for convenience
export type { 
  Annotation,
  AnnotationBody,
  AnnotationTarget,
  Appearance,
  AppearanceProvider,
  PresentUser, 
  User
} from '@annotorious/core';

export type {
  ImageAnnotation
} from '@annotorious/annotorious';

export type {
  OSDAnnotator
} from '@annotorious/openseadragon';