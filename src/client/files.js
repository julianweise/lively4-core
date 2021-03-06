import focalStorage from './../external/focalStorage.js';
import { uuid as generateUuid } from 'utils';
import sourcemap from 'src/external/source-map.min.js';
import Strings from 'src/client/strings.js'


export default class Files {
  
  static parseSourceReference(ref) {
    if(ref.match("!")) {
      var url = ref.replace(/\!.*/,"")
      var args = ref.replace(/.*\!/,"").split(/:/)
    } else {
      var m = ref.match(/(.*):([0-9]+):([0-9]+)$/)
      args = [m[2], m[3]]
      url = m[1]
    }
    
    var lineAndColumn
    if (args[0] == "transpiled") {
      // hide transpilation in display and links
      var moduleData = System["@@registerRegistry"][url]
      if (moduleData) {
      var map = moduleData.metadata.load.sourceMap
      var smc =  new sourcemap.SourceMapConsumer(map)
      lineAndColumn = smc.originalPositionFor({
          line: Number(args[1]),
          column: Number(args[2])
        })
      } else {
        lineAndColumn = {line: args[1], column: args[2]}
      }
    } else {
      lineAndColumn = {line: args[0], column: args[1]}
    }
    lineAndColumn.url = url
    lineAndColumn.toString = function() {
        return "" + this.url.replace(lively4url, "") + ":" + this.line + ":" + this.column
    }
    return lineAndColumn
  }
  
  
  static fetchChunks(fetchPromise, eachChunkCB, doneCB) {
    fetchPromise.then(function(response) {
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var all = "";
        (function read() {
          reader.read().then(function(result) {
            var text = decoder.decode(result.value || new Uint8Array, {
              stream: !result.done
            });
            all += text
            if (eachChunkCB) eachChunkCB(text, result)
            if (result.done) {
              if (doneCB) doneCB(all, result)
            } else {
              read() // fetch next chunk
            }
          })
        })()
      })
  }
  
  static async loadFile(url, version) {
    url = this.resolve(url.toString())
    return fetch(url, {
      headers: {
        fileversion: version
      }
    }).then(function (response) {
      console.log("file " + url + " read.");
      return response.text();
    })
  }

  static async copyURLtoURL(fromURL, toURL) {
    var blob = await fetch(fromURL, {method: 'GET'}).then(r => r.blob())
    return fetch(toURL, {method: 'PUT', body: blob})
  }
  
  static async saveFile(url, data){
    var urlString = url.toString();
    urlString = this.resolve(urlString)
    if (urlString.match(/\/$/)) {
      return fetch(urlString, {method: 'MKCOL'});
    } else {
      return fetch(urlString, {method: 'PUT', body: data});
    }
  }
  
  static async moveFile(url, newURL) {
    var content = await fetch(url).then(r => r.blob())

    // first, save the content...
    var putResponse = await fetch(newURL, {
      method: 'PUT',
      body: content
    })

    if (putResponse.status !== 200) {
      lively.confirm("could not move file to " + newURL)
      return 
    }

    // ok, lets be crazy... we first delete
    var delResponse = await fetch(url, {method: 'DELETE'})
    if (delResponse.status !== 200) {
      lively.notify("could not properly delete " + url, await delResponse.text())
    }

    var getResponse = await fetch(newURL)
    if (getResponse.status !== 200) {
      lively.notify("save again, because we might need to...")
      var putAgainResponse = await fetch(newURL, {
        method: 'PUT',
        body: content
      })
      return 
    }
  }
  
  static async statFile(urlString){
    urlString = this.resolve(urlString)
    return fetch(urlString, {method: 'OPTIONS'}).then(resp => resp.text())
  }

  /**
   * Recursively walks a directory path given as string.
   * @returns an array of files
   */
  static async walkDir(dir) {
    if(dir.endsWith('/')) { dir = dir.slice(0, -1); }
    const json = await lively.files.statFile(dir).then(JSON.parse);
    if(json.type !== 'directory') {
      throw new Error('Cannot walkDir. Given path is not a directory.')
    }

    let files = json.contents
      .filter(entry => entry.type === 'file')
      .map(entry => dir + '/' + entry.name);

    let folders = json.contents
      .filter(entry => entry.type === 'directory')
      .map(entry => dir + '/' + entry.name);

    let subfolderResults = await Promise.all(folders.map(folder => this.walkDir(folder)));
    subfolderResults.forEach(filesInSubfolder => files.push(...filesInSubfolder));

    return files;
  }


  static async existFile(urlString){
    urlString = this.resolve(urlString)

  	return fetch(urlString, {method: 'OPTIONS'}).then(resp => resp.status == 200)
  }

