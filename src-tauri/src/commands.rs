use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::postgres::{PgPool, PgPoolOptions};
use sqlx::{Column, Row, TypeInfo, ValueRef};

#[derive(Debug, Serialize)]
pub struct DatabaseInfo {
    name: String,
    owner: String,
    size: String,
}

#[derive(serde::Serialize)]
pub struct TableSchema {
    name: String,
    schema: String,
    columns: Vec<ColumnInfo>,
}

#[derive(serde::Serialize)]
pub struct ColumnInfo {
    name: String,
    data_type: String,
    is_nullable: bool,
    has_default: bool,
    foreign_key: Option<String>,
}

#[tauri::command]
pub async fn get_schema(connection_string: String) -> Result<String, String> {
    println!("Received connection string: {}", connection_string);

    let pool = PgPool::connect(&connection_string)
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    // Get current database name
    let db_name: String = sqlx::query_scalar("SELECT current_database()")
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to get database name: {}", e))?;

    println!("Connected to database: {}", db_name);

    // Query to get tables and their columns with foreign key information
    let query = r#"
        SELECT 
            t.table_schema,
            t.table_name,
            c.column_name,
            c.data_type,
            c.is_nullable,
            tc.constraint_type,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.tables t
        JOIN information_schema.columns c 
            ON c.table_schema = t.table_schema 
            AND c.table_name = t.table_name
        LEFT JOIN information_schema.key_column_usage kcu
            ON kcu.table_schema = t.table_schema
            AND kcu.table_name = t.table_name
            AND kcu.column_name = c.column_name
        LEFT JOIN information_schema.table_constraints tc
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = t.table_schema
            AND tc.table_name = t.table_name
        LEFT JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND tc.constraint_type = 'FOREIGN KEY'
        WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY t.table_schema, t.table_name, c.ordinal_position;
    "#;

    let rows = sqlx::query(query)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to query schema: {}", e))?;

    // Process rows into schema
    let mut schema: Vec<TableSchema> = Vec::new();
    let mut current_table: Option<TableSchema> = None;

    for row in rows {
        let table_schema: &str = row.get("table_schema");
        let table_name: &str = row.get("table_name");
        let column_name: &str = row.get("column_name");
        let data_type: &str = row.get("data_type");
        let is_nullable: &str = row.get("is_nullable");
        let constraint_type: Option<String> = row.get("constraint_type");

        let foreign_key = if constraint_type.as_deref() == Some("FOREIGN KEY") {
            let foreign_schema: &str = row.get("foreign_table_schema");
            let foreign_table: &str = row.get("foreign_table_name");
            let foreign_column: &str = row.get("foreign_column_name");
            Some(format!(
                "{}.{}.{}",
                foreign_schema, foreign_table, foreign_column
            ))
        } else {
            None
        };

        let column = ColumnInfo {
            name: column_name.to_string(),
            data_type: data_type.to_string(),
            is_nullable: is_nullable == "YES",
            has_default: false,
            foreign_key,
        };

        if let Some(ref mut table) = current_table {
            if table.schema == table_schema && table.name == table_name {
                table.columns.push(column);
                continue;
            }
        }

        if let Some(table) = current_table.take() {
            schema.push(table);
        }

        current_table = Some(TableSchema {
            schema: table_schema.to_string(),
            name: table_name.to_string(),
            columns: vec![column],
        });
    }

    if let Some(table) = current_table {
        schema.push(table);
    }

    let schema_json =
        serde_json::to_value(schema).map_err(|e| format!("Failed to serialize schema: {}", e))?;

    Ok(schema_json.to_string())
}

