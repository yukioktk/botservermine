const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    // Certifique-se de que a fun��o seja declarada como ass�ncrona
    if (message.author.bot) return;

    if (message.content === '!help') {
      const embed = new EmbedBuilder()
      .setAuthor({
        name: "Comandos",
      })
      .addFields(
        {
          name: "Servidor de Minecraft",
          value: "**status**: Detalhes dos servidores de Minecraft ||[API](https://api.mcsrvstat.us/)||\n**start**: Iniciar o servidor de Minecraft\n**stop**: Desligar o servidor de Minecraft",
          inline: false
        },
        {
          name: "Estatísticas Minecraft",
          value: "**player**: Exibir as estatísticas dos jogadores\n**uuid**: Registrar um usuário na UUID\n**uuidmapping**: Mostrar todas as UUIDs registradas\n**uuiddelete**: Deletar um nome registrado",
          inline: false
        },
        {
          name: "Máquina",
          value: "**btop**: Monitor de recursos\n**ping**: Pong",
          inline: false
        },
      )
      .setThumbnail("https://cdn.discordapp.com/avatars/1327335734327378093/29e94dde15167e91c4d4a01556fdc338.png?size=2048")
      .setColor("#00b0f4")
      .setFooter({
        text: "_.kido",
        iconURL: "https://cdn.discordapp.com/avatars/250691091316080640/a_30062dd7db24baa621384a435bb41307.gif?size=2048",
      });
    
    await message.channel.send({ embeds: [embed] });
    }
  });
};
