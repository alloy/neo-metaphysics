# Schema stitching demo

Schema stitching is the idea of automatically combining two or more GraphQL schemas into one. It can be used to modularize a single GraphQL codebase, integrate with other APIs, or just combine two public APIs into one. This is going to be one of the main features of the 2.0 release of [graphql-tools](https://github.com/apollographql/graphql-tools/pull/382), a library for creating and manipulating GraphQL schemas in JavaScript.

Huge thanks to [Mikhail Novikov](https://github.com/freiksenet) for his awesome design and implementation on this feature, and please contribute to the PR if you find it exciting!

### Running the example

First, copy the example .env file:
```
cp .env.example .env
```

In a Convection console (staging, local, or production depending on what you are developing against), generate a valid access token:
```
payload =  { aud: 'app', sub: <valid_user_id> }
token = JWT.encode payload, Convection.config.jwt_secret, 'HS256'
```

Paste this into your `.env` file under `CONVECTION_ACCESS_TOKEN`.

Then, run it like any other npm project:
```
yarn install
yarn start
```

Then, open [localhost:3000/graphiql](http://localhost:3000/graphiql) in your web browser, and hit run on the query!

### What does this do?

In short, this combines three GraphQL APIs:

1. Artsy’s Gravity GraphQL API
2. Artsy’s Positron GraphQL API
3. Artsy's Convection GraphQL API

Against those APIs, we can run queries like the following:

```graphql
# Get article information from Positron
query {
  article(id: "58d535ba8fcf0a002767b338") {
    title
    partner_ids
  }
}

# Get partner information from Gravity
query {
  partner(ids: ["4dd15229e0091e000100166b"]) {
    display_name
  }
}

# Get artist name on a submission from Gravity
query {
  submission(id: 69) {
    artist {
      name
    }
  }
}
```

One thing that stands out is that the `partner_ids` field from Positron matches up nicely with the argument to the `partner` field in the Gravity API. So what if we could just nicely pipe one into the other? Well, with schema stitching in graphql-tools 2.0, we now can! (See [the example](index.ts) for details.)

Now, we can run the following query that gets information from both APIs!

```graphql
query {
  # From the Positron API
  article(id: "58d535ba8fcf0a002767b338") {
    title

    # Stitched field that goes to the Gravity API
    partners {
      display_name
    }
  }
}
```
