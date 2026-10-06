Analisa este plano sem implementar nada.# X-Flow — Plano de implementação de orçamentos flexíveis

**Destinatário:** agente de desenvolvimento no AntiGravity  
**Projeto:** X-Flow, sistema de gestão da X-Motion  
**Data:** 3 de outubro de 2026  
**Versão:** 1.2 — despesas editáveis, ecrãs e fluxos de utilização  
**Estado:** especificação para implementação; não é uma funcionalidade já implementada.

> Objetivo: permitir ao Luís criar orçamentos com uma fórmula sugerida, alterar facilmente os seus parâmetros e componentes e escolher livremente o preço final. Nenhum preço comercial deve ficar rígido ou dependente de uma alteração no código.

> Limite de autorização desta entrega: foi preparado apenas este documento. O GitHub foi consultado em leitura; não foram alterados ficheiros do repositório, criadas branches, feitos commits, pushes ou pull requests. O agente AntiGravity deve respeitar as autorizações que o Luís lhe der, sem assumir autorização para publicar ou modificar a branch principal.

**Como usar este plano:** as secções 1–3 definem as regras financeiras; 4–8 explicam a utilização e o histórico; 9–13 orientam dados, integração e validação; 14 contém o prompt de arranque; 16–17 detalham os primeiros ecrãs e os cenários que o agente deve demonstrar.

---

## 1. Decisão de negócio a implementar

O modelo mais recente definido pelo Luís tem dois modos de orçamento.

| Componente | Valor inicial | Interpretação |
|---|---:|---|
| Base diária manual | 172 €/dia | Referência anterior, editável; inclui a recuperação pretendida de despesas e reservas, sem somar novamente o total mensal |
| Despesas e reservas mensais | 3.847,32 €/mês | Dez rubricas fornecidas pelo Luís, incluindo remuneração própria e prestação da aquisição; discriminação na secção 3.2 |
| Objetivo de lucro da empresa | 200 €/dia | Objetivo usado para sugerir preços, não garantia de lucro nem limite máximo |
| Capacidade faturável de referência | 8 horas/dia | Hipótese inicial de cálculo, editável; não significa que oito horas sejam sempre vendidas |
| Acréscimo de serviço pontual | 25 €/hora | Parcela comercial adicional nos trabalhos pequenos; não é automaticamente custo salarial ou remuneração líquida |
| Material | Custo previsto por trabalho | Acrescentado à parte; quantidade e custo devem ser editáveis |

### 1.1. Serviço completo

Exemplos: wrap completo e PPF completo.

```text
Taxa de despesas = 172 / 8 = 21,50 €/hora
Taxa de lucro pretendido = 200 / 8 = 25,00 €/hora

Preço sugerido sem IVA = horas previstas × (21,50 + 25,00) + material
                      = horas previstas × 46,50 € + material
```

Equivalente para um trabalho de oito horas: **372 € + material**.

Estes valores usam o método diário manual de 172 €. No método mensal, a base diária passa a ser o total das rubricas incluídas dividido pelos dias produtivos configurados. Os resultados serão diferentes e devem ser pré-visualizados antes de publicar; não fixar 46,50 €/hora no código.

### 1.2. Serviço pontual

Exemplos: PPF nas óticas, chrome delete, retrovisores, pilares e pequenos trabalhos.

```text
Preço sugerido sem IVA = horas previstas × (21,50 + 25,00 + 25,00) + material
                      = horas previstas × 71,50 € + material
```

### 1.3. Regras que substituem interpretações anteriores

- Não acrescentar 25 €/hora de mão de obra aos serviços completos por defeito: não faz parte da fórmula mais recente escolhida.
- Não aplicar o antigo teto de 100 €/dia de mão de obra.
- Não limitar o lucro a 200 €/dia; os 200 € são um objetivo de referência.
- Não somar os antigos 33 €/hora ou outros custos/hora históricos a estas fórmulas.
- Não cobrar 172 € de despesas completas em cada pequeno serviço: atribuir apenas a parcela proporcional.
- Os modos não são escolhidos automaticamente por ultrapassar um número de horas. Um serviço pontual pode demorar um dia; a classificação é comercial, por serviço, e pode ser alterada pelo utilizador.
- Valores de material, horas e preço final nunca devem ser inventados pela IA.

O preço sugerido é um apoio. O administrador pode escolher um preço superior ou inferior, vendo sempre o impacto.

---

## 2. Princípios de produto

1. **Configurar sem programar:** mudar valores ou composição da fórmula através da interface.
2. **Ver antes de aplicar:** mostrar fórmula legível, resultado e diferença face à configuração atual.
3. **Proteger o passado:** alterar parâmetros não modifica propostas enviadas, aprovadas ou trabalhos históricos.
4. **Separar venda e custo:** objetivo de lucro e acréscimo comercial não são custos de execução.
5. **Registar uma vez:** horas vêm do Time Book e materiais vêm do stock, com possibilidade de correção manual justificada.
6. **Manter a decisão humana:** preços e estimativas automáticos são sugestões, nunca alterações silenciosas.
7. **Funcionar sem IA:** toda a aritmética, validação e gravação são determinísticas.
8. **Interface simples:** tarefas frequentes em até três interações, além da introdução dos dados necessários.

---

## 3. Parâmetros financeiros e cálculo das despesas

### 3.1. Dois métodos de definir a base de despesas

Em `Configurações → Orçamentos e preços → Base financeira`, disponibilizar:

**Método A — Valor diário manual**, ativo inicialmente:

- Despesas diárias: 172 €.
- Capacidade faturável diária: 8 horas.
- Objetivo de lucro diário: 200 €.
- Taxas horárias calculadas automaticamente.

**Método B — Cálculo a partir das despesas mensais**, disponível como alternativa:

```text
Despesas diárias = despesas mensais atribuíveis / dias produtivos de referência no mês
Capacidade mensal = dias produtivos de referência × capacidade faturável diária
Taxa de despesas = despesas mensais atribuíveis / capacidade mensal
```

O Luís pode mudar de método. Apenas um método é ativo em cada versão; nunca somar o valor manual de 172 € ao valor calculado a partir do mês. No método mensal, o rótulo agregado é `Despesas, reservas e aquisição a recuperar`, pois a prestação ao Fábio também entra no objetivo de recuperação comercial.

Pré-carregar as rubricas da secção 3.2, mantendo o método manual anterior até o Luís escolher o método mensal e definir os dias produtivos. A entrada mensal já está preenchida, não deve ser pedida novamente.

Não inferir que as despesas mensais são 172 € × 22 dias: o número de dias não está confirmado. Com o total agora fornecido, a aplicação deve explicar a diferença entre a referência diária anterior e o valor derivado do mês. Um exemplo com 22 dias não autoriza fixar esse número por defeito.

No cálculo mensal, dividir separadamente as rubricas operacionais/reservas e a recuperação da aquisição pela capacidade mensal e somar essas duas parcelas no preço. No cálculo manual, a parcela de aquisição já se considera incluída na base agregada: não acrescentar a prestação novamente.

### 3.2. Composição e qualidade dos dados

**Base inicial fornecida pelo Luís em 3 de outubro de 2026, contando apenas com o próprio e sem um funcionário adicional:**

| Rubrica | O que inclui | Valor mensal | Tratamento no plano |
|---|---|---:|---|
| Tua remuneração e encargos | Salário bruto de referência de 920 €, contribuição patronal e provisão para subsídios de férias e Natal | 1.328,25 € | Pessoal já incluído; valor orçamentado fornecido, sem novo cálculo legal automático |
| Renda | Utilização do espaço, segundo o documento de repartição da renda | 630,74 € | Despesa recorrente |
| Água e eletricidade | Consumos do espaço; valor referido pelo Luís | 200,00 € | Despesa recorrente estimada |
| Contabilidade | Serviço mensal do contabilista; valor referido pelo Luís | 75,00 € | Despesa recorrente |
| Telefone, internet e software | Comunicações e aplicações — estimativa | 60,00 € | Despesa recorrente estimada |
| Seguros e saúde no trabalho | Provisão estimada para seguros e serviços de saúde no trabalho | 120,00 € | Previsão/provisão orçamental |
| Manutenção e ferramentas | Reserva para reparações e substituição de equipamento | 200,00 € | Reserva orçamental; não confundir automaticamente com despesa já realizada |
| Marketing | Orçamento para anúncios e divulgação | 150,00 € | Orçamento de despesa |
| Alimentação e pequenas despesas | Provisão genérica, ainda por discriminar | 250,00 € | Previsão por discriminar; não presumir tratamento fiscal |
| Prestação ao Fábio | Pagamento dos 20.000 € da aquisição em 24 meses | 833,33 € | Recuperação de caixa da aquisição, separada das despesas operacionais |
| **Total mensal a recuperar** | **Despesas, provisões/reservas e aquisição** | **3.847,32 €** | **Soma das dez rubricas; editável por alteração das linhas** |

