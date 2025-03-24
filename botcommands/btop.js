const si = require('systeminformation');
const { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} = require('discord.js');

// Função para criar uma barra de progresso usando caracteres ASCII
function createProgressBar(percentage, size = 20) {
  const complete = Math.round((percentage / 100) * size);
  const incomplete = size - complete;
  return '#'.repeat(complete) + '-'.repeat(incomplete);
}

// Função que coleta e formata as métricas do sistema
async function getSystemStats() {
  const cpuData = await si.currentLoad();
  const memData = await si.mem();
  const fsData = await si.fsSize();

  // Coleta o uptime usando systeminformation
  const uptimeSeconds = si.time().uptime; // Tempo de atividade do sistema em segundos
  const uptimeHours = Math.floor(uptimeSeconds / 3600) || 0; // Garante valor numérico
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60) || 0; // Garante valor numérico
  const uptimeText = `${uptimeHours} horas e ${uptimeMinutes} minutos`;

  const cpuUsage = cpuData.currentLoad.toFixed(1);
  const cpuBar = createProgressBar(cpuUsage);

  const memUsage = ((memData.active / memData.total) * 100).toFixed(1);
  const memBar = createProgressBar(memUsage);
  const totalMemGB = (memData.total / 1073741824).toFixed(2);
  const usedMemGB = (memData.used / 1073741824).toFixed(2);
  const memText = `Total: ${totalMemGB} GB\nUsado: ${usedMemGB} GB`;

  const diskUsagePercent = fsData[0].use.toFixed(1);
  const diskBar = createProgressBar(diskUsagePercent);
  const totalDiskGB = (fsData[0].size / 1073741824).toFixed(2);
  const usedDiskGB = (fsData[0].used / 1073741824).toFixed(2);
  const freeDiskGB = ((fsData[0].size - fsData[0].used) / 1073741824).toFixed(2);
  const diskText = `Total: ${totalDiskGB} GB\nUsado: ${usedDiskGB} GB\nLivre: ${freeDiskGB} GB`;

  return { cpuUsage, memUsage, diskUsagePercent, cpuBar, memBar, diskBar, memText, diskText, uptimeText };
}

const btopMonitors = new Map();

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    if (message.content === '!btop') {
      const statsMessage = await message.channel.send({
        embeds: [new EmbedBuilder().setDescription('Carregando monitor de recursos...')]
      });

      const pararButton = new ButtonBuilder()
        .setCustomId('stopBtop')
        .setLabel('Parar')
        .setStyle(ButtonStyle.Danger);
      const row = new ActionRowBuilder().addComponents(pararButton);

      const updateStats = async () => {
        try {
          const stats = await getSystemStats();
          const statsEmbed = new EmbedBuilder()
            .setTitle("Monitor de Recursos")
            .addFields(
              { name: "RAM", value: `${stats.memUsage}%\n[${stats.memBar}]\n${stats.memText}`, inline: true },
              { name: "CPU", value: `${stats.cpuUsage}%\n[${stats.cpuBar}]`, inline: true },
              { name: "Armazenamento", value: `Uso: ${stats.diskUsagePercent}%\n[${stats.diskBar}]\n${stats.diskText}`, inline: false },
              { name: "Uptime", value: stats.uptimeText, inline: false }
            )
            .setColor("Blue")
            .setTimestamp();
          await statsMessage.edit({ embeds: [statsEmbed], components: [row] });
        } catch (err) {
          console.error('Erro ao obter estatásticas:', err);
        }
      };

      const intervalId = setInterval(updateStats, 1000);
      btopMonitors.set(statsMessage.id, { intervalId, message: statsMessage });

      setTimeout(async () => {
        if (btopMonitors.has(statsMessage.id)) {
          clearInterval(intervalId);
          btopMonitors.delete(statsMessage.id);
          const finalEmbed = new EmbedBuilder()
            .setDescription("Monitoramento finalizado automaticamente.")
            .setColor("Red")
            .setTimestamp();
          await statsMessage.edit({ embeds: [finalEmbed], components: [] });
        }
      }, 120000);
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'stopBtop') {
      const monitor = btopMonitors.get(interaction.message.id);
      if (monitor) {
        clearInterval(monitor.intervalId);
        btopMonitors.delete(interaction.message.id);
        const finalEmbed = new EmbedBuilder()
          .setDescription("Monitoramento finalizado.")
          .setColor("Red")
          .setTimestamp();
        await interaction.message.edit({ embeds: [finalEmbed], components: [] });

        if (!interaction.replied && !interaction.deferred) {
          await interaction.deferUpdate();
        }
      } else {
        console.log('Monitoramento já foi finalizado, ignorando interação.');
      }
    }
  });
};
