import { Message } from 'discord.js'
import { CustomEmbedOptions } from 'typings/utils'

import { Command } from '../Command'
import { Embed } from './Embed'

export const errorMessage = (msg: Message, text: string, options: CustomEmbedOptions = { color: 'red' }) => {
  if (!options.color) options.color = 'red'

  const e = new Embed(msg, options).setDescription(`${text}`)

  if (options.autoRemove) {
    const { time } = options.autoRemove

    if (options.autoRemove.both) {
      return msg.channel.send(e).then((m) => {
        m.delete({ timeout: time }).catch()
        msg.delete({ timeout: time }).catch()
      })
    }
    return msg.channel.send(e).then((m) => m.delete({ timeout: time }).catch())
  }

  return msg.channel.send(e)
}

export const warningMessage = (msg: Message, text: string, options: CustomEmbedOptions = { color: 'yellow' }) => {
  if (!options.color) options.color = 'yellow'

  const e = new Embed(msg, options).setDescription(`${text}`)

  if (options.autoRemove) {
    const { time } = options.autoRemove

    if (options.autoRemove.both) {
      return msg.channel.send(e).then((m) => {
        m.delete({ timeout: time }).catch()
        msg.delete({ timeout: time }).catch()
      })
    }

    return msg.channel
      .send(e)
      .then((m) => m.delete({ timeout: time }))
      .catch()
  }

  return msg.channel.send(e)
}

export const standardMessage = (msg: Message, text: string, options: CustomEmbedOptions = { color: 'blue' }) => {
  if (!options.color) options.color = 'blue'

  const e = new Embed(msg, options).setDescription(text)

  if (options.autoRemove) {
    const { time } = options.autoRemove

    if (options.autoRemove.both) {
      return msg.channel.send(e).then((m) => {
        m.delete({ timeout: time }).catch()
        msg.delete({ timeout: time }).catch()
      })
    }

    return msg.channel
      .send(e)
      .then((m) => m.delete({ timeout: time }))
      .catch()
  }

  return msg.channel.send(e)
}

// Standard valid options return
export const validUsage = async (msg: Message, command: Command) => {
  if (command.usage.length) {
    const e = new Embed(msg, { image: 'faq.png' }).setTitle(`${command._name} Help`).setFooter('Message will self destruct in 60 seconds')
    //.setDescription(`**${command.description}**`)

    command.usage.forEach((u) => e.addField(u.description, `\`${msg.p}${command._name} ${u.usage}\``))

    if (command.image) {
      e.setThumbnail(`https://subby.dev/i/icons/${command.image}`)
      e.setFooter(`Message will self destruct in 60 seconds`, `https://subby.dev/i/icons/${command.image}`)
    }

    if (command._name === 'rl') {
      e.setImage('https://bss.nz/i/roulette.png')
    }

    return msg.channel.send(e).then((m) => {
      if (command._name === 'rl') {
        return m.delete({ timeout: 120000 })
      } else return m.delete({ timeout: 60000 })
    })
  }
}
