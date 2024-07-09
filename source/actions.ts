// ----------------------------------------------------------------------------------//
// TWEETR
// actions (( BETA v0.1.0 ))
// Fiigmnt | Febuary 9, 2022 | Updated: July 9, 2024
// ----------------------------------------------------------------------------------//

import { TweetV2, UserV2 } from "twitter-api-v2";
import { twitterClient, twitterReadOnlyClient, prisma, rand, wait } from "./utils";

export const follow = async ({ user }: { user: UserV2 }): Promise<boolean> => {
  try {
    // follow user
    const { id, name, username } = user;
    await twitterClient.v2.follow((await twitterClient.v2.me()).data.id, id);

    // TODO: add likes back in
    // like two of users recent tweets
    // console.log(":: liking tweets ::");
    // const tweets = await (await twitterClient.v2.userTimeline(id, { exclude: "replies" })).data.data;

    // // grab random tweet
    // let tweetIndex = rand(0, tweets.length - 1);
    // let tweet = tweets[tweetIndex];
    // console.log(tweet);

    // // remove the tweet from the list
    // tweets.splice(tweetIndex, 1);

    // // like that tweet
    // await like({ tweet });

    // // grab another random tweet
    // tweetIndex = rand(0, tweets.length - 1);
    // tweet = tweets[tweetIndex];
    // console.log(tweet);

    // // like that tweet
    // await like({ tweet });

    // update user in db
    await prisma.user.upsert({
      where: { id },
      create: {
        id,
        name,
        username,
        followed: true,
        unfollow: false,
      },
      update: {
        followed: true,
      },
    });
    return true;
  } catch (error: any) {
    if (error.code == 400) {
      console.log(":: 400 Error :: removing user");
      await prisma.user.delete({ where: { id: user.id } });
      return true;
    } else {
      console.log(":: ERROR follow ::");
      console.log(error);
      return false;
    }
  }
};

export const unfollow = async ({ user }: { user: UserV2 }): Promise<boolean> => {
  try {
    const { id, name, username } = user;

    await twitterClient.v2.unfollow((await twitterClient.v2.me()).data.id, id);
    await prisma.user.upsert({
      where: { id },
      create: {
        id,
        name,
        username,
        followed: true,
        unfollowed: true,
      },
      update: {
        unfollowed: true,
      },
    });
    return true;
  } catch (error) {
    console.log(":: ERROR unfollow ::");
    console.log(error);
    return false;
  }
};

export const like = async ({ tweet }: { tweet: TweetV2 }): Promise<boolean> => {
  try {
    const { id } = tweet;
    await twitterClient.v2.like((await twitterClient.v2.me()).data.id, id);
    return true;
  } catch (error: any) {
    if (error.code == 400) {
      return true;
    } else {
      console.log(":: ERROR like ::");
      console.log(error);
      return false;
    }
  }
};

// export const getFollowers = async ({ user }: { user: UserV2 }): Promise<Array<UserV2>> => {
//   try {
//     const followers = await twitterReadOnlyClient.v2.followers(user.id, {
//       asPaginator: true,
//     });

//     const result = await followers.fetchLast(800);
//     const users = await result.users;
//     return users;
//   } catch (error) {
//     console.log(":: ERROR getFollowers ::");
//     console.log(error);
//     return [];
//   }
// };

export const addUsers = async (users: UserV2[]): Promise<void> => {
  try {
    await prisma.user.createMany({ data: users, skipDuplicates: true });
  } catch (error) {
    console.log(":: ERROR addUsers ::");
    console.log(error);
  }
};

