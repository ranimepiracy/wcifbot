import { Message } from 'discord.js'

import { Command } from '../core/Command'

export default class Template extends Command {
  public constructor() {
    super({
      _name: 'Template',
      category: '_unsorted',
      description: 'Template',
      isEnabled: false,
      isGuildOnly: true,
      isShownInHelp: false,
      usage: [
        {
          description: 'Template',
          usage: 'Template'
        }
      ]
    })
  }

  public async run(msg: Message, args: string[]) {}
}
