use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use std::path::PathBuf;

pub mod migrations;

pub type DbPool = Pool<SqliteConnectionManager>;

pub fn init_db(db_path: PathBuf) -> Result<DbPool, Box<dyn std::error::Error>> {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let manager = SqliteConnectionManager::file(db_path).with_init(|c| {
        c.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA foreign_keys = ON;
             PRAGMA busy_timeout = 5000;",
        )
    });

    let pool = Pool::builder().max_size(8).build(manager)?;

    let mut conn = pool.get()?;
    migrations::run_migrations(&mut conn)?;

    Ok(pool)
}
