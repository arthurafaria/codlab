# IA Racial Coder - Claude Configuration

This file documents Claude Code workflows and skills for the IA Racial Coder project.

## Available Skills

### 1. Improve
**Reference**: https://github.com/shadcn/improve
**Activation**: `/improve`
**Purpose**: Code improvement and optimization suggestions

### 2. Design an Interface
**Reference**: https://github.com/mattpocock/skills
**Activation**: `/design-an-interface`
**Purpose**: Interface design assistance and component creation

### 3. Make Interfaces Feel Better
**Reference**: https://github.com/jakubkrehel/make-interfaces-feel-better
**Activation**: `/make-interfaces-feel-better`
**Purpose**: UI/UX improvements and interaction refinements

### 4. ECC
**Reference**: https://github.com/affaan-m/ecc
**Purpose**: Error and consistency checking

### 5. CSV Data Visualizer
**Reference**: https://github.com/ailabs-393/ai-labs-claude-skills
**Activation**: `/csv-data-visualizer`
**Purpose**: Create visualizations from CSV data

## Project Context

- **Framework**: Next.js 16.2.6
- **Package Manager**: Bun 1.3.13
- **Runtime**: Node.js/React
- **Key Dependencies**:
  - React 19.2.3
  - Google APIs integration
  - XLSX & Mammoth (document parsing)
  - Vercel Blob storage

## Development Commands

```bash
# Start development server
bun run dev

# Build production
bun run build

# Start production server
bun run start

# Generate data
bun run generate:data
```

## Workflow Tips

1. **Interface Design**: Use `/design-an-interface` for UI component creation
2. **Code Quality**: Use `/improve` for code optimization
3. **UX Polish**: Use `/make-interfaces-feel-better` for interaction improvements
4. **Data Visualization**: Use `/csv-data-visualizer` for chart creation

---
Created: 2026-07-21
