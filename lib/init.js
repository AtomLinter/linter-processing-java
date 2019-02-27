'use babel';

import * as atomPackageDeps from 'atom-package-deps';
import * as atomLinter from 'atom-linter';

export const config = {
  processingExecutablePath: {
    type: 'string',
    default: 'processing-java',
  },
};

export function activate() {
  atomPackageDeps.install();
}

export function provideLinter() {
  return {
    name: 'Processing',
    scope: 'file',
    lintsOnChange: false,
    grammarScopes: ['source.processing'],
    lint: async (textEditor) => {
      const filePath = textEditor.getPath();

      // Find the folder of the filePath
      // For Windows
      const winSign = filePath.lastIndexOf('\\');
      // For Linux / OS X & others
      const nixSign = filePath.lastIndexOf('/');
      let sign = nixSign;
      if (winSign > nixSign) sign = winSign;

      // Find folder location of the pde file (MUST BE THE PARENT FOLDER!!!)
      const folderPath = filePath.substring(0, sign);
      // console.log(filePath, folderPath);

      const command = atom.config.get('linter-processing.processingExecutablePath');
      const parameters = [
        `--sketch=${folderPath}`,
        '--build',
      ];

      const options = {
        stream: 'both',
      };

      const output = await atomLinter.exec(command, parameters, options);

      // console.log("processing-linter found error: " + output.stderr);
      const arr = output.stderr.split(':');
      const messages = [];
      if (output.stderr.length > 3) {
        const startLine = Number.parseInt(arr[1], 10) - 1;
        const startCol = Number.parseInt(arr[2], 10);
        const endLine = Number.parseInt(arr[3], 10) - 1;
        const endCol = Number.parseInt(arr[4], 10);
        let position;
        if (endLine - startLine === 0 && endCol - startCol === 0) {
          position = atomLinter.generateRange(textEditor, startLine, startCol);
        } else {
          position = [
            [startLine, startCol],
            [endLine, endCol],
          ];
        }
        messages.push({
          severity: 'error', // Issue instead of error ?
          location: {
            file: filePath,
            position,
          },
          excerpt: output.stderr,
        });
      }

      // console.log(messages);
      return messages;
    },
  };
}
