# X-Motion — Plano do website

**Versão:** 1.2  
**Data:** 25 de outubro de 2026  
**Responsável pelo projeto:** Luís Cruz  
**Marca:** X-Motion — PPF & Car Wrap, Barcelos  
**Idioma principal:** Português de Portugal  
**Primeira versão:** [Abrir o site](https://x-motion-atelier.snug-lemon-5392.chatgpt.site)

> Este documento reúne as decisões tomadas para o website, descreve a primeira versão publicada e organiza a evolução pretendida. As funcionalidades futuras estão identificadas como tal. Não representa um orçamento de desenvolvimento nem um compromisso de prazo.

> **Alterações da versão 1.1:** clarificação da decisão entre site autónomo e integração no X-Flow; checklist de informação e materiais em falta; operação e resposta aos pedidos; segurança, privacidade e retenção; metas de desempenho e acessibilidade; SEO de lançamento; riscos; critérios de aceitação reforçados. Nenhuma funcionalidade do site foi alterada por esta revisão.

> **Alterações da versão 1.2:** decisão de arquitetura registada — **B1**, com o site público integrado no X-Flow em dois hosts. Este documento mantém-se como referência de conteúdo, experiência e requisitos do site; a arquitetura técnica, dados, segurança e roadmap de implementação passam a ser os do `X-Flow_Plano_Website_Portfolio_Social_Studio.md` v1.2. As secções 12, 16, 17, 18 e 19 foram ajustadas à decisão.

---

## 1. Objetivo do site

Criar uma presença digital premium que transforme o interesse pelos trabalhos da X-Motion em pedidos de proposta qualificados, visitas ao atelier e marcações rentáveis.

O site deve permitir ao visitante:

1. Perceber o que a X-Motion faz e onde está.
2. Reconhecer a qualidade através de trabalhos reais.
3. Distinguir proteção da pintura de mudança de cor.
4. Explorar uma ideia para o seu carro.
5. Contactar a empresa com pouco esforço e expectativas claras.
6. Continuar a relação depois do primeiro contacto e da entrega, nas fases futuras.

**Indicador comercial principal:** trabalhos adjudicados e respetiva margem provenientes do site. Pedidos recebidos, cliques e utilização do simulador são indicadores intermédios.

Não se estabelece uma percentagem de conversão garantida. O desempenho terá de ser medido e melhorado com dados reais.

## 2. Público e necessidades

| Visitante | O que procura | Percurso a privilegiar |
| --- | --- | --- |
| Proprietário de carro novo ou cuidado | Preservar a pintura e reduzir danos nas zonas expostas | PPF → exemplos → cobertura → proposta |
| Entusiasta de personalização | Uma nova cor ou acabamento | Wrap / Color PPF → portefólio → estúdio de cor → proposta |
| Cliente indeciso | Perceber diferenças, preço e resultado | Comparação de soluções → perguntas frequentes → aconselhamento |
| Proprietário de mota | Proteção ou mudança de imagem | Projetos de duas rodas → contacto específico |
| Stand ou concessionário | Consistência, comunicação e capacidade de resposta | Página profissional e contacto dedicado, numa fase posterior |
| Cliente existente | Cuidados, garantia e acompanhamento | Área privada e passaporte digital, numa fase posterior |

### 2.1 Informação e materiais necessários

O lançamento depende de informação que não pode ser inventada. Esta lista deve ser fechada com a X-Motion antes de anunciar o site.

| Item | Serve para | Responsável | Estado |
| --- | --- | --- | --- |
| Logótipo oficial em vetor (SVG/AI) e versões para fundo claro e escuro | Cabeçalho, rodapé, imagem de partilha | X-Motion | Em falta |
| Fotografias originais dos trabalhos, sem recortes de Instagram | Abertura, portefólio e casos | X-Motion | Em falta |
| Autorização escrita dos proprietários para divulgar cada viatura | Uso de imagem e matrícula | X-Motion | A confirmar |
| Lista de serviços, coberturas e limites | Páginas de serviço e FAQ | X-Motion | A confirmar |
| Preços orientativos, se forem publicados | Qualificação de pedidos | X-Motion | A decidir |
| Condições de garantia e manutenção por material | Confiança e pós-venda | X-Motion | A confirmar |
| Telefone, WhatsApp, e-mail e horário de atendimento | Contacto e perfil Google | X-Motion | Em falta |
| Morada completa e indicações de acesso | Contactos e mapa | X-Motion | A confirmar |
| Firma, NIF, sede e demais dados legais | Rodapé, privacidade e faturação | X-Motion | Em falta |
| Domínio definitivo e acesso ao registador/DNS | Lançamento público | X-Motion | A decidir |
| Acesso à conta Google da empresa | Perfil de empresa e pesquisa local | X-Motion | A confirmar |
| Avaliações reais e respetiva origem | Prova social | X-Motion | Em falta |
| Texto da política de privacidade e cookies | Conformidade RGPD | Jurista + desenvolvimento | Em falta |
| Contacto e processo para pedidos de titulares de dados | Direitos RGPD | X-Motion | A definir |

Enquanto um item estiver em falta, o site não deve apresentar uma versão inventada, genérica ou provisória que possa induzir o visitante em erro.

## 3. Direção visual escolhida

### 3.1 Base: opção 5 — Atelier de Precisão

A opção 5 é a referência para a hierarquia, contraste e apresentação do serviço. A linguagem deve ser sóbria, moderna, minimalista e ligada ao trabalho real do atelier.

- Preto e carvão como base.
- Branco e cinza para leitura e contraste.
- Dourado discreto para ações e pormenores importantes.
- Fotografia com protagonismo.
- Tipografia simples, elegante e legível.
- Espaçamento generoso, alinhamentos cuidados e poucos elementos por bloco.
- Movimento suave, que respeite as preferências de redução de movimento.
- Liquid Glass aplicado com moderação, sobretudo em pequenos controlos ou navegação.

A sofisticação deve resultar da composição, da fotografia e da clareza. Evitar excesso de dourado, efeitos que dificultem a leitura e animações que atrasem o acesso ao conteúdo.

### 3.2 Identidade da marca

A referência oficial é o símbolo geométrico cruzado em dourado e branco/cinza, associado à designação X-Motion sobre fundo preto.

**Estado atual:** o cabeçalho usa uma composição tipográfica simples; as fotografias mostram o letreiro real do atelier. O ficheiro vetorial oficial ainda deve ser aplicado ao cabeçalho e aos restantes elementos de marca.

O logótipo oficial não deve ser redesenhado livremente durante o desenvolvimento.

### 3.3 Linguagem

Textos em português de Portugal, concretos e seguros. Explicar o serviço sem depender de termos técnicos que o visitante possa desconhecer.

Mensagem da primeira versão:

> **O seu carro. Uma nova expressão.**  
> Proteção e personalização automóvel. O cuidado está em cada detalhe.

Mensagem alternativa a testar posteriormente:

> **Proteja a pintura. Transforme a presença.**  
> PPF, Car Wrap e Color PPF em Barcelos.

A escolha definitiva deve considerar clareza, identidade da marca e resultados comerciais.

## 4. Fotografia e seleção dos trabalhos

### 4.1 Princípio

As fotografias dos trabalhos realizados pela X-Motion são o principal elemento de prova e identidade. A abertura e o portefólio devem usar fotografias reais fornecidas pela empresa.

### 4.2 Material real disponibilizado (outubro de 2026)

| Projeto fotografado | Apresentação atual |
| --- | --- |
| BMW M3 | Car Wrap em tom azul-violeta; capa do portefólio e hero |
| Ferrari 458 Speciale | PPF; capa e processo de aplicação |
| BMW M4 | Car Wrap em tom areia clara |
| Lamborghini Huracán | Personalização em preto profundo |
| Mercedes-Maybach | Car Wrap de dois tons |
| BMW S1000RR | Personalização de mota |
| Mercedes CLE 300 | Personalização; card wide do portefólio e atelier |

As designações e descrições foram limitadas à informação disponível nas imagens e respetivas legendas. Serviços, referências de película, cores comerciais, duração e garantias devem ser confirmados antes de acrescentar detalhes técnicos. A classificação de M3, M4 e Maybach como Car Wrap, e de Lamborghini e CLE 300 como Personalização, é uma leitura de trabalho e deve ser confirmada pela X-Motion.

### 4.3 Tratamento das fotografias

Na primeira versão foram preparados recortes das imagens fornecidas para retirar a interface exterior do Instagram, preservando as fotografias dos trabalhos.

Na versão de outubro de 2026, os 60 originais de `D:\Fabio\X-Motion\trabalhos-2025` foram analisados e convertidos para WebP: capas 1000×1250, hero 1600×1067, serviços 1200×800 e OG 1200×630. A matrícula real da Ferrari foi substituída por uma placa X-MOTION e as fotos com rostos identificáveis foram excluídas das galerias.

**Melhoria prioritária:** substituir estes recortes pelos ficheiros originais, com maior resolução, quando estiverem disponíveis.

Critérios de seleção:

- Veículo e acabamento bem visíveis.
- Nitidez e exposição adequadas.
- Cor coerente com o trabalho real.
- Bom enquadramento para computador e telemóvel.
- Variedade de veículos, serviços e acabamentos.
- Ausência de pessoas, matrículas ou informações que não devam ser divulgadas.

Preparar recortes próprios para cada formato. Procurar mostrar o carro inteiro sempre que o espaço o permita, respeitando a preferência por uma apresentação com mais espaço à volta do veículo.

### 4.4 Abertura com fotografias alternadas

Decisão: uma seleção cuidada dos melhores trabalhos aparece no início da página, uma fotografia de cada vez.

**Implementado:**

- Quatro projetos na apresentação inicial.
- Alternância automática com transição suave.
- Botões anterior e seguinte.
- Seleção direta da fotografia.
- Controlo de pausa.
- Identificação do trabalho apresentado.
- Texto e ações principais estáveis durante a mudança das imagens.

**Evolução prevista:**

- Seleção administrável de quatro a seis destaques.
- Escolha manual da primeira imagem e da ordem.
- Recorte de computador e de telemóvel por fotografia.
- Acesso direto ao detalhe do projeto a partir da abertura.

A primeira fotografia deve ser escolhida editorialmente, em vez de ser aleatória.

## 5. Estrutura da página inicial

A primeira versão organiza-se numa página longa com navegação por secções.

| Ordem | Secção | Conteúdo e função |
| --- | --- | --- |
| 1 | Cabeçalho | Marca, serviços, projetos, estúdio de cor, atelier e pedido de proposta |
| 2 | Abertura | Fotografias reais, mensagem principal, localização e ações de contacto/exploração |
| 3 | Assinatura | Proteção, personalização e precisão |
| 4 | Escolher o objetivo | Proteger a pintura ou mudar a imagem |
| 5 | Serviços | PPF, Car Wrap, Color PPF e aplicações complementares |
| 6 | Portefólio | Seleção de trabalhos reais, filtros e detalhes ampliáveis |
| 7 | Estúdio de cor | Exploração ilustrativa de cores, acabamentos e perspetivas |
| 8 | O atelier | Espaço real e forma de abordar cada projeto |
| 9 | Processo | Conversar, definir, aplicar e entregar |
| 10 | Perguntas frequentes | Diferenças entre serviços, preço, prazos, cor, manutenção e garantia |
| 11 | Proposta | Formulário curto e alternativa de contacto pelo Instagram |
| 12 | Rodapé | Identidade, privacidade e regresso ao início |

### 5.1 Navegação e ações

Ação principal: **Criar o meu projeto / Pedir proposta**.

Ação secundária: **Explorar trabalhos**.

No telemóvel existe um acesso fixo ao pedido de proposta e um menu próprio. A leitura e os controlos devem continuar utilizáveis sem deslocação horizontal involuntária.

### 5.2 Escolha por intenção

Apresentar duas entradas fáceis de compreender:

- **Proteger a pintura:** encaminha para PPF.
- **Mudar a imagem:** encaminha para Car Wrap e Color PPF.

O formulário inclui a alternativa **Preciso de aconselhamento**, para quem ainda não sabe qual o serviço adequado.

## 6. Serviços e páginas dedicadas

### 6.1 Serviços principais

1. **PPF:** película de proteção; coberturas e acabamentos adaptados ao projeto.
2. **Car Wrap:** personalização integral ou parcial em vinil.
3. **Color PPF:** mudança de cor com película de proteção.

Serviços complementares: Chrome Delete, óticas, aplicações parciais e projetos de motas, sujeitos a avaliação.

### 6.2 Estado atual

Os três serviços principais têm detalhes acessíveis a partir da página inicial. A escolha de um serviço prepara o formulário com essa intenção.

### 6.3 Evolução prevista

Criar páginas próprias, com conteúdo suficiente para responder às dúvidas antes do contacto:

| Rota proposta | Conteúdo |
| --- | --- |
| `/servicos/ppf` | Benefícios, limites, zonas de cobertura, processo, casos e cuidados |
| `/servicos/car-wrap` | Cores, acabamentos, preparação, aplicações parciais e manutenção |
| `/servicos/color-ppf` | Diferenças para vinil, opções de cor, proteção e exemplos |
| `/projetos` | Portefólio completo |
| `/projetos/[projeto]` | Página de um trabalho, com fotografias e descrição confirmada |
| `/atelier` | Espaço, pessoas e processo |
| `/cuidados` | Guias de utilização e manutenção |
| `/parceiros` | Informação para stands, concessionários e outros profissionais |
| `/contactos` | Contactos oficiais, localização e atendimento |

Estas rotas são uma proposta de evolução; não estão todas implementadas na primeira versão.

### 6.4 Informação comercial

Quando forem confirmados, apresentar preços orientativos com o que incluem, a cobertura de referência e o tratamento do IVA. Um preço «desde» deve corresponder a um serviço identificável.

**Estado atual:** o site não publica uma tabela de preços nem promete prazos ou coberturas de garantia genéricas.

## 7. Portefólio e casos reais

### 7.1 Implementado

- Oito projetos disponíveis.
- Filtros por PPF, Car Wrap, Color PPF e personalização, além da vista geral.
- Abertura ampliada de cada trabalho.
- Navegação entre projetos.
- Pedido de proposta com a referência do projeto escolhido.

Alguns trabalhos estão apenas na categoria geral porque não há informação suficiente para atribuir um serviço técnico específico.

### 7.2 Modelo futuro de um caso

Cada projeto deve poder guardar:

- Marca e modelo.
- Objetivo do proprietário.
- Serviço efetivamente realizado.
- Cor e acabamento.
- Material e referência, quando confirmados.
- Zonas abrangidas.
- Galeria geral e fotografias de acabamento.
- Antes/depois, quando existirem imagens adequadas.
- Observações úteis sobre o resultado.
- Autorização e condições de divulgação.

Não preencher campos em falta com dados inventados. Não apresentar imagens de simulação como fotografias de trabalhos realizados.

## 8. Estúdio de cor e comparação sincronizada

### 8.1 Decisão de experiência

A ideia aprovada é apresentar um carro principal, acompanhado de perspetivas mais pequenas. A cor e a barra de comparação devem manter-se sincronizadas em todas as vistas.

O carro deve ficar contido no enquadramento, com espaço à volta, permitindo compreender o conjunto da transformação.

### 8.2 Implementado na primeira versão

- Porsche 911 demonstrativo.
- Quatro vistas: três quartos, frente, lateral e traseira.
- Escolha da vista principal através das miniaturas.
- Cinco estudos de cor: azul profundo, verde petróleo, Bordeaux, grafite e prata.
- Controlos de brilho, acetinado e mate.
- Barra de comparação com posição partilhada entre a vista principal e as miniaturas.
- Cor e acabamento selecionados mantidos quando se muda de vista.
- Possibilidade de juntar a inspiração escolhida ao pedido de proposta.

### 8.3 Limites da demonstração atual

As quatro imagens do Porsche são ilustrativas e foram geradas para o simulador. As mudanças de cor usam filtros visuais aproximados e as opções de acabamento alteram a apresentação de forma simplificada.

Esta versão:

- Não usa um modelo 3D navegável.
- Não representa o carro concreto de cada visitante.
- Não está ligada a um catálogo de películas comerciais.
- Não reproduz fielmente a cor, a textura ou o brilho físico de um material.
- Não calcula automaticamente material, preço ou prazo.

O aviso sobre o caráter ilustrativo deve continuar visível. A escolha final exige confirmação numa amostra física.

### 8.4 Próxima evolução: simulação 2D do carro do cliente

1. Receber fotografias adequadas do mesmo carro em vários ângulos.
2. Identificar as zonas de carroçaria que podem mudar de cor.
3. Preservar vidros, pneus, óticas, jantes, emblemas e fundo.
4. Aplicar a mesma referência de cor a todas as imagens.
5. Partilhar o estado da cor, acabamento e comparação entre as vistas.
6. Permitir guardar e comparar duas ou três opções.
7. Associar a escolha à proposta e, posteriormente, ao X-Flow.

Não misturar fotografias de carros diferentes como se fossem perspetivas da mesma viatura.

### 8.5 Evolução posterior: 3D

A visualização 3D depende da disponibilidade, adequação e licença dos modelos dos veículos, além da qualidade dos materiais e do desempenho em telemóvel. Deve entrar como uma fase própria, sem bloquear o funcionamento do restante site.

## 9. Pedidos de proposta e conversão

### 9.1 Percursos principais

**A partir do serviço:** escolher serviço → indicar viatura e contacto → enviar pedido.

**A partir do portefólio:** abrir um trabalho → pedir projeto semelhante → enviar pedido com a referência selecionada.

**A partir do simulador:** explorar cor e acabamento → pedir proposta com essa inspiração → identificar o carro real → enviar pedido.

### 9.2 Formulário atual

| Campo | Obrigatório? | Utilização |
| --- | --- | --- |
| Serviço pretendido | Sim | Encaminhamento da análise |
| Marca, modelo e ano | Sim, num campo de texto | Identificação da viatura |
| Nome | Sim | Identificação do contacto |
| E-mail | Sim | Resposta ao pedido |
| Telefone | Não | Meio de contacto adicional |
| Ideia ou mensagem | Não | Dúvidas e objetivos |
| Inspiração escolhida | Automática, quando aplicável | Referência do portefólio ou simulador |
| Confirmação do pedido de contacto | Sim | Registo da base legal (diligências pré-contratuais) e do texto aceite |
| Opt-in para comunicações de marketing | Não, separado | Consentimento distinto, nunca pré-marcado |
| Ligação para o aviso de privacidade | Sim | Informação antes do envio |
| Origem e campanha (`utm_*`) | Automática | Atribuição e análise |
| Versão do aviso de privacidade, data e texto aceite | Automática | Prova do que foi apresentado e aceite |
| Referência do pedido | Automática | Confirmação e seguimento |
| Campo armadilha não visível | Automática | Proteção básica contra spam |

**Comportamento implementado:** validação dos dados, gravação persistente, estado inicial «Novo» e confirmação com uma referência. O envio não confirma uma marcação nem um preço.

A base legal para responder ao pedido deve ser documentada. O consentimento para marketing é separado e opcional; não pode ser confundido com a confirmação necessária para responder a quem pediu contacto.

O formulário atual não recebe anexos, não cobra pagamentos e não cria uma conta do cliente.

### 9.3 Evoluções de contacto

- Ligar o novo número e WhatsApp da X-Motion quando forem definidos.
- Configurar notificações dos pedidos para o contacto da empresa.
- Definir um prazo de resposta sustentável antes de o anunciar.
- Permitir envio de fotografias, com limites e gestão adequados.
- Transferir o pedido e a inspiração para o X-Flow, sem obrigar o cliente a repetir a informação.
- Publicar telefone, e-mail e WhatsApp com ações diretas no telemóvel, sem depender apenas do Instagram.
- Garantir e-mail com domínio próprio e registos SPF, DKIM e DMARC, para que as notificações e respostas não caiam em spam.
- Medir cliques em telefone, e-mail e WhatsApp como eventos distintos do envio do formulário.

### 9.4 Operação e resposta aos pedidos

Um formulário que grava pedidos mas não garante resposta atempada transforma-se numa perda de oportunidades. A operação deve ser definida antes da abertura.

Estados de referência para a operação, depois de separar ganho e perdido:

| Estado | Ação esperada | Prazo interno a validar |
| --- | --- | --- |
| Novo | Confirmar receção e pedir informação em falta | 1 dia útil |
| Em análise | Avaliar viatura, material e disponibilidade; preparar proposta | 2 a 3 dias úteis |
| Proposta enviada | Fazer seguimento e registar dúvidas ou objeções | 3 a 5 dias úteis |
| Ganho | Registar valor, data e trabalho associado | Aquando do fecho |
| Perdido | Registar motivo, data e concorrente, se conhecido | Aquando do fecho |
| Cancelado, spam ou duplicado | Arquivar com motivo, sem apagar o histórico | Imediato |

**Promessa pública (a validar com a X-Motion):** primeira resposta em 1 dia útil. Se não puder ser cumprida numa semana concreta, comunicar essa realidade em vez de manter a promessa.

Regras de operação:

- Definir um responsável nominal pelo acompanhamento dos pedidos e um substituto para férias e ausências.
- Consultar a caixa de gestão pelo menos uma vez por dia útil enquanto não existirem notificações fiáveis.
- Enviar uma confirmação automática ao cliente e uma notificação interna para o responsável.
- Se a notificação falhar, o pedido continua visível na caixa de gestão e não é perdido.
- Não prometer prazo, preço ou garantia antes da avaliação da viatura.
- Registar a primeira resposta, o valor da proposta, a data de ganho ou perda, o próximo passo e a referência do trabalho ou fatura.
- Registar os motivos de perda para melhorar conteúdo, oferta e qualificação.
- Definir um procedimento para pedidos duplicados, incompletos ou fora da área de serviço.
- Testar a entrega de pedidos após cada alteração ao formulário ou ao alojamento.

## 10. Área de gestão

### 10.1 Implementado

Rota: `/atelier/pedidos`.

Acesso reservado ao responsável configurado no servidor, com início de sessão. A informação dos clientes não deve ser devolvida a visitantes sem autorização. O estado real desta proteção deve ser confirmado na versão alojada antes da abertura.

Funcionalidades:

- Consultar os pedidos recebidos.
- Ver viatura, serviço, contacto, mensagem e inspiração.
- Filtrar por estado.
- Alterar o estado do pedido.
- Exportar os registos apresentados na caixa para CSV, através do controlo disponível.

Estados atuais:

1. Novo.
2. Em análise.
3. Proposta enviada.
4. Concluído.

**Limitação atual:** «Concluído» junta ganho e perdido, pelo que não permite calcular taxa de fecho nem motivos de perda. A evolução mínima separa Ganho, Perdido, Cancelado, Spam e Duplicado. Também não há notificações automáticas por e-mail; é necessário consultar a caixa de gestão.

### 10.2 Gestão de conteúdos prevista

A edição do site ainda é feita no código. Criar uma área simples para Luís poder:

- Publicar e editar projetos.
- Carregar fotografias originais.
- Escolher imagem de capa e recortes por dispositivo.
- Marcar projetos como destaque na página inicial.
- Ordenar os destaques.
- Atualizar serviços e perguntas frequentes.
- Controlar o que está publicado e o que permanece em rascunho.

A facilidade de manutenção é parte do projeto: o site deve acompanhar os trabalhos reais sem exigir uma alteração de código a cada publicação.

### 10.3 Segurança e operação

**Estado: requisitos a implementar ou verificar; não são uma descrição do que já está protegido.**

A área de gestão contém dados pessoais e não pode depender apenas de uma palavra-passe partilhada. O acesso deve ser negado por omissão e a rota de gestão não precisa de estar anunciada no rodapé público.

- Remover a ligação de gestão do rodapé público e proteger a rota com regra de acesso e limitação de pedidos.
- Autenticação com segundo fator para o responsável e sessões com expiração.
- Autorização verificada no servidor em cada pedido, negando por omissão.
- Proteção contra força bruta e limitação de tentativas de início de sessão.
- Limitação de pedidos no formulário público e proteção antiabuso para além do campo armadilha, ativada apenas se houver spam.
- Proteção CSRF nas operações de alteração e cookies com `Secure`, `HttpOnly` e `SameSite`.
- Cabeçalhos de segurança: HTTPS obrigatório, HSTS, `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy` e controlo de enquadramento.
- Segredos apenas no servidor, com rotação documentada e sem valores em repositório, documentação ou código do navegador.
- Registo de auditoria das alterações de estado: quem alterou, quando e de que estado para que estado.
- Cópias de segurança da base de dados com mecanismo nomeado, periodicidade, RPO e RTO definidos e teste de restauro datado. Referência inicial: RPO de 24 horas e RTO de 4 horas, a validar com a plataforma.
- Exportação de CSV protegida contra injeção de fórmulas e registada em auditoria, com acesso limitado ao responsável.
- Monitorização de erros, disponibilidade e falhas de envio do formulário, com alerta para o responsável.
- Atualização regular de dependências e revisão de acessos quando alguém deixa o projeto.
- Procedimento de incidente: conter, avaliar, corrigir, registar e, quando houver risco para titulares, notificar a CNPD no prazo de 72 horas e comunicar aos titulares se o risco for elevado.

As cópias de segurança e o registo de auditoria não substituem a correção da causa. Devem ser verificados, não apenas configurados.

### 10.4 Privacidade, consentimento e retenção

O site recolhe nome, e-mail, telefone, viatura e mensagem. O tratamento deve estar descrito e limitado ao necessário.

- Política de privacidade em português, com finalidade, base legal, categorias de dados, destinatários, prazos e direitos.
- Identificação da entidade responsável, contactos e forma de exercer os direitos.
- Registo da versão do aviso de privacidade, data e texto aceite, e do opt-in de marketing separado, sem depender apenas da caixa assinalada.
- Prestadores de serviços identificados (alojamento, base de dados, e-mail, analítica) e contratos de tratamento aplicáveis.
- Registo das atividades de tratamento e lista de subprocessadores, com localização dos dados.
- Termos e condições de serviço e informação pré-contratual, quando aplicável.
- Prazo de conservação definido e documentado; não conservar pedidos indefinidamente.
- Procedimento para acesso, correção, exportação e eliminação de dados, com prazo de resposta definido.
- Fotografias sem dados de localização e com matrículas tratadas antes da publicação.
- Política de cookies apenas se forem usados cookies não essenciais; preferir analítica sem cookies.
- Dados pessoais nunca enviados para ferramentas de analítica, registos de erro ou URLs.
- Formulário e política de privacidade ligados entre si no momento do consentimento.
- Revisão jurídica antes da abertura ao público, incluindo livro de reclamações eletrónico, quando aplicável.

**Base legal e retenção (proposta sujeita a validação jurídica):**

| Dados | Base legal | Retenção proposta |
| --- | --- | --- |
| Pedido e contacto | Diligências pré-contratuais | 12 meses após o último contacto, se não converter |
| Proposta, trabalho e faturação | Execução de contrato e obrigação legal | 10 anos para documentação fiscal |
| Comunicações de marketing | Consentimento | Até retirada ou 24 meses de inatividade |
| Registos de segurança e auditoria | Interesse legítimo | 6 a 12 meses |

**Direitos dos titulares:** a área de gestão deve permitir exportar, retificar, anonimizar e eliminar dados, com registo de auditoria. O prazo de resposta é de um mês, salvo extensão justificada.

## 11. Área privada do cliente — «O meu projeto»

**Estado: planeada, ainda não implementada.**

A ideia de Luís é prolongar a experiência depois da visita ao atelier. O cliente deve poder explorar as opções em casa durante cerca de dois a três dias, com tempo e sem pressão presencial.

Esse período é uma referência de acompanhamento, não uma obrigação de apagar o acesso ou pressionar a decisão automaticamente.

### 11.1 Antes da marcação

- Ver o resumo do seu pedido e a proposta.
- Consultar inclusões, alternativas e condições.
- Simular o carro nas vistas disponíveis.
- Guardar e comparar duas ou três configurações.
- Partilhar uma opção com outra pessoa, através de acesso controlado.
- Enviar dúvidas e pedir alterações.
- Confirmar uma preferência e solicitar a marcação.

### 11.2 Durante o trabalho

- Consultar etapas principais.
- Ver atualizações fotográficas selecionadas.
- Perceber se existe alguma decisão pendente.
- Conhecer a previsão de entrega comunicada pelo atelier.

A frequência das atualizações deve ser compatível com o trabalho na oficina. Evitar criar uma obrigação de publicação contínua.

### 11.3 Depois da entrega

Transformar este espaço no passaporte digital da viatura:

- Serviço realizado e data.
- Material e referência, quando aplicável.
- Zonas abrangidas.
- Cuidados recomendados.
- Condições de garantia efetivas.
- Revisões e intervenções posteriores.
- Meio de contacto para assistência.

## 12. Integração com o X-Flow

**Estado: planeada; decisão B1 registada em 25/10/2026, sem ligação operacional na primeira versão.**

Separação de responsabilidades pretendida:

| Componente | Responsabilidade |
| --- | --- |
| Website público | Apresentar a marca, explicar serviços e captar pedidos |
| Área privada do cliente | Explorar, decidir e acompanhar o projeto |
| X-Flow | Gerir clientes, viaturas, propostas, agenda, produção, materiais, qualidade e pós-venda |

Fluxo de dados futuro:

1. O visitante envia o pedido no site.
2. O X-Flow recebe o pedido como lead (`website_leads`), com contacto, viatura descrita, serviço, origem e inspiração.
3. O responsável avalia o lead e, se qualificado, cria ou associa cliente, viatura e proposta.
4. O cliente consulta a proposta na sua área.
5. A decisão evolui para marcação e trabalho.
6. A entrega alimenta o passaporte, os cuidados e o acompanhamento.

Implementar identificadores estáveis e prevenção de duplicados. Controlar permissões para que cada cliente apenas consulte o que lhe pertence.

### 12.1 Decisão tomada: site integrado no X-Flow (B1)

Em 25 de outubro de 2026, o Luís aprovou a abordagem **B1**: o site público passa para o repositório do X-Flow, com dois hosts — `www.<domínio>` para o site e `app.<domínio>` para a gestão. A abordagem A fica apenas como fallback e não deve ser mantida em paralelo.

| Abordagem | Estado | Efeito |
| --- | --- | --- |
| **A. Site autónomo + integração por API** | Fallback registado | Só se B1 falhar por custódia, capacidade ou custo; exige decisão nova |
| **B1. Site no X-Flow com dois hosts** | **Aprovada** em 25/10/2026 | Duas apps no mesmo repo: `site/` público e ERP atual, com projetos e hosts separados |
| **B2. Dashboard movido para `/dashboard`** | Rejeitada | Evita refactor de todas as rotas e links do ERP |

Consequências para este plano:

- O site deixa de ser um projeto separado em D1/Cloudflare Sites; passa para `site/` no repositório X-Flow, com deploy próprio e Neon partilhado.
- O formulário grava `website_leads` e não cria automaticamente cliente, viatura ou orçamento.
- O passaporte público usa token unificado, com expiração e revogação.
- A integração por API descrita em 16.4 aplica-se apenas ao período de transição ou se A for reativada.
- O `X-Flow_Plano_Website_Portfolio_Social_Studio.md` v1.2 prevalece para arquitetura, migrações, RLS, storage e fases.

**Sistema de registo:** o Neon/X-Flow é a fonte de verdade. Nenhum pedido é considerado tratado antes de estar registado no X-Flow.

## 13. Confiança e prova

### Elementos a desenvolver

- Avaliações reais, com origem verificável.
- Fotografias de arestas, contornos e outros acabamentos.
- Apresentação das pessoas e do espaço.
- Explicação das decisões de preparação e aplicação.
- Casos antes/depois, quando existirem imagens adequadas.
- Condições claras de serviço, manutenção e garantia.
- Contactos e informações comerciais confirmados.
- Autorizações de imagem dos proprietários, incluindo tratamento de matrículas e interiores.
- Procedimento para remover uma fotografia ou avaliação a pedido do cliente.
- Critério editorial para publicar avaliações: texto integral, data, serviço e origem verificável.

**Estado atual:** o site utiliza fotografias reais e explica serviços e processo. Não foram inventadas avaliações, certificações, parcerias, números de clientes ou garantias.

Só publicar uma marca como parceira ou certificadora se essa relação estiver confirmada e puder ser comunicada.

### 13.1 Registo de afirmações comerciais

Nenhuma afirmação sobre material, marca, cor comercial, durabilidade, garantia ou certificação deve ser publicada sem fonte confirmada. O registo mínimo é:

| Afirmação | Estado | Fonte | Responsável |
| --- | --- | --- | --- |
| Color PPF Midnight Navy Blue no Porsche 911 GT3 | A confirmar | X-Motion | Luís |
| Gloss Grey no Mercedes-Benz Coupé | A confirmar | X-Motion | Luís |
| Coberturas, garantias e prazos por serviço | Em falta | X-Motion | Luís |
| Marcas de película e eventuais certificações | Em falta | X-Motion | Luís |

Enquanto o estado não for «confirmado», a afirmação não é publicada como facto. Isto aplica-se também a textos gerados por ferramentas de marketing e a afirmações equivalentes noutros documentos do projeto, como catálogo de películas, marcas parceiras ou garantias de instalação.

## 14. Telemóvel, acessibilidade e desempenho

### Objetivos de utilização

- Percurso completo utilizável num telemóvel.
- Texto legível e contraste suficiente.
- Controlos com dimensão adequada para toque.
- Formulários com etiquetas, mensagens de erro e confirmação claras.
- Navegação por teclado e foco visível.
- Fecho de janelas ampliadas por controlo próprio e teclado.
- Alternância de imagens que possa ser pausada.
- Preferência de redução de movimento respeitada.
- Fotografias com dimensões reservadas para evitar saltos de composição.
- Carregamento secundário das imagens fora da abertura.

### 14.1 Metas verificáveis

**Antes do lançamento (laboratório):** Lighthouse móvel com 4G simulado; LCP ≤ 2,5 s, CLS ≤ 0,1 e TBT ≤ 200 ms como proxy de INP. Orçamentos de referência: JavaScript inicial ≤ 200 KB gzip, imagem de abertura ≤ 300 KB e total inicial ≤ 1,5 MB, a fixar com a equipa.

**Depois do lançamento (campo):** CrUX móvel no percentil 75, após 28 dias e volume mínimo; LCP ≤ 2,5 s, INP ≤ 200 ms e CLS ≤ 0,1. INP não é medido em laboratório nem por teste manual.

| Área | Meta | Como verificar |
| --- | --- | --- |
| Conteúdo principal | LCP ≤ 2,5 s | Laboratório antes; CrUX após lançamento |
| Interação | INP ≤ 200 ms em campo; TBT ≤ 200 ms em laboratório | CrUX após lançamento; Lighthouse/TBT antes |
| Estabilidade visual | CLS ≤ 0,1 | Lighthouse e revisão de imagens/fontes |
| Acessibilidade | WCAG 2.2 AA | Auditoria automática e revisão manual |
| Teclado | Percurso completo sem rato | Teste manual em computador |
| Leitor de ecrã | Serviços, portefólio, simulador e formulário compreensíveis | VoiceOver (iOS) e TalkBack (Android) |
| Contraste | 4,5:1 em texto normal e 3:1 em texto grande e controlos | Ferramenta de contraste e tokens documentados |
| Ecrã pequeno | Sem deslocação horizontal involuntária a 320 px e reflow a 400% | Teste manual e inspeção |
| Formulário | Erros identificados, associados ao campo e com foco gerido; dados reaproveitados em caso de erro | Teste manual e leitor de ecrã |
| Peso inicial | JavaScript ≤ 200 KB gzip, abertura ≤ 300 KB, total ≤ 1,5 MB | Relatório de rede do navegador |

Metas de referência para o Lighthouse móvel antes da abertura: desempenho ≥ 90, acessibilidade ≥ 95, boas práticas ≥ 95 e SEO ≥ 90. O Lighthouse é triagem, não prova de conformidade WCAG nem de SEO local. As metas não substituem testes reais em iPhone e Android.

Critérios WCAG 2.2 que exigem verificação própria, para além do Lighthouse: 1.4.10 (reflow), 1.4.12 (espaçamento de texto), 2.4.11 (foco não obscurecido), 2.5.7 (alternativa à barra arrastável do simulador), 2.5.8 (alvos mínimos de 24 × 24 px), 3.2.6 (ajuda consistente), 3.3.4 (prevenção de erros em ações com consequências), 3.3.7 (reintrodução de dados) e 3.3.8 (autenticação acessível).

### 14.2 Matriz mínima de verificação

| Ambiente | O que confirmar |
| --- | --- |
| iPhone com Safari | Abertura, menu, simulador, portefólio, formulário e teclado |
| Android com Chrome | Os mesmos percursos e o comportamento do teclado |
| Computador com Chrome e Edge | Navegação, foco, janelas ampliadas e descarregamentos |
| Computador com Safari e Firefox | Compatibilidade de apresentação e formulário |
| Larguras 320, 390, 768 e 1440 px | Composição, imagens e ausência de cortes |
| Preferência de movimento reduzido | Animações e carrossel sem movimento automático |
| Zoom a 200% | Leitura e utilização sem perda de conteúdo |
| Rede lenta | Ordem de carregamento e estabilidade da abertura |

### Verificação já realizada

- Compilação da aplicação e validação TypeScript.
- Navegação do portefólio e filtro por Color PPF.
- Detalhe ampliado e passagem da inspiração ao formulário.
- Envio de um pedido sintético no ambiente local e respetiva confirmação.
- Seleção de cor, mudança de vista e sincronização da comparação.
- Revisão do menu e da apresentação numa janela de conteúdo móvel de 390 × 844.

A publicação foi confirmada pela plataforma. A versão alojada deve manter acesso privado; confirmar no painel da plataforma que a proteção está ativa. A experiência de início de sessão e a caixa de gestão devem ser verificadas pelo responsável com a sua conta antes da abertura ao público.

Cada verificação deve registar data, commit ou build, dispositivo e navegador, resultado e evidência (captura, relatório ou URL). Sem esse registo, é uma alegação e não uma verificação reproduzível.

## 15. Pesquisa, medição e melhoria

### 15.1 Descoberta na pesquisa

**Estado atual:** existem título, descrição e idioma definidos; a indexação está desativada para a fase privada de revisão.

Para o lançamento público:

- Aplicar o domínio definitivo, com HTTPS, versão canónica e redirecionamento 301 de `www` ou do domínio antigo.
- Remover `noindex` e `nofollow` da versão pública e confirmar que a pré-visualização continua protegida por `noindex`, `X-Robots-Tag` e regra de acesso próprios. A configuração deve ser por ambiente, não global.
- Definir título e descrição únicos por página, com extensão adequada e sem repetições.
- Configurar Open Graph e Twitter Card com imagem absoluta de 1200 × 630 px.
- Publicar dados estruturados validados no Rich Results Test: `AutoRepair` (subtipo de `LocalBusiness`) com `name`, `address`, `telephone`, `geo`, `openingHoursSpecification`, `areaServed`, `priceRange` e `sameAs`; `Organization` e `WebSite`; `Service` por serviço; `BreadcrumbList` nas páginas internas. `FAQPage` pode ser incluído por semântica, mas não garante resultados enriquecidos.
- Garantir URL canónico autorreferente e ligações internas entre serviços, projetos e contactos.
- Criar `sitemap.xml` e `robots.txt` e submetê-los no Google Search Console e no Bing Webmaster Tools.
- Confirmar a hierarquia de títulos, textos alternativos descritivos e imagens com nome de ficheiro útil.
- Publicar página 404 própria e redirecionamentos das rotas antigas que tenham relevância.
- Confirmar nome, morada, telefone e horários e manter a mesma informação no site, no Google, no Instagram e nos documentos comerciais.
- Reclamar e completar o perfil de empresa no Google, com categoria adequada (por exemplo, reparação automóvel ou detailing), serviços, fotografias, horário, área de serviço e ligação ao site.
- Decidir e documentar se a empresa é apresentada como loja física, área de serviço ou ambas, com a morada pública tratada em conformidade.
- Criar páginas úteis e específicas para cada serviço.
- Publicar casos com texto e fotografias próprios.
- Confirmar que as páginas legais são indexáveis e estão ligadas no rodapé.
- Verificar a indexação com inspeção de URL antes de anunciar o site.

### 15.2 Medição comercial

**Estado atual:** o formulário pode guardar uma origem de campanha através de `utm_source`. Ainda não existe um sistema completo de análise de visitas e conversões.

Medição futura:

| Etapa | O que medir |
| --- | --- |
| Visita | Origem, página de entrada e dispositivo |
| Interesse | Serviço ou projeto consultado |
| Exploração | Utilização do estúdio e configuração selecionada |
| Contacto | Pedido efetivamente recebido ou conversa iniciada |
| Proposta | Valor e data de envio |
| Marcação | Trabalho confirmado |
| Resultado | Faturação, margem e motivos de perda |

Um clique num contacto não equivale automaticamente a uma conversa. Uma conversa não equivale a uma marcação.

### 15.3 Testes de melhoria

Depois de existir volume suficiente, comparar alterações com uma hipótese de cada vez:

- Fotografia de abertura.
- Mensagem principal.
- Texto do botão de proposta.
- Ordem e clareza dos serviços.
- Posição do simulador.
- Quantidade de informação pedida no primeiro contacto.

Com pouco tráfego, começar pela observação dos percursos, análise dos pedidos e dúvidas reais, evitando conclusões precipitadas a partir de poucos visitantes.

### 15.4 Analítica e consentimento

A medição deve ser definida antes do lançamento, não acrescentada depois.

- Preferir analítica sem cookies (por exemplo, Plausible, Umami ou Cloudflare Web Analytics) para dispensar banner de consentimento.
- Se for usada uma ferramenta com cookies, implementar consentimento prévio e Consent Mode, sem carregar a ferramenta antes da escolha.
- Nunca enviar nome, e-mail, telefone, mensagem ou matrícula para a analítica.
- Medir eventos com nomes estáveis: `ver_servico`, `abrir_projeto`, `explorar_cor`, `iniciar_formulario`, `submeter_formulario`, `erro_formulario`, `clique_telefone`, `clique_whatsapp`, `clique_email` e `clique_instagram`.
- Distinguir visualização de intenção: abrir o simulador não é um pedido; clicar no WhatsApp não é uma marcação.
- Padronizar campanhas: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` e `utm_term` em minúsculas e com valores documentados.
- Guardar no pedido a origem e o identificador de campanha, sem recolher parâmetros desnecessários.
- Criar um painel simples com pedidos por semana, origem, serviço, tempo de resposta e taxa de conclusão.
- Rever os dados mensalmente e escolher uma única melhoria por ciclo.
- Documentar a definição de «pedido qualificado» para que todos interpretem os números da mesma forma.

## 16. Base técnica da primeira versão

Esta secção permite transmitir o trabalho a quem continuar o desenvolvimento.

| Camada | Implementação atual |
| --- | --- |
| Interface | React e TypeScript |
| Estrutura e execução | Vinext / Vite |
| Alojamento | Pré-visualização na plataforma Sites (`chatgpt.site`), com execução em Cloudflare Workers; alojamento definitivo por decidir |
| Dados | D1 na versão atual; com B1, o destino é Neon/X-Flow, com migração do esquema e dos pedidos |
| Fotografias | Derivados WebP; parte corresponde a recortes de publicações do Instagram, a substituir por originais |
| Simulador | Imagens demonstrativas e estado partilhado entre as vistas |
| Formulário | `POST /api/pedidos` |
| Gestão de pedidos | `GET` e `PATCH /api/gestao/pedidos` |
| Área reservada | `/atelier/pedidos` |
| Controlo de acesso | Identidade autenticada e verificação do responsável no servidor, a confirmar na versão alojada |

### 16.1 Registo atual de um pedido

A tabela de pedidos guarda hoje:

- Identificador.
- Nome, e-mail e telefone opcional.
- Viatura.
- Serviço.
- Mensagem.
- Inspiração/configuração.
- Origem.
- Estado.
- Data de criação.

O modelo mínimo de lançamento deve acrescentar:

- Versão do aviso de privacidade, data e texto aceite.
- Opt-in de marketing, separado do pedido.
- Primeira resposta, valor da proposta, data de ganho ou perda e motivo de perda.
- Próximo passo e referência de trabalho ou fatura.
- Estado de sincronização com o X-Flow.

O registo detalhado de consentimentos e o histórico de alterações fazem parte do modelo mínimo de lançamento, não de uma fase posterior. O formulário confirma o pedido de contacto; o marketing exige opt-in separado.

### 16.2 Ficheiros principais

- `app/xmotion.tsx`: experiência pública e interações.
- `app/globals.css`: apresentação e adaptação aos ecrãs.
- `app/projects.ts`: conteúdo dos projetos e serviços.
- `app/layout.tsx`: idioma e metadados.
- `app/api/pedidos/route.ts`: receção dos pedidos.
- `app/atelier/pedidos/`: caixa de gestão.
- `app/api/gestao/pedidos/route.ts`: operações autorizadas da gestão.
- `db/schema.ts` e `drizzle/`: estrutura e migrações dos dados.
- `public/images/`: fotografias e imagens demonstrativas.

Credenciais, dados privados de acesso e valores sensíveis de configuração não devem ser incluídos neste documento nem no código entregue ao navegador.

### 16.3 Repositório, ambientes e portabilidade

Com B1, o código do site passa para `site/` no repositório X-Flow, com um projeto Vercel próprio. Até à migração, o código atual continua no projeto do site. Em qualquer dos casos, o repositório oficial, os ambientes e os acessos devem ser confirmados e documentados.

Antes do lançamento, confirmar:

- Repositório oficial, proprietário, acessos e política de cópia de segurança.
- Ambientes separados: local, pré-visualização privada e produção.
- Processo de publicação, revisão e reversão para a versão anterior.
- Domínio e DNS registados em nome da X-Motion, com acesso e renovação garantidos.
- Alojamento definitivo escolhido; a pré-visualização `chatgpt.site` não deve ser o endereço oficial da empresa.
- Exportação dos dados da base de dados e das imagens, sem depender de uma única plataforma.
- Documentação de instalação, variáveis de ambiente, migrações e restauro.
- Gestão de segredos fora do repositório e rotação documentada.
- Custo mensal conhecido: alojamento, base de dados, domínio, e-mail, analítica, monitorização e cópias de segurança.
- Plano de continuidade se a plataforma de pré-visualização for descontinuada ou alterar condições.
- Ambientes isolados: a pré-visualização não pode partilhar a mesma base de dados nem a mesma área de gestão da produção.
- Teste de exportação e restauro da base de dados, com data, responsável e resultado registados.

**Matriz de custódia (a preencher e confirmar):**

| Ativo | Titular | Responsável pela renovação | Recuperação | Estado |
| --- | --- | --- | --- | --- |
| Domínio e DNS | X-Motion | A definir | 2FA e códigos de recuperação | A confirmar |
| Repositório do site | X-Motion | A definir | Acessos de administração | A confirmar |
| Conta Cloudflare/Sites | X-Motion | A definir | 2FA e códigos de recuperação | A confirmar |
| Base de dados (D1 até à migração; Neon após B1) | X-Motion | A definir | Exportação e restauro | A confirmar |
| E-mail do domínio | X-Motion | A definir | Acesso administrativo | A confirmar |
| Google Business e Search Console | X-Motion | A definir | Gestores e proprietário | A confirmar |
| Analítica | X-Motion | A definir | Acesso de administração | A confirmar |

O titular deve ser a entidade legal que opera a X-Motion. Se os ativos estiverem em nome individual, documentar a transferência ou a autorização de uso antes do lançamento.

Com B1, a linha D1/Cloudflare Sites representa o legado até à migração. O alojamento definitivo, a base Neon e os respetivos acessos são decididos na Fase 0 do plano do X-Flow.

### 16.4 Integração com o X-Flow sem duplicar dados

Durante a transição, ou se A for reativada, a ligação ao X-Flow deve ser um contrato explícito, não uma cópia manual:

- Ponto de entrada autenticado, com segredo próprio e limitação de pedidos.
- Identificador idempotente por pedido, para evitar duplicados em reenvios.
- Estados de sincronização: pendente, enviado, aceite, erro e reconciliado.
- Registo de tentativas e alerta quando um pedido não chega ao X-Flow.
- Mapeamento documentado entre os campos do site e as entidades `customers`, `vehicles` e `quotes`.
- Nenhum dado do X-Flow devolvido ao site público.
- Reenvio manual disponível na área de gestão.

## 17. Plano de execução por fases

Cada fase só avança quando os critérios aplicáveis da secção 18 estiverem cumpridos. As datas e os custos continuam em aberto.

### 17.1 Riscos principais

| Risco | Probabilidade | Impacto | Mitigação | Responsável |
| --- | --- | --- | --- | --- |
| Fotografias originais e autorizações atrasam o lançamento | Alta | Alto | Fixar data-limite; publicar apenas o que estiver autorizado; não inventar conteúdo | X-Motion |
| Pedidos recebidos mas sem resposta atempada | Média | Alto | Responsável nominal, SLA, notificações e consulta diária da caixa | X-Motion |
| Notificações de pedidos falham em silêncio | Média | Alto | Alerta de falha, teste mensal e verificação da caixa de gestão | Desenvolvimento |
| Duplicação entre site público e X-Flow durante a migração | Alta | Médio | Fase 0, mapa de migração e idempotência; não manter A e B em paralelo | Projeto |
| Deriva de âmbito para 3D, área privada ou CMS antes do lançamento | Média | Alto | Fases fechadas e critérios de aceitação; nada entra sem decisão | Projeto |
| Inconformidade RGPD ou falta de informação legal | Média | Alto | Política, consentimento, retenção, contratos e revisão jurídica | X-Motion |
| Expectativa errada sobre a cor do simulador | Média | Médio | Aviso visível, amostra física e linguagem não promissória | X-Motion |
| Dependência da plataforma de pré-visualização | Média | Alto | Domínio próprio, repositório, exportação e alojamento definitivo | Desenvolvimento |
| Acesso à gestão comprometido | Baixa | Alto | Segundo fator, autorização no servidor, limitação de tentativas e auditoria | Desenvolvimento |
| Spam ou abuso do formulário | Média | Baixo | Campo armadilha, limitação de pedidos e proteção adicional se necessário | Desenvolvimento |
| Desempenho fraco no telemóvel por imagens grandes | Média | Médio | Orçamento de imagens, formatos modernos e medição antes da abertura | Desenvolvimento |
| Perda de dados ou impossibilidade de restaurar | Baixa | Alto | Cópias de segurança, teste de restauro e exportação periódica | Desenvolvimento |
| Conteúdo técnico incorreto (materiais, garantias, prazos) | Média | Alto | Aprovação da X-Motion antes de publicar; não preencher lacunas | X-Motion |

### Fase 1 — Base de apresentação e contacto

**Estado:** primeira versão implementada e publicada com acesso privado.

- [x] Direção visual inspirada na opção 5.
- [x] Abertura com trabalhos reais alternados.
- [x] Portefólio com oito fotografias e filtros.
- [x] Informação sobre os principais serviços.
- [x] Processo e perguntas frequentes.
- [x] Estúdio demonstrativo com quatro vistas sincronizadas.
- [x] Formulário com gravação persistente de pedidos.
- [x] Área reservada de consulta e atualização de pedidos.
- [x] Verificações locais de funcionamento e composição responsiva.

### Fase 2 — Preparar o lançamento público

Conteúdo e identidade:

- [ ] Rever o site com Luís, em computador e no iPhone.
- [ ] Aplicar o logótipo oficial em formato adequado.
- [ ] Substituir recortes por fotografias originais, quando disponíveis.
- [ ] Confirmar serviços, coberturas e legendas de cada projeto.
- [ ] Reunir autorizações de imagem e tratar matrículas.
- [ ] Definir domínio, contactos oficiais, morada e horário, incluindo novo telefone e WhatsApp.
- [ ] Confirmar firma, NIF, sede e informação de atendimento.
- [ ] Publicar política de privacidade e informação legal revista.
- [ ] Decidir se serão publicados preços orientativos e validar as condições.
- [ ] Confirmar garantias, manutenção e limites que podem ser prometidos.
- [ ] Validar o registo de afirmações comerciais e obter autorizações de marcas, materiais e imagens.

Técnica e operação:

- [ ] Verificar o acesso à área de gestão na versão alojada, com segundo fator.
- [ ] Remover a ligação de gestão do rodapé público e confirmar o isolamento da pré-visualização.
- [ ] Separar os estados Ganho, Perdido, Cancelado, Spam e Duplicado.
- [ ] Configurar notificações dos pedidos e alerta de falha.
- [ ] Testar a entrega de um pedido real e o respetivo seguimento.
- [ ] Ativar limitação de pedidos, cabeçalhos de segurança e política de sessão.
- [ ] Configurar cópias de segurança, testar o restauro e fechar a matriz de custódia.
- [ ] Ativar monitorização de erros e disponibilidade.
- [ ] Confirmar o alojamento definitivo e o domínio próprio, com DNS controlado pela X-Motion.
- [ ] Configurar e-mail do domínio com SPF, DKIM e DMARC.
- [ ] Definir o painel de analítica e os eventos de contacto.
- [ ] Remover `noindex`, publicar `sitemap.xml` e `robots.txt`.
- [ ] Validar Open Graph, Twitter Card e dados estruturados.
- [ ] Registar o site no Google Search Console e no Bing.
- [ ] Alinhar o perfil de empresa no Google com a mesma informação.
- [ ] Confirmar metas de desempenho, acessibilidade e a matriz de dispositivos.
- [ ] Definir procedimento de resposta a incidentes e a pedidos de titulares.
- [x] Registar a decisão de arquitetura: B1 aprovada em 25/10/2026.
- [ ] Autorizar e efetuar a abertura do site ao público.

### Fase 3 — Autonomia e conversão

- [ ] Criar páginas próprias de serviços e projetos.
- [ ] Implementar gestão de conteúdos e destaques.
- [ ] Acrescentar avaliações reais com origem verificável.
- [ ] Permitir fotografias no pedido, se forem necessárias ao processo.
- [ ] Implementar medição de contactos e resultados.
- [ ] Melhorar a página com base nas dúvidas e pedidos recebidos.

### Fase 4 — Experiência privada e X-Flow

- [ ] Integrar contactos, viaturas e propostas com o X-Flow.
- [ ] Criar «O meu projeto» para o cliente.
- [ ] Guardar e comparar configurações.
- [ ] Permitir esclarecimentos e escolha da proposta.
- [ ] Acrescentar acompanhamento das etapas e fotografias selecionadas.
- [ ] Disponibilizar passaporte digital, cuidados e garantia.

### Fase 5 — Simulação avançada

- [ ] Simulação 2D nas fotografias da viatura do cliente.
- [ ] Referências de materiais e cores confirmadas.
- [ ] Melhor reprodução de brilho, acetinado e mate.
- [ ] Comparação de luz e apresentação das limitações de cor.
- [ ] Avaliar 3D por modelo, qualidade, licença e desempenho.
- [ ] Ligar a escolha à proposta sem apresentar cálculos não validados.

As fases não têm datas ou custos fechados. O calendário deve considerar os materiais disponíveis, a preparação da operação e a prioridade comercial de cada funcionalidade.

## 18. Critérios de aceitação

Uma evolução só deve ser considerada pronta quando:

1. O conteúdo está confirmado pela X-Motion.
2. As fotografias correspondem aos trabalhos apresentados.
3. O visitante compreende o serviço e consegue pedir uma proposta.
4. O pedido fica guardado e acessível apenas a quem tem autorização.
5. Mensagens de sucesso e erro correspondem ao que realmente aconteceu.
6. O percurso funciona em computador e telemóvel.
7. Os controlos do simulador mantêm a cor e a comparação coerentes entre as vistas.
8. As simulações estão claramente distinguidas de trabalhos reais.
9. O site não promete integrações ou funcionalidades ainda indisponíveis.
10. A publicação mantém a audiência pretendida e está verificada.
11. A informação legal e a política de privacidade estão publicadas, ligadas e atualizadas.
12. A base legal de cada tratamento, o opt-in de marketing e os prazos de conservação estão registados e documentados.
13. A indexação pública está correta e os metadados sociais foram validados.
14. Os portões de laboratório de desempenho foram cumpridos, a auditoria WCAG 2.2 AA foi feita e o plano de medição de campo está ativo.
15. O acesso à gestão, a entrega de pedidos e as cópias de segurança foram testados.
16. A monitorização de erros e a resposta a falhas estão ativas.
17. A decisão B1 está registada e é conhecida pelo responsável; A e B não avançam em paralelo.
18. Nenhum segredo, credencial ou dado pessoal está exposto no código, no repositório ou na documentação.
19. O domínio, o repositório e as contas críticas pertencem à X-Motion e têm acesso de recuperação garantido.
20. A operação consegue responder aos pedidos dentro do prazo comunicado.
21. O modelo de pedidos distingue ganho, perdido, cancelado, spam e duplicado, e permite medir a primeira resposta.
22. Todas as afirmações comerciais publicadas têm fonte confirmada e autorização de publicação.

## 19. Decisões a preservar

- Usar a opção 5 como base do desenho.
- Dar protagonismo às melhores fotografias reais da X-Motion na abertura.
- Permitir atualizar a seleção de destaques numa futura gestão de conteúdos.
- Mostrar os carros com enquadramentos cuidados e espaço à volta.
- Manter a mesma cor e posição da barra em todas as perspetivas do simulador.
- Confirmar a cor em amostra física.
- Tornar o primeiro pedido simples, com alternativa para quem precisa de aconselhamento.
- Desenvolver a área privada para o cliente decidir com calma depois da visita.
- Ligar a experiência ao X-Flow por fases.
- Avaliar o sucesso através de pedidos qualificados, marcações e rentabilidade.
- Executar B1 com dois hosts e não manter A e B em paralelo.
- Não duplicar dados sem um ponto de integração identificável e idempotente.
- Publicar contactos completos e dados legais, sem depender apenas do Instagram.
- Preferir analítica sem cookies e recolher apenas os eventos necessários.
- Tratar a autorização de imagem e a anonimização como requisitos de publicação, não como tarefas posteriores.
- Manter domínio, repositório, cópias de segurança e contas críticas sob controlo da X-Motion.
- Usar `noindex` apenas em pré-visualização e confirmar a remoção antes de anunciar o site.
- Não prometer prazos, preços, garantias ou integrações antes de estarem confirmados.
- Tratar o Neon/X-Flow como sistema de registo; D1 é apenas legado até à migração.
- Não publicar afirmações de material, cor, marca, garantia ou certificação sem fonte confirmada.
- Manter a pré-visualização isolada da base de dados e da área de gestão de produção.
- Não anunciar a rota de gestão no rodapé público.

## 20. Registo de alterações

| Versão | Data | Alteração |
| --- | --- | --- |
| 1.0 | 25 de outubro de 2026 | Primeira versão: direção visual, estrutura, estado implementado e evolução por fases |
| 1.1 | 25 de outubro de 2026 | Revisão crítica: decisão de arquitetura, informação em falta, operação, segurança, privacidade, desempenho, SEO, riscos e critérios de aceitação |
| 1.2 | 25 de outubro de 2026 | Decisão registada: B1 (site público no X-Flow com dois hosts) e token unificado; secções de arquitetura, dados, riscos, checklist e critérios ajustadas |

---

**Resultado pretendido:** um site com identidade X-Motion, que mostra trabalho real, explica as escolhas, facilita o contacto e prolonga a qualidade do atendimento até ao pós-venda.
