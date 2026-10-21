# FRACTURE: BULLETHEART 1.3 — CÂMARA ÂNCORA

Esta atualização implementa uma **base física permanente**, localizada fora da masmorra mutável.

## Loop

1. O jogo abre na Câmara Âncora. Desloque-se pelo salão com WASD.
2. `E` perto do **Altar** escolhe uma classe; perto da **Forja**, fabrica; no **Mercador**, vende; no **Cofre**, consulta materiais; no **Arquivo**, consulta descobertas.
3. `E` no portal da base inicia uma **nova expedição procedural** no Nó Zero do primeiro andar.
4. Inimigos deixam materiais comuns e ocasionalmente raros. `I` abre a mochila (12 tipos de materiais; pilhas ilimitadas).
5. `E` no **Nó Zero** do primeiro andar extrai todo o espólio. Em andares superiores, `E` no Nó Zero permite recuar para o andar anterior pelo caminho já explorado.
6. `R` inicia um **ritual de retorno de 4 segundos** se houver um pergaminho. Movimentar-se ou sofrer dano interrompe o ritual sem gastar o pergaminho.
7. Em extração viva ou vitória, 100% dos materiais entram no Cofre. Na morte, retorna apenas 25% (arredondado para baixo) dos materiais comuns; raros são perdidos. Ecos, Arquivo e melhorias anteriores permanecem.
8. Ao sair da base para uma nova expedição, a masmorra muda completamente. Durante uma expedição e ao andar de volta por outros andares, a geometria permanece a mesma.

## Mercador / Forja

O Mercador vende 1 pergaminho por expedição por 90 Ecos e compra materiais da reserva em lote. A Forja usa recursos extraídos para fabricar pergaminhos, uma poção adicional para a próxima expedição ou armas preparadas para a próxima partida. Não há melhorias ilimitadas de dano.

## Persistência

O save antigo `fracture_bulletheart_v1` é preservado e ampliado. A expedição em andamento recebe um checkpoint local a cada 5 segundos e ao sair da página; ao retornar ao navegador, a tentativa é restaurada. O armazenamento é **local ao navegador e ao domínio**, sem contas online. Exporte o save no Arquivo para criar backup.

## Limitações

O inventário inicial usa seis materiais de crafting e os itens equipados continuam representados principalmente pelas armas da build. A economia requer mais balanceamento com partidas completas. O design visual da base reutiliza sprites originais do FRACTURE 1.2 e ainda precisa de uma revisão artística.
