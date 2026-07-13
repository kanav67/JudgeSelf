export const forceArrayPaths = [
  'problem.names.name',
  'problem.statements.statement',
  'problem.judging.testset',
  'problem.judging.testset.tests.test',
  'problem.files.resources.file',
  'problem.files.executables.executable',
  'problem.assets.solutions.solution',
  'problem.assets.validators.validator',
  'problem.assets.checker.testset.tests.test',
  'problem.assets.validators.validator.testset.tests.test',
  'problem.properties.property',
  'problem.stresses.list.stress',
  'problem.tags.tag'
];

export interface ParsedProblemXML {
  polygonUrl: string;
  polygonRevision: number;
  problemName: string;
  testSetName: string;

  timeLimit: number;
  memoryLimit: number;
  testCount: number;
  
  checkerSourcePath: string;
  checkerLanguage: string;
  
  hasInteractor: boolean;
  interactorSourcePath: string | null;
  interactorLanguage: string | null;
  
  resources: Array<{ name: string; path: string }>;
  
  inputType: string;
  outputType: string;
  authorName: string;
  tags: string[]
}


export interface PolygonProblemData {
  problem: PolygonProblem;
}

export interface PolygonProblem {
  revision: string;
  "short-name": string;
  url: string;
  names: {
    name: ProblemName[];
  };
  statements: Statements;
  judging: Judging;
  files: Files;
  assets: Assets;
  properties: {
    property: Property[];
  };
  stresses: any;
  tags?: Tags;
}

export interface ProblemName {
  language: string;
  value: string;
}

export interface Statements {
  "latex-pdf-mode"?: string;
  statement: Statement[];
}

export interface Statement {
  charset?: string;
  language: string;
  mathjax?: string;
  path: string;
  type: string;
}

export interface Judging {
  "cpu-name": string;
  "cpu-speed": string;
  "input-file": string;
  "output-file": string;
  "run-count": string;
  testset: Testset[];
}

export interface Testset {
  name: string;
  "time-limit": string;
  "memory-limit": string;
  "test-count": string;
  "input-path-pattern": string;
  "answer-path-pattern"?: string;
  tests: {
    test: Test[];
  };
}

export interface Test {
  method: string;
  sample?: string;
  cmd?: string;
}

export interface Files {
  resources: {
    file: FileReference[];
  };
  executables: {
    executable: Executable[];
  };
}

export interface Executable {
  source: FileReference;
  binary: FileReference;
}

export interface FileReference {
  path: string;
  type?: string;
}

export interface Assets {
  checker: Checker;
  interactor?: Interactor;
  validators: {
    validator: Validator[];
  };
  solutions: {
    solution: Solution[];
  };
}

export interface Checker {
  name?: string;
  type?: string;//usually testlib.h
  source: FileReference;
  binary: FileReference;
  copy: { path: string; type?: string };
  testset: any;
}

export interface Interactor {
  source: FileReference;
  binary: FileReference;
}

export interface Validator {
  source: FileReference;
  binary: FileReference;
  testset: any;
}

export interface Solution {
  tag: string;
  source: FileReference;
  binary: FileReference;
}

export interface Property {
  name: string;
  value: string;
}

export interface Tags {
  tag: Tag[];
}

export interface Tag {
  value: string;
}