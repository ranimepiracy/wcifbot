import { CommandHandler } from '../core/handlers/CommandHandler'

declare module 'discord.js' {
  export interface Client {
    config: ClientConfig
    commandHandler: CommandHandler
    p: string | undefined
  }

  export interface Message {
    command: string
    p: string
    context: CommandHandler
  }

  export interface MessageEmbed {
    customImage?: string
  }
}

interface ClientConfig {
  prefix: string
  token: string
}
