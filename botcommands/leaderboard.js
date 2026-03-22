const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const mappingFilePath = path.join(__dirname, 'uuid_mapping.json');

function loadMapping() {
  if (!fs.existsSync(mappingFilePath)) return {};
  return JSON.parse(fs.readFileSync(mappingFilePath, 'utf-8'));
}

function getStatsFromFile(statsPath, uuid) {
  const filePath = path.join(statsPath, `${uuid}.json`);
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, 'utf-8');
  const extract = (key) => {
    const match = content.match(new RegExp(`"${key}":(\\d+)`));
    return match ? parseInt(match[1], 10) : 0;
  };

  return {
    deaths: extract('minecraft:deaths'),
    playTime: extract('minecraft:play_time'),
    mobKills: extract('minecraft:mob_kills'),
    jumps: extract('minecraft:jump'),
  };
}

module.exports = (client, prefix) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    if (command === 'leaderboard') {
      const basePath = '/home/ubuntu/minecraftVanilla/world'; // ou Modpack, se quiser alternar
      const statsPath = path.join(basePath, 'stats');
      const mapping = loadMapping();

      const leaderboardData = {
        deaths: [],
        playTime: [],
        mobKills: [],
        jumps: []
      };

      for (const uuid of Object.keys(mapping)) {
        const stats = getStatsFromFile(statsPath, uuid);
        const name = mapping[uuid].name || uuid;

        leaderboardData.deaths.push({ name, value: stats.deaths });
        leaderboardData.playTime.push({ name, value: (stats.playTime / (20 * 60 * 60)).toFixed(2) }); // horas
        leaderboardData.mobKills.push({ name, value: stats.mobKills });
        leaderboardData.jumps.push({ name, value: stats.jumps });
      }

      // Ordena cada categoria
      for (const key in leaderboardData) {
        leaderboardData[key].sort((a, b) => b.value - a.value);
      }

      const statOptions = [
        { label: 'Mortes', value: 'deaths' },
        { label: 'Tempo de jogo (horas)', value: 'playTime' },
        { label: 'Monstros mortos', value: 'mobKills' },
        { label: 'Pulos realizados', value: 'jumps' }
      ];

      const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('statSelect')
          .setPlaceholder('Escolha a estatística')
          .addOptions(statOptions)
      );

      const reply = await message.channel.send({
        content: 'Selecione uma estatística para ver o ranking:',
        components: [selectMenu]
      });

      const collector = reply.createMessageComponentCollector({
        filter: (i) => i.customId === 'statSelect' && i.user.id === message.author.id,
        time: 60000
      });

      collector.on('collect', async (interaction) => {
        await interaction.deferUpdate();
        const statKey = interaction.values[0];
        const data = leaderboardData[statKey];

        const description = data.map((entry, index) => `**${index + 1}.** ${entry.name} — \`${entry.value}\``).join('\n');

        const embed = new EmbedBuilder()
          .setTitle(`🏆 Ranking por ${statOptions.find(o => o.value === statKey).label}`)
          .setDescription(description || 'Nenhum dado disponível.')
          .setColor('#f1c40f');

        await interaction.editReply({ embeds: [embed], components: [selectMenu] });
      });
    }
  });
};