// NOTE - MANUALLY RUNNING FROM TWITTER COPY PASTE
export const getFollowers = async (userId: string, maxFollowers = 900) => {
  let followers: UserV2[] = [];
  let cursor: string | null = null;

  const fetchFollowers = async (cursor: string | null) => {
    const variables = {
      userId: userId,
      count: 20,
      cursor: cursor,
      includePromotedContent: false,
    };

    const features = {
      rweb_tipjar_consumption_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      communities_web_enable_tweet_community_results_fetch: true,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      articles_preview_enabled: true,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      creator_subscriptions_quote_tweet_preview_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      rweb_video_timestamps_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_enhance_cards_enabled: false,
    };

    const params = {
      variables: JSON.stringify(variables),
      features: JSON.stringify(features),
    };

    const queryString = new URLSearchParams(params).toString();

    const baseUrl = "https://x.com/i/api/graphql/DMcBoZkXf9axSfV2XND0Ig/Followers";
    const fullUrl = `${baseUrl}?${queryString}`;

    try {
      const response = await fetch(fullUrl, {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.6",
          authorization:
            "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
          "content-type": "application/json",
          priority: "u=1, i",
          "sec-ch-ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Brave";v="126"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "sec-gpc": "1",
          "x-client-transaction-id":
            "rIUf8sdJf96rjTc2boFtpgUiFAEsevwuag3AnpFzjywZinEQkK5B/PoSnMmOFX2NX23jkq4OSd3Yu0hspwatturlEs6Hrw",
          "x-csrf-token":
            "9258b570e387648188a87798492185eddae72613b7d14d834fb0d73ea6b5c6d47a8806f52011a137f5845e63e9878ba6ade856770426c3c8ba5b57ec9b5495ee260bbc77b2a297c079ebd4aa734e4c72",
          "x-twitter-active-user": "yes",
          "x-twitter-auth-type": "OAuth2Session",
          "x-twitter-client-language": "en",
          cookie:
            'dnt=1; kdt=1iKGXoltJQi0fK4hOc7PBOGgEJPAq1eDWRRJ2VpK; ads_prefs="HBISAAA="; auth_multi="1477025435678556162:ca35d54f9f0691aa3970db870385c8d142a85654"; auth_token=dc0606bdebfb392a9965878adf67845cb2c07779; guest_id_ads=v1%3A172004300791435419; guest_id_marketing=v1%3A172004300791435419; guest_id=v1%3A172004300791435419; twid=u%3D85990094; ct0=9258b570e387648188a87798492185eddae72613b7d14d834fb0d73ea6b5c6d47a8806f52011a137f5845e63e9878ba6ade856770426c3c8ba5b57ec9b5495ee260bbc77b2a297c079ebd4aa734e4c72; lang=en; d_prefs=MjoxLGNvbnNlbnRfdmVyc2lvbjoyLHRleHRfdmVyc2lvbjoxMDAw; external_referer=padhuUp37zixoA2Yz6IlsoQTSjz5FgRcKMoWWYN3PEQ%3D|0|8e8t2xd8A2w%3D; personalization_id="v1_FCYSn0r4qNuuUaDD73t4vg=="',
          Referer: "https://x.com/segall_max/followers",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      });

      const result = await response.json();

      const entries = result.data.user.result.timeline.timeline.instructions.find(
        (instruction: any) => instruction.type === "TimelineAddEntries"
      )?.entries.filter((entry: any) => entry.entryId.includes("user"));

      const users: UserV2[] = entries.map((entry: any) => {
        return {
          id: entry.content.itemContent?.user_results?.result?.rest_id,
          username: entry.content.itemContent?.user_results?.result?.legacy?.screen_name,
          name: entry.content.itemContent?.user_results?.result?.legacy?.name,
        };
      });

      followers = [...followers, ...users];

      // Find the next cursor
      const nextCursor = result.data.user.result.timeline.timeline.instructions.find(
        (instruction: any) => instruction.type === "TimelineAddEntries"
      )?.entries.find((entry: any) => entry.entryId.includes("cursor-bottom"))?.content.value;

      return nextCursor;
    } catch (error) {
      console.log(":: ERROR getFollowers ::");
      console.log(error);
      return null;
    }
  };

  // Fetch followers until the desired number is reached or no more pages are available
  while (followers.length < maxFollowers) {
    console.log(`:: FETCHING FOLLOWERS -> ${followers.length} ::`);
    await wait(rand(1000, 5000));
    cursor = await fetchFollowers(cursor);

    if (!cursor) {
      break;
    }
  }

  return followers.slice(0, maxFollowers);
};
