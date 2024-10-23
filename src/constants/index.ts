import { Language } from "../types";
export const LanguageToCode: { [key: string]: number } = {
  javascript: 1078,
  java: 1058,
  cpp: 1090,
  python: 1080,
  go: 1088,
  typescript: 1070,
  ruby: 1083,
  php: 1030,
  rust: 1020,
} as const;

export const CodeToLanguage: { [key: number]: Language } = {
  1078: "javascript",
  1058: "java",
  1090: "cpp",
  1080: "python",
  1088: "go",
  1070: "typescript",
  1083: "ruby",
  1030: "php",
  1020: "rust",
} as const;

export const containerConfig = {
  java: {
    image: "openjdk:17-slim",
    cmd: (file: string, output?: string) => [
      "sh",
      "-c",
      `javac ${file} && java ${output}`,
    ],
  },
  javascript: {
    image: "node:14",
    cmd: (file: string) => ["node", file],
  },
  typescript: {
    image: "ajaysehwal81/ts-run",
    cmd: (file: string, output?: string) => [
      "sh",
      "-c",
      `tsc ${file} && node ${output}.js`,
    ],
  },
  python: {
    image: "python:3.9-slim",
    cmd: (file: string) => ["python", file],
  },
  php: {
    image: "php:latest",
    cmd: (file: string) => ["sh", "-c", `php ${file}`],
  },
  ruby: {
    image: "ruby:latest",
    cmd: (file: string) => ["sh", "-c", `ruby ${file}`],
  },
  go: {
    image: "golang:latest",
    cmd: (file: string) => ["sh", "-c", `go run ${file}`],
  },
  rust: {
    image: "rust:latest",
    cmd: (file: string, output?: string) => [
      "sh",
      "-c",
      `rustc ${file} && ./${output}`,
    ],
  },
  cpp: {
    image: "gcc:latest",
    cmd: (file: string, output?: string) => [
      "sh",
      "-c",
      `g++ -o ${output} ${file} && ./${output}`,
    ],
  },
} as const;
