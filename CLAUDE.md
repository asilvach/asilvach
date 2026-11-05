# Caderno de Reuniões · CIO Office Portugal (Natixis)

Ferramenta da equipa para um banco com IA interna fechada (Kilo Code) e sem acesso externo.
O caderno é **um só ficheiro HTML** que corre offline no Edge/Chrome. Não há Python, servidor
nem agente: o caderno lê o `.vtt`/`.docx` do Teams, calcula as métricas, gera o pedido para o
Kilo Code, valida a resposta (JSON) que a pessoa cola de volta e guarda tudo localmente.

## Arquitetura
- Pessoa → **Nova reunião** no caderno → escolhe o ficheiro e quem é → **Copiar pedido**
  → cola no Kilo Code → copia a resposta JSON → cola no caderno → **Guardar reunião**.
- Métricas (tempo de fala, ritmo, bordões, hesitações, interrupções) calculadas em JS a partir
  dos timestamps. O modelo de IA só escreve o conteúdo (resumo, secções, tarefas, temas, radar).
- Armazenamento: IndexedDB do navegador + (recomendado) ficheiro `.json` ligado pela File System
  Access API, por exemplo no OneDrive. Exportar/importar cópia nas Definições.
- Contexto e seguimento: o pedido inclui reuniões anteriores com as mesmas pessoas e as tarefas
  em aberto (códigos T1…); a resposta indica `tarefas_concluidas` e o caderno fecha-as.
- Segurança: CSP sem rede (`connect-src 'none'`), sem dependências externas, logótipo embutido.

## Estrutura
- `src/pagina.html` — esqueleto (marcadores `%%CSS%%`, `%%LOGO%%`, `%%EXEMPLOS%%`, `%%JS%%`).
- `src/app.js` — toda a lógica (leitura de transcrições, métricas, pedido, validação, vistas).
- `src/estilo-base.css` + `src/estilo-caderno.css` — design system (tokens no `:root`).
- `src/exemplos.json` — 3 reuniões fictícias; `src/exemplos/*.vtt` — transcrição de treino.
- `docs/` — LEIA-ME, nota técnica para IT, PDF do procedimento.
- `ferramentas/construir.py` — gera `dist/Caderno de Reuniões.html` e o ZIP para a equipa.
- `ferramentas/gerar_procedimento.js` — gera o PDF com capturas reais (Playwright).
- `marca/` — logótipo oficial Natixis CIB (reduzido) e especificação de cores.

## Construir
```
python3 ferramentas/construir.py
node ferramentas/gerar_procedimento.js   # só se o design ou o fluxo mudarem
python3 ferramentas/construir.py
```

## Regras
- Nunca adicionar ao git transcrições, ficheiros de dados `.json` pessoais ou conteúdo de reuniões reais.
- O formato da resposta da IA (JSON) está definido em `buildPrompt` e validado em `normalizeAI`
  (`src/app.js`); mudar um obriga a mudar o outro. Ser tolerante: blocos ```json, texto à volta,
  vírgulas finais.
- O design segue Hallmark (Floor), Web Interface Guidelines, Emil Kowalski (motion) e tokens à
  shadcn: cores e espaçamentos só por tokens; nada de rótulos em maiúsculas espaçadas, "·" a juntar
  metadados, emojis como ícones, cartões dentro de cartões; animação só para estados;
  `prefers-reduced-motion` respeitado. Cores da marca vêm de `marca/brand-spec.md`.
- Público-alvo pouco técnico: textos curtos, passo a passo, mensagens de erro com a solução.
- Testes: Playwright disponível. Verificar o fluxo completo (ficheiro → pedido → resposta → guardar
  → recarregar), `.docx`, resposta cortada, zero pedidos de rede, 390 px e modo escuro.
