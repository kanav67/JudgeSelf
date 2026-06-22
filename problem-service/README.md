# Problem Service

Internal Node.js microservice for importing programming problems from Polygon / Codeforces, preparing test data with `isolate`, and storing the resulting problem package in PostgreSQL.

## Structure

- `src/routes` - HTTP endpoints
- `src/controllers` - request handlers
- `src/services` - ingestion and processing steps
- `src/repositories` - database access
- `src/config` - environment and database config
- `docker/` - shared infrastructure bootstrap files for the workspace

## Scripts

- `npm run dev` - start the server with watch mode
- `npm start` - start the server once
- `npm run check` - syntax-check the project files

## Next steps

The next implementation pass can fill in the persistence model, Polygon fetch flow, archive handling, isolate execution, and statement/checker extraction details.

## Local infrastructure

Run `npm run docker:up` from this folder to start the shared PostgreSQL and MinIO stack defined at the workspace root. The root compose file also creates the default S3 bucket used by the service.