Subtotais de referência:

- **Rubricas operacionais e reservas, sem aquisição: 3.013,99 €/mês.** É uma base orçamentada; não um total de despesas reais já verificadas.
- **Recuperação da aquisição: 833,33 €/mês.** Inicialmente incluída no cálculo comercial, como o Luís indicou.
- **Total a recuperar: 3.847,32 €/mês.** Material de cada trabalho continua separado e não está incluído neste total mensal.

Guardar como origem `Orçamento inicial — valores fornecidos pelo Luís`. Estes montantes são parâmetros do plano, não um recálculo das obrigações salariais, fiscais ou contabilísticas. Em particular, 920 € é a referência usada no orçamento inicial, não uma determinação automática de salário legal ou líquido.

**Todos os valores e rubricas devem poder ser alterados pela interface a qualquer altura.** Permitir:

- Editar nome, descrição, categoria e valor de cada linha.
- Adicionar uma nova despesa, provisão, reserva ou recuperação de caixa.
- Ligar/desligar a inclusão de cada rubrica no preço sugerido.
- Arquivar uma rubrica e indicar data de início/fim, sem apagar o histórico.
- Alterar periodicidade mensal/anual e mostrar o equivalente mensal; não interpretar zero como falta de dado.
- Registar fonte, data, autor, razão e estado `estimado`/`validado`/`por discriminar`.
- Mostrar somas e subtotais em direto. O total de 3.847,32 € é derivado das linhas, não uma segunda parcela independente.

A despesa real registada num mês não deve substituir automaticamente a previsão. Apresentar `orçamentado versus realizado` e oferecer `usar este valor nos próximos orçamentos`, com revisão explícita.

Para remuneração e encargos, guardar inicialmente o total de 1.328,25 € e a nota do salário bruto de referência de 920 €. Se existir calculadora salarial, é um módulo separado com dados validados; não reconstruir taxas e provisões a partir de suposições.

Na prestação ao Fábio, registar a referência de 20.000 € em 24 meses, sem inventar a data da primeira prestação nem o número de prestações já pagas. Os 833,33 € são arredondados: 24 prestações iguais somariam 19.999,92 €. Mostrar os 0,08 € de diferença e permitir um último pagamento ajustado, sem alterar automaticamente o acordo. A conclusão do pagamento deve permitir excluir a rubrica de uma nova versão, mantendo as anteriores.

### 3.2.1. Ecrã de gestão mensal

Em `Configurações → Orçamentos e preços → Despesas e reservas`, mostrar uma tabela simples com nome, valor mensal, tipo, inclusão e botão de edição. Edição em linha ou painel lateral, sem obrigar a programar.

No topo, apresentar três cartões: `Operação e reservas`, `Aquisição a recuperar` e `Total mensal`. Por baixo, mostrar dias produtivos, capacidade faturável e taxas derivadas, com comparação `antes → depois`.

Ao guardar, perguntar pelo âmbito dentro da própria ação: `Guardar rascunho` ou `Aplicar aos próximos orçamentos a partir de [data]`. Aplicar alterações não reescreve propostas enviadas/aprovadas. Custos mensais e remuneração própria continuam visíveis apenas a perfis autorizados.

### 3.2.2. Conversão do total mensal — exemplos, não dias impostos

```text
O = soma mensal das rubricas operacionais e reservas incluídas
C = soma mensal das rubricas de recuperação de caixa incluídas
D = dias produtivos configurados no mês de referência
H = capacidade faturável em horas-pessoa por dia
L = objetivo de lucro diário, inicialmente 200 €
A = acréscimo pontual por hora, inicialmente 25 €

Taxa operacional/reservas = O / (D × H)
Taxa de recuperação de caixa = C / (D × H)
Base diária agregada = (O + C) / D
Tarifa de serviço completo = (O + C) / (D × H) + L / H
Tarifa de serviço pontual = tarifa de serviço completo + A
```

Com O = 3.013,99 €, C = 833,33 €, H = 8, L = 200 € e A = 25 €:

| Dias produtivos, apenas para comparação | Base diária agregada | Tarifa completo | Tarifa pontual |
|---|---:|---:|---:|
| 20 | 192,37 € | 49,05 €/hora | 74,05 €/hora |
| 22 | 174,88 € | 46,86 €/hora | 71,86 €/hora |
| 24 | 160,31 € | 45,04 €/hora | 70,04 €/hora |

Valores exibidos arredondados; conservar a precisão de cálculo até ao arredondamento final da proposta. Não obter a tarifa a partir da base diária já arredondada.

Para 22 dias, a diferença face à referência manual de 172 €/dia é aproximadamente **+2,88 €/dia**. A aplicação mostra esta diferença e só muda de método por decisão do Luís. Na parametrização de dias, disponibilizar valor manual ou sugestão a partir do calendário de trabalho; feriados, sábados e ausências só alteram a versão mediante revisão explícita.

### 3.3. Evitar dupla contagem de pessoal

Cada categoria deve indicar se já inclui custos de pessoal. Um custo de técnico adicional só entra no custo do trabalho quando não estiver já coberto pela parcela de despesas usada.

A rubrica de 1.328,25 €/mês já contém a remuneração e encargos do Luís na base inicial. Não voltar a somar este montante nem tratar os 25 €/hora do serviço pontual como outro custo salarial. A contratação futura de um funcionário exige uma nova rubrica de pessoal e revisão da capacidade; não está incluída nesta listagem inicial.

O acréscimo de 25 €/hora no serviço pontual é uma parcela do preço de venda. Não o subtrair como custo de pessoal para calcular rentabilidade.

### 3.4. Capacidade real e múltiplos colaboradores

- As oito horas são capacidade faturável de referência da unidade de negócio, não uma promessa de ocupação diária.
- A interface deve perguntar claramente: `Quantas horas de trabalho técnico esperas faturar por dia, no total?`.
- Na configuração inicial de uma capacidade de referência de oito horas, um dia equivalente de produção corresponde a oito horas técnicas atribuídas aos trabalhos.
- Com mais colaboradores, o Luís revê a capacidade total. Não multiplicar automaticamente os 172 € pelo número de técnicos, boxes ou viaturas.
- Guardar separadamente duração de calendário e horas-pessoa. Dois técnicos durante três horas correspondem a seis horas-pessoa, não três.
- O Time Book deve indicar qual das medidas forneceu e evitar nova multiplicação se já devolveu horas-pessoa.
- Usar inicialmente horas-pessoa para `horas previstas` no motor. A capacidade configurada deve utilizar essa mesma unidade.
- Exemplificação: se a capacidade total for explicitamente alterada para 16 horas-pessoa/dia, a taxa de despesas será 172/16; não continuar a aplicar 172/8 a cada colaborador por omissão.
- Tempo de cura ou espera sem intervenção não é automaticamente mão de obra. Ocupação de box pode originar uma componente própria, se ativada pelo administrador.
- Não arredondar cada pequeno trabalho para um dia inteiro. Calcular dias equivalentes como horas/capacidade.

O painel deve mostrar `despesas recuperadas nos trabalhos` e `despesas por recuperar`, sem apresentar a soma dos lucros pretendidos como lucro realizado.

---

## 4. Fórmulas editáveis: simples primeiro, flexíveis sempre

### 4.1. Editor normal, sem código

Em `Configurações → Orçamentos e preços → Fórmulas`, mostrar dois cartões iniciais:

