import type { MetadataRoute } from 'next'


export default function manifest(): MetadataRoute.Manifest {
    return {
        id: "/?source=pwa",
        name: "Fridge Board",
        short_name: "FridgeBoard",
        description: 'Whiteboard for your Fridge!',
        start_url: '/board/',
        display: 'standalone',
        background_color: '#fff',
        theme_color: '#fff',
        icons: [
            {
                "src": "icons/manifest-icon-192.maskable.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "any"
            },
            {
                "src": "icons/manifest-icon-192.maskable.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "maskable"
            },
            {
                "src": "icons/manifest-icon-512.maskable.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any"
            },
            {
                "src": "icons/manifest-icon-512.maskable.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "maskable"
            }
        ],
    }
}