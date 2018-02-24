import uuid from 'uuid';
import dynamodb from 'serverless-dynamodb-client';
import { getEntry } from './entry';

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

function markedNotesByUser(args) {
  return promisify(callback =>
    docClient.query(
      {
        TableName: 'Note',
        IndexName: 'NoteUserIndex',
        KeyConditionExpression: '#usr = :user AND marked > :ismarked',
        ExpressionAttributeNames: {
          '#usr': 'user',
        },
        ExpressionAttributeValues: {
          ':user': args.user,
          ':ismarked': 0,
        },
      },
      callback
    )
  ).then(result => result.Items);
}

export function notesByEntry(args) {
  return promisify(callback =>
    docClient.query(
      {
        TableName: 'Note',
        KeyConditionExpression: 'entry = :entry',
        ExpressionAttributeValues: {
          ':entry': args.entry,
        },
      },
      callback
    )
  ).then(result => result.Items);
}

export function createNote(args) {
  const newItem = {
    ...args,
    id: uuid.v4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    marked: args.marked ? 1 : 0,
  };
  return promisify(callback =>
    docClient.put(
      {
        TableName: 'Note',
        Item: newItem,
      },
      callback
    )
  )
    .then(() => newItem)
    .catch(error => {
      console.log('Error creating note.');
      console.log(error);
      return null;
    });
}

export function updateNoteText(args) {
  return promisify(callback =>
    docClient.update(
      {
        TableName: 'Note',
        Key: { entry: args.entry, id: args.id },
        UpdateExpression: 'set #txt = :text, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#txt': 'text' },
        ExpressionAttributeValues: {
          ':text': args.text,
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
      console.log(`Error updating note with id: ${args.id}`);
      console.log(error);
      return null;
    });
}

export function markNote(args) {
  const marked =
    args.marked && (args.marked === true || args.marked === 1) ? 1 : 0;
  return promisify(callback =>
    docClient.update(
      {
        TableName: 'Note',
        Key: { entry: args.entry, id: args.id },
        UpdateExpression: 'set marked = :marked',
        ExpressionAttributeValues: {
          ':marked': marked,
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
      console.log(`Error marking note with id: ${args.id}`);
      console.log(error);
      return null;
    });
}

export function deleteNote(args) {
  return promisify(callback =>
    docClient.delete(
      {
        TableName: 'Note',
        Key: { entry: args.entry, id: args.id },
        ReturnValues: 'ALL_OLD',
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
      console.log('Error deleting note.');
      console.log(error);
      return null;
    });
}

// eslint-disable-next-line import/prefer-default-export
export default {
  Query: {
    markedNotesByUser: (root, args) => markedNotesByUser(args),
    notesByEntry: (root, args) => notesByEntry(args),
  },
  Note: {
    entry: obj => getEntry({ id: obj.entry }),
    marked: obj => !!obj.marked,
  },
  Mutation: {
    createNote: (root, args) => createNote(args),
    updateNoteText: (root, args) => updateNoteText(args),
    markNote: (root, args) => markNote(args),
    deleteNote: (root, args) => deleteNote(args),
  },
};