- **Serviço completo** — Despesas + objetivo de lucro + material.
- **Serviço pontual** — Despesas + objetivo de lucro + acréscimo horário + material.

Cada cartão permite:

- Alterar nome e descrição.
- Alterar valores em euros, horas ou percentagens, com unidade explícita.
- Ligar/desligar componentes.
- Adicionar uma componente a partir de uma lista.
- Duplicar uma fórmula para criar uma variante.
- Associar serviços e perfis de cliente.
- Definir início de vigência.
- Guardar como rascunho, testar, publicar ou arquivar.

Componentes suportadas na primeira versão:

| Tipo | Cálculo | Exemplo |
|---|---|---|
| Despesas atribuídas | Horas × taxa de despesas | 3 × 21,50 € |
| Recuperação de caixa | Horas × taxa de aquisição/caixa | Prestação ao Fábio repartida pela capacidade; separada no método mensal e não duplicada no manual |
| Objetivo de lucro | Horas × taxa de lucro | 3 × 25 € |
| Acréscimo por hora | Horas × tarifa configurada | 3 × 25 € |
| Montante fixo | Valor em euros por serviço | Deslocação ou preparação adicional |
| Material | Soma das linhas de material | Vinil, PPF e consumíveis |
| Acréscimo sobre material | Custo de material × percentagem | Opcional; inicialmente 0% |
| Acréscimo percentual | Base identificada × percentagem | Risco ou complexidade |

Por defeito, apenas as componentes das fórmulas da secção 1 estão ligadas. Acréscimos de risco, deslocação e margem de material não são ativados sem decisão do administrador.

Permitir escolher explicitamente a base de cada percentagem: `material`, `parcela de serviço` ou `subtotal antes de acréscimos percentuais`. Não deixar percentagens incidirem circularmente umas sobre as outras.

Se a desmontagem já estiver nas horas previstas, não cobrar automaticamente um suplemento de desmontagem. Um eventual suplemento representa uma decisão comercial explícita e identificada.

### 4.2. Pré-visualização em direto

Ao lado do editor, incluir um orçamento de teste com:

- Serviço, horas e material.
- Composição em euros.
- Preço sugerido antes de IVA.
- Taxas derivadas e fórmula escrita em linguagem legível.
- Resultado anterior, novo resultado e diferença.

Exemplo de texto:

> `3 horas × (21,50 € de despesas + 25,00 € de objetivo + 25,00 € de acréscimo) + 50,00 € de material = 264,50 € antes de IVA.`

### 4.3. Fórmulas avançadas, sem execução arbitrária

O editor normal deve satisfazer a necessidade de mudar a fórmula, não apenas as constantes. Um editor textual avançado é opcional numa fase posterior; não deve atrasar a primeira versão.

Representar a fórmula como componentes estruturadas e versionadas. Se houver expressões avançadas, usar uma linguagem limitada com variáveis autorizadas e validação de unidades; nunca usar `eval`, `new Function`, JavaScript ou SQL introduzido pelo utilizador.

Bloquear divisões por zero, referências inexistentes, ciclos, valores não finitos e totais negativos. Guardar a ordem de cálculo para que o resultado seja reproduzível.

---

## 5. Interface de criação do orçamento

### 5.1. Fluxo principal

1. Escolher cliente, viatura e serviço.
2. Confirmar horas e material; o sistema sugere a fórmula associada.
3. Rever preço sugerido, escolher preço final e guardar ou enviar.

Não exigir que o Luís conheça termos como AST, markup ou custo de absorção.

### 5.2. Conteúdo do ecrã

**Área de trabalho:**

- Viatura e cliente.
- Serviços/painéis e modo `Completo` / `Pontual`.
- Horas totais e detalhe por fase.
- Materiais, consumíveis e quantidades.
- Origem da estimativa: Time Book, referência inicial ou manual.
- Botão `Ajustar fórmula neste orçamento`.

**Resumo fixo, visível sem procurar:**

| Informação | Comportamento |
|---|---|
| Preço sugerido | Calculado; não substitui automaticamente um preço manual |
| Preço final sem IVA | Campo monetário editável |
| Diferença face à sugestão | Valor em euros e percentagem |
| Material previsto | Custo interno resumido |
| Despesas atribuídas | Parcela prevista de recuperação |
| Aquisição e reservas a recuperar | Discriminação da base mensal, quando usada; não apresentar como lucro ou material |
| Objetivo incluído | Separado do custo |
| Resultado previsto | Com indicação da qualidade dos dados |
| IVA e total | Calculados depois da decisão do preço |

O detalhe da fórmula abre num painel lateral ou expansão, mantendo o ecrã principal minimalista.

### 5.3. Alterar valores em dois níveis

**Só neste orçamento:** ajustar horas, custo estimado, componentes, modo ou preço final. Guardar como exceção local sem alterar a fórmula global.

**Para próximos orçamentos:** abrir as configurações e criar uma nova versão da fórmula. Mostrar explicitamente que orçamentos existentes não serão recalculados.

O botão `Restaurar sugestão` é sempre explícito. Depois de escolhido um preço manual, alterações de horas ou material atualizam a sugestão e os avisos, mas mantêm o preço manual até o utilizador decidir.

### 5.4. Descontos, suplementos e preço fechado

Usar um modo de ajuste final de cada vez:

- Preço final manual.
- Desconto percentual sobre o preço sugerido.
- Ajuste em euros, positivo ou negativo.

Não aplicar um desconto novamente sobre um preço manual que já inclui esse desconto. Guardar a forma de ajuste e a razão. Inicialmente, o desconto incide sobre o total antes de IVA; qualquer desconto apenas em determinadas linhas deve ser uma opção explícita, não um comportamento escondido.

Prever notas rápidas como `Cliente B2B`, `Preço comercial`, `Complexidade adicional`, `Desconto autorizado` ou texto livre.

O preço de fórmula é uma referência; não o rotular como preço mínimo de custo. O custo mínimo só pode ser mostrado quando os dados de custos forem suficientes.

### 5.5. Identidade visual

- Português europeu; euros com vírgula decimal; numerais tabulares.
- Fundo `#050606`, superfícies `#101314` e `#15191A`.
- Texto marfim `#F1EDE5`; dourado `#D3A548` apenas para seleção, ação e destaque.
- Reutilizar o logótipo fino entrelaçado X-Flow e os componentes existentes.
- Glassmorphism subtil apenas no resumo/painéis, mantendo contraste e legibilidade.
- Labels visíveis, navegação por teclado, foco visível e mensagens de validação claras.
- Sem sliders para valores financeiros importantes; usar campos numéricos precisos.
- Desktop: formulário e resumo lado a lado. Mobile: resumo compacto e painel de detalhe acessível.
- Validar em 1440, 1024, 768 e 390 px.
- Incluir estados de carregamento, falta de configuração, erro, ausência de histórico e gravação concluída.

---

## 6. Materiais e Time Book

### 6.1. Materiais

Cada linha deve guardar material/referência, unidade, quantidade, custo unitário, origem do custo e data.

Unidades suportadas: metro linear, metro quadrado, unidade e pacote. Registar largura do rolo quando necessário. Não somar metros lineares e metros quadrados sem conversão explícita.

```text
Se a quantidade é líquida:
    quantidade a reservar = quantidade líquida × (1 + desperdício previsto)
Se a quantidade já inclui desperdício:
    quantidade a reservar = quantidade introduzida

Custo previsto de material = soma(quantidade a consumir × custo unitário)
Valor de material no preço = custo previsto + acréscimo comercial de material, se ativado
```

- Desperdício inicial: não impor uma percentagem inventada; exigir confirmação ou usar um valor configurado identificado.
- Stock sugere custo e disponibilidade; o orçamento não deve dar baixa no stock.
- Após aprovação, reservar; após execução, registar consumo efetivo.
- Retalhos podem reduzir a necessidade de compra, mas não devem passar automaticamente a custo zero.
- Permitir edição manual com motivo, para materiais ainda não registados ou preços de fornecedor por confirmar.
- Guardar o custo aplicado no snapshot: mudanças futuras no stock não reescrevem o orçamento.
- Normalizar os custos para uma base coerente; a recuperação ou não do IVA de compra depende da configuração financeira validada, não de uma suposição do simulador.

