import * as vscode from 'vscode';

const RULE_RE = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\S+\s*=>\s*(REPLY|FILE|EXEC)/;

export function activate(context: vscode.ExtensionContext) {
  const diag = vscode.languages.createDiagnosticCollection('lumorium');
  context.subscriptions.push(diag);

  const validate = (doc: vscode.TextDocument) => {
    if (doc.languageId !== 'lumorium') return;
    const diagnostics: vscode.Diagnostic[] = [];
    for (let i = 0; i < doc.lineCount; i++) {
      const line = doc.lineAt(i);
      const text = line.text.trim();
      if (!text || text.startsWith('#')) continue;

      if (!RULE_RE.test(text)) {
        const range = new vscode.Range(i, 0, i, line.text.length);
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            'Expected: METHOD <space> PATH <space> => <REPLY|FILE|EXEC>',
            vscode.DiagnosticSeverity.Warning
          )
        );
      }

      if (text.includes('EXEC') && !text.includes('python -c') && !text.includes('bash -lc')) {
        const range = new vscode.Range(i, 0, i, line.text.length);
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            'EXEC without an interpreter hint (python -c / bash -lc).',
            vscode.DiagnosticSeverity.Information
          )
        );
      }
    }
    diag.set(doc.uri, diagnostics);
  };

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc: vscode.TextDocument) => validate(doc)),
    vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => validate(e.document)),
    vscode.workspace.onDidCloseTextDocument((doc: vscode.TextDocument) => diag.delete(doc.uri))
  );

  if (vscode.window.activeTextEditor) {
    validate(vscode.window.activeTextEditor.document);
  }
}

export function deactivate() {}