#[tauri::command]
pub async fn list_databases(connection_string: &str) -> Result<Vec<DatabaseInfo>, String> {
    println!("Listing available databases...");

    // Extract the base connection string without the database name
    let base_conn_string = if connection_string.contains('/') {
        connection_string.rsplitn(2, '/').nth(1)
            .ok_or("Invalid connection string format")?
            .to_string() + "/"
    } else {
        connection_string.to_string()
    };

    // Connect to postgres database to list all databases
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&(base_conn_string.clone() + "postgres"))
        .await
        .map_err(|e| format!("Failed to connect to postgres database: {}", e))?;

    println!("Connected to postgres database to list available databases");

    // Query to get database information including size and owner
    let rows = sqlx::query(
        "SELECT d.datname as name,
                pg_catalog.pg_get_userbyid(d.datdba) as owner,
                pg_catalog.pg_size_pretty(pg_catalog.pg_database_size(d.datname)) as size
         FROM pg_catalog.pg_database d
         WHERE d.datistemplate = false
         ORDER BY name"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to list databases: {}", e))?;

    let databases = rows
        .iter()
        .map(|row| DatabaseInfo {
            name: row.get("name"),
            owner: row.get("owner"),
            size: row.get("size"),
        })
        .collect();

    Ok(databases)
}