### 6.2. Time Book

Separar preparação, desmontagem, lavagem/descontaminação, corte, aplicação, montagem, QC e retrabalho.

- Mostrar tempo sugerido por serviço/modelo/painel, número de amostras e confiança.
- Distinguir `tempo real`, `estimativa` e `benchmark`.
- Sem histórico suficiente, aceitar estimativa manual assinalada; não inventar precisão.
- Não contar duas vezes limpeza ou desmontagem presentes num benchmark total.
- Exibir horas-pessoa e duração de calendário separadamente.
- Uma correção manual de horas não altera automaticamente os benchmarks.
- Orçamento aprovado fornece os tempos planeados à ordem de trabalho; registos posteriores alimentam a comparação previsto/real.
- Melhorias futuras do Time Book nunca recalculam silenciosamente propostas já enviadas.

---

## 7. Custo, preço e resultado: nomes que não confundem

Manter separadas três coisas:

1. **Preço sugerido:** resultado da fórmula comercial.
2. **Preço final:** valor efetivamente escolhido antes de IVA.
3. **Custo previsto/real:** material, despesas de execução atribuídas e custos adicionais não contabilizados noutra parcela. Reservas e recuperação da aquisição mantêm identificação própria e não são automaticamente despesa real.

```text
Resultado operacional indicativo após custos atribuídos =
    preço final sem IVA
    − material previsto
    − despesas operacionais atribuídas
    − custos adicionais não incluídos na base

Margem prevista após custos atribuídos (%) =
    resultado operacional indicativo / preço final sem IVA × 100

Saldo previsto após recuperar o orçamento de operação, reservas e aquisição =
    preço final sem IVA
    − material previsto
    − base orçamental agregada atribuída ao trabalho
    − custos adicionais não incluídos nessa base
```

O objetivo de lucro e o acréscimo comercial não entram como custo nesta subtração. Não duplicar salários que já estejam na base de despesas.

As linhas mensais agora fornecidas permitem mostrar o plano de recuperação comercial discriminado. Como incluem estimativas, provisões e reservas, não as converter integralmente em despesas reais. Só calcular o indicador operacional separado quando a classificação e os custos forem suficientes; caso contrário mostrar `resultado indicativo — custos por validar`.

No método manual de 172 €, mostrar o saldo após a base agregada, sem inventar uma repartição entre operação, reservas e aquisição. No método mensal, mostrar as parcelas individualmente. Não subtrair a prestação ao Fábio duas vezes, nem chamar ao saldo depois da aquisição `lucro líquido`.

Mesmo com custos de operação validados, este resultado atribuído ao trabalho não é automaticamente o lucro líquido da empresa depois de impostos, financiamento e períodos sem ocupação.

No fim do trabalho, calcular novamente com horas e material reais, preservando o orçamento original. Destacar desperdício, retrabalho e horas excedidas.

### Alertas úteis

- Preço abaixo do custo previsto, se o custo estiver completo.
- Preço abaixo da sugestão, sem bloquear a decisão comercial por defeito.
- Baixa confiança nas horas.
- Material sem custo ou unidade válida.
- Despesas de pessoal possivelmente duplicadas.
- Orçamento de serviço pontual muito diferente do completo para as mesmas horas: mostrar a diferença, não mudar o modo automaticamente.
- Capacidade faturável configurada superior à capacidade planeada.

---

## 8. Versionamento e proteção dos orçamentos

### 8.1. Configurações

- Cada alteração publicada cria uma versão imutável com autor, data e vigência.
- Repor uma versão anterior cria uma nova versão; não apaga o histórico.
- Fórmula e base financeira usadas são identificadas em cada cálculo.
- Não permitir duas versões globais ativas para o mesmo contexto e instante.
- Arquivar fórmulas usadas; não apagá-las fisicamente.

### 8.2. Propostas

- **Novo orçamento:** usa a versão ativa nesse momento.
- **Rascunho:** guarda a versão usada; pode receber nova configuração através de `Atualizar cálculo`, com pré-visualização e confirmação.
- **Enviado ou visualizado:** não se altera silenciosamente; uma alteração gera nova revisão, novo envio e invalidação explícita da revisão substituída.
- **Aprovado:** preço, opção, parâmetros, quantidades e fórmula são imutáveis. Trabalho adicional exige aditamento ou novo orçamento.
- **Recusado/expirado:** manter histórico; duplicação cria nova proposta com nova versão de preços assinalada.

Se o cliente tiver o link de uma revisão substituída, mostrar que não é a versão válida e impedir aprovação da revisão antiga. Não reutilizar um token para mostrar um preço diferente sem identificar a revisão.

Para cada opção — essencial, recomendada ou premium — manter snapshot próprio. As alternativas não são somadas entre si.

---

## 9. Modelo de dados proposto

Reutilizar as entidades existentes quando possível. Os nomes abaixo são uma proposta, não uma obrigação de recriar todo o módulo.

| Entidade | Dados essenciais |
|---|---|
| `pricing_policies` | Organização, método de despesas, capacidade/dia, despesas/dia ou mês, dias de referência, objetivo/dia, versão, vigência, estado |
| `pricing_expense_items` | Identidade, organização, nome/descrição, categoria, valor, periodicidade, equivalente mensal, inclusão, pessoal incluído, classificação despesa/provisão/reserva/caixa, fonte, validação, vigência e versão |
| `pricing_formulas` | Organização, nome, código `complete`/`spot`/custom, identidade estável |
| `pricing_formula_versions` | Componentes e ordem de cálculo, regras, versão, publicação, autor, estado e vigência |
| `service_pricing_rules` | Serviço, fórmula sugerida, exceções de perfil/cliente, vigência |
| `quote_pricing_snapshots` | Opção/revisão, política, fórmula, parâmetros resolvidos, horas, material, subtotais, ajuste, preço final e resultado indicativo |
| `pricing_audit_events` | Autor, ação, antes/depois, motivo, data, organização, alvo e versão |

Requisitos transversais:

- `organization_id` obrigatório e isolamento efetivo no servidor e na base de dados.
- Valores monetários em cêntimos ou decimal exato; não usar floats binários como fonte de verdade.
- Taxas derivadas com precisão suficiente; arredondar para cêntimos nos limites de linha/total definidos e testados.
- Guardar inputs e outputs do cálculo, não apenas a referência à fórmula.
- `schema_version` no snapshot para suportar evolução do motor.
- Concorrência otimista por versão: se dois administradores alterarem uma fórmula, não perder uma edição silenciosamente.
- Índices por organização, estado, vigência, orçamento e opção.
- Sem edição direta do snapshot de uma proposta enviada/aprovada.

**Snapshot mínimo por opção:**

```text
Organização + orçamento + revisão + opção
Versão da política financeira + versão da fórmula
Capacidade e taxas usadas
Rubricas mensais incluídas, valores, versão, dias produtivos e subtotais operação/reservas/aquisição
Horas por fase e fonte das estimativas
Materiais, quantidades, unidades, desperdício e custos usados
Componentes comerciais ligadas/desligadas
Preço sugerido + modo de ajuste + preço final
IVA aplicado + total
Custos previstos + qualidade dos dados + resultado indicativo
Autor + data + motivo de exceções
```

---

## 10. Adaptação ao repositório existente

Foram consultados em leitura, em 3 de outubro de 2026, os seguintes ficheiros de `Zurcluis/x_flow`:

- `src/domains/quotes/pricing-engine.ts`
- `src/domains/quotes/types.ts`
- `src/app/actions/quotes.ts`
- `src/server/quotes.ts`

### Observações relevantes para a implementação

