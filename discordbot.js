const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType, EmbedBuilder, MessageFlags } = require('discord.js');
const { spawn } = require('child_process');
const fetch = require('node-fetch');
const { runInContext } = require('vm');
require("dotenv").config();

const token = process.env.BOT_TOKEN;
const prefix = '!';

// Criação do client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Conectar comandos da pasta botcommands
require('./botcommands/btop')(client, prefix);
require('./botcommands/buttonconflicts')(client);
require('./botcommands/help')(client, prefix);
require('./botcommands/ping')(client, prefix);
require('./botcommands/playerStatistics')(client, prefix);
require('./botcommands/leaderboard')(client, prefix);

// Lista de servidores
const servers = require('./servers.js');

// Processos ativos
let serverProcesses = {};
const logBuffers = {};

// Funções utilitárias
function splitMessage(content, maxLength = 2000) {
  const parts = [];
  while (content.length > maxLength) {
    let splitIndex = content.lastIndexOf('\n', maxLength);
    if (splitIndex === -1 || splitIndex < maxLength / 2) splitIndex = maxLength;
    parts.push(content.slice(0, splitIndex));
    content = content.slice(splitIndex);
  }
  if (content.length > 0) parts.push(content);
  return parts;
}

function adicionarNoBuffer(serverId, data) {
  const log = data.toString();
  const parts = splitMessage(log, 1900);
  if (!logBuffers[serverId]) logBuffers[serverId] = [];
  logBuffers[serverId].push(...parts);
}

async function enviarBuffer(channel, serverId) {
  const buffer = logBuffers[serverId] || [];
  if (buffer.length === 0) return;
  const allLogs = buffer.join('\n');
  logBuffers[serverId] = [];
  const mensagemCompleta = `\`\`\`\n${allLogs}\n\`\`\``;
  if (mensagemCompleta.length <= 2000) {
    await channel.send(mensagemCompleta);
  } else {
    const parts = splitMessage(allLogs, 1900);
    for (const part of parts) {
      await channel.send(`\`\`\`\n${part}\n\`\`\``);
    }
  }
}

async function getServerStatus(ip) {
  const response = await fetch(`https://api.mcsrvstat.us/3/${ip}`);
  return await response.json();
}

function startServer(server, interaction) {
  const proc = spawn('bash', [server.script], { cwd: server.directory, env: { LANG: 'en_US.UTF-8' } });
  serverProcesses[server.id] = proc;
  interaction.reply({ content: `Iniciando ${server.name}...` });

  proc.stdout.on('data', data => {
    console.log(`[${server.name}] ${data.toString()}`);
    adicionarNoBuffer(server.id, data);
  });

  proc.stderr.on('data', data => {
    console.error(`[${server.name} ERRO] ${data.toString()}`);
    adicionarNoBuffer(server.id, `[ERRO] ${data}`);
  });
}

function stopServer(server, interaction) {
  const proc = serverProcesses[server.id];
  if (proc) {
    proc.stdin.write('stop\n');
    proc.stdin.end();
    serverProcesses[server.id] = null;
    interaction.reply({ content: `${server.name} desligado.` });
  }
}

// --------------------------------------------------
// Inicialização do bot
client.once('ready', () => {
  console.log(`Bot online como ${client.user.tag}!`);
  client.user.setActivity({ name: '!help', type: ActivityType.Listening });
});

// Comandos e console
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Se não começa com prefixo, trata como comando para o console do servidor
  if (!message.content.startsWith(prefix)) {
    for (const s of servers) {
      if (message.channel.id === s.channelId && serverProcesses[s.id]) {
        serverProcesses[s.id].stdin.write(message.content + '\n');
      }
    }
    return;
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'start') {
    const row = new ActionRowBuilder().addComponents(
      servers.map(s => new ButtonBuilder()
        .setCustomId(`start_${s.id}`)
        .setLabel(`Iniciar ${s.name}`)
        .setStyle(ButtonStyle.Primary))
    );
    await message.channel.send({ content: 'Escolha qual servidor deseja iniciar:', components: [row] });
  }

  if (command === 'stop') {
    const row = new ActionRowBuilder().addComponents(
      servers.map(s => new ButtonBuilder()
        .setCustomId(`stop_${s.id}`)
        .setLabel(`Parar ${s.name}`)
        .setStyle(ButtonStyle.Danger))
    );
    await message.channel.send({ content: 'Escolha qual servidor deseja parar:', components: [row] });
  }

  if (command === 'status') {
  const statuses = await Promise.all(servers.map(s => getServerStatus(s.ip)));
  const embed = new EmbedBuilder().setTitle('Status dos Servidores Minecraft');

  servers.forEach((s, i) => {
    const st = statuses[i];
    let value;
    if (st.online) {
      value = `Jogadores Online: ${st.players.online}\nVersão: ${st.version}\nIP: ${s.ip}`;
      if (s.bluemap) { // só adiciona se existir
        value += `\nBluemap: ${s.bluemap}`;
      }
    } else {
      value = 'Servidor Offline\n``!start`` para ligar';
    }

    embed.addFields({ name: s.name, value });
  });

  embed.setColor(statuses.every(st => !st.online) ? 0xFF0000 : 0x00FF00);
  message.channel.send({ embeds: [embed] });
}


  if (command === 'ip') {
    const ips = servers.map(s => `**${s.name}**: ${s.ip}`).join('\n');
    message.channel.send({ content: ips });
  }
});

// Botões
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const [action, serverId] = interaction.customId.split('_');
  const server = servers.find(s => s.id === serverId);
  if (!server) return;

  if (action === 'start' && !serverProcesses[server.id]) {
    startServer(server, interaction);
  } else if (action === 'stop' && serverProcesses[server.id]) {
    stopServer(server, interaction);
  } else {
    interaction.reply({ content: 'Servidor já está nesse estado.', flags: MessageFlags.Ephemeral });
  }
});

// Logs periódicos
setInterval(async () => {
  for (const s of servers) {
    try {
      const channel = await client.channels.fetch(s.channelId);
      await enviarBuffer(channel, s.id);
    } catch (err) {
      console.error(`Erro ao enviar logs de ${s.name}:`, err);
    }
  }
}, 1000);

client.login(token);
