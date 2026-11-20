// Fixture do gate de HTML bruto: este arquivo é INSEGURO de propósito.
// Não faz parte de apps/web e nunca é compilado; só o teste check-no-raw-html.test.mjs o lê.
export function UnsafeBlock({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
