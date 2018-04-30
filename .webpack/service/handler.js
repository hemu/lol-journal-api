(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("graphql");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("lodash");

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

/*** IMPORTS FROM imports-loader ***/
var graphql = __webpack_require__(0);

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.entryById = entryById;
exports.updateEntry = updateEntry;
exports.createEntry = createEntry;
exports.deleteEntry = deleteEntry;

var _uuid = __webpack_require__(3);

var _uuid2 = _interopRequireDefault(_uuid);

var _serverlessDynamodbClient = __webpack_require__(4);

var _serverlessDynamodbClient2 = _interopRequireDefault(_serverlessDynamodbClient);

var _lodash = __webpack_require__(1);

var _note = __webpack_require__(5);

var _const = __webpack_require__(16);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const docClient = _serverlessDynamodbClient2.default.doc; // return an instance of new AWS.DynamoDB.DocumentClient()

// add to handler.js
const promisify = foo => new Promise((resolve, reject) => {
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

  const exclusiveStartKey = args.lastEvaluatedGameDate && args.lastEvaluatedID ? {
    gameDate: args.lastEvaluatedGameDate,
    user: args.user,
    id: args.lastEvaluatedID
  } : undefined;

  let keyConditionExpression = "#usr = :user";
  const expAttrVals = {
    ':user': args.user
  };
  if (args.champion) {
    keyConditionExpression = `${keyConditionExpression} and champion = :champion`;
    expAttrVals[":champion"] = args.champion;
  }

  return promisify(callback => docClient.query({
    TableName: 'Entry',
    IndexName: 'EntryUserIndex',
    KeyConditionExpression: keyConditionExpression,
    // FilterExpression: 'gameDate between :gameDateEnd and :gameDate',
    ExpressionAttributeNames: {
      '#usr': 'user'
    },
    ExpressionAttributeValues: expAttrVals,
    ScanIndexForward: false,
    Limit: 20,
    ExclusiveStartKey: exclusiveStartKey
  }, callback)).then(result => {
    return {
      entries: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey ? result.LastEvaluatedKey : null
    };
  });
}

function entryById(args) {
  return promisify(callback => docClient.query({
    TableName: 'Entry',
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
      ':id': args.id
    }
  }, callback)).then(result => {
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
  };
  if (args.role) {
    expression = `${expression}, #rol = :role`;
    attrVals[':role'] = args.role;
    expAttrName['#rol'] = 'role';
    includeExpAttrName = true;
  };
  if (args.champion) {
    expression = `${expression}, champion = :champion`;
    attrVals[':champion'] = args.champion;
  };
  if (args.opponentChampion) {
    expression = `${expression}, opponentChampion = :opponentChampion`;
    attrVals[':opponentChampion'] = args.opponentChampion;
  };
  if (args.partner) {
    expression = `${expression}, partner = :partner`;
    attrVals[':partner'] = args.partner;
  };
  if (args.opponentPartner) {
    expression = `${expression}, opponentPartner = :opponentPartner`;
    attrVals[':opponentPartner'] = args.opponentPartner;
  };
  if (args.video) {
    expression = `${expression}, video = :video`;
    attrVals[':video'] = args.video;
  };
  return { expression, attrVals, expAttrName: includeExpAttrName ? expAttrName : null };
}

function updateEntry(args) {
  const { expression, attrVals, expAttrName } = getUpdateExpAndAttrVals(args);

  updateFields = {
    TableName: 'Entry',
    Key: { id: args.id, gameDate: args.gameDate },
    UpdateExpression: expression,
    ExpressionAttributeValues: attrVals,
    ReturnValues: 'ALL_NEW'
  };

  if (expAttrName) {
    updateFields.ExpressionAttributeNames = expAttrName;
  }

  return promisify(callback => docClient.update(updateFields, callback)).then(result => {
    if (result.Attributes) {
      return result.Attributes;
    }
    return null;
  }).catch(error => {
    console.log(`Error updating entry with id: ${args.id}`);
    console.log(error);
    return null;
  });
}

function createEntry(args) {
  const newItem = _extends({}, args, {
    id: _uuid2.default.v4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return promisify(callback => docClient.put({
    TableName: 'Entry',
    Item: newItem
  }, callback)).then(() =>
  // Create one lesson note right away
  (0, _note.createNote)({
    entry: newItem.id,
    user: newItem.user,
    marked: false,
    text: ' ',
    type: _const.SystemNoteTypeIds.Lesson
  })).then(() => newItem).catch(error => {
    console.log('Error creating entry.');
    console.log(error);
    return null;
  });
}

function notesToDeleteRequests(notes, entry) {
  return notes.map(note => ({
    DeleteRequest: {
      Key: { entry, id: note.id }
    }
  }));
}

function deleteEntry(args) {
  // query for ids first

  function requestItems(notes) {
    const items = {
      Entry: [{
        DeleteRequest: {
          Key: { id: args.id, gameDate: args.gameDate }
        }
      }]
    };

    if (notes && notes.length > 0) {
      items.Note = notesToDeleteRequests(notes, args.id);
    }
    return items;
  }

  return (0, _note.notesByEntry)({ entry: args.id }).then(notes => promisify(callback => docClient.batchWrite({
    RequestItems: requestItems(notes)
  }, callback))).then(result => {
    if (result.UnprocessedItems) {
      return (0, _lodash.isEmpty)(result.UnprocessedItems);
    }
    return false;
  }).catch(error => {
    console.log('Error deleting entry.');
    console.log(error);
    return null;
  });
}

// eslint-disable-next-line import/prefer-default-export
exports.default = {
  Query: {
    entriesByUser: (root, args) => getEntriesByUser(args),
    entryById: (root, args) => entryById(args)
  },
  Mutation: {
    createEntry: (root, args) => createEntry(args),
    updateEntry: (root, args) => updateEntry(args),
    deleteEntry: (root, args) => deleteEntry(args)
  }
};


/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("uuid");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("serverless-dynamodb-client");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

/*** IMPORTS FROM imports-loader ***/
var graphql = __webpack_require__(0);

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.notesByEntry = notesByEntry;
exports.createNote = createNote;
exports.updateNoteText = updateNoteText;
exports.markNote = markNote;
exports.deleteNote = deleteNote;

var _uuid = __webpack_require__(3);

var _uuid2 = _interopRequireDefault(_uuid);

var _serverlessDynamodbClient = __webpack_require__(4);

var _serverlessDynamodbClient2 = _interopRequireDefault(_serverlessDynamodbClient);

var _entry = __webpack_require__(2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const docClient = _serverlessDynamodbClient2.default.doc; // return an instance of new AWS.DynamoDB.DocumentClient()

// add to handler.js
const promisify = foo => new Promise((resolve, reject) => {
  foo((error, result) => {
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  });
});

function markedNotesByUser(args) {
  return promisify(callback => docClient.query({
    TableName: 'Note',
    IndexName: 'NoteUserIndex',
    KeyConditionExpression: '#usr = :user AND marked > :ismarked',
    ExpressionAttributeNames: {
      '#usr': 'user'
    },
    ExpressionAttributeValues: {
      ':user': args.user,
      ':ismarked': 0
    }
  }, callback)).then(result => result.Items);
}

function notesByEntry(args) {
  return promisify(callback => docClient.query({
    TableName: 'Note',
    KeyConditionExpression: 'entry = :entry',
    ExpressionAttributeValues: {
      ':entry': args.entry
    }
  }, callback)).then(result => result.Items);
}

function createNote(args) {
  const newItem = _extends({}, args, {
    id: _uuid2.default.v4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    marked: args.marked ? 1 : 0
  });
  return promisify(callback => docClient.put({
    TableName: 'Note',
    Item: newItem
  }, callback)).then(() => newItem).catch(error => {
    console.log('Error creating note.');
    console.log(error);
    return null;
  });
}

function updateNoteText(args) {
  return promisify(callback => docClient.update({
    TableName: 'Note',
    Key: { entry: args.entry, id: args.id },
    UpdateExpression: 'set #txt = :text, updatedAt = :updatedAt',
    ExpressionAttributeNames: { '#txt': 'text' },
    ExpressionAttributeValues: {
      ':text': args.text,
      ':updatedAt': new Date().toISOString()
    },
    ReturnValues: 'ALL_NEW'
  }, callback)).then(result => {
    if (result.Attributes) {
      return result.Attributes;
    }
    return null;
  }).catch(error => {
    console.log(`Error updating note with id: ${args.id}`);
    console.log(error);
    return null;
  });
}

function markNote(args) {
  const marked = args.marked && (args.marked === true || args.marked === 1) ? 1 : 0;
  return promisify(callback => docClient.update({
    TableName: 'Note',
    Key: { entry: args.entry, id: args.id },
    UpdateExpression: 'set marked = :marked',
    ExpressionAttributeValues: {
      ':marked': marked
    },
    ReturnValues: 'ALL_NEW'
  }, callback)).then(result => {
    if (result.Attributes) {
      return result.Attributes;
    }
    return null;
  }).catch(error => {
    console.log(`Error marking note with id: ${args.id}`);
    console.log(error);
    return null;
  });
}

function deleteNote(args) {
  return promisify(callback => docClient.delete({
    TableName: 'Note',
    Key: { entry: args.entry, id: args.id },
    ReturnValues: 'ALL_OLD'
  }, callback)).then(result => {
    if (result.Attributes) {
      return result.Attributes;
    }
    return null;
  }).catch(error => {
    console.log('Error deleting note.');
    console.log(error);
    return null;
  });
}

// eslint-disable-next-line import/prefer-default-export
exports.default = {
  Query: {
    markedNotesByUser: (root, args) => markedNotesByUser(args),
    notesByEntry: (root, args) => notesByEntry(args)
  },
  Note: {
    entry: obj => (0, _entry.getEntry)({ id: obj.entry }),
    marked: obj => !!obj.marked
  },
  Mutation: {
    createNote: (root, args) => createNote(args),
    updateNoteText: (root, args) => updateNoteText(args),
    markNote: (root, args) => markNote(args),
    deleteNote: (root, args) => deleteNote(args)
  }
};


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

/*** IMPORTS FROM imports-loader ***/
var graphql = __webpack_require__(0);

'use strict';

__webpack_require__(7);

var _apolloServerLambda = __webpack_require__(8);

var _graphqlPlaygroundMiddlewareLambda = __webpack_require__(9);

var _graphqlPlaygroundMiddlewareLambda2 = _interopRequireDefault(_graphqlPlaygroundMiddlewareLambda);

var _graphql = __webpack_require__(10);

var _graphql2 = _interopRequireDefault(_graphql);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.graphqlHandler = function graphqlHandler(event, context, callback) {
  function callbackFilter(error, output) {
    // eslint-disable-next-line no-param-reassign
    output.headers['Access-Control-Allow-Origin'] = '*';
    callback(error, output);
  }

  const handler = (0, _apolloServerLambda.graphqlLambda)({ schema: _graphql2.default, tracing: true });
  return handler(event, context, callbackFilter);
};

// for local endpointURL is /graphql and for prod it is /stage/graphql
exports.playgroundHandler = (0, _graphqlPlaygroundMiddlewareLambda2.default)({
  endpoint: process.env.REACT_APP_GRAPHQL_ENDPOINT ? process.env.REACT_APP_GRAPHQL_ENDPOINT : '/production/graphql'
});

exports.graphiqlHandler = (0, _apolloServerLambda.graphiqlLambda)({
  endpointURL: process.env.REACT_APP_GRAPHQL_ENDPOINT ? process.env.REACT_APP_GRAPHQL_ENDPOINT : '/production/graphql'
});


/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("babel-polyfill");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("apollo-server-lambda");

/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("graphql-playground-middleware-lambda");

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

/*** IMPORTS FROM imports-loader ***/
var graphql = __webpack_require__(0);

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphqlTools = __webpack_require__(11);

var _types = __webpack_require__(12);

var _types2 = _interopRequireDefault(_types);

var _resolvers = __webpack_require__(15);

var _resolvers2 = _interopRequireDefault(_resolvers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const graphQLSchema = (0, _graphqlTools.makeExecutableSchema)({
  typeDefs: _types2.default,
  resolvers: _resolvers2.default,
  logger: console
});

exports.default = graphQLSchema;


/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("graphql-tools");

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

/*** IMPORTS FROM imports-loader ***/
var graphql = __webpack_require__(0);

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _entry = __webpack_require__(13);

var _entry2 = _interopRequireDefault(_entry);

var _note = __webpack_require__(14);

var _note2 = _interopRequireDefault(_note);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const mainDef = `
  schema {
    query: Query,
    mutation: Mutation,
  }
`;

exports.default = [mainDef, _entry2.default, _note2.default];


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

/*** IMPORTS FROM imports-loader ***/
var graphql = __webpack_require__(0);

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = `
type Entry {
  id: ID!
  user: String!
  createdAt: String
  updatedAt: String
  gameDate: String
  rank: String
  outcome: String
  lpChange: Int
  role: String
  kills: Int
  deaths: Int
  assists: Int
  champion: String
  opponentChampion: String
  opponents: [String]
  partner: String
  opponentPartner: String
  csPerMin: Float
  cs: [[Int]]
  video: String
  gameId: String
  regionId: String
}

type EntryKey {
  gameDate: String
  user: String
  id: ID
}

type EntriesResult {
  entries: [Entry]
  lastEvaluatedKey: EntryKey
}

type Query {
  entriesByUser(
    user: String!
    champion: String
    lastEvaluatedGameDate: String
    lastEvaluatedID: ID
  ) : EntriesResult
  entryById(id: ID!) : Entry
}

type Mutation {
  createEntry(
    user: String!
    gameId: String!
    regionId: String!
    gameDate: String
    rank: String
    outcome: String
    role: String
    kills: Int
    deaths: Int
    assists: Int
    champion: String
    opponentChampion: String
    opponents: [String]
    partner: String
    opponentPartner: String
    csPerMin: Float
    cs: [[Int]]
    video: String
  ) : Entry

  updateEntry(
    id: ID!
    gameDate: String!
    role: String
    champion: String
    opponentChampion: String
    partner: String
    opponentPartner: String
    video: String
  ) : Entry

  deleteEntry(
    id: ID!
    gameDate: String!
  ) : Boolean
}

`;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

/*** IMPORTS FROM imports-loader ***/
var graphql = __webpack_require__(0);

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = `
type Note {
  id: ID!
  createdAt: String
  updatedAt: String
  entry: Entry!
  user: String!
  marked: Boolean
  text: String
  meta: String
  type: String
}

extend type Query {
  markedNotesByUser(user: String!) : [Note]
  notesByEntry(entry: String!) : [Note]
}

extend type Mutation {
  createNote(
    entry: ID!
    user: ID!
    marked: Boolean!
    text: String
    type: String
    meta: String
  ) : Note

  markNote(
    id: ID!
    entry: ID!
    marked: Boolean!
  ) : Note

  updateNoteText(
    id: ID!
    entry: ID!
    text: String!
  ) : Note

  deleteNote(id: ID!, entry: ID!) : Note
}


`;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

/*** IMPORTS FROM imports-loader ***/
var graphql = __webpack_require__(0);

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = __webpack_require__(1);

var _entry = __webpack_require__(2);

var _entry2 = _interopRequireDefault(_entry);

var _note = __webpack_require__(5);

var _note2 = _interopRequireDefault(_note);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _lodash.merge)(_entry2.default, _note2.default);


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

/*** IMPORTS FROM imports-loader ***/
var graphql = __webpack_require__(0);

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const SYSTEM_MISTAKE_ID = 'system-mistake-type-id';
const SYSTEM_LESSON_ID = 'system-lesson-type-id';

const systemNoteTypes = exports.systemNoteTypes = [{
  id: SYSTEM_MISTAKE_ID,
  name: 'Mistake'
}, {
  id: SYSTEM_LESSON_ID,
  name: 'Lesson'
}];

const SystemNoteTypeIds = exports.SystemNoteTypeIds = {
  Mistake: SYSTEM_MISTAKE_ID,
  Lesson: SYSTEM_LESSON_ID
};


/***/ })
/******/ ])));