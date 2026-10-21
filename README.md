# FRACTURE: BULLETHEART — 1.1 · Movimento e Progressão

Este pacote é uma **atualização completa da edição BULLETHEART com o build Windows corrigido**. Preserva os controles, armas, gráficos, o Arquivo e os saves anteriores (`fracture_bulletheart_v1`).

## Correções desta edição

- **Movimento durante combates:** o encontro só começa após entrar no interior da sala. O bloqueio limita apenas a saída enquanto há inimigos; caminhar, esquivar e se deslocar lateralmente continuam livres. A movimentação usa passos pequenos para não atravessar/entrar em paredes por raio reduzido.
- **Espada:** o golpe atinge **toda a área do setor**, do jogador até a borda externa desenhada, considerando o tamanho dos inimigos. A área está sombreada e a curva brilhante sinaliza somente o alcance máximo. Inimigos atrás do jogador não são atingidos.
- **XP mais exigente:** necessidade inicial de **102 XP**, com crescimento acelerado por nível. Inimigos comuns deixam por padrão uma gema de 5 XP (20% de chance de uma segunda); elites deixam 4 × 11 XP e chefes 8 × 14 XP. Isso reduz a quantidade de melhorias obtidas muito cedo.
- **Tesouro e forja raros:** por andar existe **26% de chance** de gerar uma sala de tesouro e **12% de chance** de gerar uma forja; não são mais garantidos. Também reduzimos a chance de baús após combates para 3,5% (12% em elites). Os dois confrontos de elite necessários para obter os selos continuam garantidos.
- **Recuperação de recursos:** a poção gratuita só aparece a cada dois andares adicionais, evitando excesso de cura na campanha.

## Jogar sem instalar dependências

Extraia a edição **PLAY_NOW** e abra `index.html` no Chrome ou Edge.

## Abrir no VS Code

Na edição completa, abra a pasta do projeto que contém `package.json`, execute `npm run dev` e acesse `http://127.0.0.1:5173`. Com o build incluído é possível iniciar sem `npm install`; para alterar e recompilar o TypeScript, execute `npm install` antes. Não é necessário instalar TypeScript globalmente.

## Testes

- `npm test` — testes de regressão de combate, XP, raridade e estrutura.
- `python tools/qa_browser.py` — QA exploratório automatizado no Chromium (precisa de Playwright e Chromium disponíveis).
- `npm run build` — compilar o TypeScript após instalar dependências locais.

### O que ainda requer avaliação humana

A sensação de dificuldade, a curva de poder em campanhas completas e a diversão de sessões longas exigem playtests. Testes automatizados verificam regras e fluxos, mas não garantem equilíbrio perfeito.

---

# FRACTURE — BULLETHEART

**Ação em tempo real, exploração contínua e evolução de personagem.** Uma reconstrução jogável do FRACTURE, inspirada em *princípios gerais* de action roguelites como Enter the Gungeon, Tiny Rogues e The Binding of Isaac. Não contém personagens, sons, sprites ou código desses jogos.

## JOGAR IMEDIATAMENTE (Windows, Linux, macOS)

1. Descompacte `FRACTURE_BULLETHEART_PLAY_NOW.zip` inteiro.
2. Abra `index.html` no Chrome, Edge ou Firefox atual.
3. Clique em **Começar expedição**, selecione uma classe e jogue.

Não é necessário `npm install`, Node.js, hospedagem nem conexão com a internet. Fontes alternativas locais serão utilizadas quando a web estiver indisponível.

## O que tem no jogo

- Mapa contínuo de masmorra gerado proceduralmente: 13 a 19 salas por região, conectadas por corredores físicos; arquitetura variável, obstáculos, paredes e minimapa que revela salas visitadas.
- **Cinco regiões** com identidade cromática, inimigos mais agressivos e um guardião em cada região.
- Controle WASD, mira livre com mouse, dash com invulnerabilidade curta, projéteis inimigos visíveis e preparação dos ataques.
- **Três classes:** Caçador (espada/revólver), Colosso (martelo/arco), Arcanista (cetro/escopeta).
- **Sete armas mecanicamente distintas**: espada em arco, martelo carregado com onda de choque, arco com flechas perfurantes, revólver automático, escopeta espalhada, cajado com raios em cadeia e disco giratório.
- XP que cai no chão, níveis, escolha entre três melhorias ao subir de nível, mais de 20 evoluções e combinações (raios, explosões por abate, ricochete, roubo de vida, gelo, orbitais etc.).
- Salas de combate, elites, tesouros, forjas, santuários, cura, segredos e guardiões; cada tipo tem iconografia/ambiente e recompensa próprios.
- Chefes com proteção por cristais, três fases e padrões de disparos que exigem esquiva.
- Arquivo persistente, moeda Eco, Relicário de melhorias permanentes, histórico de expedições, importação/exportação de save.
- Música e sons sintetizados localmente por Web Audio, sem arquivos externos. O navegador exige uma interação inicial para permitir áudio.

## Controles

| Ação | Controle |
| --- | --- |
| Mover | WASD / setas |
| Mirar | Mouse |
| Atacar | Segurar clique esquerdo |
| Carregar e liberar martelo/arco | Segurar e soltar clique esquerdo |
| Arma primária/secundária | 1 / 2 |
| Esquiva | Espaço |
| Poder da classe | Q |
| Interagir (baús, forja, altar) | E |
| Poção | H |
| Exibir/ocultar minimapa | Tab |
| Pausa | Esc ou P |
| Ativar/desativar áudio | M (durante jogo), menu principal |

