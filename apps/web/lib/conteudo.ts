// Esqueleto do RED: formas e exports sem texto, para o teste falhar numa asserção
// (e não por módulo ausente). O conteúdo real entra no commit GREEN.

export type Secao = {
  titulo: string;
  itens?: readonly string[];
  paragrafos?: readonly string[];
};

export type GrupoDeRegras = {
  titulo: string;
  regras: readonly string[];
};

export const SOBRE: { titulo: 'Sobre o clã'; paragrafos: readonly string[] } = {
  titulo: 'Sobre o clã',
  paragrafos: [],
};

export const REGRAS: {
  titulo: 'Regras';
  introducao: readonly string[];
  grupos: readonly GrupoDeRegras[];
} = {
  titulo: 'Regras',
  introducao: [],
  grupos: [],
};

export const REGRAS_PROVISORIAS: boolean = false;

export const PRIVACIDADE: {
  titulo: 'Política de Privacidade';
  abertura: string;
  secoes: readonly Secao[];
  fecho: readonly string[];
} = {
  titulo: 'Política de Privacidade',
  abertura: '',
  secoes: [],
  fecho: [],
};
