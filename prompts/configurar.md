# Configurar o caderno

Objetivo: criar ou atualizar o `caderno_reunioes.html` **pessoal** desta pessoa a partir do
modelo da equipa (`modelo/caderno.html`), mantendo as reuniões que já tenha.

Argumentos: o nome e o nome no Teams, se o utilizador os indicou ao chamar o comando.

1. Lê `config.json` se existir (nome, nome no Teams, equipa).
2. Se faltar o **nome** ou o **nome no Teams**, pergunta numa só mensagem:
   - "Como te chamas (como queres aparecer no caderno)?"
   - "Como apareces nas transcrições do Teams? (abre um .vtt e procura `<v O Teu Nome>`; costuma ser `Apelido, Nome`)"
   Se houver um `.vtt` em `transcricoes/`, lista os oradores encontrados (`grep -o '<v [^>]*>' ficheiro.vtt | sort | uniq -c`) para a pessoa escolher.
3. Corre (em Windows usa `python` ou `py -3` se `python3` não existir):
   ```
   python3 ferramentas/configurar.py --nome "<Nome>" --teams "<Nome no Teams>"
   ```
4. Responde em 2–3 linhas: o caminho do caderno (o script imprime um link `file://` para abrir no
   navegador) e o próximo passo: `/reuniao transcricoes/<ficheiro>.vtt ata`.

Notas:
- O caderno e o `config.json` são pessoais e estão no `.gitignore`: nunca os adiciones ao git.
- Para receber melhorias de design depois de um `git pull`, basta voltar a correr este comando:
  as reuniões são mantidas e é guardada uma cópia de segurança `.bak`.
