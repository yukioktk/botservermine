const { EmbedBuilder } = require('discord.js');

module.exports = (client, prefix) => {
  client.on('messageCreate', async (message) => {
    // Ignora mensagens de outros bots
    if (message.author.bot) return;
    
    const command = message.content.slice(prefix.length).toLowerCase().trim();

    // Detecta o comando "ping"
    if (command === `ping`) {
      // Mede o tempo inicial antes de responder
      const startTime = Date.now();

      // Primeiro, envia uma mensagem inicial
      const sentMessage = await message.channel.send("Calculando ping...");

      // Calcula o ping WebSocket (tempo entre bot e Discord)
      const websocketPing = client.ws.ping;

      // Calcula o ping geral (tempo para ida e volta, round trip)
      const roundTripPing = Date.now() - startTime;

      // Cria um embed com os resultados
      const embed = new EmbedBuilder()
        .setTitle(":ping_pong:  Pong!")
        .addFields(
          { name: "WebSocket Ping", value: `${websocketPing}ms`, inline: true },
          { name: "Client Ping", value: `${roundTripPing}ms`, inline: true }
        )
        .setColor("Green")
        .setTimestamp();

      // Edita a mensagem original para mostrar os resultados
      await sentMessage.edit({ content: " ", embeds: [embed] });
    }
  });
};
