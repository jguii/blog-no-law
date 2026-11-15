# Brand Brief: Blog No Law

Insumos do autor para a Fase 2 (Identidade visual). Coletado em 2026-11-14.

## Paleta

| Papel | Hex | Observação |
|---|---|---|
| Base / fundo | `#000000` | Preto. Cor dominante |
| Vermelho escuro | `#420b0d` | Fim do gradiente; superfícies, cards, fundos de seção |
| Vermelho principal | `#ac020f` | Início do gradiente; cor da marca, botões, destaques |
| Complementar | `#d3aa82` | Bege/areia. Base para derivar tons de apoio |

Gradiente da marca: vermelho claro → escuro (`#ac020f` → `#420b0d`).

### Contraste (WCAG, calculado)
- `#ac020f` sobre `#000000` ≈ 2.8:1. **Reprova** para texto e para elementos de UI (mínimo 3:1). Usar vermelho como fundo/preenchimento, não como texto sobre preto.
- Branco sobre `#ac020f` ≈ 7.6:1. Aprova: texto de botão em branco ou bege-claro.
- `#d3aa82` sobre `#000000` ≈ 9.8:1. Aprova com folga: bom para títulos, links e destaques no tema escuro.
- `#420b0d` é muito escuro (próximo do preto): serve como superfície ou fundo, nunca como texto sobre fundo escuro.

## Direção / clima
- **Original**, com **tom nostálgico**: um clã antigo que segue vivo apesar das idas e vindas.
- Sem site de referência específico. Inspiração estrutural em **sites com cara de blog/comunidade como o Reddit** (feed em cards, categorias, perfis, reações e comentários), mas com identidade própria guiada pela paleta.
- Tema escuro é o natural da paleta (preto dominante). O tema claro precisa ser derivado (provavelmente a partir do bege).

## Tipografia
- Autor aceita **fontes estilizadas** para títulos e marca; não tem nenhuma em mente.
- Propor opções gratuitas (Google Fonts) nos mockups: uma display com personalidade para títulos e uma sans legível para o corpo.
- Evitar imitar a identidade visual oficial do GTA/Rockstar (ex.: fonte Pricedown): a marca deve ser do clã.

## Ativos (em `assets/brand/`)
- `Logo No Law.jpg`: 1024x1024, JPG, **sem SVG e sem transparência**. Emblema circular com dragão preto e dragão vermelho em yin-yang, "NO LAW" (NO em vermelho, LAW em preto) e "SINCE 2017", sobre pergaminho bege com montanhas em tinta, pétalas vermelhas e nuvens estilizadas vermelho/preto com contorno dourado.
- `Banner No Law.jpg`: 1500x500, JPG. Pergaminho bege, galho de bordo (folhas laranja), nuvens vermelho/preto nos cantos, emblema do dragão ao centro, "NO LAW" e o slogan **"Uma nova face, uma nova história."** numa fonte latina de estilo japonês (traços que imitam katakana).

### O que os ativos revelam sobre a identidade
- A estética real é **oriental / tinta sumi-e sobre pergaminho**: papel bege envelhecido, pinceladas, dragões, nuvens, pétalas e folhas. Isso casa com o "nostálgico" pedido e dá a originalidade buscada.
- A paleta informada bate com os ativos: preto e vermelho no emblema e o bege `#d3aa82` como cor do pergaminho. O dourado do contorno das nuvens é um acento extra possível.
- **Proposta de temas:** tema claro = "pergaminho" (fundo bege, tinta preta, vermelho como destaque); tema escuro = "tinta" (fundo preto, superfícies `#420b0d`, bege nos textos de destaque).
- O slogan "Uma nova face, uma nova história." serve para a home ou o header.
- Fonte do banner: display latina estilo japonês. Buscar equivalentes gratuitas para títulos, mantendo um corpo de texto legível.

### Trabalho necessário na Fase 2
- **Recortar e vetorizar o emblema** (dragões + círculo) para SVG ou PNG transparente. É necessário para header, favicon e imagem de Open Graph; o JPG com fundo texturizado não serve para isso.
- Gerar favicon (16/32/180/512) a partir do emblema simplificado (só os dragões em círculo; o texto fica ilegível em tamanho pequeno).
- Usar a textura de pergaminho de forma sutil como fundo, sem prejudicar a leitura nem o contraste.
- Confirmar o ano de fundação: o logo diz "SINCE 2017" e o PROJECT.md diz "10+ anos".

## Para os mockups (`/gsd-sketch` na Fase 2)
Gerar de 2 a 3 direções comparáveis, todas com a paleta acima. Ideias de eixo:
1. Pergaminho/sumi-e: fiel aos ativos, fundo de papel, pinceladas e nuvens como ornamento.
2. Tinta/sombrio: preto dominante, gradiente vermelho como assinatura, bege e dourado nos detalhes, ornamentos orientais mínimos.
3. Arquivo/memorial: ênfase em linha do tempo e fotos, ar de "acervo", usando a estética oriental com moderação.
