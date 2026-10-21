# FRACTURE BULLETHEART — Registro de validação

Executado em 2026-10-20 no container de criação.

- `npm run check`: compilação de tipos aprovada.
- `npm run build`: sucesso; arquivos gerados em `dist`.
- `npm test`: 6/6 verificações estruturais aprovadas.
- Chromium headless com página HTML + JS + PNG embutidos: menu, escolha de classe, início da expedição, movimento, ataque e interface — sem exceções JS no fluxo.
- Chromium: nível aumentado com XP, três opções renderizadas, seleção e retorno ao combate funcionando.
- Chromium: geração de sala de combate/elite (6–8 inimigos), boss com 2 cristais destrutíveis, e transição de fase sem morte instantânea.
- Testes de geração: 100 mapas, entre 13 e 19 salas, 2 elites e 1 chefe por região; centros e eixos de corredores conectados caminháveis, 0 falhas nesses cenários.

Limitações: não foram simuladas campanhas inteiras em ritmo humano nem testadas 100% das combinações de armas/mutações; os testes de navegação foram gerados e percorridos matematicamente, não representam avaliação subjetiva de diversão. Artes originais geradas por Python; recursos CC0 externos apenas pesquisados. A versão não copia assets de Enter the Gungeon.
