import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Card, CardContent } from './card';

describe('Card', () => {
  const html = renderToStaticMarkup(
    <Card>
      <CardContent>x</CardContent>
    </Card>,
  );

  it('é uma superfície bg-card com raio de 6px (rounded-md)', () => {
    expect(html).toContain('bg-card');
    expect(html).toContain('rounded-md');
  });

  it('no escuro tem contorno, no claro tem a sombra de folha', () => {
    expect(html).toContain('dark:border');
    expect(html).toContain('light:shadow-folha');
  });

  it('o CardContent tem 24px de padding no celular e 48px a partir de 768px', () => {
    expect(html).toContain('p-6');
    expect(html).toContain('md:p-12');
  });

  it('junta a classe de quem usa sem perder a superfície', () => {
    const custom = renderToStaticMarkup(<Card className="mx-auto max-w-190" />);
    expect(custom).toContain('max-w-190');
    expect(custom).toContain('bg-card');
  });

  it('não usa cor literal em hex', () => {
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
