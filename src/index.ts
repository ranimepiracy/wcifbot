import { Log } from '@callmekory/logger'
import clear from 'clear'
import Discord, { Client } from 'discord.js'

import { CommandHandler } from './core/handlers/CommandHandler'
import { loadEvents } from './core/utils/startupUtils'
import { getClientConfig, removeReactionSlowdown } from './core/utils/utils'

clear()

const client = new Client({
  ws: { intents: new Discord.Intents(Discord.Intents.ALL) }
})

getClientConfig().then(async (config) => {
  await removeReactionSlowdown()
  client.config = config
  client.login(config.token)
})

client.once('ready', async () => {
  Log.header('WCIF Bot').green()
  Log.ok(`Connected as [ ${client.user.tag} ]`)
  client.user.setActivity({ name: `${client.config.prefix}`, type: 'LISTENING' })
  client.commandHandler = new CommandHandler().init()
  loadEvents(client)

  console.log(await client.generateInvite())
  Log.ok(`Startup Complete\n`)
})

// Unhandled Promise Rejections
process.on('unhandledRejection', (reason: any) => Log.error('UnhandledRejection', reason))
