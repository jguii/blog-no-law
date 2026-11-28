// Esqueleto do RED: sem a arte, para os testes falharem na asserção e não na carga do módulo.
// O GREEN o substitui pela arte dos dragões.
export function DragonMark({
  size,
  detail,
  className,
}: {
  size: number;
  detail?: 'small' | 'large';
  className?: string;
}) {
  void size;
  void detail;
  void className;
  return <svg />;
}
