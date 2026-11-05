# Caderno de Reuniões

Sistema pessoal de notas de reuniões: transcrições do Teams → `caderno_reunioes.html`.

- **Nome no Teams:** _(preencher, exatamente como aparece no .vtt)_ — usado no Radar de Comunicação.
- Para processar uma reunião usa o comando `/reuniao` (definido em `.claude/commands/reuniao.md`).
- Transcrições em bruto e ficheiros intermédios ficam em `transcricoes/` (fora do git).

## Ferramentas
- `python3 ferramentas/analisar_vtt.py <ficheiro.vtt> --eu "<Nome>"` → `.limpo.txt` + `.analise.json`
  (métricas exatas de participação, calculadas pelos timestamps).
- `python3 ferramentas/injetar.py <artigo.html> --dados <analise.json>` → insere no caderno
  (valida, junta métricas, remove exemplos, guarda `.bak`).

## Regras
- Nunca editar `caderno_reunioes.html` à mão para inserir reuniões: usar `injetar.py`.
- Nunca mexer no `<style>` nem no `<script>` do caderno sem pedido explícito.
- O caderno funciona offline e sem dependências externas (sem CDNs, sem fontes remotas).
- Testes visuais: Playwright está disponível; verificar desktop, modo escuro e 390px de largura.
