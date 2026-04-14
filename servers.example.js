/* Templates
const servers = [
  {
    id: 'vanilla',
    name: 'Servidor Vanilla',
    ip: '12.123.123.12',
    directory: '/home/ubuntu/minecraftVanilla',
    script: 'iniciarserver.sh',
    channelId: '999999999999999',   // Discord channel id para os logs do console
    bluemap: 'http://12.123.123.12:8100/'  // (opcional) se tiver o plugin bluemap, a url para acessá-lo
  },
  {
    id: 'mod',
    name: 'Servidor Modpack',
    ip: '64.181.177.19:25566',
    directory: '/home/ubuntu/minecraftModpack',
    script: 'run.sh',
    channelId: '999999999999999999',
  }
];
*/
const servers = [
  {
    id: 'vanilla',
    name: 'Servidor Vanilla',
    ip: '12.123.123.12',
    directory: '/home/ubuntu/minecraftVanilla',
    script: 'iniciarserver.sh',
    channelId: '999999999999999',
    bluemap: 'http://12.123.123.12:8100/'
  }
];

module.exports = servers;