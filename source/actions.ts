// ----------------------------------------------------------------------------------//
// TWEETR
// actions (( BETA v0.1.0 ))
// Fiigmnt | Febuary 9, 2022 | Updated:
// ----------------------------------------------------------------------------------//

import { UserV2 } from "twitter-api-v2";
import { twitterClient, prisma } from "./utils";

export const follow = async ({ user }: { user: UserV2 }): Promise<void> => {
  try {
    const { id, name, username } = user;
    await twitterClient.v2.follow((await twitterClient.v2.me()).data.id, id);
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
  } catch (error) {
    console.log(":: ERROR ::");
    console.log(error);
  }
};

export const unfollow = async ({ user }: { user: UserV2 }): Promise<void> => {
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
    } catch (error) {
      console.log(":: ERROR ::");
      console.log(error);
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
    console.log(":: ERROR ::");
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
    console.log(":: ERROR ::");
    console.log(error);
  }
};
