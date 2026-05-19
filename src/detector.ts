import fs from 'fs';
import path from 'path';

export interface ProjectContext {
  name?: string;
  version?: string;
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
}

export function detectProjectContext(): ProjectContext | null {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);
    
    return {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      dependencies: pkg.dependencies ? Object.keys(pkg.dependencies) : [],
      devDependencies: pkg.devDependencies ? Object.keys(pkg.devDependencies) : [],
    };
  } catch (error) {
    return null;
  }
}
