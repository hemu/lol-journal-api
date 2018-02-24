import { makeExecutableSchema } from 'graphql-tools';
import types from './types';
import resolvers from './resolvers';

const graphQLSchema = makeExecutableSchema({
  typeDefs: types,
  resolvers,
  logger: console,
});

export default graphQLSchema;
