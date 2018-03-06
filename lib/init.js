'use babel';

import atomPackageDeps from 'atom-package-deps';
import atomLinter from 'atom-linter';

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
    lint: (textEditor) => {
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

      return new Promise(resolve =>
        atomLinter.exec(command, parameters, {
          stream: 'both',
        }).then((output) => {
          // console.log("processing-linter found error: " + output.stderr);
          const arr = output.stderr.split(':');
          const messages = [];
          if (output.stderr.length > 3) {
            messages.push({
              severity: 'error', // Issue instead of error ?
              location: {
                file: filePath,
                position: [
                  [+arr[1] - 1, +arr[2]],
                  [+arr[3] - 1, +arr[4]],
                ],
              },
              excerpt: output.stderr,
            });
          }
          // console.log(messages);
          return resolve(messages);
        }));
    },
  };
}
