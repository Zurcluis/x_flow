# Coleta: prints, leitura e tabela

## Por que prints (realidade de setembro de 2026)

O Instagram não abre perfis para leitura automática sem login: buscar a página pela web
devolve a tela de entrada. Sites e extensões que "raspam" perfis violam os termos de uso e
muitos pedem a senha: não use nem recomende. Por isso a skill trabalha de dois jeitos:

1. **No chat**: o aluno manda prints (capturas de tela) e você lê.
2. **Com o Claude no Chrome**: se o aluno já estiver logado no Instagram dele no Chrome, você
   pode navegar e ler o que está visível na tela, com as regras do fim deste arquivo.

Os Insights (alcance, salvamentos, visitas, toques no link) só aparecem para o dono do perfil.
Perfil do aluno ou de cliente: peça os prints dos Insights. Prospect: só dados públicos.

## Lista de prints para mandar ao aluno

Mande só o que falta, nesta linguagem (caminhos do app na realidade de setembro de 2026;
os nomes mudam, confira no app). Antes, peça para ligar o "Não perturbe" do celular: aviso de
mensagem por cima da tela cobre justamente os números.

1. **Topo do perfil**: abra o perfil e tire um print mostrando foto, nome, bio, link, números
   (publicações, seguidores, seguindo) e a fileira de destaques.
2. **Grade**: 2 ou 3 prints rolando o perfil até aparecerem de 12 a 30 posts.
3. **Números de cada post** (escolha um caminho):
   - Dono do perfil, no computador: Meta Business Suite > Insights > Conteúdo. A tabela com
     alcance, curtidas, comentários, compartilhamentos e salvamentos por post resolve em 1 ou 2
     prints.
   - Dono do perfil, no celular: em cada post, "Ver insights" (ou pelo painel profissional),
     um print por post.
   - Sem acesso aos Insights: abra cada post e anote data, curtidas e comentários (se não
     estiverem ocultos). Na aba Reels do perfil, cada Reel mostra as visualizações.
4. **Insights, visão geral** (só o dono): Painel profissional > Insights, período de 30 dias.
   Um print com visualizações (e a divisão seguidores e não seguidores), contas alcançadas,
   interações, contas com engajamento, seguidores (novos no período) e atividade do perfil
   (visitas e toques em links).
5. **Reels, opcional**: print dos insights de 2 ou 3 Reels mostrando duração e tempo médio de
   visualização.
6. **Concorrentes, opcional**: de 2 ou 3 perfis, o topo do perfil e a aba Reels (ou 6 a 12
   posts com curtidas e comentários).
7. **O que não aparece no print** (o aluno escreve): primeira linha das legendas e a chamada do
   final, quantos Stories por semana, o que tem no link, qual é a oferta e o próximo passo
   (aula experimental, orçamento, agenda), quem grava e quantas horas por semana cabem.

## Como ler e montar a tabela

Trabalhe numa pasta própria, por exemplo `raio-x-studiolunapilates-2026-09-28/`, com dois
arquivos que você escreve: `posts.csv` e `perfil.json` (modelos completos em `modelos/`).

### posts.csv (um post por linha, do mais recente para o mais antigo)

| Coluna | O que vai | Exemplo |
|---|---|---|
| `id` | P01 para o mais recente, P02... | P01 |
| `data` | como aparece: `24 set`, `24/09`, `2026-09-24`, `há 2 dias`, `4 d`, `1 sem` | 24 set |
| `formato` | Reels, Carrossel, Estático, Live (o script aceita "Reel", "Imagem") | Reel |
| `tema` | título curto do post (capa ou assunto) | 3 erros que travam sua lombar |
| `pilar` | pilar de conteúdo que você identificou (3 a 6 no perfil todo) | Dor e postura |
| `gancho` | texto da capa ou primeira linha; entre parênteses o que viu, se não houver texto | Você sente a lombar travar...? |
| `cta` | nenhum, salvar, comentar, compartilhar, direct, link, seguir | salvar |
| `alcance` | contas alcançadas (Insights) | 3.140 |
| `visualizacoes` | visualizações (Reels) | 5.020 |
| `curtidas`, `comentarios`, `compartilhamentos`, `salvamentos` | como no print | 198 |
| `duracao_s`, `tempo_medio_s` | duração e tempo médio do Reel, `0:38` ou `38` | 0:38 |
| `obs` | algo que ajude a análise | capa sem título |

