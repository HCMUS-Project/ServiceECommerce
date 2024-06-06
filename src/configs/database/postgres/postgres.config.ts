/**
 * @fileOverview mongo.config - Configuration for postgres database
 */

export default () => ({
    postgresUri: process.env.POSTGRES_URI || 'postgres://admin:123456@localhost:5432/nest',
});
