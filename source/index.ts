// ----------------------------------------------------------------------------------//
// Main Event Handler
// Tweetr (( v1.1.0 ))
// Fiigmnt | January 18, 2022 | Updated:
// ----------------------------------------------------------------------------------//

import { UserV2 } from "twitter-api-v2";
import { twitterClient, prisma } from "./utils";
import { getListMembers, ListType } from "./lists";
import { addUsers, follow, unfollow, getFollowers } from "./actions";

// --------------------------------------------- //
// SCHEDULE INFO
// 50 per call, 400 per day
// 8 calls total per day, every hour starting at 8am
// CRON JOB -> 0 8-14 * * *
// --------------------------------------------- //

const rand = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min)) + min;
};

const wait = () => new Promise((r) => setTimeout(r, 2000));

async function run(): Promise<void> {
  // Only run half the time
  if (rand(0, 100) > 50) {
    try {
      console.log(`--------- STARTING ---------`);
      // --------------------------------------------- //
      // follow list users

      const { users: usersToFollow, listId: usersToFollowId } =
        await getListMembers({
          type: ListType.FOLLOW,
        });

      for (const user of usersToFollow) {
        console.log(`:: FOLLOW  ->  ${user.username}`);
        await follow({ user });
        await twitterClient.v2.removeListMember(usersToFollowId, user.id);
      }

      // --------------------------------------------- //
      // keep list users

      const { users: usersToKeep, listId: usersToKeepId } =
        await getListMembers({
          type: ListType.KEEP,
        });

      for await (const user of usersToKeep) {
        console.log(`:: KEEP  ->  ${user.username}`);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            unfollow: false,
          },
        });
        await twitterClient.v2.removeListMember(usersToKeepId, user.id);
      }

      // --------------------------------------------- //
      // -- Follow Schedule ---
      // FOLLOW = Monday, Tuesday, Wednesday
      // UNFOLLOW = Thursday, Friday, Saturday

      enum Day {
        SUNDAY = 0,
        MONDAY = 1,
        TUESDAY = 2,
        WEDNESDAY = 3,
        THURSDAY = 4,
        FRIDAY = 5,
        SATURDAY = 6,
      }

      const today: Day = new Date().getDay();

      // --------------------------------------------- //
      // Follow Schedule

      if (
        today === Day.WEDNESDAY ||
        today === Day.THURSDAY ||
        today === Day.FRIDAY
      ) {
        // --------------------------------------------- //
        // check user follow list length
        const userCount = await prisma.user.count({
          where: { followed: false },
        });

        if (userCount < 100) {
          // --------------------------------------------- //
          // get some more users

          const { users: usersToCopy, listId: usersToCopyId } =
            await getListMembers({
              type: ListType.COPY,
            });

          if (usersToCopy.length === 0) {
            console.log(`:: ERROR ->  NO USERS TO COPY FROM`);
            return;
          }

          const parent: UserV2 = usersToCopy[rand(0, usersToCopy.length - 1)];

          console.log(`:: ADDING USERS FROM -> ${parent.username}`);
          const followers = await getFollowers({
            user: parent,
          });

          await addUsers({ users: followers });
          await twitterClient.v2.removeListMember(usersToCopyId, parent.id);
        }

        // --------------------------------------------- //
        // follow those users
        const users = await prisma.user.findMany({
          where: { followed: false },
          take: 25,
          orderBy: {
            updatedAt: "desc",
          },
        });

        for (const user of users) {
          console.log(`:: FOLLOW -> ${user.username}`);
          await wait();
          await follow({ user });
        }
      }

      // --------------------------------------------- //
      // Unfollow Schedule
      if (
        today === Day.MONDAY ||
        today === Day.TUESDAY ||
        today === Day.SATURDAY ||
        today === Day.SUNDAY
      ) {
        // --------------------------------------------- //
        // check user follow list length
        const userCount = await prisma.user.count({
          where: { followed: true, unfollow: true, unfollowed: false },
        });

        if (userCount === 0) {
          console.log(`:: NO ONE TO UNFOLLOW`);
          return;
        }

        // --------------------------------------------- //
        // unfollow those users
        const users = await prisma.user.findMany({
          where: { followed: true, unfollow: true, unfollowed: false },
          take: 25,
          orderBy: {
            updatedAt: "desc",
          },
        });

        for (const user of users) {
          console.log(`:: UNFOLLOW -> ${user.username}`);
          await wait();
          await unfollow({ user });
        }
      }
    } catch (error) {
      console.log(":: ERROR -> MAIN RUN ::");
      console.log(error);
    }
  }
}

run();
