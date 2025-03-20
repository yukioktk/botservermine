module.exports = (client) => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    // Bot�es relacionados a comandos de servidores
    const serverButtonIds = ['serverVanilla', 'serverMod', 'stop_serverVanilla', 'stop_serverMod'];
    if (serverButtonIds.includes(customId)) {
      if (typeof global.handleServerButton === 'function') {
        return global.handleServerButton(interaction);
      } else {
        console.error('global.handleServerButton n�o est� definido.');
        return;
      }
    }

    // Bot�o do btop
    if (customId === 'stopBtop') {
      const { handleButtonInteraction: handleBtopButton } = require('./btop');
      if (typeof handleBtopButton === 'function') {
        return handleBtopButton(interaction);
      } else {
        console.error('handleBtopButton n�o foi encontrado em ./btop.');
        return;
      }
    }

    // Log para IDs n�o tratados
    console.log(`Intera��o com customId "${customId}" n�o foi tratada.`);
  });
};
