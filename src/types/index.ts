export interface CpuUsage {
  percentage: number;
  frequency_ghz: number;
  active_cores: number;
}

export interface MemoryUsage {
  total_bytes: number;
  used_bytes: number;
  total_swap_bytes: number;
  used_swap_bytes: number;
}

export interface NetworkInterface {
  received_bytes: number;
  transmitted_bytes: number;
}

export interface DiskInfo {
  name: string;
  mount_point: string;
  total_bytes: number;
  available_bytes: number;
  is_removable: boolean;
}

export interface SystemInfo {
  name: string | null;
  kernel_version: string | null;
  os_version: string | null;
  host_name: string | null;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_bytes: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
