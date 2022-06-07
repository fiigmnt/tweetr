// ----------------------------------------------------------------------------------//
// Utils
// Tweetr (( v1.1.0 ))
// Fiigmnt | January 18, 2022 | Updated:
// ----------------------------------------------------------------------------------//

import { TwitterApi } from 'twitter-api-v2';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const {
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,
} = process.env;

export const twitterClient = new TwitterApi({
  appKey: TWITTER_API_KEY || '',
  appSecret: TWITTER_API_SECRET || '',
  accessToken: TWITTER_ACCESS_TOKEN || '',
  accessSecret: TWITTER_ACCESS_SECRET || '',
});

export const prisma = new PrismaClient();

export const rand = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min)) + min;
};

export const wait = () => new Promise((r) => setTimeout(r, 2000));
