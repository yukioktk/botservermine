module.exports = (client) => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    // Botões relacionados a comandos de servidores
    const serverButtonIds = ['serverVanilla', 'serverMod', 'stop_serverVanilla', 'stop_serverMod'];
    if (serverButtonIds.includes(customId)) {
      if (typeof global.handleServerButton === 'function') {
        return global.handleServerButton(interaction);
      } else {
        console.error('global.handleServerButton não está definido.');
        return;
      }
    }

    // Botão do btop
    if (customId === 'stopBtop') {
      const { handleButtonInteraction: handleBtopButton } = require('./btop');
      if (typeof handleBtopButton === 'function') {
        return handleBtopButton(interaction);
      } else {
        console.error('handleBtopButton não foi encontrado em ./btop.');
        return;
      }
    }

    // Log para IDs não tratados
    console.log(`Interação com customId "${customId}" não foi tratada.`);
  });
};
