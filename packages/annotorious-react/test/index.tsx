import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Annotorious } from '../src';

const root = createRoot(document.getElementById('root') as Element);
root.render(
  <Annotorious>
    <App />
  </Annotorious>
);