#[tauri::command]
pub async fn create_database(connection_string: &str, database_name: &str) -> Result<(), String> {
    println!("Received connection string: {}", connection_string);

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(connection_string)
        .await
        .map_err(|e| e.to_string())?;

    let db_name: String = sqlx::query_scalar("SELECT current_database()")
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to get database name: {}", e))?;

    println!("Connected to database: {}", db_name);

    let query = format!("CREATE DATABASE {}", database_name);
    sqlx::query(&query)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_database(connection_string: &str, database_name: &str) -> Result<(), String> {
    println!("Received connection string: {}", connection_string);

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(connection_string)
        .await
        .map_err(|e| e.to_string())?;

    let db_name: String = sqlx::query_scalar("SELECT current_database()")
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to get database name: {}", e))?;

    println!("Connected to database: {}", db_name);

    let query = format!("DROP DATABASE {}", database_name);
    match sqlx::query(&query).execute(&pool).await {
        Ok(_) => Ok(()),
        Err(err) => {
            println!("Error: {}", err);
            Err(err.to_string())
        }
    }
}

#[tauri::command]
pub async fn execute_query(connection_string: &str, query: &str) -> Result<String, String> {
    let start_time = std::time::Instant::now();
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(connection_string)
        .await
        .map_err(|e| e.to_string())?;

    let result = sqlx::query(query)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let execution_time = start_time.elapsed().as_millis();

    // Convert rows to JSON
    let json_rows: Vec<serde_json::Value> = result
        .iter()
        .map(|row| {
            let mut map = serde_json::Map::new();
            for (i, column) in row.columns().iter().enumerate() {
                let value = row
                    .try_get_raw(i)
                    .ok()
                    .and_then(|v| {
                        if v.is_null() {
                            Some(serde_json::Value::Null)
                        } else {
                            match v.type_info().name() {
                                "text" | "varchar" | "char" | "name" => row
                                    .try_get::<String, _>(i)
                                    .ok()
                                    .map(serde_json::Value::String),
                                "int2" | "int4" => row
                                    .try_get::<i32, _>(i)
                                    .ok()
                                    .map(|n| serde_json::Value::Number(n.into())),
                                "int8" => row
                                    .try_get::<i64, _>(i)
                                    .ok()
                                    .map(|n| serde_json::Value::Number(n.into())),
                                "float4" => row
                                    .try_get::<f32, _>(i)
                                    .ok()
                                    .map(|n| serde_json::json!(n)),
                                "float8" => row
                                    .try_get::<f64, _>(i)
                                    .ok()
                                    .map(|n| serde_json::json!(n)),
                                "bool" => row
                                    .try_get::<bool, _>(i)
                                    .ok()
                                    .map(serde_json::Value::Bool),
                                "timestamp" | "timestamptz" => row
                                    .try_get::<DateTime<Utc>, _>(i)
                                    .ok()
                                    .map(|dt| serde_json::Value::String(dt.to_rfc3339())),
                                _ => row
                                    .try_get::<String, _>(i)
                                    .ok()
                                    .map(serde_json::Value::String),
                            }
                        }
                    })
                    .unwrap_or(serde_json::Value::Null);

                map.insert(column.name().to_string(), value);
            }
            serde_json::Value::Object(map)
        })
        .collect();

    let result_json = serde_json::json!({
        "rows": json_rows,
        "rowCount": result.len(),
        "executionTime": execution_time,
        "columns": result.get(0).map(|row| {
            row.columns().iter().map(|col| {
                serde_json::json!({
                    "name": col.name(),
                    "type": col.type_info().name()
                })
            }).collect::<Vec<_>>()
        }).unwrap_or_default()
    });

    Ok(serde_json::to_string(&result_json).map_err(|e| e.to_string())?)
}

#[tauri::command]
pub async fn query_table(
    connection_string: String,
    table_name: String,
    schema_name: String,
) -> Result<Vec<serde_json::Value>, String> {
    println!("Received connection string: {}", connection_string);

    let pool = PgPool::connect(&connection_string)
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    // Get current database name
    let db_name: String = sqlx::query_scalar("SELECT current_database()")
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to get database name: {}", e))?;

    println!("Connected to database: {}", db_name);

    // Debug: List all tables in the database
    println!("Listing all tables in database:");
    let tables = sqlx::query(
        "SELECT table_schema, table_name 
         FROM information_schema.tables 
         WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
         ORDER BY table_schema, table_name"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to list tables: {}", e))?;

    for row in &tables {
        let schema: &str = row.try_get("table_schema").unwrap_or("unknown");
        let table: &str = row.try_get("table_name").unwrap_or("unknown");
        println!("Found table: {}.{}", schema, table);
    }

    println!("Searching for table: {}.{}", schema_name, table_name);

    // Check if table exists before querying
    let table_exists: bool = sqlx::query_scalar(
        "SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 
            AND table_name = $2
        )"
    )
    .bind(&schema_name)
    .bind(&table_name)
    .fetch_one(&pool)
    .await
    .map_err(|e| format!("Failed to check table existence: {}", e))?;

    if !table_exists {
        return Err(format!("Table {}.{} does not exist", schema_name, table_name));
    }

    // Safely quote both schema and table names
    let quoted_schema = format!("\"{}\"", schema_name.replace("\"", "\"\""));
    let quoted_table = format!("\"{}\"", table_name.replace("\"", "\"\""));

    // Query to get all rows from the table
    let query = format!(
        "SELECT * FROM {}.{} LIMIT 1000",
        quoted_schema, quoted_table
    );

    println!("Executing query: {}", query);

    let rows = sqlx::query(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to query table: {}", e))?;

    // Convert rows to JSON
    let json_rows: Vec<serde_json::Value> = rows
        .iter()
        .map(|row| {
            let mut map = serde_json::Map::new();
            for (i, column) in row.columns().iter().enumerate() {
                let value = row
                    .try_get_raw(i)
                    .ok()
                    .and_then(|v| {
                        if ValueRef::is_null(&v) {
                            Some(serde_json::Value::Null)
                        } else {
                            match ValueRef::type_info(&v).name() {
                                "text" | "varchar" | "char" => row
                                    .try_get::<String, _>(i)
                                    .ok()
                                    .map(serde_json::Value::String),
                                "int4" => row
                                    .try_get::<i32, _>(i)
                                    .ok()
                                    .map(|n| serde_json::Value::Number(n.into())),
                                "int8" => row
                                    .try_get::<i64, _>(i)
                                    .ok()
                                    .map(|n| serde_json::Value::Number(n.into())),
                                "float4" => {
                                    row.try_get::<f32, _>(i).ok().map(|n| serde_json::json!(n))
                                }
                                "float8" => {
                                    row.try_get::<f64, _>(i).ok().map(|n| serde_json::json!(n))
                                }
                                "bool" => {
                                    row.try_get::<bool, _>(i).ok().map(serde_json::Value::Bool)
                                }
                                "timestamp" | "timestamptz" => row
                                    .try_get::<DateTime<Utc>, _>(i)
                                    .ok()
                                    .map(|dt| serde_json::Value::String(dt.to_rfc3339())),
                                _ => row
                                    .try_get::<String, _>(i)
                                    .ok()
                                    .map(serde_json::Value::String),
                            }
                        }
                    })
                    .unwrap_or(serde_json::Value::Null);

                map.insert(Column::name(column).to_string(), value);
            }
            serde_json::Value::Object(map)
        })
        .collect();

    Ok(json_rows)
}
