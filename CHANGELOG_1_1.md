# 1.1.0 — Balance & Combat Movement (21/10/2026)

## Corrigido

- Início de batalha disparado na zona externa, causando aprisionamento na entrada: agora exige posição dentro do núcleo da sala.
- Condição de bloqueio substituída por limite dos acessos da sala, sem congelar movimentação interna.
- Colisão usando raio menor em fallback, que podia colocar o jogador dentro de paredes.
- Hitbox da espada alinhada ao setor preenchido visualmente, considerando colisão circular do inimigo.

## Balanceado

- XP para subir de nível passa a `65 + 30×nível + 7×nível²`, arredondado.
- XP padrão por inimigo comum ~5 (às vezes 10), elite 44, chefe 112.
- Salas de tesouro: 26% por andar; forja: 12% por andar, no máximo uma de cada.
- Baús em sala: 3,5% após batalha comum e 12% após elite.
- Bônus de poção a cada dois andares avançados, em vez de todos.

## Compatibilidade

- Mantida chave de save `fracture_bulletheart_v1` e estrutura do arquivo.
- Nenhuma alteração de sprites ou comandos.

## Validação

- 11 testes automatizados (incluindo 5 novos) aprovados.
- Chromium: menu, entrada em combate, movimento nos dois eixos, dano de espada e amostra de 350 masmorras, sem erros JavaScript.
- Esta versão foi validada tecnicamente, mas a duração de uma campanha completa ainda exige playtest real.
