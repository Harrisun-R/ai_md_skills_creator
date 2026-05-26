import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectProjectContext } from '../detector.js';
import fs from 'fs';

vi.mock('fs');

describe('Detector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks to prevent accidental hits
    (fs.existsSync as any).mockReturnValue(false);
    (fs.readdirSync as any).mockReturnValue([]);
  });

  it('should detect Node.js projects', () => {
    (fs.existsSync as any).mockImplementation((path: string) => path.endsWith('package.json'));
    (fs.readFileSync as any).mockReturnValue(JSON.stringify({
      name: 'node-project',
      version: '1.0.0',
      dependencies: { express: '^4.17.1' }
    }));

    const context = detectProjectContext();
    expect(context?.name).toBe('node-project');
    expect(context?.dependencies).toContain('express');
  });

  it('should detect Python projects via pyproject.toml', () => {
    (fs.existsSync as any).mockImplementation((path: string) => path.endsWith('pyproject.toml'));
    (fs.readFileSync as any).mockReturnValue(`
[project]
name = "python-project"
version = "0.1.0"
dependencies = [
    "requests",
    "flask"
]
    `);

    const context = detectProjectContext();
    expect(context?.name).toBe('python-project');
    expect(context?.dependencies).toContain('requests');
    expect(context?.dependencies).toContain('flask');
  });

  it('should detect Rust projects via Cargo.toml', () => {
    (fs.existsSync as any).mockImplementation((path: string) => path.endsWith('Cargo.toml'));
    (fs.readFileSync as any).mockReturnValue(`
[package]
name = "rust-project"
version = "1.2.3"

[dependencies]
serde = "1.0"
tokio = { version = "1.0", features = ["full"] }
    `);

    const context = detectProjectContext();
    expect(context?.name).toBe('rust-project');
    expect(context?.dependencies).toContain('serde');
    expect(context?.dependencies).toContain('tokio');
  });

  it('should detect Go projects via go.mod', () => {
    (fs.existsSync as any).mockImplementation((path: string) => path.endsWith('go.mod'));
    (fs.readFileSync as any).mockReturnValue(`
module github.com/user/go-project

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/spf13/cobra v1.8.0
)
    `);

    const context = detectProjectContext();
    expect(context?.name).toBe('github.com/user/go-project');
    expect(context?.dependencies).toContain('github.com/gin-gonic/gin');
  });

  it('should detect Ruby projects via Gemfile', () => {
    (fs.existsSync as any).mockImplementation((path: string) => path.endsWith('Gemfile'));
    (fs.readFileSync as any).mockReturnValue(`
source 'https://rubygems.org'
gem 'rails', '~> 7.0'
gem 'pg'
    `);

    const context = detectProjectContext();
    expect(context?.dependencies).toContain('rails');
    expect(context?.dependencies).toContain('pg');
  });

  it('should detect PHP projects via composer.json', () => {
    (fs.existsSync as any).mockImplementation((path: string) => path.endsWith('composer.json'));
    (fs.readFileSync as any).mockReturnValue(JSON.stringify({
      name: 'vendor/php-project',
      require: { 'laravel/framework': '^10.0', 'php': '^8.1' }
    }));

    const context = detectProjectContext();
    expect(context?.name).toBe('vendor/php-project');
    expect(context?.dependencies).toContain('laravel/framework');
    expect(context?.dependencies).not.toContain('php');
  });

  it('should detect Flutter projects via pubspec.yaml', () => {
    (fs.existsSync as any).mockImplementation((path: string) => path.endsWith('pubspec.yaml'));
    (fs.readFileSync as any).mockReturnValue(`
name: flutter_app
description: A new Flutter project.
version: 1.0.0+1
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2
  dio: ^5.0.0
    `);

    const context = detectProjectContext();
    expect(context?.name).toBe('flutter_app');
    expect(context?.dependencies).toContain('cupertino_icons');
    expect(context?.dependencies).toContain('dio');
    expect(context?.dependencies).not.toContain('flutter');
  });

  it('should detect Java projects via pom.xml', () => {
    (fs.existsSync as any).mockImplementation((path: string) => path.endsWith('pom.xml'));
    (fs.readFileSync as any).mockReturnValue(`
<project>
    <artifactId>java-maven-project</artifactId>
    <version>1.0-SNAPSHOT</version>
    <dependencies>
        <dependency>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>
</project>
    `);

    const context = detectProjectContext();
    expect(context?.name).toBe('java-maven-project');
    expect(context?.dependencies).toContain('spring-boot-starter-web');
  });

  it('should detect .NET projects via .csproj', () => {
    (fs.readdirSync as any).mockReturnValue(['MyProject.csproj']);
    (fs.readFileSync as any).mockImplementation((path: string) => {
      if (path.endsWith('.csproj')) {
        return `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.1" />
  </ItemGroup>
</Project>
    `;
      }
      return '';
    });

    const context = detectProjectContext();
    expect(context?.name).toBe('MyProject');
    expect(context?.dependencies).toContain('Newtonsoft.Json');
  });

  it('should detect Swift projects via Package.swift', () => {
    (fs.existsSync as any).mockImplementation((path: string) => path.endsWith('Package.swift'));
    (fs.readFileSync as any).mockReturnValue(`
let package = Package(
    name: "SwiftProject",
    dependencies: [
        .package(url: "https://github.com/apple/swift-argument-parser", from: "1.2.0"),
    ]
)
    `);

    const context = detectProjectContext();
    expect(context?.name).toBe('SwiftProject');
    expect(context?.dependencies).toContain('swift-argument-parser');
  });

  it('should detect C++ projects via CMakeLists.txt', () => {
    (fs.existsSync as any).mockImplementation((path: string) => path.endsWith('CMakeLists.txt'));
    (fs.readFileSync as any).mockReturnValue(`
project(MyCppProject)
find_package(OpenCV REQUIRED)
find_package(Boost COMPONENTS system)
    `);

    const context = detectProjectContext();
    expect(context?.name).toBe('MyCppProject');
    expect(context?.dependencies).toContain('OpenCV');
    expect(context?.dependencies).toContain('Boost');
  });
});
