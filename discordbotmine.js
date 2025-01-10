const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType, EmbedBuilder } = require('discord.js');
const { spawn } = require('child_process');
const fetch = require('node-fetch');

// Configurações do bot
const token = 'BOT_TOKEN'; // Substitua pelo seu token
const prefix = '!';
const channelIdServerVanilla = 'ID'; // Canal de log do Servidor Vanilla
const channelIdServerMod = 'ID'; // Canal de log do Servidor Mod
const serverVanillaIP = 'IP'; // Substitua pelo IP do seu servidor Vanilla
const serverModIP = 'IP'; // Substitua pelo IP do seu servidor Mod

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Variáveis para armazenar os processos dos servidores
let serverVanillaProcess = null;
let serverModProcess = null;

// Função para dividir mensagens longas
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

// Definir codificação
process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');
process.stderr.setEncoding('utf8');

client.once('ready', () => {
    console.log(`Bot online como ${client.user.tag}!`);
    
    //Rich Presence
    client.user.setActivity({
        name: '!status',
        type: ActivityType.Listening,
    })
});

// Função para pegar status do servidor
async function getServerStatus(ip) {
    const response = await fetch(`https://api.mcsrvstat.us/3/${ip}`);
    const data = await response.json();
    return data;
}

client.on('messageCreate', async (message) => {
    // Ignorar mensagens do próprio bot ou de outros bots
    if (message.author.bot) return;

    // Ignorar mensagens fora do prefixo, exceto nos canais de log
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
        const row = new ActionRowBuilder()
            .addComponents(
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
            const stopRow = new ActionRowBuilder()
                .addComponents(
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

    // Comando para verificar o status dos servidores
    if (command === 'status') {
        const vanillaStatus = await getServerStatus(serverVanillaIP);
        const modStatus = await getServerStatus(serverModIP);

        // Definir cor do embed
        let embedColor = 0x00FF00; // Verde
        if (!vanillaStatus.online && !modStatus.online) {
            embedColor = 0xFF0000; // Vermelho
        }

        const statusEmbed = new EmbedBuilder()
            .setTitle('Status dos Servidores Minecraft')
            .addFields(
                { name: 'Servidor Vanilla', value: vanillaStatus.online ? 
                    `Jogadores Online: ${vanillaStatus.players.online}\n${vanillaStatus.version}\nIP: ${serverVanillaIP}\nBluemap: http://64.181.177.19:8100/` :
                    'Servidor Offline\n``!start`` para ligar' },
                { name: 'Servidor Mod', value: modStatus.online ? 
                    `Jogadores Online: ${modStatus.players.online}\n${modStatus.version}\nIP: ${serverModIP}\n Bluemap: http://64.181.177.19:8101/` :
                    'Servidor Offline\n``!start`` para ligar' }
            )
            .setColor(embedColor);

        message.channel.send({ embeds: [statusEmbed] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    try {
        const logChannelServerVanilla = await client.channels.fetch(channelIdServerVanilla);
        const logChannelServerMod = await client.channels.fetch(channelIdServerMod);

        if (interaction.customId === 'serverVanilla' && !serverVanillaProcess) {
            const serverVanillaPath = '/home/ubuntu/minecraftVanilla';
            const scriptName = 'iniciarserver.sh';
            serverVanillaProcess = spawn('bash', [scriptName], { cwd: serverVanillaPath, env: { LANG: 'en_US.UTF-8' } });

            await interaction.reply({ content: 'Iniciando o Servidor Vanilla...' });

            serverVanillaProcess.stdout.on('data', (data) => {
                const log = data.toString();
                console.log(`Servidor Vanilla - STDOUT: ${log}`);
                const messageParts = splitMessage(log, 1990);
                messageParts.forEach((part) => logChannelServerVanilla.send(`\`\`\`\n${part}\n\`\`\``));
            });

            serverVanillaProcess.stderr.on('data', (data) => {
                const log = data.toString();
                console.log(`Servidor Vanilla - STDERR: ${log}`);
                const messageParts = splitMessage(log, 1990);
                messageParts.forEach((part) => logChannelServerVanilla.send(`\`\`\`[ERRO]\n${part}\n\`\`\``));
            });

            serverVanillaProcess.on('close', (code) => {
                serverVanillaProcess = null;
                logChannelServerVanilla.send(`Servidor Vanilla foi encerrado com o código: ${code}`);
            });
        } else if (interaction.customId === 'serverVanilla') {
            if (!interaction.replied) {
                return await interaction.reply({ content: 'Servidor Vanilla online', ephemeral: true });
            }
        }

        if (interaction.customId === 'serverMod' && !serverModProcess) {
            const serverModPath = '/home/ubuntu/minecraftModpack';
            const scriptName = 'run.sh';
            serverModProcess = spawn('bash', [scriptName], { cwd: serverModPath, env: { LANG: 'en_US.UTF-8' } });

            await interaction.reply({ content: 'Iniciando o Servidor Mod...' });

            serverModProcess.stdout.on('data', (data) => {
                const log = data.toString();
                console.log(`Servidor Mod - STDOUT: ${log}`);
                const messageParts = splitMessage(log, 1990);
                messageParts.forEach((part) => logChannelServerMod.send(`\`\`\`\n${part}\n\`\`\``));
            });

            serverModProcess.stderr.on('data', (data) => {
                const log = data.toString();
                console.log(`Servidor Mod - STDERR: ${log}`);
                const messageParts = splitMessage(log, 1990);
                messageParts.forEach((part) => logChannelServerMod.send(`\`\`\`[ERRO]\n${part}\n\`\`\``));
            });

            serverModProcess.on('close', (code) => {
                serverModProcess = null;
                logChannelServerMod.send(`Servidor Mod foi encerrado com o codigo: ${code}`);
            });
        } else if (interaction.customId === 'serverMod') {
            if (!interaction.replied) {
                return await interaction.reply({ content: 'Servidor Mod online', ephemeral: true });
            }
        }

        if (interaction.customId === 'stop_serverVanilla' && serverVanillaProcess) {
            serverVanillaProcess.stdin.write('stop\n');
            serverVanillaProcess.stdin.end();
            serverVanillaProcess = null;
            if (!interaction.replied) {
                return await interaction.reply({ content: 'Comando "stop" enviado para o Servidor Vanilla.' });
            }
        } else if (interaction.customId === 'stop_serverMod' && serverModProcess) {
            serverModProcess.stdin.write('stop\n');
            serverModProcess.stdin.end();
            serverModProcess = null;
            if (!interaction.replied) {
                return await interaction.reply({ content: 'Comando "stop" enviado para o Servidor Mod.' });
            }
        } else {
            if (!interaction.replied) {
                return await interaction.reply({ content: 'Servidor offline', ephemeral: true });
            }
        }
    } catch (error) {
        console.error('Erro ao processar a interação:', error);
        if (!interaction.deferred && !interaction.replied) {
            await interaction.reply({ content: 'Ocorreu um erro ao processar a interação.', ephemeral: true });
        }
    }
});


// Login do bot
client.login(token);
