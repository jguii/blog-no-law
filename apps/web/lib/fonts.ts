import { Atkinson_Hyperlegible_Next, Yuji_Boku } from 'next/font/google';

// Fontes do clã (D-18): Atkinson Hyperlegible Next no corpo e Yuji Boku nos títulos. Nada de fonte
// que imite o GTA/Rockstar. Este é o único módulo que chama o loader do next/font.
// O Next baixa as fontes no build e as serve de /_next/static/media: o navegador do visitante
// nunca fala com o Google, então o IP dele não chega a terceiros.
export const body = Atkinson_Hyperlegible_Next({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

// Yuji Boku só existe no peso 400: pedir negrito geraria negrito sintético, por isso os títulos
// do clã não usam peso.
export const title = Yuji_Boku({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-title',
  display: 'swap',
});
