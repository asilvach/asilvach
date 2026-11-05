@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Atualizar o Caderno de Reuniões
echo.
echo  A atualizar o Caderno de Reuniões com as transcrições da pasta "entrada"...
echo  Pode demorar um ou dois minutos por reunião. Não feches esta janela.
echo.
where kilo >nul 2>nul
if errorlevel 1 goto semkilo
kilo run "Atualiza o caderno: segue à letra o procedimento do ficheiro .kilo/commands/reuniao.md, para todas as transcrições novas da pasta entrada."
if errorlevel 1 goto falhou
echo.
echo  Feito. A abrir o Caderno de Reuniões...
for %%f in ("Caderno de Reuni*.html") do start "" "%%f"
timeout /t 5 >nul
exit /b 0

:semkilo
echo  Não encontrei o Kilo Code no terminal (o comando "kilo").
echo  Alternativa: abre esta pasta no VS Code, abre o Kilo Code e escreve: atualiza o caderno
echo.
pause
exit /b 1

:falhou
echo.
echo  O Kilo Code não conseguiu terminar.
echo  Se pediu autorização para escrever ficheiros, abre o Kilo Code nesta pasta e escreve: atualiza o caderno
echo  Se o problema continuar, envia uma captura desta janela a quem te deu o caderno.
echo.
pause
exit /b 1
