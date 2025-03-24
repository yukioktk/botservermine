const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType, EmbedBuilder, MessageFlags } = require('discord.js');
const { spawn } = require('child_process');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

require("dotenv").config();

// Configurações do bot
const token = (process.env.BOT_TOKEN); // Token
const prefix = '!';
const channelIdServerVanilla = (process.env.ID_CONSOLE_VANILLA); // Canal de log do Servidor Vanilla
const channelIdServerMod = (process.env.ID_CONSOLE_MODPACK);   // Canal de log do Servidor Mod
const serverVanillaIP = (process.env.VANILLA_IP);              // IP do servidor Vanilla
const serverModIP = (process.env.MODPACK_IP);             // IP do servidor Mod
const vanillaDirectory = (process.env.VANILLA_DIRECTORY);             // Diretório do servidor Vanilla
const modpackDirectory = (process.env.MODPACK_DIRECTORY);             // Diretório do servidor Modpack
const vanillaScript = (process.env.VANILLA_SCRIPT);             // Script para iniciar o servidor Vanilla (.sh)
const modpackScript = (process.env.MODPACK_SCRIPT);             // Script para iniciar o servidor Modpack (.sh)

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });


require('./botcommands/btop')(client);
require('./botcommands/buttonconflicts')(client);
require('./botcommands/help')(client);
require('./botcommands/ping')(client);
require('./botcommands/playerStatistics')(client);


// Listner buttons
function handleServerButton(interaction) {
  // ... Sua lógica para os botões dos servidores ...
  // Por exemplo, se interaction.customId for 'serverVanilla', etc.
}

// Definindo de forma global para ser acessível no buttonconflicts.js:
global.handleServerButton = handleServerButton;




// Variáveis para armazenar os processos dos servidores
let serverVanillaProcess = null;
let serverModProcess = null;

// --------------------------------------------------
// Buffer de logs para juntar as mensagens e evitar rate limiting
const logBuffers = {
  vanilla: [],
  mod: []
};

// Função para dividir mensagens longas, respeitando o limite do Discord (2000 caracteres)
function splitMessage(content, maxLength = 2000) {
  const parts = [];
  while (content.length > maxLength) {
    let splitIndex = content.lastIndexOf('\n', maxLength);
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      splitIndex = maxLength;
    }
    parts.push(content.slice(0, splitIndex));
    content = content.slice(splitIndex);
  }
  if (content.length > 0) {
    parts.push(content);
  }
  return parts;
}

// Função para adicionar os logs ao buffer, dividindo-os se necessário
function adicionarNoBuffer(bufferName, data) {
  const log = data.toString();
  const parts = splitMessage(log, 1900); // margem para garantir a formatação no bloco de código
  logBuffers[bufferName].push(...parts);
}

// Função para enviar os logs acumulados do buffer para o canal
async function enviarBuffer(channel, bufferName) {
  const buffer = logBuffers[bufferName];
  if (buffer.length === 0) return;

  // Agrega todas as entradas do buffer em uma única string
  const allLogs = buffer.join('\n');
  // Limpa o buffer imediatamente para tratar novos logs
  logBuffers[bufferName] = [];

  const mensagemCompleta = `\`\`\`\n${allLogs}\n\`\`\``;

  if (mensagemCompleta.length <= 2000) {
    await channel.send(mensagemCompleta);
  } else {
    // Caso ultrapasse o limite, divide novamente a mensagem
    const parts = splitMessage(allLogs, 1900);
    for (const part of parts) {
      await channel.send(`\`\`\`\n${part}\n\`\`\``);
    }
  }
}

// --------------------------------------------------
// Codificação utf-8
process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');
process.stderr.setEncoding('utf8');

client.once('ready', () => {
  console.log(`Bot online como ${client.user.tag}!`);
  // Rich Presence
  client.user.setActivity({
    name: '!help',
    type: ActivityType.Listening,
  });
});

// Função que consulta o status do servidor via API
async function getServerStatus(ip) {
  const response = await fetch(`https://api.mcsrvstat.us/3/${ip}`);
  const data = await response.json();
  return data;
}

