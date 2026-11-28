import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button, buttonVariants } from './button';

const combinations = [
  { variant: 'primary', size: 'default' },
  { variant: 'primary', size: 'sm' },
  { variant: 'secondary', size: 'default' },
  { variant: 'secondary', size: 'sm' },
] as const;

describe('buttonVariants', () => {
  it('usa por padrão o primário de 52px com o gradiente da marca', () => {
    const classes = buttonVariants();
    expect(classes).toContain('bg-brand-button');
    expect(classes).toContain('h-13');
  });

  it('o tamanho sm tem 44px de altura', () => {
    const classes = buttonVariants({ size: 'sm' });
    expect(classes).toContain('h-11');
    expect(classes).not.toContain('h-13');
  });

  it('o secundário é contorno de 2px na cor do texto, sem o gradiente', () => {
    const classes = buttonVariants({ variant: 'secondary' });
    expect(classes).toContain('border-2');
    expect(classes).toContain('border-foreground');
    expect(classes).not.toContain('bg-brand-button');
  });

  it('o primário sobe no hover, sem movimento para quem pede menos animação', () => {
    const classes = buttonVariants({ variant: 'primary' });
    expect(classes).toContain('hover:shadow-botao');
    expect(classes).toContain('motion-reduce:hover:transform-none');
  });

  it('tem foco visível pelo anel do tema e estado desabilitado', () => {
    const classes = buttonVariants();
    expect(classes).toContain('focus-visible:outline-ring');
    expect(classes).toContain('disabled:pointer-events-none');
    expect(classes).toContain('disabled:opacity-50');
  });

  it.each(combinations)('não usa cor literal em hex (%o)', (props) => {
    expect(buttonVariants(props)).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

describe('Button', () => {
  it('é type="button" por padrão, para não enviar formulário sem querer', () => {
    expect(renderToStaticMarkup(<Button>Ok</Button>)).toContain('type="button"');
  });

  it('respeita o type pedido', () => {
    expect(renderToStaticMarkup(<Button type="submit">Ok</Button>)).toContain('type="submit"');
  });

  it('repassa disabled', () => {
    expect(renderToStaticMarkup(<Button disabled>Ok</Button>)).toContain('disabled=""');
  });

  it('junta a classe de quem usa sem perder as variantes', () => {
    const html = renderToStaticMarkup(<Button className="w-full">Ok</Button>);
    expect(html).toContain('w-full');
    expect(html).toContain('bg-brand-button');
  });
});
