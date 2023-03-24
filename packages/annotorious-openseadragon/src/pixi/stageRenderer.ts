import * as PIXI from 'pixi.js';
import type OpenSeadragon from 'openseadragon';
import { ShapeType } from '@annotorious/annotorious';
import type { ImageAnnotation, Polygon, Rectangle } from '@annotorious/annotorious';

const drawRectangle = (rectangle: Rectangle) => {
  const { x, y, w, h } = rectangle.geometry;

  const rect = new PIXI.Graphics();
  rect.beginFill(0x1a73e8, 0.25);
  rect.drawRect(x, y, w, h);
  rect.endFill();

  return rect;
}

const drawPolygon = (polygon: Polygon) => {
  const flattend = polygon.geometry.points.reduce((flat, xy) => ([...flat, ...xy]), []);   

  const poly = new PIXI.Graphics();
  poly.beginFill(0x1a73e8, 0.25);
  poly.drawPolygon(flattend);
  poly.endFill();

  return poly;
}

const redraw = (viewer: OpenSeadragon.Viewer, graphics: PIXI.Graphics, renderer: PIXI.AbstractRenderer) => () => {
  const viewportBounds = viewer.viewport.viewportToImageRectangle(viewer.viewport.getBounds(true));

  const containerWidth = viewer.viewport.getContainerSize().x;
  const zoom = viewer.viewport.getZoom(true);
  const scale = zoom * containerWidth / viewer.world.getContentFactor();

  const rotation = Math.PI * viewer.viewport.getRotation() / 180;

  const dx = - viewportBounds.x * scale;
  const dy = - viewportBounds.y * scale;

  let offsetX: number, offsetY: number;

  if (rotation > 0 && rotation <= Math.PI / 2) {
    offsetX = viewportBounds.height * scale;
    offsetY = 0;
  } else if (rotation > Math.PI / 2 && rotation <= Math.PI) {
    offsetX = viewportBounds.width * scale;
    offsetY = viewportBounds.height * scale;
  } else if (rotation > Math.PI && rotation <= Math.PI * 1.5) {
    offsetX = 0;
    offsetY = viewportBounds.width * scale;
  } else {
    offsetX = 0;
    offsetY = 0;
  }
    
  graphics.position.x = offsetX + dx * Math.cos(rotation) - dy * Math.sin(rotation);
  graphics.position.y = offsetY + dx * Math.sin(rotation) + dy * Math.cos(rotation);
  graphics.scale.set(scale, scale);
  graphics.rotation = rotation;
  
  renderer.render(graphics);
};

export const createStage = (viewer: OpenSeadragon.Viewer, canvas: HTMLCanvasElement) => {

  const graphics = new PIXI.Graphics();

  const renderer = PIXI.autoDetectRenderer({ 
    width: canvas.width, 
    height: canvas.height,
    backgroundAlpha: 0,
    view: canvas
  });

  // Lookup table: rendered shapes by annotation ID
  const renderedGraphics = new Map<string, PIXI.Graphics>(); 

  const addAnnotation = (annotation: ImageAnnotation) => {
    const { selector } = annotation.target;

    let g: PIXI.Graphics;

    if (selector.type === ShapeType.RECTANGLE) {
      g = drawRectangle(selector as Rectangle);
    } else if (selector.type === ShapeType.POLYGON) {
      g = drawPolygon(selector as Polygon);
    } else {
      console.warn(`Unsupported shape type: ${selector.type}`)
    }

    if (g) {
      graphics.addChild(g);
      renderedGraphics.set(annotation.id, g);
    }
  }

  const removeAnnotation = (annotation: ImageAnnotation) => {
    const g = renderedGraphics.get(annotation.id);
    if (g) {
      renderedGraphics.delete(annotation.id);  
      g.destroy();
    }
  }

  const updateAnnotation = (oldValue: ImageAnnotation, newValue: ImageAnnotation) => {
    const g = renderedGraphics.get(oldValue.id);

    if (g) {
      renderedGraphics.delete(oldValue.id);
      g.destroy();

      addAnnotation(newValue)
    }
  }

  const resize = (width: number, height: number) => {
    renderer.resize(width, height);
    renderer.render(graphics);
  }

  return {
    addAnnotation,
    redraw: redraw(viewer, graphics, renderer),
    removeAnnotation,
    resize,
    updateAnnotation
  }
  
}