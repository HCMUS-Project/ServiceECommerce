#!/bin/bash
# Wait for PostgreSQL to be up before running migrations and other tasks
./wait-for-it.sh postgres:5432 --timeout=30 --strict -- echo "Postgres is up"

# Generate protocol files
yarn gen:proto_folder
yarn gen:proto

# Run database migrations
export migrate_name="merge_db_from_new_pull"
yarn migrate

# Generate additional necessary files
yarn generate

yarn build

# Start Prisma Studio in the background
npx prisma studio --port 5555 &

# Start the main process.
exec "$@"