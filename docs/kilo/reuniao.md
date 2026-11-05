---
description: Atualiza o Caderno de Reuniões com as transcrições novas da pasta entrada
---

Atualiza o Caderno de Reuniões: cria um resumo para cada transcrição nova da pasta `entrada/`.

1. Lista as transcrições em `entrada/` (ficheiros `.vtt`, `.docx` ou `.txt`; ignora a pasta
   `entrada/processadas/` e os ficheiros `.md`).
2. Para cada transcrição que ainda NÃO tem o ficheiro `entrada/NOME.resposta.json`
   (NOME = nome do ficheiro sem a extensão):
   a. Se existir `entrada/NOME.pedido.md`, lê-o inteiro e segue-o à letra
      (foi preparado pelo caderno e tem as métricas exatas).
   b. Se não existir, lê `instrucoes-para-o-kilo.md` (na raiz desta pasta) e a transcrição
      inteira, e segue essas instruções à letra.
      Se `instrucoes-para-o-kilo.md` não existir, para e diz: "Abre o Caderno de Reuniões no Edge
      e liga a pasta uma vez (botão Escolher a pasta do caderno). Depois volta a pedir."
   c. Cria `entrada/NOME.resposta.json` com APENAS o objeto JSON pedido
      (sem texto antes ou depois, sem blocos de código).
   d. Volta a ler o ficheiro que criaste e confirma que é JSON válido e completo; se não for,
      corrige-o. Se o ficheiro já não estiver na pasta, é porque o caderno já o importou:
      está tudo bem, não o voltes a criar.
3. Trata as transcrições uma de cada vez, até não haver mais.
4. Não alteres, não movas e não apagues nenhum outro ficheiro. O caderno importa as respostas
   e arruma a pasta sozinho na próxima vez que estiver aberto.
5. No fim, responde numa linha por reunião: o título e o número de tarefas. Lembra que a
   reunião aparece no caderno quando ele estiver aberto no Edge.

Indicação extra do utilizador (opcional, por exemplo um tipo de resumo): $ARGUMENTS
