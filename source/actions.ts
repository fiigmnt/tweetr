// ----------------------------------------------------------------------------------//
// ACTIONS FILE
// tweetr (( BETA v0.2.0 ))
// FIIG | Febuary 9, 2022 | Updated: July 9, 2024
// ----------------------------------------------------------------------------------//

import { TweetV2, UserV2 } from "twitter-api-v2";
import { twitterClient, twitterReadOnlyClient, prisma, rand, wait } from "./utils";
import { headers } from "./constants";

export const follow = async ({ user }: { user: UserV2 }): Promise<boolean> => {
  try {
    // follow user
    const { id, name, username } = user;
    await twitterClient.v2.follow((await twitterClient.v2.me()).data.id, id);

    // like two of users recent tweets
    console.log(":: liking tweets ::");
    const tweets = await (await twitterClient.v2.userTimeline(id, { exclude: "replies" })).data.data;

    if (tweets?.length > 0) {
      // grab random tweet
      let tweetIndex = rand(0, tweets.length - 1);
      let tweet = tweets[tweetIndex];

      // like that tweet
      await like({ tweet });
    }

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
        headers,
        body: null,
        method: "GET",
      });

      const result = await response.json();

      const entries = result.data.user.result.timeline.timeline.instructions
        .find((instruction: any) => instruction.type === "TimelineAddEntries")
        ?.entries.filter((entry: any) => entry.entryId.includes("user"));

      const users: UserV2[] = entries.map((entry: any) => {
        return {
          id: entry.content.itemContent?.user_results?.result?.rest_id,
          username: entry.content.itemContent?.user_results?.result?.legacy?.screen_name,
          name: entry.content.itemContent?.user_results?.result?.legacy?.name,
        };
      });

      followers = [...followers, ...users];

      // Find the next cursor
      const nextCursor = result.data.user.result.timeline.timeline.instructions
        .find((instruction: any) => instruction.type === "TimelineAddEntries")
        ?.entries.find((entry: any) => entry.entryId.includes("cursor-bottom"))?.content.value;

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
