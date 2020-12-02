import { groupByProperty } from '@callmekory/utils/lib'
import { Message } from 'discord.js'

import { Command } from '../core/Command'
import { Embed } from '../core/utils/Embed'
import { validUsage, warningMessage } from '../core/utils/messageUtils'
import { Paginator } from '../core/utils/Paginator'

/**
 * Command to get information on what other commands are available and how to use them
 */
export default class Help extends Command {
  private msg: Message

  private lockedCommands: { commandName: string; commandString: string }[]

  public constructor() {
    super({
      _name: 'help',
      category: 'Community',
      description: 'Get help on command usage',
      isGuildOnly: true,
      isShownInHelp: false,
      usage: [
        {
          description: 'Get help on a specific command',
          usage: 'help <command>'
        }
      ]
    })
  }

  public async run(msg: Message, args: string[]) {
    this.msg = msg

    // Show individual command's help if specified
    if (args[0]) return this.showIndividualCommand(args[0])

    // Else show all commands
    return this.showAllCommands()
  }

  /**
   * Shows all commands and descriptions
   */
  private async showAllCommands() {
    // Load server database for guild
    const { p: prefix } = this.msg

    // Filter commands based on author access
    const commands = this.msg.context.commands.filter((command: Command) => this.checkUserPerms(command))

    // Sort commands alphabetically by name
    const sorted = commands.array().sort((a, b) => Number(b._name) - Number(a._name))

    // Split commands into category groups
    const splitByCategory = groupByProperty(sorted, 'category')

    // Generate embed list
    const embedList = Object.keys(splitByCategory).map((key: string) => {
      const e = new Embed(this.msg, { image: 'faq.png' })
        .setTitle(`Help - ${key} commands`)
        .setDescription(`Showing commands that you have access to.\n\`${prefix}help <command>\` for command usage`)

      // Add command name and description to description variable
      splitByCategory[key].forEach((i: Command) => {
        e.addField(`${this.msg.p}${i._name}`, i.description, true)
      })
      return e
    })

    // Return help embed
    return new Paginator(this.msg, embedList).send()
  }

  /**
   * Shows help for a individual command
   * @param targetCommand command the user wants help on
   */
  private async showIndividualCommand(targetCommand: string) {
    // Find command by name
    const command = this.msg.context.findCommand(targetCommand)

    // If command exists and user has perms for it show them the help embed
    if (command && this.checkUserPerms(command)) {
      return validUsage(this.msg, command)
    } else {
      return warningMessage(this.msg, `No command named: ${targetCommand}`, { image: 'faq.png' })
    }
  }

  /**
   * Checks if a user has the permission for the specified command
   * @param command Command
   */
  private checkUserPerms(command: Command) {
    if (!command.isEnabled) return false
    if (!command.isShownInHelp) return false

    return command.isEnabled
  }
}
