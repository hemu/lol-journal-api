import uuid from 'uuid';
import dynamodb from 'serverless-dynamodb-client';
import { isEmpty } from 'lodash';
import { getNotesByEntry, createNote } from './note';
import { SystemNoteTypeIds } from '../const';

const docClient = dynamodb.doc; // return an instance of new AWS.DynamoDB.DocumentClient()

// add to handler.js
const promisify = foo =>
  new Promise((resolve, reject) => {
    foo((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });

function getEntriesByUser(args) {
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 360);

  const exclusiveStartKey = (
    args.lastEvaluatedGameDate && args.lastEvaluatedID
  ) ? {
    gameDate: args.lastEvaluatedGameDate,
    user: args.user,
    id: args.lastEvaluatedID,
  } : undefined;

  return promisify(callback =>
    docClient.query(
      {
        TableName: 'Entry',
        IndexName: 'EntryUserIndex',
        KeyConditionExpression: '#usr = :user',
        // FilterExpression: 'gameDate between :gameDateEnd and :gameDate',
        ExpressionAttributeNames: {
          '#usr': 'user',
        },
        ExpressionAttributeValues: {
          ':user': args.user,
          // ':gDate': new Date().toISOString(),
          // ':gameDateEnd': oneYearAgo.toISOString(),
        },
        ScanIndexForward: false,
        Limit: 20,
        ExclusiveStartKey: exclusiveStartKey,
      },
      callback
    )
  ).then(result => {
    return {
      entries: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey ? result.LastEvaluatedKey : null,
    };
  });
}

export function entryById(args) {
  return promisify(callback =>
    docClient.query(
      {
        TableName: 'Entry',
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': args.id,
        },
      },
      callback
    )
  ).then(result => {
    if (result.Items.length > 0) {
      return result.Items[0];
    }
    return null;
  });
}

export function updateEntry(args) {
  return promisify(callback =>
    docClient.update(
      {
        TableName: 'Entry',
        Key: { id: args.id },
        UpdateExpression:
          'set #rnk = :rank, updatedAt = :updatedAt, outcome = :outcome, #rol = :role, kills = :kills, deaths = :deaths, assists = :assists, champion = :champion, opponentChampion = :opponentChampion, partner = :partner, opponentPartner = :opponentPartner, csPerMin = :csPerMin, csAt5Min = :csAt5Min, csAt10Min = :csAt10Min, csAt15Min = :csAt15Min, csAt20Min = :csAt20Min, video = :video, gameDate = :gameDate',
        ExpressionAttributeNames: { '#rnk': 'rank', '#rol': 'role' },
        ExpressionAttributeValues: {
          ':gameDate': args.gameDate,
          ':rank': args.rank,
          ':outcome': args.outcome,
          ':role': args.role,
          ':kills': args.kills,
          ':deaths': args.deaths,
          ':assists': args.assists,
          ':champion': args.champion,
          ':opponentChampion': args.opponentChampion,
          ':partner': args.partner,
          ':opponentPartner': args.opponentPartner,
          ':csPerMin': args.csPerMin,
          ':csAt5Min': args.csAt5Min,
          ':csAt10Min': args.csAt10Min,
          ':csAt15Min': args.csAt15Min,
          ':csAt20Min': args.csAt20Min,
          ':video': args.video,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      },
      callback
    )
  )
    .then(result => {
      if (result.Attributes) {
        return result.Attributes;
      }
      return null;
    })
    .catch(error => {
      console.log(`Error updating entry with id: ${args.id}`);
      console.log(error);
      return null;
    });
}

export function createEntry(args) {
  const newItem = {
    ...args,
    id: uuid.v4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return promisify(callback =>
    docClient.put(
      {
        TableName: 'Entry',
        Item: newItem,
      },
      callback
    )
  )
    .then(() =>
      // Create one lesson note right away
      createNote({
        entry: newItem.id,
        user: newItem.user,
        marked: false,
        text: ' ',
        type: SystemNoteTypeIds.Lesson,
      })
    )
    .then(() => newItem)
    .catch(error => {
      console.log('Error creating entry.');
      console.log(error);
      return null;
    });
}

function notesToDeleteRequests(notes, entry) {
  return notes.map(note => ({
    DeleteRequest: {
      Key: { entry, id: note.id },
    },
  }));
}

export function deleteEntry(args) {
  // query for ids first
  return getNotesByEntry({ entry: args.id })
    .then(notes =>
      promisify(callback =>
        docClient.batchWrite(
          {
            RequestItems: {
              Entry: [
                {
                  DeleteRequest: {
                    Key: { id: args.id },
                  },
                },
              ],
              Note: notesToDeleteRequests(notes, args.id),
            },
          },
          callback
        )
      )
    )
    .then(result => {
      if (result.UnprocessedItems) {
        return isEmpty(result.UnprocessedItems);
      }
      return false;
    })
    .catch(error => {
      console.log('Error deleting entry.');
      console.log(error);
      return null;
    });
}

// eslint-disable-next-line import/prefer-default-export
export default {
  Query: {
    entriesByUser: (root, args) => getEntriesByUser(args),
    entryById: (root, args) => entryById(args),
  },
  Mutation: {
    createEntry: (root, args) => createEntry(args),
    updateEntry: (root, args) => updateEntry(args),
    deleteEntry: (root, args) => deleteEntry(args),
  },
};
