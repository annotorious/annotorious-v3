import { v4 as uuidv4 } from 'uuid';
import type { AnnotationBody } from '@annotorious/core';
import { type ImageAnnotation, ShapeType } from '@annotorious/annotorious';
import { parseMediaFragment } from '../mediafragments';
import { parseSVG } from '../svg';
import type { WebAnnotation } from '.';

interface W3CParseResult {
  
  parsed: ImageAnnotation[];
  
  failed: WebAnnotation[];

}

export const parseW3C = (annotations: WebAnnotation[], invertY: boolean = false): W3CParseResult =>
  annotations.reduce(
    (result, annotation) => {
      const id = annotation.id || uuidv4();

      const { body } = annotation;

      const bodies: AnnotationBody[] = (Array.isArray(body) ? body : [body]).map(b => ({
        annotation:id,
        type: b.type,
        purpose: b.purpose,
        value: b.value,
        created: b.created,
        creator: b.creator ? { ...b.creator } : undefined
      }));

      const target = Array.isArray(annotation.target) ? annotation.target[0] : annotation.target;

      const selector = Array.isArray(target.selector) ? target.selector[0] : target.selector;

      let crosswalked: ImageAnnotation;

      if (selector.type === 'FragmentSelector') {
        crosswalked = {
          id,
          target: {
            annotation: id,
            selector: {
              type: ShapeType.RECTANGLE,
              geometry: parseMediaFragment(selector.value, invertY)
            }
          },
          bodies
        };
      } else if (selector.type === 'SvgSelector') {
        const parsed = parseSVG(selector.value);
        if (parsed) {
          crosswalked = {
            id,
            target: {
              annotation: id,
              selector: {
                type: parsed.type,
                geometry: { ...parsed.geometry }    
              }
            },
            bodies
          };
        }
      } else {
        console.error(`Unknown selector type: ${selector.type}`);
      }

      return crosswalked
        ? {
            parsed: [...result.parsed, crosswalked],
            failed: result.failed
          }
        : {
            parsed: result.parsed,
            failed: [...result.failed, annotation]
          };
    },
    { parsed: [], failed: [] }
  );
