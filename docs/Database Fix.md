# Understanding SQLite Database Corruption

## What Happened?

Your database was becoming corrupted specifically when updating user information. The corruption occurred after the first successful update, suggesting that the first operation modified some internal state of the database in a way that made subsequent operations unsafe.

## Why It Happened?

The root cause was related to how SQLite handles transactions and writes data to disk. SQLite databases are susceptible to corruption when:

1. **Concurrent access isn't properly managed**: Multiple operations trying to modify the database simultaneously
2. **Transactions aren't properly committed**: When a database operation is partially completed and then interrupted
3. **Journal mode isn't optimized**: Using the default journal mode can lead to issues with complex operations like FTS triggers

In your specific case, the FTS (Full-Text Search) triggers you set up were likely interacting problematically with the default SQLite settings. The `UPDATE` operations in your triggers might have been creating race conditions or inconsistent database states.

## What is PRAGMA?

"PRAGMA" in SQLite is a special command used to modify the operation of the SQLite library. Think of pragmas as configuration settings for your database connection. They control how SQLite behaves in terms of:

- How data is written to disk
- How transactions are handled
- How the database locks and handles concurrent access
- Performance characteristics
- Security features

## How the Solution Fixed It

The solution modified your database connection string to include several PRAGMA settings:

```python
SQLALCHEMY_DATABASE_URI = (
    f"sqlite:///{SQLITE_DB_DIR}"
    f"?journal_mode=WAL"          # Write-Ahead Logging for better concurrency
    f"&synchronous=NORMAL"        # Balance between safety and performance
    f"&foreign_keys=ON"           # Enforce referential integrity
    f"&locking_mode=NORMAL"       # Standard locking
    f"&busy_timeout=5000"         # Wait 5 seconds on busy before failing
)
```

Here's what each setting does:

### 1. `journal_mode=WAL` (Write-Ahead Logging)
This is the most important fix. WAL changes how SQLite writes changes to the database:

- **Default mode**: SQLite uses a "rollback journal" where changes are first written to a separate file and then copied to the main database
- **WAL mode**: Changes are appended to a separate log file, and readers can continue reading the old version while writers add to the log

Benefits of WAL:
- Better concurrency: Readers don't block writers, writers don't block readers
- More robust to crashes: If a crash occurs during a write, the database remains in a consistent state
- Faster for most workloads: Writing to the log is often faster than rewriting the database file

This directly addressed your issue with the FTS triggers, which involve multiple read/write operations that need to happen reliably.

### 2. `synchronous=NORMAL`
This controls how aggressively SQLite forces data to be written to physical storage:

- FULL (default): Every write is pushed to physical storage immediately (safest but slowest)
- NORMAL: Slightly less safe but much better performance
- OFF: Fastest but vulnerable to corruption on system crashes

This setting balances safety and performance, making sure your database operations are still durable without excessive slowdown.

### 3. `foreign_keys=ON`
This enforces referential integrity for foreign key relationships, ensuring that your data remains consistent. This isn't directly related to your corruption issue but is a good practice.

### 4. `locking_mode=NORMAL`
Controls how SQLite locks the database file. NORMAL mode is the default and allows multiple readers and a single writer.

### 5. `busy_timeout=5000`
Sets how long (in milliseconds) SQLite will wait when the database is locked before giving up. This prevents "database is locked" errors by waiting up to 5 seconds for locks to clear.

## The Core Fix

The primary reason this solved your problem is that WAL mode significantly improves how SQLite handles:

1. **Concurrent operations**: Your FTS triggers were running alongside your main database operations
2. **Transaction isolation**: WAL provides better isolation between different operations
3. **Crash recovery**: WAL mode can recover cleanly from crashes or interruptions during writes, which is critical for FTS operations

SQLite's default journal mode wasn't able to handle the complexity of your application's operations, especially the FTS triggers that perform multiple database changes for each update to a user record.

This is a common issue with SQLite when it's used for more complex applications – the default settings are optimized for simplicity and compatibility rather than robustness for complex workloads.
