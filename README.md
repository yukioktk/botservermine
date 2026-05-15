# Bot de Discord para administrar um ou vários servidores de minecraft 

Procurei muito e não achei nenhum bot com as funções que eu queria, então eu mesmo fiz com ajuda de IA

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
Na pasta do servidor de Minecraft, crie um .sh para iniciar o servidor, exemplo:

OBS: Em servidores Forge não é necessário

```
java -jar -Xmx4024M paper-1.21.3-82.jar nogui
```

Faça o download da [Release](https://github.com/yukioktk/botservermine/releases) mais recente

Crie um arquivo .env com seu token
```
BOT_TOKEN= TOKEN_DO_BOT 
```
Substitua o servers.js com as informações dos servidores
\
\
Inicie com
```
node discordbot.js
```
