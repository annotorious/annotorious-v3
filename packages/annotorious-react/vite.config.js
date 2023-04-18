import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsConfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';

import * as packageJson from './package.json';

export default defineConfig(({ command, mode }) => ({
  plugins: [
    react(),
    tsConfigPaths(),
    dts({
      include: ['./src/']
    })
  ],
  server: {
    open: '/test/index.html'
  },
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'AnnotoriousReact',
      formats: ['es', 'umd'],
      fileName: (format) => `annotorious-react.${format}.js`
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies)],
      output: {
        globals: {
          react: 'React',
          openseadragon: 'OpenSeadragon'
        }
      }
    }
  }
}));