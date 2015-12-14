module.exports =
  config:
    javaExecutablePath:
      type: 'string'
      default: 'java'
    processingExecutablePath:
      type: 'string'
      default: 'processing-java'

  activate: ->
    require('atom-package-deps').install()

  provideLinter: ->
    helpers = require('atom-linter')
    regex = '*'
    provider =
      grammarScopes: ['source.pde']
      scope: 'file'
      lintOnFly: false # Only when saving
      lint: (textEditor) =>
        filePath = textEditor.getPath()
        command = atom.config.get('linter-clojure.processingExecutablePath') or 'processing-java'
        parameters = [
          '--sketch='+filePath,
          '--build'
        ]

        return helpers.exec(command, parameters, {stream: 'stderr'}).then (output) ->
          errors = for message in helpers.parse(output, regex, {filePath: filePath})
            message.type = 'error'
            message

          return errors
