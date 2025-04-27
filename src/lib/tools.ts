import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type ToolType = 'extension' | 'cli' | 'generator' | 'library';

export type Tool = {
  name: string;
  description: string;
  type: ToolType;
  url: string;
  license: string;
};

export function getToolsData(): Tool[] {
  // Path to the tools.md file
  const filePath = path.join(process.cwd(), 'src/data/tools.md');
  
  // Read the file content
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Parse the frontmatter using gray-matter
  const { data } = matter(fileContent);
  
  return data.tools || [];
}
