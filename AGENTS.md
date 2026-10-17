<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Arranque de tarefas: briefing de skills e agentes

Antes de escrever código novo ou implementar uma funcionalidade, faz um briefing (rápido por omissão) e só depois começas a implementar. O briefing não tem um limite rígido: se a tarefa for complexa, ambígua ou de alto risco, pode ser maior e incluir decisões, alternativas, dependências e um plano detalhado por agente.

1. **Enquadrar** — objetivo, âmbito, ficheiros/áreas afetadas, riscos e critérios de conclusão. Tem em conta as regras deste ficheiro e de `.agents/rules/`.
2. **Escolher skills** — percorre as skills disponíveis e carrega com a ferramenta `skill` apenas as que mudam a abordagem (design, segurança, Postgres, React/Next, TDD, deploy, etc.). As skills são carregadas antes de implementar, nunca depois.
3. **Escolher agentes** — usa o máximo de agentes que se justifique, com paralelismo real e sem sobreposição: `explore` para localizar código, `general` para trabalho independente em paralelo, `builder-review` para revisão crítica e `builder-fusion` para decisões técnicas de alto risco. Cada agente recebe um entregável concreto e um âmbito fechado.
4. **Briefing** — no caso simples, regista em 3-6 linhas: objetivo, skills escolhidas, agentes e respetivas tarefas, riscos e definição de done. Em tarefas complexas ou de alto risco, o briefing pode ser maior. Partilha-o com o utilizador sempre que houver ambiguidade ou decisão de alto impacto; caso contrário, avança.

Ajusta a profundidade ao tamanho da tarefa: alterações triviais (typo, uma linha) dispensam briefing; funcionalidades novas, refactors e integrações exigem-no sempre. No resumo final, indica as skills e os agentes usados.
