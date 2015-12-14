# Everything seems to work perfectly fine, but the error doesn't get underlined or marked by a red dot.
# Another weird thing that happened when developping this linter was: ['source.pde'] didn't seem to work,
# so I ended up using grammarScopes: ['*'] and then checking manually if that file ended on .pde
module.exports =
  config:
    processingExecutablePath:
      type: 'string'
      default: 'processing-java'

  activate: ->
    require('atom-package-deps').install()

  provideLinter: ->
    helpers = require('atom-linter')
    provider =
      grammarScopes: ['*'] # For whatever reason ['source.pde'] didn't work
      scope: 'project'
      lintOnFly: false

      lint: (textEditor) =>
        String::endsWith   ?= (s) -> s == '' or @slice(-s.length) == s
        filePath = textEditor.getPath()

        if filePath.endsWith(".pde")
          # Now in order for processing-java to work, we have to find the folder of the filePath
          # For Windows
          winSign = filePath.lastIndexOf "\\"
          # For Linux / OS X & others
          nixSign = filePath.lastIndexOf "/"
          sign = nixSign
          if winSign > nixSign
            sign = winSign

          # Find folder location of the pde file (MUST BE THE PARENT FOLDER!!!)
          filePath = filePath.substring 0, sign

          command = atom.config.get('linter-processing.processingExecutablePath') or 'processing-java'
          parameters = [
            '--sketch='+filePath,
            '--build'
          ]
          console.log "processing-linter executing: "+(atom.config.get('linter-processing.processingExecutablePath') or 'processing-java')+' --sketch='+filePath+' --build'

          return helpers.exec(command, parameters, {stream: "both" } ).then ( output ) ->
            console.log "processing-linter found error: " + output.stderr;
            arr = output.stderr.split ":"
            if output.stderr.length > 3
              messages = []
              messages.push(
                type: 'error' # Issue instead of error?
                filePath: arr[0]
                range: [ [parseInt(arr[1]-1, 10), parseInt(arr[2], 10)], [parseInt(arr[3]-1, 10), parseInt(arr[4], 10)] ]
                text: output.stderr
              )
             return messages
             
        else console.log "This is not a .pde file"
