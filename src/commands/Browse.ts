import { Message, MessageEmbed } from 'discord.js'
import fetch from 'node-fetch'

import { Command } from '../core/Command'
import { Embed } from '../core/utils/Embed'
import { warningMessage } from '../core/utils/messageUtils'
import { Paginator } from '../core/utils/Paginator'

export default class Browser extends Command {
  public constructor() {
    super({
      _name: 'wcif',
      category: '_unsorted',
      description: 'Find a anime stream',
      argumentRequired: true,
      usage: [
        {
          description: 'Find a stream for a MAL anime link',
          usage: '<mal link>'
        }
      ]
    })
  }

  public async run(msg: Message, args: string[]) {
    const string = args[0]

    const regexp = /myanimelist\.net\/(anime|manga)\/(\d+)/gm
    const matches = string.matchAll(regexp)

    let mediaType: string
    let mediaID: string

    for (const match of matches) {
      mediaType = match[1]
      mediaID = match[2]
    }

    if (!mediaType || !mediaID) {
      return warningMessage(msg, `Please provide a valid MAL link for me to find streams for.`)
    }

    if (mediaType !== 'anime') {
      return warningMessage(msg, 'Manga is not currently supported.')
    }

    const fetchSteamingSites = async () => {
      const resp = await fetch(`https://api.malsync.moe/mal/${mediaType}/${mediaID}`)
      const json = await resp.json()
      return json
    }

    const myAnimeListData = await fetchSteamingSites()

    const streamingSites = myAnimeListData.Sites
    const websiteNames = Object.keys(streamingSites)

    interface SortedSites {
      dubs: { website: string; url: string; dub: boolean }[]
      subs: { website: string; url: string; dub: boolean }[]
    }

    const sortedSites: SortedSites = {
      subs: [],
      dubs: []
    }

    for (const site of websiteNames) {
      if (site.toLowerCase() !== 'crunchyroll') {
        const siteData = streamingSites[site]
        const streamNames = Object.keys(siteData)

        for (const stream of streamNames) {
          const streamInfo = {
            website: site,
            url: siteData[stream].url,
            dub: siteData[stream].title.toLowerCase().includes('dub')
          }

          if (streamInfo.dub) sortedSites.dubs.push(streamInfo)
          else sortedSites.subs.push(streamInfo)
        }
      }
    }

    const embedList: MessageEmbed[] = []

    const dubsAvailable = sortedSites.dubs.length
    const subsAvailable = sortedSites.subs.length

    let noDubsOrSubsMessage = ''

    if (!dubsAvailable || !subsAvailable) {
      noDubsOrSubsMessage = `There were no ${!dubsAvailable ? 'dubbed' : subsAvailable ? 'subbed' : ''} streams found.`
    }

    if (sortedSites.subs.length) {
      let text = `Found **${sortedSites.subs.length}** sites that have subbed streams:\n`

      for (const sub of sortedSites.subs) {
        text += `[${sub.website}](${sub.url})\n`
      }

      embedList.push(new Embed(msg).setTitle(`${myAnimeListData.title} - Sub`).setThumbnail(myAnimeListData.image).setDescription(text))
    }

    if (sortedSites.dubs.length) {
      let text = `Found **${sortedSites.dubs.length}** sites that have dubbed streams:\n`

      for (const dub of sortedSites.dubs) {
        text += `[${dub.website}](${dub.url})\n`
      }

      embedList.push(new Embed(msg).setTitle(`${myAnimeListData.title} - Dub`).setThumbnail(myAnimeListData.image).setDescription(text))
    }

    return new Paginator(msg, embedList, noDubsOrSubsMessage).send()
  }
}
