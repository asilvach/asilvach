# Caderno de Reuniões

Sistema pessoal de notas de reuniões: transcrições do Teams → `caderno_reunioes.html`.

- **Nome no Teams:** _(preencher, exatamente como aparece no .vtt)_ — usado no Radar de Comunicação.
- Para processar uma reunião usa o comando `/reuniao` (definido em `.claude/commands/reuniao.md`).
- Transcrições em bruto ficam em `transcricoes/` (não são enviadas para o git, ver `.gitignore`).
- Limpeza de `.vtt`: `python3 ferramentas/limpar_vtt.py <ficheiro.vtt>`.
- Ao editar `caderno_reunioes.html`: só inserir `<article class="meeting-entry">` abaixo do
  marcador `<!-- NOVA_REUNIAO_AQUI`. Nunca mexer no `<style>` nem no `<script>` sem pedido explícito.
