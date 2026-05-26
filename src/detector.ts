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
  const detectors = [
    detectNode,
    detectPython,
    detectRust,
    detectGo,
    detectRuby,
    detectPHP,
    detectFlutter,
    detectJVM,
    detectDotNet,
    detectSwift,
    detectCMake
  ];

  for (const detector of detectors) {
    const context = detector();
    if (context) return context;
  }

  return null;
}

function detectNode(): ProjectContext | null {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) return null;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      dependencies: pkg.dependencies ? Object.keys(pkg.dependencies) : [],
      devDependencies: pkg.devDependencies ? Object.keys(pkg.devDependencies) : [],
    };
  } catch {
    return null;
  }
}

function detectPython(): ProjectContext | null {
  const pyprojectPath = path.join(process.cwd(), 'pyproject.toml');
  const reqPath = path.join(process.cwd(), 'requirements.txt');

  let context: ProjectContext = {};

  if (fs.existsSync(pyprojectPath)) {
    const content = fs.readFileSync(pyprojectPath, 'utf-8');
    context.name = content.match(/name\s*=\s*"([^"]+)"/)?.[1];
    context.version = content.match(/version\s*=\s*"([^"]+)"/)?.[1];
    context.description = content.match(/description\s*=\s*"([^"]+)"/)?.[1];
    
    // Simple dependency extraction from pyproject.toml
    const depsMatch = content.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
    if (depsMatch) {
      context.dependencies = depsMatch[1]
        .split(',')
        .map(d => d.trim().replace(/"/g, ''))
        .filter(d => d !== '');
    }
  }

  if (fs.existsSync(reqPath) && !context.dependencies) {
    const content = fs.readFileSync(reqPath, 'utf-8');
    context.dependencies = content
      .split('\n')
      .map(line => line.split('==')[0].split('>=')[0].trim())
      .filter(line => line !== '' && !line.startsWith('#'));
  }

  return Object.keys(context).length > 0 ? context : null;
}

function detectRust(): ProjectContext | null {
  const cargoPath = path.join(process.cwd(), 'Cargo.toml');
  if (!fs.existsSync(cargoPath)) return null;

  const content = fs.readFileSync(cargoPath, 'utf-8');
  const name = content.match(/\[package\][\s\S]*?name\s*=\s*"([^"]+)"/)?.[1];
  const version = content.match(/\[package\][\s\S]*?version\s*=\s*"([^"]+)"/)?.[1];
  
  const deps: string[] = [];
  const depsMatch = content.match(/\[dependencies\]([\s\S]*?)(\n\[|$)/);
  if (depsMatch) {
    const lines = depsMatch[1].split('\n');
    for (const line of lines) {
      const match = line.match(/^([a-zA-Z0-9_-]+)\s*=/);
      if (match) deps.push(match[1]);
    }
  }

  return { name, version, dependencies: deps };
}

function detectGo(): ProjectContext | null {
  const goModPath = path.join(process.cwd(), 'go.mod');
  if (!fs.existsSync(goModPath)) return null;

  const content = fs.readFileSync(goModPath, 'utf-8');
  const name = content.match(/^module\s+([^\s\n]+)/m)?.[1];
  
  const deps: string[] = [];
  const requireMatch = content.match(/require\s+\(([\s\S]*?)\)/) || content.match(/require\s+([^\s\n]+)/);
  if (requireMatch) {
    const lines = requireMatch[1].split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2 && !parts[0].startsWith('//')) {
        deps.push(parts[0]);
      }
    }
  }

  return { name, dependencies: deps };
}

function detectRuby(): ProjectContext | null {
  const gemfilePath = path.join(process.cwd(), 'Gemfile');
  if (!fs.existsSync(gemfilePath)) return null;

  const content = fs.readFileSync(gemfilePath, 'utf-8');
  const deps: string[] = [];
  const gemRegex = /gem\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = gemRegex.exec(content)) !== null) {
    deps.push(match[1]);
  }

  return { dependencies: deps };
}

function detectPHP(): ProjectContext | null {
  const composerPath = path.join(process.cwd(), 'composer.json');
  if (!fs.existsSync(composerPath)) return null;

  try {
    const pkg = JSON.parse(fs.readFileSync(composerPath, 'utf-8'));
    return {
      name: pkg.name,
      description: pkg.description,
      dependencies: pkg.require ? Object.keys(pkg.require).filter(k => k !== 'php') : [],
      devDependencies: pkg['require-dev'] ? Object.keys(pkg['require-dev']) : [],
    };
  } catch {
    return null;
  }
}

