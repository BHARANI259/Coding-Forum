\set db_name 'kec_coding_forum'
\set app_user 'kec_forum_app'
\set app_password 'kec_forum_pass'

SELECT 'CREATE DATABASE ' || :'db_name'
WHERE NOT EXISTS (
    SELECT 1 FROM pg_database WHERE datname = :'db_name'
)\gexec

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kec_forum_app') THEN
        CREATE USER kec_forum_app WITH PASSWORD 'kec_forum_pass';
    ELSE
        ALTER USER kec_forum_app WITH PASSWORD 'kec_forum_pass';
    END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE kec_coding_forum TO kec_forum_app;

\connect kec_coding_forum

GRANT USAGE, CREATE ON SCHEMA public TO kec_forum_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kec_forum_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO kec_forum_app;

