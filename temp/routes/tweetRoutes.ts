import { Router } from 'express'
import { getTweet } from '../controllers/tweetController'

const tweetRouter = Router()

tweetRouter.post('/fetch', getTweet)

export default tweetRouter;