function detectFlutter(): ProjectContext | null {
  const pubspecPath = path.join(process.cwd(), 'pubspec.yaml');
  if (!fs.existsSync(pubspecPath)) return null;

  const content = fs.readFileSync(pubspecPath, 'utf-8');
  const name = content.match(/^name:\s*([^\s\n]+)/m)?.[1];
  const version = content.match(/^version:\s*([^\s\n]+)/m)?.[1];
  const description = content.match(/^description:\s*(.*)/m)?.[1]?.trim();

  const deps: string[] = [];
  const depsMatch = content.match(/^dependencies:\s*([\s\S]*?)^[a-z]/m) || content.match(/^dependencies:\s*([\s\S]*)/m);
  if (depsMatch) {
    const lines = depsMatch[1].split('\n');
    for (const line of lines) {
      const match = line.match(/^\s+([a-zA-Z0-9_-]+):/);
      if (match && match[1] !== 'flutter') deps.push(match[1]);
    }
  }

  return { name, version, description, dependencies: deps };
}

function detectJVM(): ProjectContext | null {
  const pomPath = path.join(process.cwd(), 'pom.xml');
  const gradlePath = path.join(process.cwd(), 'build.gradle');
  const gradleKtsPath = path.join(process.cwd(), 'build.gradle.kts');

  if (fs.existsSync(pomPath)) {
    const content = fs.readFileSync(pomPath, 'utf-8');
    const name = content.match(/<artifactId>([^<]+)<\/artifactId>/)?.[1];
    const version = content.match(/<version>([^<]+)<\/version>/)?.[1];
    
    const deps: string[] = [];
    const depRegex = /<artifactId>([^<]+)<\/artifactId>/g;
    let match;
    // Skip the first artifactId as it's usually the project's own ID
    depRegex.exec(content); 
    while ((match = depRegex.exec(content)) !== null) {
      if (!deps.includes(match[1])) deps.push(match[1]);
    }
    return { name, version, dependencies: deps };
  }

  if (fs.existsSync(gradlePath) || fs.existsSync(gradleKtsPath)) {
    const content = fs.readFileSync(fs.existsSync(gradlePath) ? gradlePath : gradleKtsPath, 'utf-8');
    const deps: string[] = [];
    const depRegex = /(?:implementation|api|testImplementation)\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = depRegex.exec(content)) !== null) {
      const parts = match[1].split(':');
      const depName = parts.length > 1 ? parts[1] : parts[0];
      if (!deps.includes(depName)) deps.push(depName);
    }
    return { dependencies: deps };
  }

  return null;
}

function detectDotNet(): ProjectContext | null {
  const files = fs.readdirSync(process.cwd());
  const csprojFile = files.find(f => f.endsWith('.csproj'));
  if (!csprojFile) return null;

  const content = fs.readFileSync(path.join(process.cwd(), csprojFile), 'utf-8');
  const name = path.basename(csprojFile, '.csproj');
  
  const deps: string[] = [];
  const depRegex = /Include="([^"]+)"/g;
  let match;
  while ((match = depRegex.exec(content)) !== null) {
    if (!deps.includes(match[1])) deps.push(match[1]);
  }

  return { name, dependencies: deps };
}

function detectSwift(): ProjectContext | null {
  const packageSwiftPath = path.join(process.cwd(), 'Package.swift');
  if (!fs.existsSync(packageSwiftPath)) return null;

  const content = fs.readFileSync(packageSwiftPath, 'utf-8');
  const name = content.match(/name:\s*["']([^"']+)["']/)?.[1];
  
  const deps: string[] = [];
  const depRegex = /\.package\(url:\s*["']([^"']+)["']/g;
  let match;
  while ((match = depRegex.exec(content)) !== null) {
    const parts = match[1].split('/');
    const depName = parts[parts.length - 1].replace('.git', '');
    if (!deps.includes(depName)) deps.push(depName);
  }

  return { name, dependencies: deps };
}

function detectCMake(): ProjectContext | null {
  const cmakePath = path.join(process.cwd(), 'CMakeLists.txt');
  if (!fs.existsSync(cmakePath)) return null;

  const content = fs.readFileSync(cmakePath, 'utf-8');
  const name = content.match(/project\s*\(\s*([^\s\)]+)/i)?.[1];
  
  const deps: string[] = [];
  const findPkgRegex = /find_package\s*\(\s*([^\s\)]+)/gi;
  let match;
  while ((match = findPkgRegex.exec(content)) !== null) {
    if (!deps.includes(match[1])) deps.push(match[1]);
  }

  return { name, dependencies: deps };
}
