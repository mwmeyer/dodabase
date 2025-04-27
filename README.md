# Dodabase

Dodabase is a directory of AI coding tools and libraries that help developers build, test, and deploy software more efficiently. This project is built with [Next.js](https://nextjs.org) and provides a clean, searchable interface for discovering AI-powered development tools.

## Project Overview

Dodabase catalogs various types of AI coding tools including:
- **Extensions**: AI tools that integrate with code editors and IDEs
- **CLI Tools**: Command-line interfaces for AI-assisted coding
- **Generators**: Tools that can generate code or entire applications
- **Libraries**: Code libraries with AI capabilities

## Adding New Tools

Tools are defined in the `src/data/tools.md` file using YAML frontmatter. To add a new tool:

1. Open `src/data/tools.md`
2. Add a new entry to the `tools` array in the frontmatter section
3. Follow this format:

```yaml
- name: "Tool Name"
  description: "A brief description of what the tool does"
  type: "extension|cli|generator|library"
  url: "https://github.com/username/repository"
  license: "License type (e.g., MIT, Apache-2.0)"
```

Example:
```yaml
- name: "Aider"
  description: "Terminal-based AI pair programming with local LLM support"
  type: "cli"
  url: "https://github.com/paul-gauthier/aider"
  license: "Apache-2.0"
```

### Tool Types

When adding a new tool, use one of these types:
- `extension`: Tools that integrate with code editors/IDEs
- `cli`: Command-line interface tools
- `generator`: Tools that generate code or applications
- `library`: Code libraries with AI capabilities

## Project Structure

- `src/data/tools.md`: Contains the list of tools in YAML frontmatter
- `src/lib/tools.ts`: Functions for parsing and retrieving tool data
- `src/components/ToolsList.tsx`: Component for displaying the tools
- `src/app/page.tsx`: Main page that renders the tools list