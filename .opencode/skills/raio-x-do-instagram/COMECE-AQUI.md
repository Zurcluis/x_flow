# Raio-X do Instagram · comece aqui

Esta skill faz a auditoria completa de um perfil de Instagram (seu, de um cliente ou de um
prospect) e entrega um relatório em PDF com nota por área, os 5 problemas que mais custam,
3 bios novas, calendário de 30 dias, 15 ideias e 3 roteiros de Reels, mais um resumo para
WhatsApp e, para prospect, a mensagem para oferecer a auditoria.

## O que você precisa

- Uma conta no Claude com Skills e execução de código (na realidade de setembro de 2026,
  disponível nos planos pagos; confira no app). Não há custo extra de API nem de créditos.
- Os prints do perfil (a skill diz exatamente quais).
- Opcional: a extensão Claude no Chrome, para o Claude ler o perfil direto no navegador em
  que você já está logado no Instagram.

## Instalar no app do Claude (navegador ou desktop)

Caminho na realidade de setembro de 2026; os nomes dos menus podem mudar.

1. Abra Configurações > Recursos (Capabilities) e ative a execução de código e criação de
   arquivos.
2. Na mesma tela, em Skills, clique em enviar skill e escolha o arquivo
   `raio-x-do-instagram.zip` (sem descompactar).
3. Confira se a skill aparece ligada na lista.

No Claude Code ou no Cowork: descompacte e coloque a pasta `raio-x-do-instagram` dentro de
`~/.claude/skills/` (Mac) ou `%USERPROFILE%\.claude\skills\` (Windows).

## Primeiro pedido (cole no chat e anexe os prints)

```
Faz o raio-x do Instagram do @[perfil]. É [meu perfil / de um cliente / um prospect].
Objetivo: [vender serviço / crescer / lançar / atrair clientes locais].
Nicho e público: [uma frase]. Cidade: [se for negócio local].
O que vende e como o cliente começa: [ex.: aula experimental pelo WhatsApp].
Quem grava e quantas horas por semana: [...].
Concorrentes: [@... e @..., opcional].
O relatório vai com o meu nome: [nome, função, contato].
```

Prints que ajudam (a skill pede o que faltar): topo do perfil, grade com 12 a 30 posts,
tabela de conteúdo ou insights de cada post, visão geral dos Insights de 30 dias, e o que
não aparece no print (primeira linha das legendas, o que tem no link, frequência de Stories).

## O que você recebe

- `raio-x-<perfil>.pdf`: o relatório para entregar ou vender.
- `resumo-whatsapp.txt`: a versão curta para mandar ao dono do perfil.
- `mensagem-abordagem.txt` (prospect): a mensagem para oferecer a auditoria completa. Você
  envia, uma por vez, para o contato comercial da empresa.

Se o ambiente não tiver a biblioteca de PDF, a skill entrega um `.html`: abra no navegador e
use Imprimir > Salvar como PDF.

## Cuidados

- Números vêm dos prints; o que faltar aparece como [CONFIRMAR] para o dono responder.
- A skill não compara com "média de mercado": compara o perfil com ele mesmo e com
  concorrentes medidos do mesmo jeito.
- Peça autorização por escrito ao cliente para usar os prints dos Insights.
- O exemplo em `modelos/` é de um negócio fictício (@studiolunapilates).