Regras de leitura:
- Copie o número como está: "12,4 mil", "3.140", "1,2 mi" (o script converte).
- Número ilegível ou que não aparece (curtidas ocultas, borrão, notificação por cima, print
  cortado): deixe a célula **vazia**, mesmo que pareça dar para adivinhar. Nunca estime. O
  script tira esse post das taxas de interação e do ranking (somar só o que sobrou daria uma
  taxa menor que a real) e avisa; o relatório explica.
- Se o mesmo número aparece legível em outro print (ex.: alcance borrado na lista, mas legível
  no detalhe do Reel), use o legível e anote de onde veio em `obs`.
- Data relativa ("há 2 dias", "4 d", "1 sem"): copie como está. O script converte a partir de
  `data_prints`, que precisa ser o dia em que os prints foram tirados; semana vira data
  aproximada e o script avisa. Se o detalhe do post mostra a data exata, prefira ela.
- Seguidores arredondados pelo app ("11,8 mil"): copie assim; o script avisa que as contas por
  seguidor ficam aproximadas.
- Campo com vírgula no texto (ex.: gancho) vai entre aspas duplas no CSV.
- Se o print não mostra a data, peça; sem datas o script não calcula a frequência.
- Classifique `pilar` depois de ver a grade toda; use nomes curtos e repetíveis.

### perfil.json

Campos principais (veja `modelos/perfil-exemplo.json`): `perfil` (@), `nome_exibido`,
`categoria`, `modo` (`meu-perfil`, `cliente` ou `prospect`), `objetivo` (`vender-servico`,
`crescer`, `lancar` ou `clientes-locais`), `nicho`, `cidade`, `data_prints` (AAAA-MM-DD),
`seguidores`, `seguindo`, `publicacoes`, `bio_atual`, `link_atual`, `destaques_atuais`,
`stories_por_semana`, `capacidade`, `oferta`, `insights` (bloco com `periodo`,
`visualizacoes`, `pct_nao_seguidores`, `contas_alcancadas`, `interacoes`,
`contas_com_engajamento`, `novos_seguidores`, `visitas_perfil`, `toques_link`),
`concorrentes` (lista com `perfil`, `seguidores`, `publicacoes`, `bio`, `destaques`, `posts`)
e `preparado_por` (`nome`, `funcao`, `contato`). `cor` é opcional (hex, ex. `#0E7C66`), para
o relatório sair na cor da marca do aluno.

Depois de ler, mostre ao aluno em até 5 linhas o que entendeu (perfil, período, número de
posts, números dos Insights) e siga. Só pare para perguntar se um número decisivo ficou
ilegível.

## Fatos do Instagram usados na análise (realidade de setembro de 2026, confira no app)

- Bio: até 150 caracteres. O script confere.
- Nome (campo que entra na busca): o app limita quantas vezes ele pode mudar em poucos dias.
- Link na bio: dá para ter mais de um link (até 5 na última conferência).
- Grade: os posts aparecem recortados na vertical (3:4); texto nas bordas some na miniatura.
- Posts fixados: até 3 no topo da grade.
- Insights: "Visualizações" é a métrica principal do painel; alcance, interações e contas com
  engajamento continuam disponíveis; períodos de 7, 14, 30 e 90 dias. Alguns Reels mostram
  tempo de visualização e taxa de pulos.
- Curtidas podem estar ocultas pelo dono; nesse caso, use comentários e visualizações.

## Modo Claude no Chrome

Use só quando o aluno pedir e já estiver logado no Chrome com a conta dele.

1. Você não faz login, não digita senha e não aceita termos pelo aluno. Se aparecer tela de
   login, verificação ou aviso de limite, pare e peça para o aluno resolver.
2. Abra `instagram.com/<perfil>` e leia o topo (nome, bio, link, números, nomes dos destaques).
3. Abra os posts um a um, em ritmo de pessoa (sem abrir dezenas em sequência rápida), até 30.
   Anote data, formato, curtidas, comentários, visualizações dos Reels e primeira linha da
   legenda. Preencha o `posts.csv` como na leitura de prints.
4. Não curta, não siga, não comente, não salve, não mande direct e não responda nada.
5. Abrir Stories ou destaques de outra conta deixa o nome do aluno na lista de quem viu:
   em prospect e concorrente, leia só nomes e capas dos destaques.
6. Insights do próprio perfil: com o aluno logado, leia a tela do painel profissional ou do
   Meta Business Suite e transcreva do mesmo jeito.
7. Um perfil por vez. Nada de varrer listas de perfis (é contra os termos de uso).
