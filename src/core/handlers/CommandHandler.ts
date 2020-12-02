import { Log } from '@callmekory/logger'
import { findFilesByType } from '@callmekory/utils'
import { Message } from 'discord.js'
import Enmap from 'enmap'
import { join, normalize } from 'path'

import { Command } from '../Command'
import { validUsage, warningMessage } from '../utils/messageUtils'

export class CommandHandler {
  public commands: Enmap<string, Command>

  public aliases: Enmap<string, Command>

  public prefix: string

  public ownerID: string

  public loadedCommands: number

  public cooldowns: Enmap<string, Enmap<string, number>>

  public constructor() {
    this.commands = new Enmap()
    this.aliases = new Enmap()
    this.loadedCommands = 0
    this.cooldowns = new Enmap()
  }

  public init() {
    this.loadCommands()
    return this
  }

  /**
   * Loads commands
   */
  public loadCommands() {
    const cmdFiles = findFilesByType(normalize(join(__dirname, '..', '..', 'commands')), '.js')

    for (const file of cmdFiles) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const cmd = require(file).default
      const instance = new cmd() as Command

      const commandName = instance._name.toLowerCase()

      instance.location = file

      if (instance.isEnabled) {
        if (this.commands.has(commandName)) {
          Log.warn('Start Module', `"${commandName}" already exists!`)
          throw new Error('Commands cannot have the same name')
        }

        instance.aliases.forEach((alias: string) => {
          if (this.aliases.has(alias)) {
            throw new Error(`Commands cannot share aliases: ${instance._name} has ${alias}`)
          }

          this.aliases.set(alias, instance)
        })

        this.commands.set(commandName.toLowerCase(), instance)
        this.loadedCommands++
      }
    }

    Log.ok(`Loaded [ ${this.loadedCommands} ] commands`)
  }

  /**
   * Runs specified command
   * @param client Client
   * @param command
   * @param msg
   * @param args
   * @returns
   */
  public runCommand(msg: Message, command: Command, args?: string[]) {
    msg.channel.startTyping()
    command.run(msg, args)
    return setTimeout(() => msg.channel.stopTyping(true), 1000)
  }

  /**
   * Finds and return specified command
   * @param commandName Command to get
   */
  public findCommand(commandName: string): Command {
    return this.commands.get(commandName.toLowerCase()) || this.aliases.get(commandName.toLowerCase())
  }

  /**
   * Handles message
   * @param msg Message
   * @param client Client
   */
  // eslint-disable-next-line complexity
  public async parseCommand(msg: Message) {
    const { content, author, channel, client } = msg
    if (author.bot) return

    // * ----- Load Config -----------------------------------------------

    // Assign prefix
    this.prefix = client.config.prefix

    if (!content.startsWith(this.prefix)) return

    // * ----- Find Command ----------------------------------------------

    // Split args from message and remove empty items from array. ex: double spaces
    const args = content.split(' ').filter((a) => a)
    const commandName = args.shift().toLowerCase().slice(this.prefix.length)

    // * ----- Check if command is locked ------------------------------

    // Find command and if it doesn't exist do nothing
    const command = this.findCommand(commandName)
    if (!command) return

    msg.client.p = this.prefix
    msg.p = this.prefix
    msg.context = this

    // * ----- Check if Guild Only ---------------------------------------

    if (command.isGuildOnly && channel.type !== 'text') {
      Log.info(`${msg.author.tag} tried to run ${msg.content} in a DM`)

      return warningMessage(msg, 'This command can only be ran inside the Discord server')
    }

    // * ----- Check if DM Only ------------------------------------------

    if (command.isDmOnly && channel.type !== 'dm') {
      await msg.reply("This command can only be ran by DM'ing me.").then((m) => m.delete({ timeout: 5000 }))
      return Log.info(`User ${author.username} tried to run DM only command ${commandName} in a guild`)
    }

    // * ----- Check if Missing Arguments --------------------------------

    if (command.argumentRequired && !args.length) {
      Log.info(`${author.tag}|${author.id} tried to run ${command._name} without parameters`)
      return validUsage(msg, command)
    }

    // * ----- Run Command -----------------------------------------------

    Log.info(`${author.tag} ran ${content}`)

    // Run command
    return this.runCommand(msg, command, args)
  }
}
