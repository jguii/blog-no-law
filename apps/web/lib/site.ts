import type { Metadata, Viewport } from 'next';

// Esqueleto da etapa RED (02-11): os valores reais entram na etapa GREEN.
export const SITE = {
  name: '',
  clan: '',
  slogan: '',
  foundedYear: 0,
  description: '',
} as const;

export const siteMetadata: Metadata = {};

export const siteViewport: Viewport = {};
