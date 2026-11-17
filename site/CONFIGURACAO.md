# Configure suas próprias contas

O app abre sem credenciais e permite explorar a interface. A geração de imagens fica desligada até você conectar a sua própria conta **OpenRouter** ou **Hugging Face** (com créditos mensais gratuitos no plano Free). Não existe chave, conta, proxy ou crédito do autor incluído.

## Variáveis do servidor

| Nome | Valor a configurar |
| --- | --- |
| AI_PROVIDER | `openrouter` ou `huggingface` |
| AI_API_KEY | Chave da sua conta OpenRouter ou token Hugging Face (`hf_...`, com permissão *Inference Providers*; também aceita `HF_TOKEN`) |
| AI_NANO_MODEL | Opcional: modelo principal (`google/gemini-3-pro-image` no OpenRouter, ou `black-forest-labs/FLUX.1-Kontext-dev` no Hugging Face) |
| AI_GPT_MODEL | Opcional: modelo alternativo (`openai/gpt-image-2` no OpenRouter, ou `Qwen/Qwen-Image-Edit` no Hugging Face) |
| AI_HF_PROVIDER | Opcional (apenas Hugging Face): sub-provedor de inferência; padrão `fal-ai` (também suporta `wavespeed` ou `auto`) |

No desenvolvimento, crie você mesmo um arquivo local chamado `.env.local` com as duas primeiras variáveis. Ele é ignorado pelo Git e pela Vercel. Nunca envie esse arquivo para outra pessoa nem o inclua em um ZIP.

Na Vercel, importe seu próprio repositório com a pasta deste kit como raiz. Selecione Next.js, use `npm ci` para instalar e `npm run build` para compilar. Em Settings → Environment Variables, cadastre AI_PROVIDER e AI_API_KEY apenas para este projeto. Faça um novo deploy após configurar.

As variáveis são lidas somente pelas rotas de servidor. Nunca use prefixo NEXT_PUBLIC_ para uma chave. Nunca coloque segredos no código do navegador, prompts, imagens, logs ou repositórios.

A API utiliza o endpoint público do OpenRouter e os créditos da conta que você configurar. A disponibilidade de modelos e os custos dependem dessa conta. As imagens enviadas para geração são encaminhadas ao provedor escolhido; não são gravadas em banco por este kit.

Esta edição não inclui autenticação de usuários ou cobrança. Se publicar geração aberta, os visitantes poderão consumir os créditos que você configurar. Antes de abrir ao público, configure autenticação e limites conforme sua necessidade, ou use a proteção de acesso da sua hospedagem. Não reutilize sistemas ou contas do autor.
