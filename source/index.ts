// ----------------------------------------------------------------------------------//
// Main Event Handler
// tweetr (( BETA v0.2.0 ))
// FIIG | January 18, 2022 | Updated: July 9, 2024
// ----------------------------------------------------------------------------------//

import { UserV2 } from "twitter-api-v2";
import { twitterClient, prisma, rand, wait, Day } from "./utils";
import { getListMembers, ListType } from "./lists";
import { addUsers, follow, unfollow, getFollowers } from "./actions";

// --------------------------------------------- //
// SCHEDULE INFO
// 5 per call, 25 per day
// 8 calls total per day, every hour starting at 8am
// CRON JOB -> 0 12-16 * * *
// --------------------------------------------- //

async function main(): Promise<void> {
  console.log(`--------- STARTING ---------`);

  try {
    // --------------------------------------------- //
    // TODO: IMPORTANT: not using a follow / unfollow schedule
    // -- Follow Schedule ---
    // const today: Day = new Date().getDay();

    // if (today === Day.TUESDAY || today === Day.THURSDAY || today === Day.FRIDAY) {
    // --------------------------------------------- //
    // check user follow list length
    const userCount = await prisma.user.count({
      where: { followed: false },
    });

    if (userCount < 100) {
      const { users: usersToCopy, listId: usersToCopyId } = await getListMembers({
        type: ListType.COPY,
      });

      if (usersToCopy.length === 0) {
        console.log(`:: ERROR ->  NO USERS TO COPY FROM`);
        return;
      }

      const parent: UserV2 = usersToCopy[rand(0, usersToCopy.length - 1)];
      console.log(`:: ADDING USERS FROM -> ${parent.username}`);
      const followers = await getFollowers("14815732");

      await addUsers(followers);

      // DELETE USER FROM LIST
      // IMPORTANT - this endpoint is not working, remove manually
      // await twitterClient.v2.removeListMember(usersToCopyId, parent.id);
    }

    // --------------------------------------------- //
    // follow those users
    const users = await prisma.user.findMany({
      where: { followed: false },
      take: 5,
      orderBy: {
        updatedAt: "desc",
      },
    });

    for (const user of users) {
      console.log(`:: FOLLOW -> ${user.username}`);
      await wait(rand(1000, 5000));
      const result = await follow({ user });
      if (!result) {
        console.log(`:: ERROR FOUND, BREAKING`);
        break;
      }
    }

    // --------------------------------------------- //
    // Unfollow Schedule
    // if (today === Day.MONDAY || today === Day.WEDNESDAY || today === Day.SATURDAY || today === Day.SUNDAY) {
    //   // --------------------------------------------- //
    //   // check user follow list length
    //   const userCount = await prisma.user.count({
    //     where: { followed: true, unfollow: true, unfollowed: false },
    //   });

    //   if (userCount === 0) {
    //     console.log(`:: NO ONE TO UNFOLLOW`);
    //     return;
    //   }

    //   // --------------------------------------------- //
    //   // unfollow those users
    //   const users = await prisma.user.findMany({
    //     where: { followed: true, unfollow: true, unfollowed: false },
    //     take: 25, // TODO: again taking 25 users to unfollow
    //     orderBy: {
    //       updatedAt: "desc",
    //     },
    //   });

    //   for (const user of users) {
    //     console.log(`:: UNFOLLOW -> ${user.username}`);
    //     await wait(2000); // TODO: how long are we waiting for?
    //     const result = await unfollow({ user });
    //     if (!result) {
    //       console.log(`:: ERROR FOUND, BREAKING`);
    //       break;
    //     }
    //   }
    // }
  } catch (error) {
    console.log(":: ERROR -> MAIN RUN ::");
    console.log(error);
  }
}

main();
