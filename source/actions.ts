// ----------------------------------------------------------------------------------//
// TWEETR
// actions (( BETA v0.1.0 ))
// Fiigmnt | Febuary 9, 2022 | Updated:
// ----------------------------------------------------------------------------------//

import { TweetV2, UserV2 } from 'twitter-api-v2';
import { twitterClient, prisma, rand } from './utils';

export const follow = async ({ user }: { user: UserV2 }): Promise<boolean> => {
  try {
    // follow user
    const { id, name, username } = user;
    await twitterClient.v2.follow((await twitterClient.v2.me()).data.id, id);

    // like two of users recent tweets
    console.log(":: liking tweets ::")
    const tweets = await (
      await twitterClient.v2.userTimeline(id, { exclude: 'replies' })
    ).data.data;

    // grab random tweet
    let tweetIndex = rand(0, tweets.length - 1);
    let tweet = tweets[tweetIndex];
    console.log(tweet);

    // remove the tweet from the list
    tweets.splice(tweetIndex, 1);

    // like that tweet
    await like({tweet});

    // grab another random tweet
    tweetIndex = rand(0, tweets.length - 1);
    tweet = tweets[tweetIndex];
    console.log(tweet);

    // like that tweet
    await like({tweet});

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
    console.log(':: ERROR ::');
    console.log(error);
    if (error.code == 400) {
      console.log(':: 400 Error :: removing user');
      await prisma.user.delete({ where: { id: user.id } });
      return true;
    }
    console.log(error);
    return false;
  }
};

export const unfollow = async ({
  user,
}: {
  user: UserV2;
}): Promise<boolean> => {
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
    console.log(':: ERROR ::');
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
    console.log(':: ERROR ::');
    console.log(error);
    if (error.code == 400) {
      console.log(':: 400 Error :: continuing');
      return true;
    }
    console.log(error);
    return false;
  }
};

export const getFollowers = async ({
  user,
}: {
  user: UserV2;
}): Promise<Array<UserV2>> => {
  try {
    const followers = await twitterClient.v2.followers(user.id, {
      asPaginator: true,
    });

    return await (
      await followers.fetchLast(1200)
    ).users;
  } catch (error) {
    console.log(':: ERROR ::');
    console.log(error);
    return [];
  }
};

export const addUsers = async ({
  users,
}: {
  users: Array<UserV2>;
}): Promise<void> => {
  try {
    await prisma.user.createMany({ data: users, skipDuplicates: true });
  } catch (error) {
    console.log(':: ERROR ::');
    console.log(error);
  }
};
