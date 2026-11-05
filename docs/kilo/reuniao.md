---
description: Processa as transcrições novas do Caderno de Reuniões (pasta entrada)
---

Processa as reuniões que o Caderno de Reuniões preparou na pasta `entrada/` deste projeto.

1. Lista os ficheiros `entrada/*.pedido.md`.
2. Para cada pedido que ainda NÃO tem o ficheiro de resposta correspondente
   (o mesmo nome, terminado em `.resposta.json` em vez de `.pedido.md`):
   a. Lê o pedido inteiro. Contém as instruções completas e a transcrição da reunião.
   b. Segue essas instruções à letra.
   c. Cria o ficheiro de resposta indicado no pedido, por exemplo
      `entrada/2026-11-05 Comité IT.resposta.json`, com APENAS o objeto JSON
      (sem texto antes ou depois, sem blocos de código).
   d. Volta a ler o ficheiro que criaste e confirma que é JSON válido e completo.
      Se não for, corrige-o. Se o ficheiro já não estiver na pasta, é porque o caderno
      já o importou: está tudo bem, não o voltes a criar.
3. Trata um pedido de cada vez. Se houver vários, faz todos.
4. Se em `entrada/` houver transcrições (`.vtt`, `.docx`, `.txt`) sem `.pedido.md`, diz:
   "Abre ou atualiza o Caderno de Reuniões no Edge para preparar estas transcrições e volta a escrever /reuniao."
5. Não alteres, não movas e não apagues nenhum outro ficheiro. O caderno arruma tudo sozinho.
6. No fim, responde numa linha por reunião: o título e o número de tarefas.

Indicação extra do utilizador (opcional, por exemplo um tipo de resumo): $ARGUMENTS
