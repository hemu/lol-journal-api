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
}

type Query {
  entriesByUser(user: String!) : [Entry]
  entryById(id: ID!) : Entry
}

type Mutation {
  createEntry(
    user: String!
    gameId: String!
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
    gameId: String
  ) : Entry

  deleteEntry(id: ID!) : Boolean
}

`;