1. O motor atual contém referências fixas de custo/hora e IVA e constrói preços a partir de peças/multiplicadores. Introduzir um caminho novo para as fórmulas configuráveis; não substituir constantes globalmente sem analisar os consumidores.
2. `QuoteOption` já separa preço, horas, custo e margem. Estender com snapshots/revisões ou relações próprias, sem deixar de suportar propostas antigas.
3. A ação de criação recebe opções com valores financeiros. O servidor deve passar a recalcular e validar esses valores a partir de inputs autorizados; não confiar nos totais enviados pelo browser.
4. A criação atual grava a proposta como enviada. Separar `Guardar rascunho` de `Enviar`, preservando o fluxo de utilização existente.
5. A aprovação e a atualização de opção selecionada devem acontecer na mesma transação. Validar que a opção pertence ao orçamento e que o orçamento pertence à organização/token correto.
6. Os tempos planeados da ordem de trabalho devem vir da opção efetivamente aprovada, não de horas genéricas fixas. Não inventar fases de longa duração para um serviço pequeno.
7. As consultas públicas precisam de um DTO próprio, com apenas campos destinados ao cliente. Não devolver o objeto interno completo e esconder custos apenas na interface.

Antes de desenvolver, o agente deve voltar a ler o estado atual, `AGENTS.md` e regras aplicáveis, identificar os componentes de criação/detalhe/portal e verificar migrations e testes. Os ficheiros podem evoluir depois desta consulta.

### Organização sugerida, sem duplicar arquitetura

- Evoluir `src/domains/quotes/pricing-engine.ts` ou extrair um domínio de preços partilhado.
- Criar tipos de política, componentes, resultados e snapshots.
- Introduzir repositório e ações de configurações de preços, com autorização.
- Reutilizar componentes de formulário, resumo, moeda e modal da aplicação.
- Criar área `Configurações → Orçamentos e preços`.
- Acrescentar migrations incrementais à sequência existente; nunca editar migrations já aplicadas.
- Fazer simulador, orçamento, relatórios e produção consumir a mesma fonte de preços quando aplicável. Não manter fórmulas concorrentes escondidas.

Compatibilidade:

- Propostas existentes preservam valores e são identificadas como `cálculo anterior`, sem recalcular retroativamente.
- Não usar um custo/hora antigo para preencher custos em falta nas propostas novas.
- Falta de configuração ativa deve gerar uma mensagem de configuração, não uma taxa escondida.
- Nenhuma implementação desta funcionalidade pode apagar dados ou executar seeds de demonstração sobre uma base real.

---

## 11. Segurança, IVA e limites de autoridade

- Administrador: configura, publica fórmulas e autoriza exceções.
- Comercial/gestor autorizado: cria orçamentos e ajusta o preço conforme permissões.
- Técnico: consulta instruções, horas e material, sem receber margens ou configurações financeiras no payload.
- Cliente/B2B: consulta apenas a sua proposta comercial e documentos autorizados.
- IA: pode explicar uma composição devolvida pelo motor; não publica configurações nem altera preços sem confirmação autenticada.

Auditar mudanças de fórmula, parâmetros, preço, versão, envio e aprovação.

IVA deve ser calculado depois do preço final/ajustes antes de imposto. A taxa é configurável por contexto fiscal validado, não uma taxa universal inventada pelo motor. Preservar a taxa efetivamente aplicada no snapshot; o objetivo de lucro nunca inclui IVA cobrado como receita própria.

Validações no servidor: finitude, limites, unidades, organização, permissão, versão, estado da proposta, pertença de opção e integridade dos cálculos.

Não publicar, fazer push, abrir PR, alterar produção ou correr migrations numa base real sem a autorização aplicável do Luís. Este documento não concede essa autorização.

---

## 12. Exemplos e testes de aceitação

Os exemplos 12.1 a 12.3 usam a referência diária manual anterior de 172 €, um recurso de referência, valores sem IVA e materiais já incluindo o consumo previsto. Os exemplos 12.5 validam a nova listagem mensal. Não constituem recomendações de preço de mercado.

### 12.1. Cálculo inicial

| Caso | Modo | Horas | Material | Despesas atribuídas | Objetivo | Acréscimo pontual | Preço sugerido |
|---|---|---:|---:|---:|---:|---:|---:|
| Dia completo | Completo | 8 | 0 € | 172 € | 200 € | 0 € | 372 € |
| Wrap de 4 dias equivalentes | Completo | 32 | 400 € | 688 € | 800 € | 0 € | 1.888 € |
| PPF de 5 dias equivalentes | Completo | 40 | 1.000 € | 860 € | 1.000 € | 0 € | 2.860 € |
| Óticas | Pontual | 1 | 50 € | 21,50 € | 25 € | 25 € | 121,50 € |
| Chrome delete | Pontual | 3 | 50 € | 64,50 € | 75 € | 75 € | 264,50 € |
| Pontual de 8 horas | Pontual | 8 | 0 € | 172 € | 200 € | 200 € | 572 € |

**Preço manual:** no exemplo das óticas, escolher 180 € antes de IVA mantém o preço sugerido de 121,50 € e regista um ajuste de +58,50 €. A diferença não é um erro nem deve ser corrigida automaticamente.

### 12.2. Configuração dinâmica

- Mudar despesas diárias para 200 €, mantendo objetivo 200 € e capacidade 8: completo = 50 €/hora; pontual = 75 €/hora.
- Mudar apenas objetivo para 240 €, mantendo despesas 172 € e capacidade 8: completo = 51,50 €/hora; pontual = 76,50 €/hora.
- Mudar apenas capacidade para 6, mantendo despesas 172 € e objetivo 200 €: completo = 62 €/hora; pontual = 87 €/hora.
- Mudar apenas acréscimo pontual para 30 €: completo continua 46,50 €/hora; pontual passa a 76,50 €/hora.
- Desligar acréscimo pontual torna os dois modos iguais nesta configuração; a pré-visualização deve mostrar isso.

Cada mudança cria uma versão; nenhuma altera propostas enviadas ou aprovadas.

### 12.3. Recuperação diária sem duplicação

- Três trabalhos pontuais de uma hora mais um completo de cinco horas somam oito horas.
- Despesas atribuídas: 3 × 21,50 + 5 × 21,50 = **172 €**, não 4 × 172 €.
- Objetivo distribuído: **200 €**.
- Acréscimo dos pontuais: **75 €**.
- Soma dos preços sugeridos antes de material/IVA: **447 €**.
- Se só forem faturadas seis horas com a capacidade de referência de oito, recuperar apenas **129 €** de despesas; o painel mostra **43 €** por recuperar, sem prometer lucro diário atingido.

### 12.4. Testes obrigatórios

- Fórmulas completas/pontuais; valores decimais e trabalho de vários dias.
- Horas negativas, capacidade zero, números não finitos, taxas inválidas e unidades incompatíveis.
- Material líquido versus quantidade com desperdício; conversão explícita de unidades.
- Soma exata das dez rubricas mensais; equivalentes anuais/mensais; zero, inclusão/exclusão e alteração com nova vigência.
- Remuneração própria já incluída; não adicionar funcionário por omissão.
- Prestação de aquisição contabilizada uma vez no preço; reservas não convertidas silenciosamente em custos reais.
- Sem dupla contagem de fases, colaboradores, salários ou despesas.
- Componentes percentuais sem ciclos; ordem de arredondamento reproduzível.
- Preço manual mantido após atualizar horas ou material; restauração explícita funciona.
- Ajuste/IVA aplicado uma vez; preço antes de IVA separado do total.
- Custos incompletos não produzem lucro líquido ou margem validada.
- Configuração nova não altera snapshots históricos.
- Revisão enviada antiga não pode ser aprovada depois de substituída.
- Opção aprovada pertence à proposta; aprovação e opção em transação única; ordem idempotente.
- Horas da opção aprovada chegam à produção sem serem substituídas por defaults fixos.
- Isolamento entre organizações; técnicos e portal público não recebem custos, margens ou snapshots internos.
- Concorrência na edição de fórmulas; auditoria e reposição de versão.
- Propostas antigas continuam acessíveis com valores intactos.
- Verificação visual e funcional em desktop/mobile, teclado, foco e mensagens de erro.

### 12.5. Rubricas mensais e alterações futuras

