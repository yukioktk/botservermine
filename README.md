Bot de Discord para administrar um servidor de Minecraft Vanilla, e um servidor de Minecraft com Mods

Procurei muito e não achei nenhum bot com as funções que eu queria, então eu mesmo fiz usando IA, com pouco conhecimento em JavaScript e criação de bots de Discord\
*ainda precisei fazer diversos ajustes manualmente e estudar um pouco porque a IA é imbecil*\
Algum dia eu refaço o código do zero sem IA

## Features
<details>
<summary>Iniciar ou parar o servidor selecionado com !start ou !stop</summary>
<img width="436" height="167" alt="image" src="https://github.com/user-attachments/assets/854e4d1c-b017-4b1f-a99c-61a35b5b9ce0" />
</details>

<details>
  <summary>Mostrar detalhes do servidor pelo https://api.mcsrvstat.us/ com !status</summary>
<img width="397" height="308" alt="image" src="https://github.com/user-attachments/assets/6691aada-4199-49cd-8f0f-f2e641c75dea" />
</details>

<details>
  <summary>Mostrar estatísticas dos jogadores pelos arquivos do mundo, como playerdata e stats, com !player</summary>
<img width="487" height="421" alt="image" src="https://github.com/user-attachments/assets/aca18209-5662-4c6c-9ff8-5e45d72fc795" />
</details>

<details>
  <summary>Monitorar os recursos do host com !btop</summary>
<img width="448" height="498" alt="image" src="https://github.com/user-attachments/assets/a5939386-7fcc-4c6d-b38a-e9e0a54cd587" />
</details>



## Requisitos
Node.js
```
npm install discord.js dotenv systeminformation nbt node-fetch@2
```
## Instalação
Faça o download da [Release](https://github.com/yukioktk/botservermine/releases) mais recente\
Na pasta do servidor de Minecraft, crie um .sh para iniciar o servidor, exemplo:  (Em servidores Forge não é necessário, basta inserir o run.sh no .env)
```
java -jar -Xmx4024M paper-1.21.3-82.jar nogui
```


Crie um arquivo .env e substitua com suas informações
```
BOT_TOKEN= INSIRA_SEU_TOKEN
ID_CONSOLE_VANILLA= INSIRA_O_ID_DO_CANAL_DE_CONSOLE_DO_SERVIDOR_VANILLA_DO_DISCORD
ID_CONSOLE_MODPACK= INSIRA_O_ID_DO_CANAL_DE_CONSOLE_DO_SERVIDOR_MODPACK_DO_DISCORD
VANILLA_IP= IP_DO_SERVIDOR_VANILLA
MODPACK_IP= IP_DO_SERVIDOR_MODPACK
VANILLA_DIRECTORY= CAMINHO_PARA_O_.JAR_VANILLA
MODPACK_DIRECTORY= CAMINHO_PARA_O_.JAR_MODPACK
VANILLA_SCRIPT= NOME_DO_.SH_PARA_INICIAR_O_SERVER_VANILLA
MODPACK_SCRIPT= NOME_DO_.SH_PARA_INICIAR_O_SERVER_VANILLA
```
Exemplo:
```
BOT_TOKEN= ASDASDDasdasddsadasasdsdasdasdsadadadadsadasdsada
ID_CONSOLE_VANILLA= 1231231231231231231
ID_CONSOLE_MODPACK= 1232131231231231232
VANILLA_IP= mc.hypixel.net
MODPACK_IP= mc.hypixel.net
VANILLA_DIRECTORY= /home/ubuntu/minecraftVanilla
MODPACK_DIRECTORY= /home/ubuntu/minecraftModpack
VANILLA_SCRIPT= iniciarserver.sh
MODPACK_SCRIPT= run.sh 
```
Inicie com
```
node discordbot.js
```