client.on('messageCreate', async (message) => {
  // Ignorar mensagens de outros bots
  if (message.author.bot) return;

  // Se a mensagem não começa com o prefixo, e se estiver no canal de log, redireciona ao processo correspondente
  if (!message.content.startsWith(prefix)) {
    if (message.channel.id === channelIdServerVanilla && serverVanillaProcess) {
      serverVanillaProcess.stdin.write(message.content + '\n');
    } else if (message.channel.id === channelIdServerMod && serverModProcess) {
      serverModProcess.stdin.write(message.content + '\n');
    }
    return;
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Comando para iniciar os servidores
  if (command === 'start') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('serverVanilla')
        .setLabel('Iniciar Servidor Vanilla')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('serverMod')
        .setLabel('Iniciar Servidor Mod')
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({
      content: 'Escolha qual servidor deseja iniciar:',
      components: [row]
    });
  }

  // Comando para parar os servidores
  if (command === 'stop') {
    if (serverVanillaProcess || serverModProcess) {
      const stopRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('stop_serverVanilla')
          .setLabel('Parar Servidor Vanilla')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('stop_serverMod')
          .setLabel('Parar Servidor Mod')
          .setStyle(ButtonStyle.Danger)
      );

      await message.channel.send({
        content: 'Escolha qual servidor deseja parar:',
        components: [stopRow]
      });
    } else {
      return message.channel.send('Nenhum servidor online');
    }
  }

  // Comando para consultar o status dos servidores
  if (command === 'status') {
    const vanillaStatus = await getServerStatus(serverVanillaIP);
    const modStatus = await getServerStatus(serverModIP);

    let embedColor = 0x00FF00; // Verde por padrão
    if (!vanillaStatus.online && !modStatus.online) {
      embedColor = 0xFF0000; // Vermelho se ambos estiverem offline
    }

    const statusEmbed = new EmbedBuilder()
      .setTitle('Status dos Servidores Minecraft')
      .addFields(
        { name: 'Servidor Vanilla', value: vanillaStatus.online ? 
          `Jogadores Online: ${vanillaStatus.players.online}\n${vanillaStatus.version}\nIP: ${serverVanillaIP}\nBluemap: http://64.181.177.19:8100/` :
          'Servidor Offline\n``!start`` para ligar' },
        { name: 'Servidor Mod', value: modStatus.online ? 
          `Jogadores Online: ${modStatus.players.online}\n${modStatus.version}\nIP: ${serverModIP}\nBluemap: http://64.181.177.19:8101/` :
          'Servidor Offline\n``!start`` para ligar' }
      )
      .setColor(embedColor);

    message.channel.send({ embeds: [statusEmbed] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

    const serverButtons = ['serverVanilla', 'serverMod', 'stop_serverVanilla', 'stop_serverMod'];
    if (!serverButtons.includes(interaction.customId)) return; // Se não for um desses botões, sai e permite que outro listener (por exemplo, o do btop) trate


  try {
    const logChannelServerVanilla = await client.channels.fetch(channelIdServerVanilla);
    const logChannelServerMod = await client.channels.fetch(channelIdServerMod);


    // Botão para iniciar o Servidor Vanilla
    if (interaction.customId === 'serverVanilla' && !serverVanillaProcess) {
      const serverVanillaPath = vanillaDirectory;
      const scriptName = vanillaScript;
      serverVanillaProcess = spawn('bash', [scriptName], { cwd: serverVanillaPath, env: { LANG: 'en_US.UTF-8' } });

      await interaction.reply({ content: 'Iniciando o Servidor Vanilla...' });

      serverVanillaProcess.stdout.on('data', (data) => {
        console.log(`Servidor Vanilla - STDOUT: ${data}`);
        adicionarNoBuffer('vanilla', data);
      });

      serverVanillaProcess.stderr.on('data', (data) => {
        console.log(`Servidor Vanilla - STDERR: ${data}`);
        adicionarNoBuffer('vanilla', `[ERRO] ${data}`);
      });

      serverVanillaProcess.on('close', (code) => {
        serverVanillaProcess = null;
        logChannelServerVanilla.send(`Servidor Vanilla foi encerrado com o código: ${code}`);
      });
    } else if (interaction.customId === 'serverVanilla') {
      if (!interaction.replied) {
        await interaction.reply({ content: 'Servidor Vanilla online', flags: MessageFlags.Ephemeral });
      }
    }

    // Botão para iniciar o Servidor Mod
    if (interaction.customId === 'serverMod' && !serverModProcess) {
      const serverModPath = modpackDirectory;
      const scriptName = modpackScript;
      serverModProcess = spawn('bash', [scriptName], { cwd: serverModPath, env: { LANG: 'en_US.UTF-8' } });

      await interaction.reply({ content: 'Iniciando o Servidor Mod...' });

      serverModProcess.stdout.on('data', (data) => {
        console.log(`Servidor Mod - STDOUT: ${data}`);
        adicionarNoBuffer('mod', data);
      });

      serverModProcess.stderr.on('data', (data) => {
        console.log(`Servidor Mod - STDERR: ${data}`);
        adicionarNoBuffer('mod', `[ERRO] ${data}`);
      });

      serverModProcess.on('close', (code) => {
        serverModProcess = null;
        logChannelServerMod.send(`Servidor Mod foi encerrado com o código: ${code}`);
      });
    } else if (interaction.customId === 'serverMod') {
      if (!interaction.replied) {
        await interaction.reply({ content: 'Servidor Mod online', flags: MessageFlags.Ephemeral });
      }
    }

    // Botões para parar os servidores
    if (interaction.customId === 'stop_serverVanilla' && serverVanillaProcess) {
      serverVanillaProcess.stdin.write('stop\n');
      serverVanillaProcess.stdin.end();
      serverVanillaProcess = null;
      if (!interaction.replied) {
        await interaction.reply({ content: 'Comando "stop" enviado para o Servidor Vanilla.' });
      }
    } else if (interaction.customId === 'stop_serverMod' && serverModProcess) {
      serverModProcess.stdin.write('stop\n');
      serverModProcess.stdin.end();
      serverModProcess = null;
      if (!interaction.replied) {
        await interaction.reply({ content: 'Comando "stop" enviado para o Servidor Mod.' });
      }
    } else {
      if (!interaction.replied) {
        await interaction.reply({ content: 'Servidor offline', flags: MessageFlags.Ephemeral });
      }
    }
  } catch (error) {
    console.error('Erro ao processar a interação:', error);
    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply({ content: 'Ocorreu um erro ao processar a interação.', flags: MessageFlags.Ephemeral });
    }
  }
});

// Agendar o envio periódico dos logs agregados a cada 1 segundo
setInterval(async () => {
  try {
    const logChannelServerVanilla = await client.channels.fetch(channelIdServerVanilla);
    const logChannelServerMod = await client.channels.fetch(channelIdServerMod);

    await enviarBuffer(logChannelServerVanilla, 'vanilla');
    await enviarBuffer(logChannelServerMod, 'mod');
  } catch (error) {
    console.error('Erro ao enviar os logs do buffer:', error);
  }
}, 1000);

client.login(token);
