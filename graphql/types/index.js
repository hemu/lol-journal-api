import entrySchema from './entry';
import noteSchema from './note';

const mainDef = `
  schema {
    query: Query,
    mutation: Mutation,
  }
`;

export default [mainDef, entrySchema, noteSchema];
