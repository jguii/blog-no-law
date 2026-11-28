'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { DragonMark } from '@/components/dragon-mark';
import { THEME_KEY, resolveTheme, type Theme } from '@/lib/theme';

// O tema vive no atributo data-theme do <html> (o script anti-flash o aplica antes da pintura).
// O botão só lê esse atributo e avisa os ouvintes quando ele muda.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

function readTheme(): Theme {
  return resolveTheme(document.documentElement.getAttribute('data-theme'));
}

// Servidor e hidratação veem "dark" (D-15); se o visitante tiver salvo "light", o React
// reconcilia o rótulo logo após hidratar. O ícone não depende disso: ele muda por CSS.
function readServerTheme(): Theme {
  return 'dark';
}

function readStoredTheme(): Theme {
  try {
    return resolveTheme(localStorage.getItem(THEME_KEY));
  } catch {
    return 'dark';
  }
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, readServerTheme);

  // O Strict Mode do dev remonta e limpa atributos que o script pôs no <html>: reaplica a escolha
  // salva (no-op em produção). Com o storage bloqueado, cai no escuro padrão.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', readStoredTheme());
    notify();
  }, []);

  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  function toggle() {
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage bloqueado: o tema troca só nesta sessão e a próxima visita abre no escuro.
    }
    notify();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={next === 'light' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      className="group inline-flex size-11 items-center justify-center rounded-full border-2 border-border bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <span className="inline-flex transition-transform duration-300 group-hover:rotate-180 light:rotate-180 light:group-hover:rotate-360 motion-reduce:transition-none">
        <DragonMark size={28} />
      </span>
    </button>
  );
}