- Os valores mensais somam exatamente **3.847,32 €**; sem a prestação, **3.013,99 €**.
- Com 22 dias configurados e 8 horas/dia, base diária exata = 3.847,32/22; mostrar **174,88 €**, sem substituir o valor de cálculo por este arredondamento.
- Um completo de 8 horas, sem material, dá **374,88 €**; um pontual de 8 horas dá **574,88 €**, no exemplo de 22 dias.
- Um wrap de 32 horas com 400 € de material dá **1.899,51 €** nesse método; se o motor multiplicar a tarifa exibida de 46,86 € em vez da taxa exata, dará um resultado diferente e o teste deve detetar isso.
- Mudar apenas renda de 630,74 € para 700 € atualiza o total para **3.916,58 €**. O método mensal recalcula; o método diário manual mantém 172 € até decisão explícita.
- Excluir a prestação ao Fábio reduz a base mensal a **3.013,99 €**, sem alterar o objetivo de 200 €/dia ou o acréscimo de 25 €/hora.
- Alterar o total de remuneração não altera automaticamente o salário bruto de referência ou vice-versa; mostrar que a composição necessita de revisão se esses campos divergirem.
- Adicionar um funcionário cria nova despesa e nova versão; não duplicar o custo do Luís nem alterar a capacidade silenciosamente.
- Uma revisão de qualquer rubrica não muda propostas já enviadas/aprovadas; snapshots continuam com os valores anteriores.
- Os custos mensais não aparecem no portal do cliente nem no payload do técnico.

---

## 13. Sequência de implementação

### Fase 0 — Diagnóstico e contrato do cálculo

- Ler instruções e código atual.
- Mapear cálculo, persistência, portal, aprovação, produção e consumidores financeiros.
- Confirmar unidade de tempo e tratamento de custos/pessoal.
- Documentar pontos a preservar e dados ainda por confirmar.
- Definir tipos, regras de arredondamento e testes dos exemplos da secção 12.

**Entrega:** plano técnico localizado, sem alterações externas não autorizadas.

### Fase 1 — Motor e configurações versionadas

- Criar migrations incrementais e repositório de políticas/fórmulas.
- Pré-carregar as dez rubricas mensais da secção 3.2, total de 3.847,32 €, remuneração própria incluída e aquisição separada; não executar esse carregamento sobre dados reais já configurados sem revisão.
- Preservar a referência manual 172/200/8/25 até o Luís escolher o método mensal e os dias produtivos. Identificar os valores mensais como fornecidos/estimados, sem inventar dias ou validar automaticamente custos reais.
- Implementar componentes de cálculo, validação e snapshots.
- Implementar edição, teste, publicação e histórico das fórmulas.

**Critério:** alterar valores e componentes pela interface muda imediatamente a pré-visualização e os novos cálculos, sem modificar código.

### Fase 2 — Orçamento flexível

- Integrar modo sugerido por serviço, horas, materiais e resumo.
- Permitir exceção local e preço final manual.
- Separar rascunho de envio; guardar snapshot por opção.
- Recalcular no servidor e mostrar impacto das alterações.

**Critério:** o Luís consegue criar os exemplos da secção 12, ajustar o preço e recuperar a proposta exatamente como ficou guardada.

### Fase 3 — Portal e aprovação segura

- DTO público sem dados internos.
- Revisões e invalidação de aprovações antigas.
- Aprovação transacional da opção correta, com criação idempotente da ordem de trabalho.
- Manter compatibilidade com propostas antigas.

**Critério:** o cliente vê o preço certo; a produção recebe a opção, horas e materiais efetivamente aprovados.

### Fase 4 — Time Book, stock e resultado

- Ligar estimativas com confiança e consumo de material.
- Comparar previsto/real e mostrar recuperação das despesas.
- Mostrar resultado indicativo ou validado de acordo com a qualidade dos dados.
- Eliminar divergências de fórmula entre simulador/orçamento/relatórios.

**Critério:** preço final é preservado; consumo e tempos reais alteram a análise, não o contrato aprovado.

### Fase posterior, opcional

- Editor avançado limitado, se o editor de componentes não satisfizer a necessidade.
- Exceções B2B mais sofisticadas, simulação de capacidade e recomendações de preço baseadas em histórico.
- Não automatizar decisões de preço ou mudanças de fórmula através de IA nesta primeira entrega.

### Definition of Done

- Testes de negócio, integração, permissões e regressão passam.
- Executar `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build` conforme instruções do projeto; reportar falhas ou limitações sem afirmar sucesso não verificado.
- Validar visualmente desktop/mobile e fluxos de erro.
- Nenhum segredo, dado real de cliente ou custo interno exposto no portal.
- Sem perda de propostas existentes ou recálculo retroativo.
- Walkthrough com exemplos, mudanças de configuração e preço manual.
- Entrega inclui mudanças efetuadas, verificações realizadas, limitações e qualquer publicação/migration que ainda exija autorização.

---

## 14. Prompt de arranque para o AntiGravity

Copiar o texto abaixo e anexar este documento ao agente:

```text
Quero implementar no X-Flow o sistema de orçamentos flexíveis descrito no ficheiro
X-Flow_Plano_Orcamentos_Flexiveis_AntiGravity.md.

O documento é a referência para esta funcionalidade e substitui as fórmulas
comerciais antigas que entrarem em conflito com este modelo, sem reescrever
orçamentos históricos.

Começa por ler AGENTS.md, as regras aplicáveis e o módulo de orçamentos existente.
Analisa motor de preços, tipos, formulários, persistência, portal e aprovação.
Não recries a aplicação nem introduzas outro motor de preços paralelo.

Modelo inicial:
- Pré-carrega as dez despesas/reservas mensais da secção 3.2: total 3.847,32 €,
  dos quais 833,33 € são prestação ao Fábio e 3.013,99 € são operação/reservas.
- A remuneração própria e encargos de 1.328,25 € já estão incluídos.
- Todas as rubricas e valores são editáveis, com histórico e aplicação futura.
- Preserva a opção manual de 172 €/dia. Oferece método mensal calculado a partir
  das rubricas incluídas e dos dias produtivos configurados; não fixes 22 dias.
- Objetivo de lucro: 200 €/dia, sem teto ao lucro final.
- Capacidade faturável de referência: 8 horas-pessoa/dia, editável.
- Serviço completo: horas × ((172 + 200) / 8) + material.
- Serviço pontual: horas × (((172 + 200) / 8) + 25) + material.
- Estas duas expressões usam o método manual. No mensal, substitui 172 pela
  soma mensal incluída dividida pelos dias produtivos; separa operação/reservas
  e recuperação da aquisição internamente, sem adicionar a prestação duas vezes.
- Não acrescentar outra parcela de 25 €/hora nos completos por defeito.
- Não usar teto de 100 €/dia nem somar os antigos 33 €/hora.

Preciso de mudar facilmente valores E componentes das fórmulas na interface,
sem programar: adicionar/desligar componentes, duplicar fórmulas, testar e
publicar novas versões. Quero preço sugerido e preço final manual separados.
Após um ajuste manual, não sobrescrevas o preço final ao alterar horas/material.

Preserva snapshots e versões; alterações globais não mudam propostas enviadas
ou aprovadas. Recalcula no servidor. Custos e margens nunca vão para o payload
público. Mantém preço, custo, objetivo de lucro e acréscimo comercial separados.
Usa a composição mensal fornecida nesta versão; não inventes encargos salariais,
datas da aquisição, despesas reais, dias produtivos ou tratamento contabilístico.

Liga ao Time Book e stock, reutilizando o que existe. Preserva pt-PT, design
preto/dourado/marfim, simplicidade e responsividade. A funcionalidade deve
funcionar sem IA e sem fórmulas JavaScript executáveis introduzidas pelo utilizador.

Apresenta primeiro os ficheiros a alterar, migrations, riscos e sequência de
implementação. Faz a implementação local conforme a minha autorização e valida
os exemplos e testes do documento. Não faças commit, push, PR, publicação ou
migration em produção sem eu autorizar especificamente.
```

---

## 15. Checklist de validação com o Luís

Estes pontos não impedem a construção do motor configurável, mas devem ficar visíveis antes de usar as margens como dados validados:

