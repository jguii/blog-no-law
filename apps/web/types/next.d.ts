// O next-env.d.ts é gerado pelo build e fica fora do Git, e o job de typecheck da CI roda sem build.
// Estas duas diretivas dão ao TypeScript as declarações de `*.css` e de imagens que o Next oferece.
/// <reference types="next" />
/// <reference types="next/image-types/global" />
