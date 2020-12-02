import { Message } from 'discord.js'

export default async (msg: Message) => {
  if (msg.author.bot) return

  return msg.client.commandHandler.parseCommand(msg)
}
