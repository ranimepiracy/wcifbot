import { Message, MessageEmbed, ReactionCollector, TextChannel } from 'discord.js'

export class Paginator {
  private msg: Message

  private pages: MessageEmbed[]

  private page: number

  private readonly timeoutTime: number

  private collector: ReactionCollector

  private readonly userID: string

  private channel: TextChannel

  private readonly totalPages: number

  private originalMessage: Message

  private readonly footerText: string

  private reactions: {
    previousPage: string
    nextPage: string
  }

  public constructor(msg: Message, pages: MessageEmbed[], footerText = '') {
    this.msg = msg
    this.originalMessage = msg
    this.channel = msg.channel as TextChannel
    this.userID = msg.author.id
    this.footerText = footerText

    // Current page of the embedList we are on
    this.page = 1

    // EmbedList we will page over
    this.pages = pages
    this.totalPages = pages.length

    this.reactions = {
      previousPage: '⏩',
      nextPage: '⏪'
    }

    // Timeout time in milliseconds to stop listening for reactions
    this.timeoutTime = 60 * 1000 * 5
  }

  /**
   * Sends Pager to channel
   */
  public async send() {
    // Embed footer text
    const footerText = `Page ${this.page}/${this.totalPages} | ${this.footerText}`

    // Send the first page of the embed list
    const msg = await this.channel.send(this.pages[0].setFooter(footerText, this.pages[0].customImage || ''))

    // Assign the previously sent message as the target message
    this.msg = msg

    // Add reactions based on page counts
    await this.addReactions()

    // Create Reaction Collector to listen for user reactions
    this.createCollector(this.userID)

    // Return our message object if we want to parse it after pagination
    return msg
  }

  /**
   * Selects and shows the target page from this.pages
   * @param page page number of wanted index from this.pages
   */
  private async select(page = 1) {
    this.page = page
    const footerText = `Page ${this.page}/${this.totalPages} | ${this.footerText}`
    await this.msg.edit(this.pages[page - 1].setFooter(footerText, this.pages[page - 1].customImage || ''))
  }

  /**
   * Creates the Reaction Collector to listen to reactions from user
   * @param userId user ID of the member who originally requested the embed
   */
  private createCollector(userId: string) {
    // Filter reactions to the user that requested the embed
    const filter = (_, u) => u.id === userId

    // Create Reaction Collector
    const collector = this.msg.createReactionCollector(filter, { time: this.timeoutTime })

    // Save collector to be used later in execution
    this.collector = collector

    // Handle actions based on selected reaction from user
    collector.on('collect', async (react) => {
      // If reaction is the back button and we are NOT on the first page, go back

      switch (react.emoji.name) {
        // If user hits back, go back 1 page
        case this.reactions.previousPage: {
          if (this.page !== 1) await this.select(this.page - 1)
          break
        }

        // If user hits next, go forward 1 page
        case this.reactions.nextPage: {
          if (this.page !== this.pages.length) await this.select(this.page + 1)
          break
        }
      }

      // Remove users reaction to have clean slate for for next page
      await this.msg.reactions.resolve(react).users.remove(this.originalMessage.author)
    })

    // When the collector times out or the user hits stop, remove all reactions
    collector.on('end', () => this.msg.reactions.removeAll())
  }

  /**
   * Adds needed reactions for pagination based on page count
   */
  private async addReactions() {
    // If more than 1 page, display navigation controls
    if (this.totalPages > 1) {
      if (this.reactions.previousPage) await this.msg.react(this.reactions.previousPage)
      if (this.reactions.nextPage) await this.msg.react(this.reactions.nextPage)
    }
  }
}
