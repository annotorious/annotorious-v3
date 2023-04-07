import React from 'react';
import { createRoot } from 'react-dom/client';
import { Annotorious } from '../src';

const root = createRoot(document.getElementById('root') as Element);

root.render(
  <Annotorious>
    <div>Hello World</div>
  </Annotorious>
);