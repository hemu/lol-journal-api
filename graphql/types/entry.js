export default `
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
