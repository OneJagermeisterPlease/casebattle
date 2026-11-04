import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@casebattle/shared'],
  output: 'standalone',
  // Монорепо: трассируем зависимости от корня, чтобы standalone-сборка включила workspace-пакеты.
  outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../'),
};

export default nextConfig;
