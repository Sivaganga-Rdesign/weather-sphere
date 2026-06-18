# 🌤️ Weather Sphere

A modern, fast, and highly modular weather application that delivers real-time weather tracking, forecasting, and localized atmospheric insights. Built with a robust TypeScript monorepo architecture and designed to run seamlessly in cloud environments like Replit.

## 🔗 Live Application
Experience the live application here:  
👉 **[Weather Sphere Live Demo](https://weather-sphere--thumbik27.replit.app)**

---

## ✨ Features
*   **Real-Time Data Fetching:** Accurate up-to-the-minute details on temperature, humidity, wind speeds, and atmospheric metrics.
*   **Global Location Search:** Effortlessly lookup current weather data for any major city across the globe.
*   **Monorepo Workspace:** Clean, structured separation of concerns dividing business logic, custom scripts, and executable code.
*   **TypeScript-First Design:** Fully typed codebase ensuring bulletproof stability, predictability, and cleaner refactoring.

---

## 🛠️ Tech Stack
This project leverages an advanced JavaScript/TypeScript development ecosystem:
*   **Language:** [TypeScript](https://www.typescriptlang.org/) (Strictly typed compiler configuration)
*   **Package Management:** [pnpm](https://pnpm.io/) (High-performance workspace/monorepo dependency linking)
*   **Runtime Environment:** Node.js
*   **Cloud Platform:** [Replit](https://replit.com/) (Instant development and native application hosting)

---

## 📁 Repository Structure
Based on the project's root files, the repository is organized as a unified workspace:

```text
├── .agents/             # Configurations/logs utilized by development agents
├── .git/                # Version control local history
├── .local/              # Environment-specific local caching (Excluded from Git)
├── artifacts/           # Compiled builds and production-ready static assets
├── lib/                 # Core logic, reusable modules, APIs, and business layers
├── scripts/             # Automation scripts for internal pipelines, setups, and builds
├── .gitignore           # Explicit path exclusions for clean version control
├── .npmrc               # Custom registry and dependency resolution settings for pnpm
├── .replit              # Active configuration file for the Replit workspace environment
├── .replitignore        # Path exclusions for Replit deployments
├── package.json         # Workspace manifests, project metadata, and global script definitions
├── pnpm-lock.yaml       # Strict pnpm dependency lockfile
├── pnpm-workspace.yaml  # Defining sub-packages and linked workspaces 
├── tsconfig.base.json   # Underlying base configuration for the TypeScript compiler
└── tsconfig.json        # Main TypeScript entry file inheriting base parameters
