import * as express from 'express';
import * as bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeRemoteExecutableSchema, mergeSchemas } from 'graphql-tools';
import { createApolloFetch } from 'apollo-fetch';

async function run() {
  const positronSchema = await makeRemoteExecutableSchema(createApolloFetch({
    uri: 'https://stagingwriter.artsy.net/api/graphql',
  }));

  const gravitySchema = await makeRemoteExecutableSchema(createApolloFetch({
    uri: 'https://stagingapi.artsy.net/api/graphql',
  }));

  const schema = mergeSchemas({
    schemas: [gravitySchema, positronSchema],
    onTypeConflict: (leftType, rightType) => leftType, // Prefer Gravity over positron, for e.g. Artwork
    links: [],
  });

  const app = express();

  app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

  app.use(
    '/graphiql',
    graphiqlExpress({
      endpointURL: '/graphql',
      query: `query {
  article(id: "58d535ba8fcf0a002767b338") {
    title
    partners {
      display_name
    }
  }
}
      `,
    })
  );

  app.listen(3000);
  console.log('Server running. Open http://localhost:3000/graphiql to run queries.');
}

try {
  run();
} catch (e) {
  console.log(e, e.message, e.stack);
}
