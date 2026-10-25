# X-Flow — Plano de implementação do assistente X-Motion

Versão 1.0 · 23 de outubro de 2026

## 1. Resultado pretendido

Criar um assistente próprio da X-Motion, integrado no X-Flow, que apresenta por voz o plano do dia e responde a perguntas sobre a oficina. Ao ser ativado, surge uma esfera animada com a identidade visual da aplicação.

O primeiro objetivo é a rotina do pequeno-almoço: Luís recebe o aviso de que o resumo está disponível, abre o assistente e ouve os compromissos, as prioridades e os assuntos que precisam de decisão. Pode perguntar por um trabalho, pedir mais detalhe ou interromper a leitura.

O nome de trabalho é **assistente X-Motion**, dentro da aplicação **X-Flow**. O nome e a saudação devem ser configuráveis; o nome do utilizador vem da conta autenticada.

### Contexto usado e limites deste plano

- Captura do Centro de Comando do X-Flow e endereço indicado: https://x-flow-roan.vercel.app/.
- Mensagens disponibilizadas do chat “CRM Desenvolvimento”, incluindo a ligação entre orçamentos, Time Book, stock e fórmulas configuráveis.
- Prévia visual criada nesta conversa. A última preferência recebida foi intensidade de luz de **65%**, observada no estado “A falar”. Em produção, a abertura começa em espera.
- Os valores e trabalhos presentes nas capturas e na prévia são referências visuais, não dados atuais confirmados da empresa.
- O código da aplicação não está nesta pasta e as pesquisas disponíveis não localizaram o repositório. A ferramenta de leitura web também não conseguiu abrir a aplicação. Não foram confirmados framework, autenticação, base de dados, fornecedor de IA ou APIs existentes.

Os nomes de componentes, serviços, entidades e rotas abaixo são propostas de organização. A fase inicial deve adaptá-los ao projeto real, reutilizando a infraestrutura existente. Estar alojado na Vercel não confirma que o X-Flow use Next.js ou uma determinada base de dados.

## 2. Entregas e âmbito

| Entrega | Inclui | Critério para avançar |
|---|---|---|
| Piloto por pedido | Esfera, resumo com dados reais, leitura por voz, perguntas por texto e voz, fontes e controlos de áudio | Resumos corretos e utilizáveis no computador e no telemóvel |
| Rotina da manhã | Preferências, preparação agendada, aviso e abertura direta do resumo | Hora local correta, tratamento de falhas e ausência de duplicados |
| Ações assistidas | Criar tarefas e preparar alterações com confirmação | Permissões, validação e registo de cada operação comprovados |
| Evoluções opcionais | Conversa mais fluida, integrações pessoais e ativação por voz em dispositivos apropriados | Necessidade e compatibilidade validadas no uso diário |

O piloto consulta o negócio e guarda apenas o estado necessário do próprio assistente. Não altera preços, compromissos ou trabalhos, nem envia mensagens a clientes. As ações entram numa entrega própria, sem atrasar o primeiro resumo útil.

O projeto só satisfaz a rotina diária completa depois da segunda entrega; a prévia visual, por si só, não a implementa.

## 3. Experiência dentro do X-Flow

### Entrada e disposição

1. Reaproveitar o botão existente **“Pergunta ao X-Flow AI”** como entrada principal.
2. No computador, abrir um painel sobre a aplicação, suficientemente amplo para esfera, transcrição e fontes. Manter o contexto do ecrã anterior ao fechar.
3. No telemóvel, usar uma vista dedicada que ocupa o ecrã e respeita as áreas seguras do dispositivo.
4. Disponibilizar **“Começar o meu dia”**, entrada por texto e botão de microfone.
5. Durante a reprodução, disponibilizar **Pausar**, **Continuar** e **Parar**. Separar **Silenciar microfone** de **Silenciar som**.
6. Apresentar uma transcrição legível e ligações para os registos mencionados.
7. Deixar o utilizador consultar o resumo em texto quando não quiser ou não puder ouvir.

