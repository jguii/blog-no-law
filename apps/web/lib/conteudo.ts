// Textos das páginas institucionais (Sobre o clã, Regras, Política de Privacidade).
// Ficam num lugar só para o autor revisar com calma. São strings puras: as páginas
// (plano 02-06) renderizam como texto pelo JSX, nunca como HTML, então aqui não entra
// marcação, link, menção, convite do Discord nem contato pessoal (o teste vigia isso).
// O Sobre é o texto que o autor escreveu (substitui o provisório da D-12); a história
// completa do clã continua podendo crescer depois.

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
    'A No Law nasceu em 2017, no GTA San Andreas Multiplayer (SA-MP) no servidor Cidade Vida Real (CVR).',
    'Em nossa jornada tivemos alguns fins de ciclos e reinícios e até hoje o clã resiste.',
  ],
};

// Regras do clã no Discord, adaptadas ao blog e ao tom da D-13/D-11: agrupadas por tema
// (cada título vira um h2) e uma regra por item (vira um item da lista numerada).
// Se um dia ficar sem grupos, a página volta à versão provisória (REGRAS_PROVISORIAS).
export const REGRAS: {
  titulo: 'Regras';
  introducao: readonly string[];
  grupos: readonly GrupoDeRegras[];
} = {
  titulo: 'Regras',
  introducao: [
    'A ideia da No Law é simples: reunir o pessoal, fazer amizades e zoar.',
    'Pra isso funcionar, o respeito entre todos é o que mais importa, e valeu a quem ajuda a manter o clã bacana.',
  ],
  grupos: [
    {
      titulo: 'Respeito vem primeiro',
      regras: ['Respeite todo mundo: o respeito entre todos é o que mais importa aqui.'],
    },
    {
      titulo: 'Preconceito e piadas',
      regras: [
        'Não aceitamos nenhum tipo de preconceito, como racismo, homofobia ou xenofobia.',
        'Também não toleramos piadas de cunho sexual.',
        'Não importa se a intenção era fazer uma “brincadeira”: esse tipo de atitude não tem lugar aqui.',
        'Quem fizer isso é banido do clã e do nosso Discord.',
      ],
    },
    {
      titulo: 'Desentendimentos e brigas',
      regras: [
        'Se tiver algum problema ou desentendimento com alguém, resolvam na conversa e com calma.',
        'Não permitimos brigas no chat: mensagens desse tipo serão apagadas.',
        'Lembrem-se: é apenas SA-MP. Vamos manter o ambiente amigável para todo mundo jogar de boa!',
      ],
    },
  ],
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
