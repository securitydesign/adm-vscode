// This is the entry point for your extension
const vscode = require('vscode');
const gherkin = require('@cucumber/gherkin');

// this method is called when your extension is deactivated
function deactivate() {}

// Define ADM as a custom dialect
gherkin.dialects['adm'] = {
    "feature": ["Model"],
    "background": ["Assumption"],
    "scenario": ["Attack", "Defense"],
    "rule": ["Policy"],
    "examples": ["Examples"],
    "given": ["Given"],
    "when": ["When"],
    "then": ["Then"],
    "and": ["And"],
    "but": ["But"],
    "scenarioOutline": ["Attack Outline", "Defense Outline"],
};

// newId() - generates a random string for use as an ID.
function newId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function activate(context) {
    let activeEditor = vscode.window.activeTextEditor;
    let options = [];

    currentKeywordForAnd = '';

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            // Redo all indices and prepare autocomplete options.
            const doc = Load(activeEditor.document.getText());
            indices = index(doc);
            let lineNumber = activeEditor.selection.active.line;
            let lineText = activeEditor.document.lineAt(lineNumber).text.trim();
            currentKeyword = lineText.split(' ')[0];
            statement = lineText.split(' ').slice(1).join(' ');
            options = [];
            switch (currentKeyword) {
                case 'Given':
                    options = givenOptions(indices, lineNumber);
                    currentKeywordForAnd = 'Given';
                    break;
                case 'When':
                    options = whenOptions(indices, lineNumber);
                    currentKeywordForAnd = 'When';
                    break;
                case 'And':
                    if (currentKeywordForAnd == 'Given') {
                        options = givenOptions(indices, lineNumber);
                    } else if (currentKeywordForAnd == 'When') {
                        options = whenOptions(indices, lineNumber);
                    }
                    break;
                case 'Then':
                    // ADM doesn't have any rules for 'Then' statements
                    break;
                default:
                    console.log('unknown keyword');
                    break;
            }

            // Trigger autocomplete only when we have a 'Given ', 'When ', or 'And ' statement
            if (event.contentChanges.length > 0) {
                const lastChange = event.contentChanges[event.contentChanges.length - 1];

                // get text from current line
                const lineText = activeEditor.document.lineAt(activeEditor.selection.active.line).text;
                // if the current line starts with multiple spaces followed by 'Given'/'When'/'And' and a space
                if (/^(\s*)(Given|When|And)\s$/.test(lineText)) {
                    vscode.commands.executeCommand('editor.action.triggerSuggest');
                } else {
                    // close autocomplete suggestion
                    options = [];
                    vscode.commands.executeCommand('closeParameterHints');
                }
            }
        }

    }, null, context.subscriptions);

    const completionsProvider = vscode.languages.registerCompletionItemProvider('adm', {
        provideCompletionItems(document, position, token, context) {
            const list = options.map(option => new vscode.CompletionItem(option, vscode.CompletionItemKind.Text));
            return new vscode.CompletionList(list, false);
        }
    });

    context.subscriptions.push(changeDocumentSubscription, completionsProvider);
}

function Load(content) {
    try
    {
        builder = new gherkin.AstBuilder(newId);
        matcher = new gherkin.GherkinClassicTokenMatcher('adm');
        parser = new gherkin.Parser(builder, matcher);
        const gherkinDocument = parser.parse(content);
        return gherkinDocument;
    }
    catch (err) {
        console.log(err.message);
    }
}

function index(document) {
    indices = new Map();
    indices['Attack'] = [];
    indices['Defense'] = [];
    indices['Given'] = [];
    indices['When'] = [];
    indices['Then'] = [];
    
    for (let i = 0; i < document.feature.children.length; i++) {
        const child = document.feature.children[i];
        if (child.scenario) {
            indexScenario(child.scenario, indices);
        }
        else if (child.background) {
            indexAssumption(child.background, indices);
        }
        else if (child.rule) {
            indexPolicy(child.rule, indices);
        }
    }

    return indices;
}

