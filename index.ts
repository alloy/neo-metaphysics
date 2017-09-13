import * as express from 'express';
import * as bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeRemoteExecutableSchema, mergeSchemas } from 'graphql-tools';
import { createApolloFetch } from 'apollo-fetch';

async function run() {
  const positronSchema = await makeRemoteExecutableSchema(createApolloFetch({
    uri: process.env.POSITRON_GRAPH_URL,
  }));

  const gravitySchema = await makeRemoteExecutableSchema(createApolloFetch({
    uri: process.env.GRAVITY_GRAPH_URL,
  }));

  const convectionFetch = createApolloFetch({ uri: process.env.CONVECTION_GRAPH_URL });
  convectionFetch.use(({ request, options }, next) => {
    if (!options.headers) {
      options.headers = {};
    }
    options.headers['Authorization'] = `Bearer ${process.env.CONVECTION_TOKEN}`

    next();
  });

  const convectionSchema = await makeRemoteExecutableSchema(convectionFetch)

  const schema = mergeSchemas({
    schemas: [gravitySchema, convectionSchema, positronSchema],
    onTypeConflict: (leftType, rightType) => leftType, // Prefer Gravity over positron, for e.g. Artwork
    links: [
      {
        name: 'partners',
        from: 'Anon201', // TODO Figure out why Positron returns this instead of Article for the `article` root field
        to: 'partner', // TODO Gravity should rename this to be plural
        resolveArgs: parent => ({ ids: parent.partner_ids }),
        fragment: `
          fragment ArticlePartners on Anon201 {
            partner_ids
          }
        `,
      },
      {
        name: 'artist',
        from: 'Submission',
        to: 'artist',
        resolveArgs: parent => ({ id: parent.artist_id }),
        fragment: `
          fragment SubmissionArtist on Submission {
            artist_id
          }
        `,
      },
    ],
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