Não criar um segundo dashboard com métricas duplicadas. O assistente apresenta uma síntese e encaminha para Agenda, Produção, Orçamentos, Stock ou O Meu Dia.

### Exemplo de utilização

O exemplo seguinte é ilustrativo e só poderá ser apresentado com números quando estes vierem dos serviços reais:

> “Bom dia, Luís. Hoje tens uma entrega prevista para a tarde e um trabalho dependente de material. A tua primeira prioridade é confirmar essa reposição. Também há propostas à espera de seguimento. Queres ouvir a agenda ou começar pelos trabalhos?”

Perguntas iniciais a suportar:

- “O que tenho planeado para hoje?”
- “Qual é a próxima entrega?”
- “Que trabalhos estão bloqueados?”
- “Que orçamentos precisam de seguimento?”
- “Que materiais estão abaixo do mínimo?”
- “Explica-me melhor a primeira prioridade.”
- “Repete a agenda”. Durante a reprodução, o botão **Parar** interrompe a leitura; a interrupção simultânea por voz fica para a evolução de conversa em tempo real.

Pedidos fora do âmbito recebem uma resposta clara, sem inventar uma consulta ou uma ação.

## 4. Esfera e identidade visual

Usar o logótipo, a tipografia e os tokens de cor do código existente. As cores da prévia são aproximações à captura, a substituir pelos valores reais da marca: grafite quase preto, dourado e branco suave.

A esfera terá núcleo luminoso, ondas internas e anéis finos. O brilho inicial de referência é **65%**; deve existir opção de reduzir o movimento. Evitar flashes e preservar a legibilidade dos controlos.

| Estado real | Visual e indicação |
|---|---|
| Em espera | Pulsação discreta; microfone desligado |
| A pedir acesso ao microfone | Indicação explícita de que falta a escolha do utilizador |
| A ouvir | Ondas ligadas ao nível do áudio captado; indicador de microfone ativo |
| A transcrever | Movimento discreto e indicação de processamento da fala |
| A consultar/preparar | Anéis em movimento; sem sugerir que está a ouvir |
| A falar | Ondas ligadas ao áudio efetivamente reproduzido |
| Em pausa | Movimento reduzido e opção de continuar |
| Sem ligação ou erro | Mensagem útil e opção de tentar novamente ou usar texto |

Os estados devem decorrer de eventos de áudio e pedidos reais. **Não transportar os temporizadores da demonstração para simular escuta ou respostas em produção.**

Se o projeto for React, separar a animação do estado da conversa: desenhar no Canvas por `requestAnimationFrame`, guardar níveis de áudio em referências e atualizar o estado React apenas quando muda a interação. Carregar o módulo quando se abre o assistente; parar a animação quando está oculto. Não acrescentar uma biblioteca 3D pesada para esta versão.

Respeitar `prefers-reduced-motion`, navegação por teclado, foco visível, contraste e botões de toque de pelo menos 44 × 44 px. O painel deve gerir o foco de abertura, fecho e retorno ao botão de origem.

## 5. Resumo da manhã

### Conteúdo e duração

Versão curta de referência: **60 a 90 segundos**, configurável, com até três prioridades e esta ordem:

1. Situações que podem impedir o trabalho ou uma entrega de hoje.
2. Compromissos, entradas e entregas previstas, por ordem temporal.
3. Trabalhos em curso e dependências.
4. Orçamentos que precisam de seguimento.
5. Materiais abaixo do mínimo que afetem a produção.
6. Tarefas pessoais do X-Flow que ficaram pendentes.

Dados financeiros só entram se existirem fontes adequadas e o utilizador tiver acesso. Um orçamento pendente não é dinheiro recebido; ausência de registo não confirma uma dívida ou uma falta de pagamento.

