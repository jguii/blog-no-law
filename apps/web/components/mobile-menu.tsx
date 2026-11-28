'use client';

import { useEffect, useRef, useState } from 'react';
import { CloseIcon, MenuIcon } from '@/components/icons';
import { NavLinks } from '@/components/nav-links';

type MobileMenuProps = {
  // Id do painel, ligado ao botão por `aria-controls`. Só uma instância por página deve usar o
  // padrão: a pré-visualização do `/kit` passa outro id.
  panelId?: string;
};

// Altura da faixa (padding 8+8, linha de 44px e traço de pincel de 10px): o painel rola dentro do
// que sobra da janela, para um celular deitado não cortar o último item.
const PANEL_MAX_HEIGHT = 'max-h-[calc(100dvh-4.375rem)]';

// Menu sanduíche do celular (D-10, D-23): um disclosure, não um diálogo. O botão ☰ (44x44) abre um
// painel logo abaixo da faixa; o painel não é modal, então não trava foco nem rolagem. Nasce
// fechado no HTML do servidor (atributo `hidden`) e só existe abaixo de 768px (`md:hidden`).
// O painel se posiciona contra o <header> (o `relative` mais próximo), por isso nada entre os dois
// pode ser posicionado.
export function MobileMenu({ panelId = 'menu-principal' }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Esc fecha e devolve o foco ao ☰ (onde o visitante estava antes de abrir).
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Alargar a janela para 768px ou mais troca o ☰ pelas pílulas: o painel fecha para não voltar
  // aberto ao estreitar de novo.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 768px)');
    function onChange(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }
    wide.addEventListener('change', onChange);
    return () => wide.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="md:hidden">
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        className="inline-flex size-11 items-center justify-center rounded-full border-2 border-border bg-transparent text-foreground hover:bg-accent"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      <div
        id={panelId}
        hidden={!open}
        className={`absolute inset-x-0 top-full z-30 overflow-y-auto border-b-2 border-border bg-panel px-4 py-2 ${PANEL_MAX_HEIGHT}`}
      >
        <nav aria-label="Principal">
          <NavLinks variant="panel" onNavigate={() => setOpen(false)} />
        </nav>
      </div>
    </div>
  );
}
