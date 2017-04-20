# contexter-cli

> A demo application that extends the `npm contexter` **metadata** extraction capability to images also

This is a complete application to show the core [contexter](https://www.npmjs.com/package/contexter) library capabilities

Reactively extract all available data from files (including images) in a directory to one javascript object

![dir-with-images-to-jsObject-240x135](https://cloud.githubusercontent.com/assets/4935817/25252880/46b69f52-25e4-11e7-9c10-8bcb64238c0c.png)


`contexter-cli` has two commands, `serve` and `write`. Both accept a directory path

- `serve` shows the `context` object generated
- `write` writes to a file or console the `context` object generated

## Usage

Sample dir structure

    dir/
    |-- assets/
    |   |-- photo.jpg   <--- metadata like 'colors'
    |   |-- style.css
    |   `-- posts.yml
    |
    |-- index.html
    |-- README.md
    `-- notes.txt

**CLI**

```
$ contexter-cli serve .
```
**terminal output**
```
Started contexting dir...
  /README.md added
  /index.html added
  /notes.txt added
  /assets/photo.jpg added
  /assets/posts.yml added
  /assets/style.css added
.done!
The server now is running at http://localhost:3000

[BS] Access URLs:
 -------------------------------------
          UI: http://localhost:3001
 -------------------------------------
 UI External: http://192.168.15.6:3001
 -------------------------------------
[BS] Watching files...

```
Open browser to http://localhost:3000

You will see the directory structure and a dynamic `context` javascript object that mirrors it

![homepage.png](https://cloud.githubusercontent.com/assets/4935817/25252888/50952da4-25e4-11e7-9ce8-04b47d64f6bf.png)

The result is a reactive `context` variable equivalent to:

    var context = {
                  "/": {
                        assets: {
                              "photo.jpg": {
                                      colors: [
                                            "#bbbbbb",
                                            "#080808",
                                            "#5c5c5c",
                                            "#787878",
                                            "#646464"
                                      ], ...
                                },
                              "style.css": {...},
                              "posts.yml": {...},
                        "index.html":  {...},
                        "README.md":  {...},
                        "notes.txt":  {...}
                        },
                  datafiles: [
                        {...}   // index.html
                        ],
                  unknowns: [
                        {...},  // photo.jpg
                        {...},  // style.css
                        {...},  // index.html
                        {...},  // README.md
                        {...}   // notes.txt
                        ]
                }

## Getting started

1.- Install with npm:

```
$ npm install contexter-cli --global
```

2.- Then run the command `serve` with a path to the directory

```
$ contexter-cli serve <path-to-dir>
```
3.- Wait for the following output

```
...
.done!
The server now is running at http://localhost:3000

[BS] Access URLs:
 -------------------------------------
          UI: http://localhost:3001
 -------------------------------------
 UI External: http://192.168.15.6:3001
 -------------------------------------
[BS] Watching files...


```

4.- In a browser open http://localhost:3000

5.- Play with the dynamic `context` javascript object

...it is reactive, you can update files while the App is running to see the changes in the browser live!

## Acknowledgements

- [@zeke](https://www.npmjs.com/~zeke) Thanks for your code, time and inspiration

## License

The MIT License (MIT)

Copyright (c) 2017 Eduardo Martinez

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