O ranking de prioridades é calculado por regras configuráveis no servidor: prazo, estado de bloqueio e dependências conhecidas. A IA explica essas prioridades em linguagem natural. Quando uma relação não estiver registada, pode sugerir verificação, mas não afirmar que existe um bloqueio.

### Preferências do utilizador

Disponibilizar em **Definições → Assistente**:

- Ativar/desativar o resumo e escolher dias e hora local.
- Fuso horário, inicialmente sugerido como `Europe/Madrid`, sujeito a confirmação nas definições.
- Duração curta ou detalhada; secções incluídas.
- Voz em português europeu e velocidade de leitura.
- Notificações, movimento e intensidade da esfera.
- Inclusão de valores financeiros, apenas quando permitida pelo perfil.
- Histórico de conversas opcional e respetiva retenção.

Separar o fuso da rotina pessoal do fuso operacional da oficina. Os limites de “hoje na oficina” usam o fuso configurado para a empresa; a notificação usa o fuso pessoal. Se forem diferentes, mostrar a referência horária nos compromissos.

### Ativação e limitações práticas

O caminho inicial é **notificação → abrir o resumo → tocar em “Ouvir”**. Em navegadores que o permitam, o toque na notificação poderá servir para iniciar a experiência; se a reprodução for bloqueada, manter o botão de ouvir. Os navegadores aplicam regras de bloqueio de áudio automático. [MDN — reprodução automática](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)

