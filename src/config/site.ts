export const siteConfig = {
  name: 'PVS POS',
  description: 'Enterprise AI Smart Point of Sale Platform',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://pvs.martt.growxlabs.tech',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'https://pvs.martt.growxlabs.tech',
} as const;
