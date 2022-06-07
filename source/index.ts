// ----------------------------------------------------------------------------------//
// Main Event Handler
// Tweetr (( v1.1.0 ))
// Fiigmnt | January 18, 2022 | Updated:
// ----------------------------------------------------------------------------------//

import { UserV2 } from 'twitter-api-v2';
import { twitterClient, prisma, rand, wait } from './utils';
import { getListMembers, ListType } from './lists';
import { addUsers, follow, unfollow, getFollowers } from './actions';

// --------------------------------------------- //
// SCHEDULE INFO
// 50 per call, 400 per day
// 8 calls total per day, every hour starting at 8am
// CRON JOB -> 0 12-16 * * *
// --------------------------------------------- //

async function run(): Promise<void> {
  // only want to run half of the time
  // const runJob = rand(0, 100) > 50;
  const runJob = rand(0, 100) > 0;

  console.log(`--------- STARTING ---------`);
  console.log(`RUN JOB: ${runJob}`);

  if (runJob) {
    try {
      // --------------------------------------------- //
      // follow list users

      const { users: usersToFollow, listId: usersToFollowId } =
        await getListMembers({
          type: ListType.FOLLOW,
        });

      for (const user of usersToFollow) {
        console.log(`:: FOLLOW  ->  ${user.username}`);
        const result = await follow({ user });
        if (result) {
          await twitterClient.v2.removeListMember(usersToFollowId, user.id);
        } else {
          console.log(`:: ERROR FOUND, BREAKING`);
          break;
        }
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
      // FOLLOW = Tuesday, Thursday, Friday
      // UNFOLLOW = Monday, Wednesday, Saturday, Sunday

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
        today === Day.TUESDAY ||
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
            updatedAt: 'desc',
          },
        });

        for (const user of users) {
          console.log(`:: FOLLOW -> ${user.username}`);
          await wait();
          const result = await follow({ user });
          if (!result) {
            console.log(`:: ERROR FOUND, BREAKING`);
            break;
          }
        }
      }

      // --------------------------------------------- //
      // Unfollow Schedule
      if (
        today === Day.MONDAY ||
        today === Day.WEDNESDAY ||
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
            updatedAt: 'desc',
          },
        });

        for (const user of users) {
          console.log(`:: UNFOLLOW -> ${user.username}`);
          await wait();
          const result = await unfollow({ user });
          if (!result) {
            console.log(`:: ERROR FOUND, BREAKING`);
            break;
          }
        }
      }
    } catch (error) {
      console.log(':: ERROR -> MAIN RUN ::');
      console.log(error);
    }
  }
}

run();
