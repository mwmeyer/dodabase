import { getToolsData } from '@/lib/tools';
import { ToolsList } from '@/components/ToolsList';

export default function Home() {
  // Load tools data at build time
  const tools = getToolsData();
  
  return (
    <ToolsList initialTools={tools} />
  );
}