function indexScenario(scenario, indices) {
    indices[scenario.keyword].push({
        name: scenario.name,
        line: scenario.location,
        ancestor: {}
    });
    currentKeyword = '';
    scenario.steps.forEach(step => {
        if (step.keyword !== 'And') {
            currentKeyword = step.keyword;
        }
        indices[currentKeyword].push({
            name: step.text,
            line: step.location,
            ancestor: {
                'keyword': scenario.keyword,
                'scenario': scenario.name
            }
        });
    });

    return;
}

function indexAssumption(assumption, indices) {
    assumption.steps.forEach(step => {
        indices['Given'].push({
            name: step.text,
            line: step.location,
            ancestor: {}
        });
    });
}

function indexPolicy(policy, indices) {
    policy.children.forEach(child => {
        if (child.scenario) {
            indexScenario(child.scenario, indices);
        }
        else if (child.background) {
            indexAssumption(child.background, indices);
        }
    });
}

function givenOptions(indices, lineNumber) {
    autoCompleteOptions = [];

    // build stack of statements from current line to top of document
    entry = indices['Given'].find(option => option.line.line === lineNumber+1);
    otherGivens = [];
    indices['Given'].forEach(option => {
        if (option.line.line != lineNumber+1 && option.ancestor['scenario'] == entry.ancestor['scenario']) {
            otherGivens.push(option.name); 
        }
    });
    
    // collect all given statements that don't belong to current scenario 
    // and are not already used in current scenario
    indices['Given'].forEach(option => {
        if (option.line.line != entry.line.line && option.ancestor['scenario'] != entry.ancestor['scenario']) {
            if (!autoCompleteOptions.includes(option.name) && !otherGivens.includes(option.name)) {
                autoCompleteOptions.push(option.name);
            }
        }
    });
    indices[entry.ancestor['keyword']].forEach(option => {
        // collect all given statements
        if (option.name.trim() != entry.ancestor['scenario'].trim()) {
            if (!autoCompleteOptions.includes(option.name) && !otherGivens.includes(option.name)) {
                autoCompleteOptions.push(option.name);
            }
        }
    });
    return autoCompleteOptions;
}

function whenOptions(indices, lineNumber) {
    autoCompleteOptions = [];

    // build stack of statements from current line to top of document
    entry = indices["When"].find(option => option.line.line === lineNumber+1);
    otherWhens = [];
    indices["When"].forEach(option => {
        if (option.line.line != lineNumber+1 && 
            option.ancestor['scenario'] == entry.ancestor['scenario']) {
            otherWhens.push(option.name); 
        }
    });

    if (entry.ancestor['keyword'] == 'Attack') {
        // If current scenario is an attack, collect all 'then' statements from all defenses
        indices['Then'].forEach(option => {
            if (option.ancestor.keyword == 'Defense' && 
                !autoCompleteOptions.includes(option.name) && 
                !otherWhens.includes(option.name)) {
                autoCompleteOptions.push(option.name);
            }
        });
    } else if (entry.ancestor['keyword'] == 'Defense') {
        // If current scenario is a defense, collect all 'when' statements from all attacks
        indices['When'].forEach(option => {
            if (option.ancestor.keyword == 'Attack' && 
                !autoCompleteOptions.includes(option.name) && 
                !otherWhens.includes(option.name)) {
                autoCompleteOptions.push(option.name);
            }
        });
        // and all 'then' statements from all attacks
        indices['Then'].forEach(option => {
            if (option.ancestor.keyword == 'Attack' && 
                !autoCompleteOptions.includes(option.name) && 
                !otherWhens.includes(option.name)) {
                autoCompleteOptions.push(option.name);
            }
        });
    }
    
    return autoCompleteOptions;
}

module.exports = {
    activate,
    deactivate
}