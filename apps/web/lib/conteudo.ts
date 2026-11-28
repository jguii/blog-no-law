// Textos das páginas institucionais (Sobre o clã, Regras, Política de Privacidade).
// Ficam num lugar só para o autor revisar com calma. São strings puras: as páginas
// (plano 02-06) renderizam como texto pelo JSX, nunca como HTML, então aqui não entra
// marcação, link, menção, convite do Discord nem contato pessoal (o teste vigia isso).
// O texto definitivo do Sobre é do backlog (D-12).

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
  paragrafos: [
    'O No Law nasceu em 2017, no GTA San Andreas Multiplayer (SA-MP), de uma amizade que já vinha de antes do jogo.',
    'Desde então a gente foi e voltou muitas vezes, mas o clã nunca deixou de existir.',
    'A história completa chega em breve.',
  ],
};

// Versão mínima, até as regras do Discord serem adaptadas (D-13).
export const REGRAS: {
  titulo: 'Regras';
  introducao: readonly string[];
  grupos: readonly GrupoDeRegras[];
} = {
  titulo: 'Regras',
  introducao: [
    'As regras do clã estão vindo do nosso Discord e aparecem aqui em breve.',
    'Enquanto isso, vale o de sempre: respeito com todo mundo.',
  ],
  grupos: [],
};

// Verdadeiro enquanto não há grupo de regras: a página mostra a versão mínima.
export const REGRAS_PROVISORIAS: boolean = REGRAS.grupos.length === 0;

// Só o que o site guarda hoje (D-14). Não afirma "não coleta" nem "não compartilha":
// a hospedagem registra endereço de acesso e há serviços de terceiros (UI-SPEC P7).
// O tema vive no armazenamento do navegador, então o texto diz "salva no seu próprio navegador".
export const PRIVACIDADE: {
  titulo: 'Política de Privacidade';
  abertura: string;
  secoes: readonly Secao[];
  fecho: readonly string[];
} = {
  titulo: 'Política de Privacidade',
  abertura:
    'Este site é o espaço do clã No Law para guardar e mostrar a nossa história. Por enquanto ele não pede cadastro.',
  secoes: [
    {
      titulo: 'O que o site guarda',
      itens: [
        'A sua escolha de tema (claro ou escuro), salva no seu próprio navegador para a próxima visita.',
        'Registros técnicos da hospedagem, como data, hora e endereço de acesso, usados para manter o site no ar e investigar problemas.',
        'Avisos automáticos de erro, sem dados pessoais, para a gente corrigir o que quebrar.',
      ],
    },
    {
      titulo: 'O que o site não faz',
      paragrafos: [
        'Não vende os seus dados e não usa nada disso para propaganda. Os serviços que o site usa (hospedagem e aviso de erros) recebem só o necessário para funcionar.',
      ],
    },
  ],
  fecho: [
    'Quando o login com o Discord chegar, esta página explica o que muda.',
    'Dúvidas sobre os seus dados? Fale com um admin do clã.',
  ],
};
