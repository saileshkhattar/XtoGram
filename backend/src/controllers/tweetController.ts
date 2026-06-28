import { Request, Response } from 'express'
import { processTweet } from '../services/tweetService'

export const getTweet = async (req: Request, res: Response) => {
  try {
    const { url } = req.body

    if (!url) {
      res.status(400).json({ message: 'Tweet URL is required' })
      return
    }

    const result = await processTweet(url)
    res.status(200).json(result)

  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch tweet' })
  }
}