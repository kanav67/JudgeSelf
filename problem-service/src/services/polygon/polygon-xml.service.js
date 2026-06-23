const { XMLParser } = require('fast-xml-parser');
const path = require('path');

const parseProblemXML = async (xmlContent) => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (name, jpath, isObject, isArray) => {
      // forces them to always be parsed as an array
      const forceArrayPaths = [
        'problem.names.name',
        'problem.statements.statement',
        'problem.judging.testset',
        'problem.files.resources.file',
      ];
      return forceArrayPaths.includes(jpath);
    }
  });

  const problemData = parser.parse(xmlContent);
  
  const problemName = extractName(problemData);
  const resources = extractResources(problemData);
  const testsInfo = extractTestsInfo(problemData);
  const checkerInfo = extractCheckerInfo(problemData);

  const hasInteractor = problemData.problem.assets.interactor ? true : false;
  const interactorInfo = extractInteractorInfo(problemData);

  // skipping author name as it is not actually shown on codeforces.
  // if needed, we can extract it from the problem-properties.json file.
  return {
    polygonUrl: problemData.problem.url,
    polygonRevision: problemData.problem.revision,
    problemName: problemName,
    testSetName: testsInfo.testSetName,

    timeLimit: testsInfo.timeLimit,
    memoryLimit: testsInfo.memoryLimit,
    testCount: testsInfo.testCount,

    checkerSourcePath: checkerInfo.path,
    checkerLanguage: checkerInfo.type,

    hasInteractor: hasInteractor,
    interactorSourcePath: interactorInfo.sourcePath,
    interactorLanguage: interactorInfo.language,

    resources: resources,

    inputType: 'stdin',
    outputType: 'stdout',
    authorName: '',
  };
};

module.exports = { parseProblemXML };


function extractName(problemData) {
  const names = problemData.problem.names.name;
  if (names.length === 0) {
    throw new Error('No problem name found in the problem. Please ensure the problem has at least one name.');
  }
  const problemName = names.find(name => name.language === 'english')?.value || names[0].value;
  return problemName;
}

//resources contains additional files required at runtime
function extractResources(problemData) {
  const skipFiles = ['files/problem.tex', 'files/statements.ftl', 'files/olyml.sty'];
  return (problemData.problem.files.resources?.file || [])
    .filter(file => !skipFiles.includes(file.path))
    .map(file => ({
      name: path.basename(file.path),
      path: file.path,
    }));
}

function extractTestsInfo(problemData) {
  const testsets = problemData.problem.judging.testset;
  if (testsets.length > 1) {
    throw new Error('Multiple testsets are not supported yet. Please ensure the problem has only one testset.');
  }
  if (testsets.length == 0) {
    throw new Error('No testset found in the problem. Please ensure the problem has at least one testset.');
  }
  if (parseInt(testsets[0]['test-count']) <= 0) {
    throw new Error('There should be atleast one test in the testset.');
  }

  return {
    testSetName: testsets[0].name,
    timeLimit: parseInt(testsets[0]['time-limit']),
    memoryLimit: parseInt(testsets[0]['memory-limit']),
    testCount: parseInt(testsets[0]['test-count']),
  }
}

function extractCheckerInfo(problemData) {
  const checker = problemData.problem.assets.checker;
  if (!checker || !checker.source) {
    throw new Error('No checker was found. Please add atleast one checker.');
  }
  if (!checker.source.path) {
    throw new Error('Checker source not found in problem. Are you sure a checker is provided?');
  }
  if (!checker.source.type) {
    throw new Error('Checker language is not defined in problem.');
  }

  return {
    path: checker.source.path,
    type: checker.source.type,
  }
}

function extractInteractorInfo(problemData) {
  const interactor = problemData.problem.assets.interactor;
  if (!interactor) {
    return {
      sourcePath: null,
      language: null,
    };
  }
  if (!interactor.source || !interactor.source.path) {
    throw new Error('Interactor source not found in problem. Are you sure an interactor is provided?');
  }
  if (!interactor.source.type) {
    throw new Error('Interactor language is not defined in problem.');
  }

  return {
    sourcePath: interactor.source.path,
    language: interactor.source.type,
  }
}