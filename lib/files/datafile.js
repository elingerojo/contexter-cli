'use strict'

// This file, overrides the `contexter datafile.js` so `contexter-cli` ...
// ... can handle "SyntaxError" inside datafiles without throwing an error
//
module.exports =  {
  // Overrides `File` class default `parseCallback` method to assign `this.data`
  parseCallback (err, output) {

    // SyntaxError handling
    if (err) {

      let errorMessage = err + '. File was not parsed.'
      // Let the user know the reason that `this.data` will be an error message
      console.log(
`
${err} inside file: ${this.path.relative}
WARNING: There was an error parsing, so parse result was set to an error text, as:
 ...['${this.path.relative}'].data = "${errorMessage}"
Continue...
`
      )
      output = errorMessage
    }

    // Assign `output` to `file.data` (instead of default `file.output`)
    this.data = output
  }

}
