import { Log } from '@callmekory/logger/lib'
import { existsSync, promises as fs } from 'fs'
import { join, normalize } from 'path'

import { CONFIG } from '../../CONSTANTS'
import { ClientConfig } from '../../typings'

export const getClientConfig = async () => {
  // Ensure we have a bot config file
  if (!existsSync(CONFIG.BOT)) {
    await fs.writeFile(CONFIG.BOT, JSON.stringify({ prefix: '?', token: '' }, null, 2))
  }

  const config = JSON.parse(await fs.readFile(CONFIG.BOT, { encoding: 'utf8' }))

  return config as ClientConfig
}

/**
 * Removes the additional 250ms slowdown on discord.js reactions
 */
export const removeReactionSlowdown = async () => {
  const filePath = normalize(join(__dirname, '..', '..', '..', 'node_modules/discord.js/src/rest/RequestHandler.js'))

  const file = await fs.readFile(filePath, { encoding: 'utf8' })

  const found = file.match(/getAPIOffset\(serverDate\) \+ 250/gim)

  if (found) {
    Log.info('Removing additional 250ms timeout for reactions.\nWill need to restart process for changes to take effect.')
    const newFile = file.replace(/getAPIOffset\(serverDate\) \+ 250/gim, 'getAPIOffset(serverDate)')
    await fs.writeFile(filePath, newFile, { encoding: 'utf8' })
    return process.exit()
  }
}
