export default `
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
