// Fixture do gate de HTML bruto: só JSX com texto (escapado pelo React).
export function SafeBlock({ text }: { text: string }) {
  return <div>{text}</div>;
}
