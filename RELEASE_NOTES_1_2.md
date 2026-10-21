# FRACTURE: BULLETHEART 1.2 - Public Beta

## Corrigido nesta edição

- Martelo: golpe base 45 de dano, recarga 1,07 s, escala de carga limitada; distância ótima próxima ao centro da pancada, bordas com redução de dano.
- Inimigos comuns: vida ajustada ao nível com limite; cadência de ataque cresce com a progressão.
- Alguns inimigos comuns aparecem como campeões marcados em dourado, com mais vida e risco.
- Atiradores passam a se movimentar lateralmente.
- Interface de armas recebe sete arquivos SVG reais do Lucide, com aviso ISC/MIT.
- Boss: fases e escudos intocados.

## Validação

- 15 testes automáticos passam.
- Teste de abertura em Chromium executado com scripts embutidos, sem erros de JS.
- Renderização e carregamento de um SVG verificados.
- Simulação de impacto do martelo validou dano maior no centro e menor na borda.
- O servidor HTTP local pode ser iniciado, mas este ambiente impede uma navegação direta a localhost pelo Chromium.

## Ainda pendente para uma build pública

- Tileset CC0 de mundo/personagens completo (pacotes foram localizados, mas downloads binários falharam neste ambiente).
- Playtests humanos completos com diferentes classes e níveis.
- Balanceamento estatístico com telemetria voluntária, sem enviar dados automaticamente.
- Auditoria de acessibilidade, resolução de tela, desempenho e licenciamento de todos os assets.
