import { v4 as uuidv4 } from 'uuid';
import { type ImageAnnotation, ShapeType } from '@annotorious/annotorious';
import { parseMediaFragment } from '../mediafragments';
import type { IIIFAnnotation } from '.';
import { parseSVG } from '../svg';

interface IIIFParseResult {
  
  parsed: ImageAnnotation[]; 
  
  failed: IIIFAnnotation[];

}

export const parseAnnotations = (annotations: IIIFAnnotation[]): IIIFParseResult =>
  annotations.reduce((result, annotation) => {
    const { on, resource } = annotation;

    let crosswalked: ImageAnnotation;

    if (on.selector['@type'] === 'oa:FragmentSelector') {
      const id = annotation['@id'];

      crosswalked = {
        id,
        target: {
          annotation: id,
          selector: {
            type: ShapeType.RECTANGLE,
            geometry: parseMediaFragment(on.selector.value)
          }
        },
        bodies: [{
          id: uuidv4(),
          annotation: id,
          purpose: 'transcribing',
          value: resource.chars
        }]
      };
    } else if (on.selector['@type'] === 'oa:SvgSelector') {
      const parsed = parseSVG(on.selector.value);
      if (parsed) {
        const id = annotation['@id'] || uuidv4();

        crosswalked = {
          id,
          target: {
            annotation: id,
            selector: {
              type: parsed.type,
              geometry: { ...parsed.geometry }
            }
          },
          bodies: [{
            id: uuidv4(),
            annotation: id,
            purpose: 'transcribing',
            value: resource.chars
          }]
        };
      }
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
    }, { parsed: [], failed: [] }
  );
