import { describe, expect, it } from 'vitest';
import { SITE, resolveSiteUrl, siteMetadata } from './site';

const PADRAO = 'https://blog-no-law.vercel.app/';

describe('resolveSiteUrl', () => {
  it('cai no domínio de produção quando a variável está ausente', () => {
    expect(resolveSiteUrl(undefined).href).toBe(PADRAO);
  });

  it('cai no domínio de produção quando a variável está vazia', () => {
    expect(resolveSiteUrl('').href).toBe(PADRAO);
  });

  it('cai no domínio de produção quando o valor não é uma URL', () => {
    expect(resolveSiteUrl('nao-e-url').href).toBe(PADRAO);
  });

  it('recusa http: e cai no domínio de produção', () => {
    expect(resolveSiteUrl('http://exemplo.test').href).toBe(PADRAO);
  });

  it('recusa javascript: e cai no domínio de produção', () => {
    expect(resolveSiteUrl('javascript:alert(1)').href).toBe(PADRAO);
  });

  it('aceita uma URL https válida', () => {
    expect(resolveSiteUrl('https://exemplo.test').href).toBe('https://exemplo.test/');
  });
});

describe('siteMetadata', () => {
  it('traz o metadataBase como URL absoluta https', () => {
    expect(siteMetadata.metadataBase).toBeInstanceOf(URL);
    expect(new URL(String(siteMetadata.metadataBase)).protocol).toBe('https:');
  });

  it('declara siteName, locale e type do Open Graph', () => {
    const og = siteMetadata.openGraph as Record<string, unknown> | null | undefined;
    expect(og?.siteName).toBe('Blog No Law');
    expect(og?.locale).toBe('pt_BR');
    expect(og?.type).toBe('website');
  });

  it('mantém o título padrão, o modelo e a descrição do 02-11', () => {
    expect(siteMetadata.title).toEqual({ default: 'Blog No Law', template: '%s | Blog No Law' });
    expect(siteMetadata.description).toBe(SITE.description);
  });
});