  static isURL(urlString) {
    return ("" + urlString).match(/^([a-z]+:)?\/\//) ? true : false;
  }

  static resolve(string) {
    if (!this.isURL(string)) {
      var result = lively.location.href.replace(/[^/]*$/, string)
    } else {
      result = string.toString()
    }
    // get rid of ..
    result = result.replace(/[^/]+\/\.\.\//g,"")
    // and .
    result = result.replace(/\/\.\//g,"/")
    
    return result
  }

  static directory(string) {
    string = string.toString()
    return string.replace(/([^/]+|\/)$/,"")
  }
  
  static resolve(string) {
    if (!this.isURL(string)) {
      var result = lively.location.href.replace(/[^/]*$/, string)
    } else {
      result = string.toString()
    }
    // get rid of ..
    result = result.replace(/[^/]+\/\.\.\//g,"")
    // and .
    result = result.replace(/\/\.\//g,"/")
    
    return result
  }

  /* 
   * #Meta An inline test is a line that evaluates to true?
   * #Meta We coould parse those lines, and generate better feedback, e.g. not just that it does not evaluate to true, but what are the values that are not equal?
   * #Meta Could we run those inline tests in #Travis, too? 
   TESTS:
      lively.files.name("https://foo/bar/bla.txt") == "bla.txt" 
  */
  static name(url) {
    return url.toString().replace(/.*\//,"")
  }
  
 /* 
  TESTS:
      lively.files.extension("https://foo/bar/bla.txt") == "txt" 
      lively.files.extension("https://foo/bar/bla.PNG") == "png"
      lively.files.extension("https://foo/bar/bla") === undefined
   */  
  static extension(url) {
    var name = this.name(url)
    if (!name.match(/\./)) return undefined
    return name.toLowerCase().replace(/.*\./,"")    
  }
  
  
  /*# Generate tmpfile url for lively4 server
   *
   * lively.files.tempfile() // e.g. https://lively-kernel.org/lively4/_tmp/3b8a7fcc-11dd-463e-8d32-dcc46575a4fd
   *
   */
  static tempfile() {
    // #Dependency to #Lively4Server 
    return  lively.files.directory(lively4url) + "_tmp/" + generateUuid()  
  }

  /*
    lively.files.stringToBlob("hello world")
   */
  static stringToBlob(string) {
    var encoded = encodeURIComponent(string)
    return fetch(`data:text/plain;charset=utf-8,${encoded}`).then(r => r.blob())
  }
  
  /* 
    lively.files.stringToBlob("hello world").then(b => lively.files.readBlobAsText(b))
   */ 
  static readBlobAsText(fileOrBlob) {
    return new Promise(resolve => {        
      const reader = new FileReader();
      reader.onload = event => {
        resolve(event.target.result)
      }
      reader.readAsText(fileOrBlob); 
    })
  }

  static readBlobAsDataURL(fileOrBlob) {
    return new Promise(resolve => {        
      const reader = new FileReader();
      reader.onload = event => {
        resolve(event.target.result)
      }
      reader.readAsDataURL(fileOrBlob); 
    })
  }  
  
  static async loadVersions(url) {
    var versionscache = await caches.open("file_versions")
    var resp = await versionscache.match(url)
    if (resp) return resp
    resp = await fetch(url, {
      method: "OPTIONS",
      headers: {
         showversions: true   
      }      
    })
    versionscache.put(url, resp)
    return resp
  }
  
  
  static async _sortIntoFileTree(root, path, element) {
    console.log("sort into " + path + " " + element.name )
    var next = path.shift()
    if (!next) {      
      root.children.push(element)
      return
    }
    var dir = root.children.find(ea => ea.name == next)
    if (!dir) {
      dir = {
        name: next,
        children: []
      }
      root.children.push(dir)
    }
    this._sortIntoFileTree(dir, path, element)
  }
  
  static async fileTree(url) {
    var tree = {
      name: url,
      children: []
    }
    var list = (await fetch(url, {
      method: "OPTIONS",
      headers: {
        filelist: true
      }
    }).then(r => r.json())).contents
    if (!list) return;
    
    for(var ea of list) {
      if (ea.name !== ".") {
        var path = ea.name.replace(/^\.\//,"").replace(/[^/]*$/,"").split("/").filter(ea => ea)
        var element = {
            name: ea.name.replace(/.*\//,""),
            modified: ea.modified,
            size: ea.size,
            type: ea.type
          }
        if (element.type == "directory") element.children = [];
        this._sortIntoFileTree(tree, path, element)        
      }
    }
    return tree
  }
  
  // Files.visualizeFileTreeMap(lively4url )
  static async visualizeFileTreeMap(url) {
    var tree = await lively.files.fileTree(url)
    if (tree) {
      lively.openComponentInWindow("lively-d3-treemap").then( async tm => {
        tm.setTreeData(tree)
      })
    } else {
      lively.notify("Could not create tree for " + url)
    }
  }
  
}