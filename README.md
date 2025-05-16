Bot de Discord para administrar um servidor de Minecraft Vanilla, e um servidor de Minecraft com Mods

Procurei muito e não achei nenhum bot com as funções que eu queria, então eu mesmo fiz usando IA, com pouco conhecimento em JavaScript e criação de bots de Discord\
*ainda precisei fazer diversos ajustes manualmente e estudar um pouco porque a IA é imbecil*

## Features
Iniciar ou parar o servidor selecionado com !start ou !stop\
Mostrar detalhes do servidor pela [API](https://api.mcsrvstat.us/) com !status\
Mostrar estatísticas dos jogadores pelos arquivos do mundo, como playerdata e stats, com !player (é necessário registrar a uuid dos jogadores com !uuid)\
Monitorar os recursos do host com !btop


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
