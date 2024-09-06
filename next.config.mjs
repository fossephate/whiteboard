/** @type {import('next').NextConfig} */
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
    swSrc: 'src/app/sw.ts', // where the service worker src is
    swDest: 'public/sw.js', // where the service worker code will end up
    reloadOnOnline: true,
    
});

const nextConfig = withSerwist({
    basePath: '/board',
});

export default nextConfig
