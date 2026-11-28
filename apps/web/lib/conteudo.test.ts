import { describe, expect, it } from 'vitest';
import { PRIVACIDADE, REGRAS, REGRAS_PROVISORIAS, SOBRE } from './conteudo';

// Reúne toda string de um export (títulos, parágrafos, itens), para a varredura
// não esquecer nenhum campo que o autor venha a acrescentar.
function coletarTextos(valor: unknown): string[] {
  if (typeof valor === 'string') return [valor];
  if (Array.isArray(valor)) return valor.flatMap(coletarTextos);
  if (valor && typeof valor === 'object') return Object.values(valor).flatMap(coletarTextos);
  return [];
}

// Lista de textos numa linha só: a mensagem de falha do relatório fica de uma linha.
function umaLinha(textos: readonly string[] | undefined): string {
  return (textos ?? []).join(' | ');
}

const TODOS = [...coletarTextos(SOBRE), ...coletarTextos(REGRAS), ...coletarTextos(PRIVACIDADE)];

const PROIBIDOS: ReadonlyArray<readonly [string, RegExp]> = [
  ['sigla da lei de dados', /lgpd/i],
  ['a palavra "lei"', /\blei\b/i],
  ['a palavra "cookie"', /cookie/i],
  ['afirmação "não coleta"', /não coleta/i],
  ['afirmação "não compartilha"', /não compartilha/i],
  ['marcação HTML', /</],
  ['link http', /http/i],
  ['link www.', /www\./i],
  ['convite do Discord', /discord\.gg/i],
  ['menção (@algo)', /@\p{L}/u],
  ['e-mail', /[^\s@]+@[^\s@]+\.[^\s@]+/],
  ['telefone (8 ou mais dígitos)', /(?:\d[\s().-]*){8,}/],
];

describe('textos das páginas institucionais', () => {
  it('Sobre: os parágrafos são o texto provisório da UI-SPEC', () => {
    expect(SOBRE.titulo).toBe('Sobre o clã');
    expect(umaLinha(SOBRE.paragrafos)).toBe(
      umaLinha([
        'O No Law nasceu em 2017, no GTA San Andreas Multiplayer (SA-MP), de uma amizade que já vinha de antes do jogo.',
        'Desde então a gente foi e voltou muitas vezes, mas o clã nunca deixou de existir.',
        'A história completa chega em breve.',
      ]),
    );
  });

  it('Sobre: cita 2017 e SA-MP', () => {
    const texto = SOBRE.paragrafos.join(' ');
    expect(texto).toContain('2017');
    expect(texto).toContain('SA-MP');
  });

  it('Regras: sem as regras do Discord, fica a versão mínima e provisória', () => {
    expect(REGRAS.titulo).toBe('Regras');
    expect(umaLinha(REGRAS.introducao)).toBe(
      umaLinha([
        'As regras do clã estão vindo do nosso Discord e aparecem aqui em breve.',
        'Enquanto isso, vale o de sempre: respeito com todo mundo.',
      ]),
    );
    expect(REGRAS.grupos).toHaveLength(0);
    expect(REGRAS_PROVISORIAS).toBe(true);
  });

  it('Privacidade: abertura e fecho são os da UI-SPEC', () => {
    expect(PRIVACIDADE.titulo).toBe('Política de Privacidade');
    expect(PRIVACIDADE.abertura).toBe(
      'Este site é o espaço do clã No Law para guardar e mostrar a nossa história. Por enquanto ele não pede cadastro.',
    );
    expect(PRIVACIDADE.fecho.at(-1)).toBe('Dúvidas sobre os seus dados? Fale com um admin do clã.');
  });

  it('Privacidade: "O que o site guarda" lista três itens', () => {
    const guarda = PRIVACIDADE.secoes.find((s) => s.titulo === 'O que o site guarda');
    expect(umaLinha(guarda?.itens)).toBe(
      umaLinha([
        'A sua escolha de tema (claro ou escuro), salva no seu próprio navegador para a próxima visita.',
        'Registros técnicos da hospedagem, como data, hora e endereço de acesso, usados para manter o site no ar e investigar problemas.',
        'Avisos automáticos de erro, sem dados pessoais, para a gente corrigir o que quebrar.',
      ]),
    );
  });

  it('Privacidade: "O que o site não faz" não vende dados nem usa para propaganda', () => {
    const naoFaz = PRIVACIDADE.secoes.find((s) => s.titulo === 'O que o site não faz');
    expect(umaLinha(naoFaz?.paragrafos)).toBe(
      'Não vende os seus dados e não usa nada disso para propaganda. Os serviços que o site usa (hospedagem e aviso de erros) recebem só o necessário para funcionar.',
    );
  });

  it('Privacidade: menciona navegador, hospedagem e erro', () => {
    const texto = coletarTextos(PRIVACIDADE).join(' ').toLowerCase();
    expect(texto).toContain('navegador');
    expect(texto).toContain('hospedagem');
    expect(texto).toContain('erro');
  });

  it('a varredura enxerga texto (não passa por vazio)', () => {
    expect(TODOS.length).toBeGreaterThan(10);
  });

  it.each(PROIBIDOS)('nenhum texto contém %s', (_nome, padrao) => {
    const achado = TODOS.find((texto) => padrao.test(texto));
    expect(achado).toBeUndefined();
  });
});