- [x] Listagem inicial mensal fornecida pelo Luís: dez rubricas, total 3.847,32 €.
- [x] Remuneração própria e encargos incluídos: 1.328,25 €/mês; sem funcionário adicional.
- [x] Prestação ao Fábio identificada separadamente: 833,33 €/mês, incluída na recuperação comercial inicial.
- [ ] Método ativo a escolher: manter 172 €/dia manual ou calcular pela listagem mensal.
- [ ] Dias produtivos de referência, data inicial e calendário da prestação ao Fábio.
- [ ] Validação dos custos efetivos e discriminação das provisões/reservas, incluindo pequenas despesas.
- [ ] Capacidade faturável real: oito horas no total ou outra referência.
- [ ] Medida de tempo usada pelo Time Book em trabalhos com duas pessoas.
- [ ] Serviços classificados inicialmente como completos/pontuais e exceções.
- [ ] Política de desperdício, unidades e atualização do custo dos materiais.
- [ ] Permissões para mudar preço e autorizar exceções.
- [ ] Contexto fiscal, taxa de IVA e base coerente de custos de compra.

**Resultado pretendido:** o X-Flow sugere uma composição transparente e consistente; o Luís decide o preço, muda as fórmulas quando necessário e acompanha o resultado real sem perder o histórico.

### Histórico deste documento

- **1.0:** modelo completo/pontual, editor de fórmulas, preço final livre e implementação faseada.
- **1.1:** dez rubricas mensais fornecidas, total de 3.847,32 €, gestão editável, remuneração própria sem duplicação, aquisição/reservas discriminadas, conversão por dias configuráveis e novos testes.
- **1.2:** especificação dos quatro ecrãs iniciais, alterações rápidas, comportamento dos botões e walkthrough de aceitação com exemplos concretos.

---

## 16. Especificação dos primeiros ecrãs

Estas indicações completam as regras anteriores; não criam um terceiro modelo de preço. Reutilizar o módulo de orçamentos existente e acrescentar apenas a configuração necessária.

### 16.1. Ecrã A — Despesas e reservas

**Entrada:** `Configurações → Orçamentos e preços → Despesas e reservas`.

**Objetivo:** o Luís deve conseguir alterar uma renda, acrescentar uma despesa ou retirar uma prestação em menos de um minuto.

| Zona | Conteúdo | Ação principal |
|---|---|---|
| Cabeçalho | Despesas e reservas; mês/período de referência e versão | Nova rubrica |
| Resumo | Operação e reservas: 3.013,99 €; aquisição: 833,33 €; total: 3.847,32 € | Ver composição |
| Lista | Dez rubricas iniciais, valor, classificação e inclusão | Editar linha |
| Rodapé | Alterações por guardar; comparação de totais | Rever e guardar |

Ao carregar numa linha, abrir um painel com:

- Nome e descrição.
- Montante e periodicidade; equivalente mensal calculado.
- Categoria e tipo: despesa, previsão/provisão, reserva ou recuperação de caixa.
- `Incluir na base de preços`: ligado/desligado.
- Custos de pessoal incluídos: sim/não, quando aplicável.
- Data de início/fim e nota da alteração.

Não colocar o tipo de despesa apenas numa tooltip. Na prestação ao Fábio, mostrar `Aquisição — recuperação de caixa`; na manutenção, `Reserva orçamental`; na remuneração, `Pessoal já incluído`.

**Interações:**

1. Alterar o valor na linha/painel atualiza a soma de pré-visualização, sem publicar a configuração.
2. `Rever e guardar` mostra o total atual, o novo total, as linhas alteradas e o impacto no método mensal.
3. O Luís escolhe guardar rascunho ou aplicar a partir de uma data. Guardar não confirma automaticamente dias produtivos em falta.

Exemplo obrigatório: alterar renda de 630,74 € para 700 € mostra **+69,26 €/mês** e um novo total de **3.916,58 €**. Se o método ativo for manual, mostrar `A base diária de 172 € mantém-se; alteraste a previsão mensal.`

Se a gravação falhar, manter a edição no ecrã e mostrar um botão de tentativa; não comunicar sucesso antes de a transação terminar.

### 16.2. Ecrã B — Base diária e capacidade

**Entrada:** `Configurações → Orçamentos e preços → Base financeira`.

No topo, dois cartões selecionáveis:

- **Valor diário manual:** campo de referência diária, inicialmente 172 €.
- **Calcular pelo mês:** total mensal obtido das rubricas incluídas, inicialmente 3.847,32 €, e campo de dias produtivos.

Campos comuns:

| Campo visível | Valor inicial | Ajuda de utilização |
|---|---:|---|
| Horas técnicas faturáveis por dia, no total | 8 | Capacidade estimada; não são apenas horas de abertura |
| Objetivo de lucro por dia | 200 € | Objetivo comercial, não limite nem garantia |
| Acréscimo por hora de serviço pontual | 25 € | Adicional comercial dos pequenos serviços |
| Aplicar a partir de | Data escolhida | Afeta cálculos novos a partir desta data |

**Resultados à direita ou por baixo no mobile:**

- Base agregada por dia e por hora.
- Objetivo por hora.
- Tarifa completa e pontual.
- Método usado e estado dos dados.

No método mensal, o total é somente leitura neste ecrã, com ligação `Editar despesas`. Para o alterar, editar as rubricas; não introduzir um segundo total que diverge da lista.

Quando faltarem dias produtivos, mostrar `Indica os dias de referência para calcular pelo mês`. É possível guardar rascunho; não publicar um método mensal sem denominador válido. O exemplo de 22 dias aparece apenas em `Experimentar cenário`, separado dos campos publicados.

Alterar a capacidade mostra o efeito em ambas as tarifas. Não atribuir mais colaboradores automaticamente quando o número aumenta.

### 16.3. Ecrã C — Fórmulas

**Entrada:** `Configurações → Orçamentos e preços → Fórmulas`.

Mostrar dois cartões, sem um editor de código:

| Fórmula | Componentes iniciais | Botões |
|---|---|---|
| Serviço completo | Base a recuperar + objetivo de lucro + material | Editar, testar, duplicar |
| Serviço pontual | Base a recuperar + objetivo de lucro + acréscimo por hora + material | Editar, testar, duplicar |

Na edição, cada componente é uma linha com nome, unidade, parâmetro/origem e interruptor de inclusão. No método mensal, `Base a recuperar` pode ser expandida em operação/reservas e aquisição; as duas linhas não podem coexistir com uma terceira base agregada que as some novamente.

O botão `Adicionar componente` oferece os tipos da secção 4.1. Uma percentagem obriga a escolher a base de incidência. Explicar a fórmula com texto visível, não apenas símbolos.

**Painel de teste:** horas, material e tipo de serviço, inicialmente com um exemplo de três horas e 50 € de material. Mostrar decomposição, preço sugerido e comparação com a versão publicada.

**Publicação:** resumo das alterações, serviços associados, data e botão `Aplicar aos próximos orçamentos`. Se as permissões não permitirem publicar, disponibilizar apenas rascunho.

Desativar uma fórmula global não pode fazer desaparecer a fórmula guardada em snapshots históricos. Para serviços associados a uma fórmula arquivada, exigir uma alternativa explícita antes de publicar a alteração.

### 16.4. Ecrã D — Novo orçamento

**Entrada:** módulo de orçamentos existente, ação `Novo orçamento`.

**Desktop:** zona principal com cliente, viatura, linhas de serviço, horas e material; resumo lateral fixo com sugestão e preço final.

**Mobile:** campos em sequência; resumo compacto com preço final e ação principal; detalhe financeiro abre por toque. O rodapé fixo não deve cobrir os últimos campos nem o teclado.

Por linha de serviço, mostrar:

- Nome, âmbito/painéis e descrição destinada ao cliente.
- Modo `Completo`/`Pontual`, com indicação `Sugerido para este serviço`.
- Horas previstas e origem; botão `Detalhar fases`.
- Material e custo interno; botão `Ver materiais`.
- Ligação `Ajustar parâmetros desta linha`, sem mudar a configuração global.

No resumo:

