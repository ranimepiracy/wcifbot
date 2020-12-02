import { join, normalize } from 'path'

export const CONFIG = {
  BOT: normalize(join(__dirname, '..', 'config.json'))
}
