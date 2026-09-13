# KukuDhamini PostgreSQL Backup and Restore

These commands are examples for an operator with access to the PostgreSQL database configured by `DATABASE_URL`. Run them from a secure machine, never commit the connection string, and store backups separately from the database provider.

## Backup

Create a compressed custom-format backup:

```bash
pg_dump --format=custom --file=kukudhamini-$(date +%Y-%m-%d).dump "$DATABASE_URL"
```

Use encrypted storage with restricted access. A practical production policy is daily automated backups, at least 30 days of retention, and periodic off-provider copies.

## Restore

Restore only after confirming the target database and obtaining approval. Restoration can overwrite existing objects and data:

```bash
pg_restore --clean --if-exists --dbname="$RESTORE_DATABASE_URL" kukudhamini-YYYY-MM-DD.dump
```

For a fresh, empty target, omit `--clean --if-exists`. Never run a restore against production as an experiment.

## Verify a backup

Restore a copy into an isolated test database, run `prisma migrate deploy` if the target requires migrations, and verify login plus representative farm workflows. A backup is usable only when the restore completes and the application can read and write expected test records.

## Separation and safety

- Keep production and test URLs separate.
- Do not store backups in the application repository or public web storage.
- Restrict backup files and database credentials to operators who need them.
- Test restoration at least quarterly and record the restore time and result.