import { useState } from 'react';
import { Modal } from './Modal';

export type DatabaseType = 'postgres' | 'mysql' | 'sqlite';

export interface DatabaseConfig {
  type: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

interface DatabaseConfigProps {
  isOpen: boolean;
  config: DatabaseConfig;
  onChange: (config: DatabaseConfig) => void;
  onClose: () => void;
  onConnect: (config: DatabaseConfig) => void;
  isConnecting: boolean;
}

const defaultPorts: Record<DatabaseType, number> = {
  postgres: 5432,
  mysql: 3306,
  sqlite: 0,
};

export function DatabaseConfig({
  isOpen,
  config,
  onClose,
  onConnect,
  isConnecting,
}: DatabaseConfigProps) {
  const initialConfig: DatabaseConfig = {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: '',
    database: 'postgres' // Default to postgres for initial connection
  };

  const [localConfig, setLocalConfig] = useState<DatabaseConfig>(config || initialConfig);
  const [showPassword, setShowPassword] = useState(false);

  const handleTypeChange = (type: DatabaseType) => {
    setLocalConfig(prev => ({
      ...prev,
      type,
      port: defaultPorts[type],
      // Reset database name for different types
      database: type === 'postgres' ? 'postgres' : ''
    }));
  };

  const handleConnectClick = () => {
    if (!isFormValid()) return;
    onConnect(localConfig);
  };

  const isFormValid = () => {
    if (localConfig.type === 'sqlite') {
      return !!localConfig.database;
    }
    return !!(
      localConfig.host &&
      localConfig.port &&
      localConfig.username &&
      localConfig.database
    );
  };

  const getConnectionHint = () => {
    switch (localConfig.type) {
      case 'postgres':
        return 'Default superuser is usually "postgres"';
      case 'mysql':
        return 'Default superuser is usually "root"';
      case 'sqlite':
        return 'Enter the database file path';
      default:
        return '';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Database Configuration"
      size="md"
    >
      <div className="space-y-4 p-4">

        <div>
          <label className="block text-sm font-medium mb-1">Database Type</label>
          <select
            value={localConfig.type}
            onChange={(e) => handleTypeChange(e.target.value as DatabaseType)}
            className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:border-[var(--primary-color)] appearance-none cursor-pointer hover:border-[var(--primary-color)]"
          >
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
          </select>
        </div>

        {localConfig.type !== 'sqlite' ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Host</label>
                <input
                  type="text"
                  value={localConfig.host}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="localhost"
                  className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Port</label>
                <input
                  type="number"
                  value={localConfig.port}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, port: parseInt(e.target.value) || defaultPorts[prev.type] }))}
                  className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={localConfig.username}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, username: e.target.value }))}
                placeholder={localConfig.type === 'postgres' ? 'postgres' : 'root'}
                className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)]"
              />
              <p className="text-xs text-gray-500 mt-1">{getConnectionHint()}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={localConfig.password}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password (optional)"
                  className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Database File</label>
            <input
              type="text"
              value={localConfig.database}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, database: e.target.value }))}
              placeholder="Enter database file path"
              className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)]"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Database Name</label>
          <input
            type="text"
            value={localConfig.database}
            onChange={(e) => setLocalConfig(prev => ({ ...prev, database: e.target.value }))}
            placeholder={localConfig.type === 'postgres' ? 'postgres' : 'Enter database name'}
            className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)]"
          />
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-[var(--border-color)] hover:bg-[var(--bg-darker)]"
          >
            Cancel
          </button>
          <button
            onClick={handleConnectClick}
            disabled={!isFormValid() || isConnecting}
            className={`px-4 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