## Entrega para desenvolvedores

A edição de código-fonte usa **TypeScript**, **HTML/CSS** e **Canvas 2D** sem engine de terceiros nem dependências no runtime. Os desenhos pixel art são originais e têm seu gerador no projeto (`tools/create_art.py` e `tools/menu_art.py`), ambos exigindo Pillow somente para regenerar os arquivos, não para jogar.

Na pasta que contém `package.json`:

```bash
npm run dev
```

**Se tu só quer rodar o jogo, não precisa instalar nada**: o comando acima usa os arquivos já compilados em `dist/` quando TypeScript não está instalado. Alternativamente, abra `dist/index.html` diretamente.

**Se tu for editar `src/main.ts`**, instala as dependências e executa novamente:

```bash
npm install
npm run dev
```

Com TypeScript instalado, `npm run dev` recompila automaticamente o código-fonte e inicia o servidor em `http://127.0.0.1:5173`. Para gerar a edição de distribuição manualmente, use `npm run build`. Os comandos `npm run check` e `npm test` servem para verificar tipos e executar testes.

**Windows:** o script de build chama o compilador local por meio do próprio Node.js, e não depende de encontrar `tsc` globalmente no PATH. Se executar `npm run build` sem instalar as dependências, ele mostrará uma instrução clara para usar `npm install`.

## Saves e versões antigas

A chave nova é `fracture_bulletheart_v1`. O jogo tenta importar informações básicas da chave `fracture_reliquary_v2`, quando o browser expõe os dois dados na mesma origem. Também aceita importar pelo Arquivo arquivos JSON de progresso anterior, convertendo itens conhecidos compatíveis e Ecos. O sistema de equipamento mudou; portanto, não é possível converter todas as builds antigas.

**Recomendo exportar o save da versão anterior antes de substituir seus arquivos.** Abrir `index.html` em outra pasta pode resultar em armazenamento local isolado no navegador.

## Conteúdo original, licenças e open source

Este projeto não reproduz dados, imagens ou sons extraídos de jogos comerciais. Os sprites são criados pelos scripts Python incluídos e toda a lógica de combate é escrita especificamente para FRACTURE.

Foram pesquisados como alternativas CC0 (não incorporados ao ZIP):
- [Kenney — Roguelike/RPG pack](https://kenney.nl/assets/roguelike-rpg-pack), CC0, 1700 sprites 16x16.
- [Puny Dungeon (Shade)](https://opengameart.org/content/16x16-puny-dungeon-tileset), CC0, 16×16.
- [Buch — Dungeon Tileset](https://opengameart.org/content/dungeon-tileset), CC0.

Esses arquivos não foram obtidos no ambiente de produção: **não estão neste pacote**. Ver `RESEARCH_AND_DESIGN.md`.

## Validação e limitações

- TypeScript compilado e versão estática produzida.
- Chromium headless: menu, classes, início da expedição, movimentação, ataques e HUD sem erros no fluxo testado.
- Simulação de 100 masmorras: todos os centros de salas caminháveis e trajetos centrais entre salas conectados.
- Chromium headless: uma sala elite gera inimigos, XP gera escolha de nível, chefe nasce protegido, destruir cristal o enfraquece e seu HP respeita uma transição de fase.
- Sem teste humano longo de todas as classes/regiões, sem garantia de balanceamento ou de duração exata. É um **protótipo grande e jogável**, não um título comercial finalizado. Testes de game feel e acessibilidade ainda são necessários.

## Organização

- `src/main.ts` — motor, salas, combate, progressão, inventário, HUD e persistência.
- `assets/*.png` — arte original incluída na versão estática.
- `tools/create_art.py` — gerador de sprites de atores e objetos.
- `tools/menu_art.py` — arte do menu.
- `tools/build.mjs` — transpila TypeScript e monta a distribuição estática.
- `tools/serve.mjs` — servidor simples local.
- `tools/browser_check.py`, `tools/extended_check.py`, `tools/logic_check.py` — testes exploratórios reproduzíveis em Chromium/Playwright (dependência opcional).

## Próximas prioridades de qualidade

Playtest de 30–60 minutos em cada classe, sistemas avançados de IA e line-of-sight, geração com segredos que exijam pistas, partículas e animação desenhada frame a frame, trilha composta com variações e ajustes de dificuldade com telemetria real de mortes/abates. Não apresentamos essas tarefas como concluídas.


## 1.2 Public Beta – enemy & weapon balance
- Hammer: heavy impact now has a slower cadence, reduced charge scaling, and an inner sweet spot/outer falloff.
- Normal enemies: moderate level-aware health/cadence scaling; some are visibly marked as stronger champions.
- Ranged enemies strafe at medium range instead of only approaching or stopping.
- Weapon HUD includes real open-source Lucide SVG icons. License in THIRD_PARTY_LICENSES.md. This is not the full CC0 environment-art overhaul yet.
- Boss health and multi-phase protections are unchanged.

The values are **initial balance candidates** until multiple manual playtests are completed.
