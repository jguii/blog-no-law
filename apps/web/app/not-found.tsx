import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Página não encontrada' };

// 404 estática: herda o layout raiz (header, tema e rodapé). Um card central com o Display e
// o CTA primário de volta ao início.
export default function NotFound() {
  return (
    <Card className="mx-auto max-w-190">
      <CardContent className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-display text-balance">Página não encontrada</h1>
        <p className="text-body">Esse endereço não existe ou mudou de lugar.</p>
        <Link href="/" className={buttonVariants({ variant: 'primary' })}>
          Voltar para o início
        </Link>
      </CardContent>
    </Card>
  );
}
