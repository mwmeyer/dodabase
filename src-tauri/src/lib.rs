#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use crate::commands::{
    create_database, delete_database, execute_query, get_schema, list_databases, query_table,
};

pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            list_databases,
            create_database,
            delete_database,
            execute_query,
            get_schema,
            query_table
        ])
        .run(tauri::generate_context!())
        .map_err(|e| e.into())
}