1. **Preço sugerido sem IVA**, visualmente secundário.
2. **Preço final sem IVA**, campo principal editável, com indicação `Manual` quando alterado.
3. **IVA e total a apresentar ao cliente**, conforme contexto configurado.
4. **Diferença face à sugestão**, em euros e percentagem.
5. Expansão `Ver composição interna`: base de recuperação, objetivo, acréscimo, materiais, eventuais suplementos e qualidade dos custos.

Permitir linhas com modos diferentes na mesma proposta. Exemplo: preparação de um completo e um serviço pontual adicional não exigem dois clientes ou duas fichas. Cada linha usa as horas que lhe pertencem; atividades partilhadas são atribuídas uma única vez, não repetidas integralmente em todas as linhas.

Os parâmetros globais pertencem a uma versão. Uma exceção por linha não altera os parâmetros das outras linhas. O preço final manual pode ser escolhido para a opção inteira; a diferença é guardada como ajuste da opção e não cria despesas fictícias nas linhas.

**Botões:**

- `Guardar rascunho`: persiste dados e snapshot de cálculo, sem enviar mensagem, criar aprovação ou reservar material.
- `Pré-visualizar para o cliente`: mostra apenas a proposta comercial, sem despesas mensais, margem ou objetivo interno.
- `Enviar orçamento`: confirma revisão, validade e canal autorizado. Se não existir integração de envio, disponibiliza o link/documento e não afirmar que enviou uma mensagem.
- `Restaurar preço sugerido`: ação explícita que remove o ajuste manual depois de mostrar a diferença.

Não transformar o material a custo em uma linha pública que revele o custo de compra. O orçamento público pode mostrar material/marca e preço comercial combinado conforme a apresentação escolhida.

### 16.5. Microtextos essenciais

Usar textos simples e coerentes:

| Situação | Texto sugerido |
|---|---|
| Fórmula de apoio | O preço sugerido é uma referência. Podes escolher outro valor. |
| Base manual | Usas uma base diária manual de 172 €. A listagem mensal serve de referência. |
| Alteração global | Esta alteração aplica-se aos novos cálculos. As propostas enviadas e aprovadas mantêm os valores guardados. |
| Preço manual após nova estimativa | A sugestão mudou. Mantivemos o preço final que escolheste. |
| Rubricas estimadas | Este resultado usa despesas e reservas orçamentadas. Os custos reais podem variar. |
| Remuneração própria | A tua remuneração e encargos já estão incluídos na base mensal. |
| Prestação concluída | Podes excluir esta prestação dos próximos cálculos, mantendo o histórico. |
| Falha de gravação | Não foi possível guardar. As alterações continuam neste ecrã. |

Os exemplos de texto com valores devem usar interpolação a partir dos dados; nunca deixar 172 € fixo quando o utilizador já alterou a base.

---

## 17. Walkthrough que o AntiGravity deve demonstrar

Executar estes cenários com dados de teste, sem modificar a base real da empresa. São demonstrações de aceitação da funcionalidade, não instruções para alterar preços comerciais existentes.

### Cenário 1 — Configuração inicial

1. Abrir a lista e confirmar as dez rubricas, total **3.847,32 €**, remuneração própria incluída e prestação separada.
2. Confirmar método manual **172 €/dia**, capacidade **8 horas**, objetivo **200 €/dia** e acréscimo **25 €/hora**.
3. Abrir fórmulas: completo **46,50 €/hora**; pontual **71,50 €/hora**.
4. Verificar que as componentes podem ser editadas sem abrir código.

### Cenário 2 — Wrap completo com preço escolhido

1. Criar proposta de teste: serviço completo, **32 horas** e **400 € de material**.
2. Mostrar sugestão **1.888 € antes de IVA**.
3. Escolher preço final de teste **2.200 € antes de IVA**; mostrar diferença de **+312 €**.
4. Guardar rascunho; reabrir e confirmar preço final manual e fórmula original.
5. Alterar estimativa para **36 horas**, mantendo material: nova sugestão **2.074 €**; preço manual permanece **2.200 €**, diferença **+126 €**.
6. Não alterar o objetivo global nem criar um custo fictício de 312 €.

### Cenário 3 — Óticas com preço comercial

1. Criar proposta de teste de serviço pontual: **1 hora**, **50 € de material**.
2. Sugestão **121,50 €**; escolher preço final de teste **180 € antes de IVA**.
3. Confirmar diferença **+58,50 €** e ausência de uma segunda parcela salarial.
4. Na pré-visualização pública, não mostrar os 3.847,32 €, os 1.328,25 € de remuneração ou o objetivo diário.

### Cenário 4 — Alterar uma despesa e o método

1. Num rascunho de configuração, alterar renda para **700 €**; mostrar total **3.916,58 €** e diferença **+69,26 €**.
2. Manter método manual: tarifas **46,50 €/hora** e **71,50 €/hora** não mudam.
3. Num cenário de teste mensal, escolher explicitamente **22 dias**: base derivada **178,03 €/dia**, completo **47,25 €/hora**, pontual **72,25 €/hora**, valores exibidos arredondados.
4. Publicar apenas no ambiente de teste. Uma proposta nova recebe a versão nova; a proposta de wrap enviada anteriormente conserva a anterior.
5. Demonstrar que o valor exato, e não a tarifa exibida arredondada, é usado no cálculo final.

### Cenário 5 — Alterar o acréscimo sem mexer nos completos

1. Mudar o acréscimo de pontual de **25 €** para **30 €/hora** numa nova versão de teste, mantendo base manual.
2. Serviço completo mantém **46,50 €/hora**; pontual passa a **76,50 €/hora**.
3. Chrome delete de três horas com 50 € de material passa de **264,50 €** para **279,50 €** nos novos cálculos.
4. Proposta aprovada continua com o preço e parâmetros anteriores.

### Cenário 6 — Proposta mista sem despesas duplicadas

1. Usar base manual e criar uma opção com serviço completo de **5 horas** e pontual de **3 horas**.
2. Introduzir materiais de teste de **80 €** e **50 €**, respetivamente.
3. Confirmar serviço completo **312,50 €**, serviço pontual **264,50 €** e total sugerido **577 €**, antes de IVA.
4. Confirmar recuperação de base diária **172 €**, objetivo **200 €**, acréscimo **75 €** e materiais **130 €**.
5. Escolher preço final da opção **600 €**: guardar um ajuste comercial de **+23 €**, sem o contabilizar como mais horas, mais material ou mais despesas.

### Cenário 7 — Revisão e aprovação

1. Enviar uma revisão de teste e conservar o snapshot exato.
2. Mudar parâmetros globais: o link enviado mantém os valores.
3. Alterar a proposta enviada através de uma nova revisão: o link antigo informa que foi substituído e não aceita aprovação.
4. Aprovar a revisão válida e uma opção concreta; confirmar que a produção recebe os tempos e materiais dessa opção.
5. Tentar repetir a aprovação: não criar segunda ordem nem segunda reserva.

### Cenário 8 — Fim da prestação ao Fábio

1. Num cenário de teste, excluir a prestação de **833,33 €** a partir de uma data escolhida, sem afirmar que o pagamento real já terminou.
2. Com as restantes rubricas originais, total incluído passa a **3.013,99 €/mês**.
3. No método mensal com 22 dias e oito horas, mostrar base **137,00 €/dia**, completo **42,12 €/hora** e pontual **67,12 €/hora**, com precisão interna preservada.
4. No método manual, a exclusão não altera automaticamente os 172 €: oferecer a mudança de método ou a revisão explícita desse valor.
5. Histórico de aquisição e propostas anteriores permanece intacto.

### Ordem prática para a primeira entrega utilizável

Entregar primeiro uma fatia completa: configuração editável → cálculo → preço final manual → rascunho persistido → reabertura com valores intactos. Esta entrega deve incluir autorização, validação no servidor e snapshot; não basta uma maqueta com campos que não gravam.

Depois completar envio/revisões/aprovação, ligação aos tempos e materiais reais e painéis de recuperação. Integrações ainda indisponíveis devem ser identificadas como tal, sem simular sucesso.

**Entrega ao Luís:** demonstração dos ecrãs, cenários verificados, capturas desktop/mobile, limitações e passos de ativação. Nenhum destes cenários autoriza alterar o GitHub ou publicar a aplicação.
