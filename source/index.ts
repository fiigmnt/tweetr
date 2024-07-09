// ----------------------------------------------------------------------------------//
// Main Event Handler
// Tweetr (( v1.1.0 ))
// Fiigmnt | January 18, 2022 | Updated: July 9, 2024
// ----------------------------------------------------------------------------------//

import { UserV2 } from 'twitter-api-v2';
import { twitterClient, prisma, rand, wait } from './utils';
import { getListMembers, ListType } from './lists';
import { addUsers, follow, unfollow, getFollowers } from './actions';

// --------------------------------------------- //
// SCHEDULE INFO
// TODO: update this schedule to match guidlines
// 50 per call, 400 per day
// 8 calls total per day, every hour starting at 8am
// CRON JOB -> 0 12-16 * * *
// --------------------------------------------- //

async function run(): Promise<void> {
  // only want to run half of the time
  const runJob = rand(0, 100) > 50;

  console.log(`--------- STARTING ---------`);
  console.log(`RUN JOB: ${runJob}`);

  if (runJob) {
    try {
      // --------------------------------------------- //
      // follow list users

      // TODO: ERROR - this follows all list users at once (does not consider limits)
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
      // TODO: block this out manually - follow a bunch at first
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

          // TODO: test this out, see if it still works
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
          take: 25, // TODO: this is important - following this number of users
          orderBy: {
            updatedAt: 'desc',
          },
        });

        for (const user of users) {
          console.log(`:: FOLLOW -> ${user.username}`);
          await wait(); // TODO: this should spread out so 5 (or less) every 15 minuts
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
          take: 25, // TODO: again taking 25 users to unfollow
          orderBy: {
            updatedAt: 'desc',
          },
        });

        for (const user of users) {
          console.log(`:: UNFOLLOW -> ${user.username}`);
          await wait(); // TODO: how long are we waiting for?
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
