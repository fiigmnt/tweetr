// ----------------------------------------------------------------------------------//
// LISTS
// tweetr (( BETA v0.2.0 ))
// FIIG | Febuary 9, 2022 | Updated:
// ----------------------------------------------------------------------------------//

import { UserV2 } from 'twitter-api-v2';
import { twitterClient } from './utils';

export enum ListType {
  FOLLOW = 'follow',
  KEEP = 'keep',
  COPY = 'devs',
}

export const getListMembers = async ({
  type,
}: {
  type: ListType;
}): Promise<{ users: Array<UserV2>; listId: string }> => {
  // Get lists owned by me
  const lists = await twitterClient.v2.listsOwned(
    (
      await twitterClient.v2.me()
    ).data.id
  );

  for await (const list of lists) {
    const listId = list.id;
    if (list.name === type) {
      const membersOfList = await twitterClient.v2.listMembers(listId);
      // iterate over users iterable and access data array
      return { users: (await membersOfList.data.data) || [], listId };
    }
  }
  return { users: [], listId: '' };
};
