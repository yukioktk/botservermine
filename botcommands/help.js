const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    // Certifique-se de que a função seja declarada como assíncrona
    if (message.author.bot) return;

    if (message.content === '!help') {
      const embed = new EmbedBuilder()
        .setTitle("Comandos")
        .setDescription(
          "**status**: Detalhes dos servidores de Minecraft ||[API](https://api.mcsrvstat.us/)||\n" +
          "**start**: Iniciar o servidor de Minecraft\n" +
          "**stop**: Desligar o servidor de Minecraft\n" +
          "**btop**: Monitor de recursos\n" +
	  "**ping**: Pong"
        )
        .setThumbnail("https://cdn.discordapp.com/avatars/1327335734327378093/29e94dde15167e91c4d4a01556fdc338.png?size=2048")
        .setColor("#000000")
        .setFooter({
          text: "_.kido",
          iconURL: "https://cdn.discordapp.com/avatars/250691091316080640/a_30062dd7db24baa621384a435bb41307.gif?size=2048",
        });

      await message.channel.send({ embeds: [embed] });
    }
  });
};