A escuta exige acesso ao microfone em contexto seguro e autorização do utilizador. Pedir esse acesso ao usar o botão de falar, não ao carregar o dashboard. Não é necessário abrir o microfone para ouvir o resumo. [MDN — getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

Ativar pelo nome “X-Motion” pode ser estudado com a aplicação aberta e uma sessão de escuta explicitamente ativa. Não prometer ativação contínua com o navegador fechado, telemóvel bloqueado ou sistema suspenso. Para uma experiência sem toque nessas condições, avaliar depois uma aplicação nativa ou integração com o assistente do dispositivo.

## 6. Ligação aos dados reais

Reutilizar os serviços e regras da aplicação. O assistente não terá acesso livre à base de dados nem poderá executar SQL gerado pelo modelo.

| Fonte | Informação mínima | Cuidado |
|---|---|---|
| Agenda | Início, fim, descrição curta, cliente e estado | Distinguir cancelados, confirmados e provisórios |
| Produção | Serviço, estado, previsão de entrega e bloqueios | Não deduzir progresso apenas do tempo decorrido |
| Check-in | Entradas e ligação ao trabalho/viatura | Não contar uma viatura em duplicado |
| Orçamentos | Estado, envio e último seguimento | Só dizer “sem resposta” se houver dados para isso |
| Stock | Quantidade, mínimo e reservas, se existentes | Reutilizar a definição atual de stock disponível |
| O Meu Dia | Tarefas e vencimentos do utilizador | Respeitar propriedade e visibilidade |
| Time Book | Tempos previstos e registados | Não tratar todas as horas como faturáveis |
| Financeiro | Valores e estados autorizados | Ocultar informação não permitida ao perfil |

### Regras vindas do “CRM Desenvolvimento”

- Custos, objetivos e acréscimos são configuráveis. Não copiar valores históricos do chat para constantes do assistente.
- Distinguir custo previsto, preço calculado pela fórmula e preço final escolhido.
- Consultar o motor de orçamento existente para qualquer cálculo; não pedir ao modelo para inventar a fórmula.
- Preservar a versão de um orçamento já enviado/aprovado.
- A ligação entre horas do Time Book, materiais e preço deve seguir o estado efetivamente implementado no X-Flow. Uma funcionalidade planeada no chat pode ainda não existir no código.

### Contrato de dados do resumo

O agregador do servidor deve devolver um objeto validado que inclua:

- Data operacional, fuso, instante de geração e versão do resumo.
- Estado de cada fonte: disponível, vazio, indisponível ou sem permissão.
- Eventos, prioridades e totais calculados deterministicamente.
- Referências aos registos e rotas internas permitidas para os abrir.
- Instante de atualização das fontes e indicação de conteúdo desatualizado.

“Zero marcações” só é válido após uma consulta concluída. Uma falha na Agenda deve produzir “Não consegui consultar a agenda”, mantendo as outras partes disponíveis.

No piloto, consultar novamente quando o resumo tiver mais de cinco minutos e permitir atualização manual. Este intervalo é um valor de arranque configurável. Sempre que existam eventos de alteração no X-Flow, usá-los para invalidar os resumos afetados. Mostrar a hora da consulta.

Não executar todos os serviços de forma sequencial: fazer leituras independentes em paralelo, com limites e tratamento individual de falhas. Paginar os detalhes e enviar à IA apenas a síntese necessária.

## 7. Arquitetura proposta

```text
Painel do assistente + esfera
           |
           v
Serviço autenticado do assistente
           |
           +-- Agregador de contexto --> Serviços existentes do X-Flow
           |
           +-- Resumo estruturado --> Texto natural --> Áudio da resposta
           |
           +-- Áudio do utilizador --> Transcrição --> Consulta autorizada

Agendador --> Preparação do resumo --> Notificação --> Abertura do painel
```

### Voz: decisão inicial

Começar por turnos: **gravar uma pergunta → transcrever → consultar → responder em texto → reproduzir voz**. Esta organização facilita verificar o que foi entendido e os dados utilizados. O utilizador pode interromper a reprodução e iniciar uma nova pergunta.

Usar interfaces separadas para transcrição, geração de resposta e voz, aproveitando primeiro os fornecedores já contratados no projeto. Escolher os modelos na fase de descoberta com uma amostra de português europeu, ruído de oficina e nomes de serviços como PPF, wrap e chrome delete.

O fornecedor, o modelo, o preço e os limites não ficam presumidos neste plano. Registar a decisão técnica antes de integrar o serviço. Reconhecimento de fala específico de um navegador não deve ser a única opção de entrada; texto permanece disponível.

Conversa simultânea e interrupção automática pela fala podem entrar depois, através de uma sessão de áudio em tempo real, caso o piloto justifique o custo e a complexidade. Uma ligação longa deve usar infraestrutura apropriada ao fornecedor; não presumir um servidor WebSocket permanente numa função HTTP da aplicação.

### Gestão de áudio

- No piloto, suspender a captação durante a resposta para evitar que o assistente transcreva a própria voz.
- Derivar os níveis visuais de entrada e saída de analisadores de áudio separados.
- Usar os eventos de início, pausa e fim do áudio para os estados visuais.
- Cancelar pedidos, respostas e reprodução ao terminar; ignorar resultados tardios da sessão cancelada.
- Libertar as pistas do microfone, o gravador e os recursos de áudio ao fechar.
- Tratar troca de dispositivo, chamadas telefónicas, saída da aplicação e perda de ligação.
- Testar os formatos aceites por cada navegador e pelo serviço de transcrição; limitar duração e tamanho de cada pergunta.

### Serviços e rotas representativas

| Operação | Contrato proposto |
|---|---|
| Obter resumo | `GET /api/assistant/briefing` — identidade e âmbito resolvidos pelo servidor |
| Atualizar resumo | `POST /api/assistant/briefing/refresh` — limitado por utilizador |
| Enviar pergunta | `POST /api/assistant/message` — texto, conversa e contexto permitido |
| Transcrever | `POST /api/assistant/transcribe` — áudio limitado, autenticado e validado |
| Gerar voz | `POST /api/assistant/speech` — identificador de resposta autorizada, sem narrar texto arbitrário |
| Preferências | `GET/PATCH /api/assistant/preferences` |
| Push | `POST/DELETE /api/assistant/push-subscriptions` |
| Agendamento | Rota privada de trabalho ou consumidor de fila; não exposta ao modelo |

Adaptar estes contratos às rotas e ao framework reais. Se a aplicação for apenas um frontend estático, as operações com chaves e dados privados exigem um serviço de servidor autenticado.

## 8. Preparação agendada e notificações

1. Guardar as preferências e calcular o próximo instante de execução em UTC a partir do fuso IANA.
2. Um agendador recolhe os resumos vencidos; um trabalhador gera o contexto de cada utilizador autorizado.
3. O trabalhador guarda o resumo e um pedido de notificação.
4. A notificação diz apenas **“O teu resumo da manhã está pronto”**, com ligação direta à data correta. Não inclui nomes de clientes, matrículas ou valores no ecrã bloqueado.
5. Ao abrir, validar sessão, permissões e atualidade do resumo antes da leitura.
6. Se o aviso falhar, o resumo continua acessível no X-Flow. Não reenviar avisos antigos fora de uma janela configurada; valor inicial sugerido: duas horas.

Web Push usa subscrição e service worker. A receção depende do navegador e das condições do dispositivo; não deve ser tratada como um despertador de precisão garantida. [MDN — Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

No iPhone/iPad, validar a instalação como aplicação no ecrã principal e a versão suportada. A Apple documenta Web Push para estas aplicações a partir do iOS/iPadOS 16.4. [Apple — Web Push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)

### Escolha do agendador

Confirmar primeiro o plano de alojamento. O cron da Vercel usa UTC. [Vercel — Cron Jobs](https://vercel.com/docs/cron-jobs)

Na documentação consultada, o plano Hobby permite execução diária com uma janela de uma hora; pode haver invocações duplicadas ou perdidas e não há repetição automática de falhas. Se for necessária maior precisão, escolher um plano ou agendador adequado. Proteger a rota com segredo de servidor e implementar reconciliação e deduplicação. [Vercel — gestão de cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

Independentemente do fornecedor, usar um identificador único por utilizador, empresa/âmbito e data local para impedir preparação e notificação duplicadas. Uma atualização manual pode criar nova versão do conteúdo sem criar novo aviso. Guardar estado de entrega por dispositivo e limitar repetições.

Se um pedido ao serviço de push tiver resultado incerto, não repetir indefinidamente. Reutilizar uma chave/tag estável na notificação e controlar tentativas no servidor; não prometer entrega exatamente uma vez por toda a cadeia externa.

As mudanças de hora de verão/inverno devem manter a hora local escolhida. Definir também o comportamento para horas locais inexistentes ou repetidas, mesmo que o piloto use uma hora de manhã sem essa ambiguidade.

## 9. Persistência proposta

Reutilizar entidades existentes quando forem adequadas. Os nomes abaixo são modelos lógicos, não tabelas já existentes nem migrações prontas.

| Entidade | Informação essencial | Entrega |
|---|---|---|
| Preferências | Utilizador, empresa/âmbito, fuso, hora, dias, voz, duração, brilho e privacidade | Piloto; agendamento ativado depois |
| Resumo diário | Proprietário, âmbito, data local, versão, fontes, conteúdo, validade e estado | Rotina agendada; cache do piloto se necessário |
| Subscrição push | Utilizador, dispositivo, endpoint, chaves e estado | Rotina agendada |
| Execução/entrega | Chave de deduplicação, tentativas, estado, próxima execução e erro seguro | Rotina agendada |
| Conversa/mensagem | Proprietário, âmbito, texto e referências; apenas com histórico ativo | Opcional |
| Ação proposta | Tipo permitido, parâmetros validados, versão do registo, validade e estado | Ações assistidas |

Usar as convenções reais de chaves primárias e estrangeiras; guardar instantes em UTC e o identificador de fuso separadamente. Aplicar restrições de unicidade e índices aos filtros reais por proprietário, âmbito, data e estado. Referências a registos devem ter relações válidas e regras de eliminação explícitas.

Se a base for Postgres, aplicar isolamento por utilizador/empresa também na base, com políticas adequadas ao modelo de autenticação. Não assumir funções de autenticação específicas de Supabase ou Neon. Os trabalhadores têm identidade e âmbito explícitos; funções administrativas não devem abrir consultas sem restrição.

Evitar estado de utilizador em variáveis globais do servidor. O cache deve incluir âmbito e permissões relevantes; invalidá-lo se o perfil ou acesso mudar. Não partilhar resumos financeiros entre perfis diferentes.

## 10. Respostas fiáveis e permissões

- Autenticar e autorizar cada consulta e cada pedido de áudio no servidor.
- Resolver o utilizador e a empresa a partir da sessão; não confiar em identificadores enviados pelo modelo ou pelo navegador.
- Manter uma lista curta de ferramentas permitidas para Agenda, Produção, Orçamentos e Stock.
- Validar parâmetros e resultados com esquemas. Limitar datas, volume e número de chamadas.
- Tratar notas de clientes, descrições de trabalhos e documentos como dados, nunca como instruções para o assistente.
- Não permitir que esses textos mudem permissões, ferramentas, destino de dados ou regras do sistema.
- Fazer contagens e cálculos monetários no código existente. Validar referências e factos da resposta; na dúvida, apresentar o resumo estruturado sem reformulação pela IA.
- Assinalar fontes incompletas e não inventar nomes, datas, preços, estados ou entregas.
- Separar permissões operacionais e financeiras. Um colaborador pode ouvir a sua agenda sem receber margens ou remunerações.
- Manter chaves privadas no servidor; proteger áudio temporário e subscrições push.
- Aplicar limites por conta, tamanho de áudio, duração, custo e frequência de pedidos.
- Proteger operações autenticadas contra pedidos de outras origens segundo a arquitetura da sessão.

Proposta de retenção para o piloto: áudio bruto apenas durante o processamento, sem arquivo próprio; histórico desativado por defeito e, se ativado, 30 dias configuráveis. Confirmar os termos de retenção do fornecedor antes de ativar voz. Registos operacionais devem guardar tempos, estados e consumo, com dados pessoais minimizados; não copiar conversas completas para logs.

Permitir apagar histórico e resumos guardados e revogar subscrições. A retenção de auditoria de ações deve ser definida separadamente. Estes são requisitos de produto e engenharia, não uma conclusão jurídica de conformidade.

## 11. Ações assistidas — entrega posterior

Começar por **criar uma tarefa em O Meu Dia**. Só depois acrescentar alterações à agenda ou rascunhos de seguimento comercial.

Fluxo obrigatório para alterações:

1. Interpretar o pedido e resolver o registo; perguntar quando houver ambiguidade.
2. Preparar uma proposta com os campos exatos, data, hora, fuso e efeito da mudança.
3. Mostrar/ler a proposta e pedir confirmação explícita. Para mensagens externas, mostrar também destinatário e texto.
4. Guardar a proposta no servidor com validade e ligação à identidade; o cliente confirma o identificador, não um conjunto diferente de parâmetros.
5. Revalidar permissões, disponibilidade e versão do registo no momento da confirmação.
6. Executar a alteração e o registo de auditoria de forma consistente, com chave de idempotência.
7. Confirmar sucesso apenas após a gravação. Se houver conflito ou resultado incerto, verificar o estado antes de repetir.

Uma confirmação genérica antiga não autoriza uma nova ação. Se o alvo ou os dados mudarem, gerar uma nova proposta. Os valores de orçamentos seguem o motor existente e preservam versões já enviadas.

## 12. Plano de trabalho

### Fase 0 — Confirmar a aplicação real

**Trabalho:** localizar repositório e instruções do projeto; identificar frontend, backend, autenticação, serviços, esquema, fornecedor de IA e plano Vercel. Verificar o botão de IA existente e distinguir dados reais de dados de demonstração. Confirmar quais as funcionalidades do plano de orçamentos que já foram implementadas.

**Saída:** mapa de integração com ficheiros e serviços reais, decisão do fornecedor de voz/IA, limites de alojamento e critérios de desempenho a medir. Reutilizar o que existe; não migrar a aplicação apenas para adicionar o assistente.

### Fase 1 — Resumo em texto com dados autorizados

**Trabalho:** agregador, prioridades, fontes, estados parciais e atualização. Começar por Agenda, Produção e Orçamentos; acrescentar Stock e O Meu Dia conforme os serviços estejam disponíveis.

**Saída:** resumo que pode ser comparado com os ecrãs do X-Flow, sem depender da IA para as contas.

### Fase 2 — Esfera integrada e leitura por voz

**Trabalho:** transportar a linguagem visual da prévia para componentes da aplicação, usar tokens reais, implementar estados, texto, leitura, pausa, paragem e acessibilidade. Usar a preferência de brilho de referência de 65%.

**Saída:** “Começar o meu dia” lê dados reais. A esfera acompanha o áudio; fechar termina a sessão e liberta recursos.

### Fase 3 — Perguntas por voz e texto

**Trabalho:** microfone, transcrição, ferramentas de consulta, resposta com fontes, cancelamento, tratamento de ruído e limites de consumo.

**Saída:** piloto por pedido utilizável. Perguntas de seguimento conservam contexto autorizado sem reler desnecessariamente toda a base.

### Fase 4 — Rotina agendada

**Trabalho:** preferências, preparação, cache privado, push, gestão de dispositivos, fuso e reconciliação de execuções.

**Saída:** rotina completa da manhã validada no dispositivo usado por Luís. Notificações desligáveis; resumo manual continua disponível.

### Fase 5 — Ações e evolução

**Trabalho:** primeira ação com confirmação, auditoria e conflitos; avaliar conversa em tempo real e ativação por nome conforme os resultados do piloto.

**Saída:** autonomia delimitada e comprovada. Cada integração adicional tem âmbito, custo e testes próprios.

## 13. Critérios de aceitação

| Cenário | Resultado esperado |
|---|---|
| Dia normal | Resumo com prioridades e eventos iguais aos dados de origem; fontes abertas no registo correto |
| Sem eventos | Dizer que a consulta não encontrou marcações; manter outras secções |
| Agenda indisponível | Indicar indisponibilidade, sem a converter em zero marcações |
| Dados alterados após preparação | Atualizar ou sinalizar desatualização antes de apresentar como atual |
| Pergunta sobre preço | Consultar fórmula/versão atual; distinguir preço calculado e escolhido |
| Orçamento já aprovado | Consulta não altera valores ou versão |
| Perfil sem financeiro | Sem valores restritos no texto, áudio, cache, notificação ou histórico |
| Mudança de conta/empresa | Cancelar a sessão e não reproduzir o áudio do âmbito anterior |
| Tentativa de instrução numa nota | Tratar como conteúdo; nenhuma expansão de permissões |
| Microfone recusado ou pedido ignorado | Opção clara para cancelar e continuar por texto |
| Pausar, continuar e parar | Estado da esfera acompanha a reprodução; não surgem respostas tardias |
| Fechar o assistente | Sem captação, reprodução, pedidos ou animação desnecessários |
| Ruído e eco | Sem transcrição da própria resposta; possibilidade de corrigir o texto entendido |
| Voz indisponível | Resposta continua disponível em texto; tentativa limitada e sem duplicar operações |
| 320 px e movimento reduzido | Sem corte ou sobreposição; controlos acessíveis e esfera estável |
| Mudança da hora | Execução mantém a hora local escolhida em Europe/Madrid e no fuso da oficina |
| Duas execuções simultâneas | Uma preparação ativa por chave e sem repetição indevida do aviso |
| Execução falhada ou perdida | Trabalho pendente recuperado; aviso fora de prazo suprimido |
| Push desativado/expirado | Sem insistência; resumo manual disponível e subscrição inválida tratada |
| Cache de outro utilizador | Acesso recusado, mesmo conhecendo o identificador do resumo |
| Pedido de ação no piloto | Explica o âmbito; nenhuma alteração de negócio |
| Confirmação repetida ou antiga | No máximo uma execução; proposta expirada ou alterada é recusada |
| Falha de confirmação de gravação | Não anunciar sucesso; consultar o estado antes de repetir |

Usar testes de integração para permissões, cálculos, dados parciais, idempotência e ações. Usar verificação no navegador para áudio, estados e acessibilidade. Testar em aparelhos reais: Safari no iPhone, Chrome no Android e os navegadores de computador usados na oficina. Não prometer compatibilidade antes destes ensaios.

## 14. Consumo, desempenho e lançamento

Medir por pedido: latência de consulta, transcrição, primeiro áudio, duração de reprodução, erros e consumo do fornecedor. Definir metas após a fase 0 e comparar o dashboard antes e depois; a esfera fechada não deve manter processamento ativo.

O orçamento mensal deve somar minutos transcritos, volume de respostas geradas, voz produzida, armazenamento e agendamento. Simular a rotina com o número de dias e perguntas realmente esperado; não assumir que uma subscrição pessoal de chat cobre os serviços da aplicação.

Definir teto de consumo, alertas e modo de texto quando a voz atingir o limite. Reutilizar o áudio autorizado de uma mesma versão do resumo quando isso fizer sentido; não reutilizar conteúdo entre perfis ou resumos modificados.

Lançar primeiro por uma opção de ativação apenas na conta de Luís, num ambiente de pré-produção com dados adequados. Depois dos critérios de aceitação, ativar o piloto em produção e acompanhar vários dias de uso. A rotina agendada só entra após teste de permissões de notificação no dispositivo escolhido.

Manter uma forma simples de desligar o assistente sem afetar os restantes módulos. No recuo, parar agendamentos e sessões de voz e preservar dados existentes; alterações de estrutura devem ser compatíveis e não destrutivas.

## 15. Instrução de arranque para implementação

O texto seguinte pode ser entregue à ferramenta de desenvolvimento usada no projeto:

> Implementa o assistente X-Motion integrado no X-Flow segundo este plano, começando pela fase 0 e depois pelo piloto por pedido, fases 1 a 3. Inspeciona as instruções e o código existentes e apresenta os pontos reais de integração antes das alterações. Reutiliza autenticação, permissões, serviços, motor de orçamento e identidade visual; não assumas framework, fornecedor ou nomes de tabelas deste documento como factos. A experiência deve abrir pelo botão atual de IA, ter esfera dourada e branca sobre grafite, transcrição, leitura em português europeu e perguntas por texto/voz. Usa dados reais autorizados e estados reais de áudio. Mantém o acesso ao negócio apenas para consulta no piloto; não implementes cálculos financeiros alternativos nem alteres propostas já enviadas. Trata fontes indisponíveis, cancelamento, microfone recusado e áudio bloqueado. Mantém chaves no servidor, limites de uso e isolamento de cache. Adiciona verificações de integração para permissões, dados parciais e fórmulas, e verifica a experiência em computador e telemóvel. Reporta os ficheiros alterados, o que foi comprovado e as dependências ainda em falta. As fases 4 e 5 são entregas seguintes e devem preservar os contratos e as regras deste plano.

## 16. Referências técnicas

As ligações junto dos requisitos documentam comportamentos da plataforma; os restantes pontos são decisões propostas para o X-Flow. Documentação consultada em 23 de outubro de 2026:

- [MDN — Microfone e permissões](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
- [MDN — Reprodução automática](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).
- [MDN — Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API).
- [Apple — Web Push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers).
- [Vercel — Cron Jobs](https://vercel.com/docs/cron-jobs).
- [Vercel — Gestão de cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
