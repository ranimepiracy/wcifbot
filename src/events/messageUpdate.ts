import { Message } from 'discord.js'

export default async (_old: Message, _new: Message) => {
  if (_new.author.bot) return

  if (_old.partial) await _old.fetch()
  if (_new.partial) await _new.fetch()

  if (_old.content !== _new.content) return _new.client.commandHandler.parseCommand(_new)
}
