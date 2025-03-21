const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const nbt = require('nbt'); // Biblioteca para lidar com arquivos NBT

const mappingFilePath = path.join(__dirname, 'uuid_mapping.json');

function loadMapping() {
  if (!fs.existsSync(mappingFilePath)) return {};
  try {
    const content = fs.readFileSync(mappingFilePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Erro ao ler o arquivo de mapeamento:", err);
    return {};
  }
}

function saveMapping(mapping) {
  try {
    fs.writeFileSync(mappingFilePath, JSON.stringify(mapping, null, 2), 'utf-8');
  } catch (err) {
    console.error("Erro ao salvar o arquivo de mapeamento:", err);
  }
}

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    // Comando !uuid
    if (command === '!uuid') {
      if (args.length < 3) { // Verifica os argumentos
        message.channel.send("Uso incorreto. Exemplo: `!uuid <uuid> <nome> <userIDdiscord>`");
        return;
      }
      const uuid = args[0];
      const customName = args[1];
      const userIdDiscord = args[2];

      const mapping = loadMapping();
      mapping[uuid] = { name: customName, userId: userIdDiscord }; // Salva UUID, nome e User ID
      saveMapping(mapping);

      message.channel.send(`Mapping registrado: \`${uuid}\` foi configurado como **${customName}** com o Discord ID: \`${userIdDiscord}\``);
      return;
    }


    // Comando !uuiddelete
if (command === '!uuiddelete') {
  if (args.length < 1) {
    message.channel.send("Uso incorreto. Exemplo: `!uuiddelete <uuid>`");
    return;
  }
  const uuid = args[0];
  const mapping = loadMapping();

  if (!mapping[uuid]) {
    message.channel.send(`A UUID \`${uuid}\` não está registrada.`);
    return;
  }

  delete mapping[uuid]; // Remove a entrada da UUID do mapeamento
  saveMapping(mapping); // Salva o mapeamento atualizado

  message.channel.send(`A UUID \`${uuid}\` e suas informações associadas foram removidas com sucesso.`);
  return;
}



    // Comando !uuidmapping
if (command === '!uuidmapping') {
  const mapping = loadMapping();
  const entries = Object.entries(mapping);
  if (entries.length === 0) {
    message.channel.send("Nenhuma UUID registrada.");
    return;
  }
  
  let description = "";
  for (const [uuid, data] of entries) {
    const discordProfile = data.userId ? `<@${data.userId}>` : "Usuário não registrado";
    description += `**Nome:** ${data.name}\n**UUID:** ${uuid}\n**Discord:** ${discordProfile}\n\n`;
  }

  const embed = new EmbedBuilder()
    .setTitle("UUID Mapping Registrado")
    .setDescription(description)
    .setColor("#3498db");

  message.channel.send({ embeds: [embed] });
  return;
}


    // Comando !player
    if (command === '!player') {
      const serverSelectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('serverSelect')
          .setPlaceholder('Selecione o servidor')
          .addOptions([
            { label: 'Vanilla', value: 'Vanilla' },
            { label: 'Modpack', value: 'Modpack' },
          ])
      );

      const replyMessage = await message.channel.send({
        content: 'Escolha o servidor:',
        components: [serverSelectMenu],
      });

      const serverCollector = replyMessage.createMessageComponentCollector({
        filter: (i) => i.customId === 'serverSelect' && i.user.id === message.author.id,
        time: 30000,
      });

      serverCollector.on('collect', async (serverInteraction) => {
        await serverInteraction.deferUpdate();

        const selectedServer = serverInteraction.values[0];
        const basePath =
          selectedServer === 'Vanilla'
            ? '/home/ubuntu/minecraftVanilla/world'
            : '/home/ubuntu/minecraftModpack/world';

        const statsPath = path.join(basePath, 'stats');
        const playerdataPath = path.join(basePath, 'playerdata');

        let playerFiles;
        try {
          playerFiles = fs.readdirSync(statsPath).filter((file) => file.endsWith('.json'));
        } catch (err) {
          console.error("Erro ao ler a pasta stats:", err);
          await serverInteraction.editReply({
            content: 'Erro ao acessar a pasta stats do servidor.',
            components: [],
          });
          return;
        }

        const mapping = loadMapping();

        let playerOptions = playerFiles.map((file) => {
          const playerId = path.basename(file, '.json');
          const label = mapping[playerId] ? mapping[playerId].name : playerId;
          return { label, value: playerId, registered: Boolean(mapping[playerId]) };
        });

        playerOptions.sort((a, b) => {
          if (a.registered && !b.registered) return -1;
          if (!a.registered && b.registered) return 1;
          return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
        });

        if (playerOptions.length === 0) {
          await serverInteraction.editReply({
            content: 'Nenhum jogador encontrado neste servidor.',
            components: [],
          });
          return;
        }

        const playerSelectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('playerSelect')
            .setPlaceholder('Selecione um jogador')
            .addOptions(playerOptions.map(({ label, value }) => ({ label, value })))
        );

        await serverInteraction.editReply({
          content: 'Escolha o jogador:',
          components: [playerSelectMenu],
        });

        const playerCollector = replyMessage.createMessageComponentCollector({
          filter: (i) => i.customId === 'playerSelect' && i.user.id === serverInteraction.user.id,
          time: 30000,
        });

        playerCollector.on('collect', async (playerInteraction) => {
          await playerInteraction.deferUpdate();

          const selectedPlayer = playerInteraction.values[0];
          const statsFile = path.join(statsPath, `${selectedPlayer}.json`);

          let playTime = 0, deaths = 0, mobKills = 0;
          if (fs.existsSync(statsFile)) {
            try {
              const statsContent = fs.readFileSync(statsFile, 'utf-8');
              const playTimeMatch = statsContent.match(/"minecraft:play_time":(\d+)/);
              const deathsMatch = statsContent.match(/"minecraft:deaths":(\d+)/);
              const mobKillsMatch = statsContent.match(/"minecraft:mob_kills":(\d+)/);
              playTime = playTimeMatch ? parseInt(playTimeMatch[1], 10) : 0;
              deaths = deathsMatch ? parseInt(deathsMatch[1], 10) : 0;
              mobKills = mobKillsMatch ? parseInt(mobKillsMatch[1], 10) : 0;
            } catch (error) {
              console.error(`Erro ao ler o arquivo JSON: ${statsFile}`, error);
              await playerInteraction.editReply({
                content: 'Erro ao carregar as estatísticas do jogador.',
                components: [],
              });
              return;
            }
          } else {
            await playerInteraction.editReply({
              content: 'O arquivo de estatísticas do jogador não foi encontrado.',
              components: [],
            });
            return;
          }

          const horasDeJogo = (playTime / (20 * 60 * 60)).toFixed(2);


          let walkDistance = 0, sprintDistance = 0, jumps = 0, elytraDistance = 0, flyDistance = 0;

          if (fs.existsSync(statsFile)) {
            try {
              const statsContent = fs.readFileSync(statsFile, 'utf-8');
              const walkMatch = statsContent.match(/"minecraft:walk_one_cm":(\d+)/);
              const sprintMatch = statsContent.match(/"minecraft:sprint_one_cm":(\d+)/);
              const jumpMatch = statsContent.match(/"minecraft:jump":(\d+)/);
              const elytraMatch = statsContent.match(/"minecraft:aviate_one_cm":(\d+)/);
              const flyMatch = statsContent.match(/"minecraft:fly_one_cm":(\d+)/);
          
              walkDistance = walkMatch ? parseInt(walkMatch[1], 10) / 100 : 0; // Convertendo de cm para m
              sprintDistance = sprintMatch ? parseInt(sprintMatch[1], 10) / 100 : 0; // Convertendo de cm para m
              jumps = jumpMatch ? parseInt(jumpMatch[1], 10) : 0; // Mantendo em número de pulos
              elytraDistance = elytraMatch ? parseInt(elytraMatch[1], 10) / 100 : 0; // Convertendo de cm para m
              flyDistance = flyMatch ? parseInt(flyMatch[1], 10) / 100 : 0; // Convertendo de cm para m
            } catch (error) {
              console.error(`Erro ao ler o arquivo JSON: ${statsFile}`, error);
            }
          }
          
          

          let xpLevel = 0, health = 0;
          const playerdataFiles = fs.readdirSync(playerdataPath).filter((file) => file.endsWith('.dat'));
          const nbtFile = playerdataFiles.find((file) => file.includes(selectedPlayer));
          if (nbtFile) {
            const nbtFilePath = path.join(playerdataPath, nbtFile);
            const nbtBuffer = fs.readFileSync(nbtFilePath);
            await new Promise((resolve) => {
              nbt.parse(nbtBuffer, (error, data) => {
                if (error) {
                  console.error('Erro ao ler o arquivo NBT:', error);
                  resolve();
                } else {
                  const playerData = data.value;
                  xpLevel = playerData?.XpLevel || 0;
                  if (typeof xpLevel === 'object' && xpLevel !== null) {
                    xpLevel = xpLevel.value || 0;
                  }
                  health = playerData?.Health?.value || playerData?.Health || 0;
                  resolve();
                }
              });
            });
          }

          const updatedMapping = loadMapping();
          const playerData = updatedMapping[selectedPlayer];
          const displayName = playerData ? playerData.name : selectedPlayer;
          const userId = playerData ? playerData.userId : null;

          const embed = new EmbedBuilder()
            .setTitle(`Estatísticas de ${displayName}`)
            .addFields(
                [
                    { name: 'Perfil do Discord', value: userId ? `<@${userId}>` : 'Usuário não registrado', inline: false },
                    { name: 'Tempo de jogo', value: `${horasDeJogo} horas`, inline: true },
                    { name: 'Nível de experiência', value: `${xpLevel}`, inline: true },
                    { name: 'Vida', value: `${health}`, inline: true },
                    { name: 'Mortes', value: `${deaths}`, inline: true },
                    { name: 'Monstros mortos', value: `${mobKills}`, inline: true },
                    { name: 'Pulos realizados', value: `${jumps}`, inline: true },
                    { name: 'Distância caminhada', value: `${walkDistance.toFixed(2)} blocos`, inline: true },
                    { name: 'Distância corrida', value: `${sprintDistance.toFixed(2)} blocos`, inline: true },
                    { name: 'Distância com elytra', value: `${elytraDistance.toFixed(2)} blocos`, inline: true },
                    { name: 'Distância de voo', value: `${flyDistance.toFixed(2)} blocos`, inline: true   }
                  ])
                  const user = await client.users.fetch(userId).catch(() => null); // Busca o usuário ou retorna null se não encontrado
                  const userAvatar = user ? user.avatar : null;
                  embed.setThumbnail(userAvatar ? `https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.png` : null);
                  embed.setColor('#3498db')
                  embed.setFooter({ text: `Servidor: ${selectedServer}` }); // Mostra o servidor no rodapé
                  
      
                await playerInteraction.editReply({
                  content: null,
                  embeds: [embed],
                  components: [],
                });
              });
            });
          }
        });
      };
      