import uuid from 'uuid';
import dynamodb from 'serverless-dynamodb-client';
import { isEmpty } from 'lodash';
import { notesByEntry, createNote } from './note';
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

  let keyConditionExpression = "#usr = :user";
  const expAttrVals = {
    ':user': args.user,
  }
  if(args.champion) {
    keyConditionExpression = `${keyConditionExpression} and champion = :champion`;
    expAttrVals[":champion"] = args.champion;
  }

  return promisify(callback =>
    docClient.query(
      {
        TableName: 'Entry',
        IndexName: 'EntryUserIndex',
        KeyConditionExpression: keyConditionExpression,
        // FilterExpression: 'gameDate between :gameDateEnd and :gameDate',
        ExpressionAttributeNames: {
          '#usr': 'user',
        },
        ExpressionAttributeValues: expAttrVals,
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


function getUpdateExpAndAttrVals(args) {
  let expression = "set updatedAt = :updatedAt";
  let includeExpAttrName = false;
  const expAttrName = {};
  const attrVals = {
    ':updatedAt': new Date().toISOString() 
  }
  if(args.role) { 
    expression = `${expression}, #rol = :role` 
    attrVals[':role'] = args.role;
    expAttrName['#rol'] = 'role';
    includeExpAttrName = true;
  };
  if(args.champion) {
    expression = `${expression}, champion = :champion` 
    attrVals[':champion'] = args.champion;
  };
  if(args.opponentChampion) {
    expression = `${expression}, opponentChampion = :opponentChampion` 
    attrVals[':opponentChampion'] = args.opponentChampion;
  };
  if(args.partner) {
    expression = `${expression}, partner = :partner` 
    attrVals[':partner'] = args.partner;
  };
  if(args.opponentPartner) {
    expression = `${expression}, opponentPartner = :opponentPartner` 
    attrVals[':opponentPartner'] = args.opponentPartner;
  };
  if(args.video) {
    expression = `${expression}, video = :video` 
    attrVals[':video'] = args.video;
  };
  return { expression, attrVals, expAttrName: includeExpAttrName ? expAttrName : null };
}


export function updateEntry(args) {
  const { expression, attrVals, expAttrName } = getUpdateExpAndAttrVals(args);

  updateFields = {
    TableName: 'Entry',
    Key: { id: args.id, gameDate: args.gameDate },
    UpdateExpression: expression,
    ExpressionAttributeValues: attrVals,
    ReturnValues: 'ALL_NEW',
  }

  if(expAttrName) {
    updateFields.ExpressionAttributeNames = expAttrName;
  }


  return promisify(callback =>
    docClient.update(
      updateFields,
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

  function requestItems(notes) {
    const items = {
      Entry: [
        {
          DeleteRequest: {
            Key: { id: args.id, gameDate: args.gameDate },
          },
        },
      ],
    }

    if(notes && notes.length > 0) {
      items.Note = notesToDeleteRequests(notes, args.id);
    }
    return items;
  }

  
  return notesByEntry({ entry: args.id })
    .then(notes =>
      promisify(callback =>
        docClient.batchWrite(
          {
            RequestItems: requestItems(notes),
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
