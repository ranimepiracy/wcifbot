import { Log } from '@callmekory/logger'
import { findFilesByType } from '@callmekory/utils'
import { Client } from 'discord.js'
import path, { join, normalize } from 'path'

/**
 * Loads and assigns events to their handlers
 * @param client Discord client
 */
export const loadEvents = (client: Client) => {
  // Load all files from events folder
  const eventFiles = findFilesByType(normalize(join(__dirname, '..', '..', 'events')), 'js')

  // Loop over, load and assign them to their respective events
  // Event file names are named the same as the event name for clarify
  for (const eventFile of eventFiles) {
    // Import event function
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const eventFunction = require(eventFile).default
    const eventName = path.basename(eventFile).split('.')[0]

    try {
      // Assign our event to the event emit event
      client.on(eventName, (...args) => void eventFunction(...args, client))
    } catch (err) {
      Log.error(`Event Error [ ${eventFile} ]`, err)
    }
  }

  Log.ok(`Loaded [ ${eventFiles.length} ] events`)
}
