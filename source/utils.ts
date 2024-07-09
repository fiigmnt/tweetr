// ----------------------------------------------------------------------------------//
// Utils
// Tweetr (( v1.1.0 ))
// Fiigmnt | January 18, 2022 | Updated:
// ----------------------------------------------------------------------------------//

import { TwitterApi } from "twitter-api-v2";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const { TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET } = process.env;

export const twitterClient = new TwitterApi({
  appKey: TWITTER_API_KEY || "",
  appSecret: TWITTER_API_SECRET || "",
  accessToken: TWITTER_ACCESS_TOKEN || "",
  accessSecret: TWITTER_ACCESS_SECRET || "",
});

export const twitterReadOnlyClient = twitterClient.readOnly;

export const prisma = new PrismaClient();

export const rand = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min)) + min;
};

export const wait = (time: number) => new Promise((r) => setTimeout(r, time));

export enum Day {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export const headers = {
  authorization:
    "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
  "content-type": "application/x-www-form-urlencoded",
  "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Brave";v="120"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "x-client-transaction-id":
    "cidgAqRCCi5hcGIQrgD6ZwvrnMX/lj1F1Bz9QUCxN8Drp1EodtqHCDNVSKAtIRyHTIX7IXPEyIlhhnUbirAMAQeiq+jrcw",
  "x-client-uuid": "ed320dda-017a-4b2f-9809-3bc87c2cc535",
  "x-csrf-token":
    "36d4b3c575fb0f86af2ffffd311bf509d1c99e571395201226402e2583ceba330ab2226c9fd8866d2573a74034fa7022eb81709310c26d16e806f6c8d0dfa2addf4812b3ed81776161119378bcc2812e",
  "x-twitter-active-user": "yes",
  "x-twitter-auth-type": "OAuth2Session",
  "x-twitter-client-language": "en",
  Referer: "https://twitter.com/frankdegods/followers",
};
