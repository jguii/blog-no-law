// Selo hanko do clã (D-19): quadrado de 44px em vermelho da marca com "NO" e "LAW" empilhados em
// branco (razão de contraste 7,58, AAA). Decorativo: a marca com texto acessível está ao lado.
export function Hanko() {
  return (
    <div
      aria-hidden="true"
      className="flex size-11 shrink-0 flex-col items-center justify-center rounded-sm bg-primary text-label leading-none text-white"
    >
      <span>NO</span>
      <span>LAW</span>
    </div>
  );
}
