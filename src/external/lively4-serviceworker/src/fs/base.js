/**
 * Basic file system base class.
 */
export class Base {
  constructor(name, path, options) {
    this.path = path
    this.name = name
    this.options = options
  }

  /**
   * Return stats about object at given path.
   *
   * @param  {String} path
   * @return {Promise}
   */
  stat(path, request) {
    throw new StatNotFoundError()
  }

  /**
   * Return content at given path.
   *
   * @param  {String} path
   * @param  {Request} request
   * @return {Promise}
   */
  read(path, request) {
    throw new FileNotFoundError()
  }

  /**
   * Write content at given path.
   *
   * @param  {String} path
   * @param  {String} content
   * @param  {Request} request
   * @return {Promise}
   */
  write(path, content, request) {
    return Promise.resolve(new Response(null, {status: 405}))
  }
  
  /**
   * Deletes  object at given path.
   *
   * @param  {String} path
   * @param  {Request} request
   * @return {Promise}
   */
  del(path, request) {
    throw new FileNotFoundError()
  }
  
  /**
   * creates directory at given path.
   *
   * @param  {String} path
   * @param  {Request} request
   * @return {Promise}
   */
  makeDir(path, request) {
    throw new FileNotFoundError()
  }
}

export class Stat {
  constructor(isDirectory, contents, allowed) {
    this.isDirectory = isDirectory
    this.contents = contents
    this.allowed = allowed
  }

  toResponse() {
    return new Response(this.contentToJson(), {
      status: 200,
      headers: {'Allow': this.allowedToHeader()}
    })
  }

  allowedToHeader() {
    return this.allowed.toString()
  }

  contentToJson() {
    if (this.isDirectory) {
      return JSON.stringify({
          type: 'directory',
          contents: this.contents
        }, null, '\t')
    }
    return JSON.stringify(this.contents, null, '\t')
  }
}

export class StatNotFoundError extends Error {
  constructor(message='No stat available for given path.') {
    super(message)
    this.name = 'StatNotFoundError'
  }
}

export class File {
  constructor(blob) {
    this.blob = blob
  }

  toResponse() {
    return new Response(this.blob, {
      headers: {
        fileversion: this.fileversion
      },
      status: 200})
  }
}

export class FileNotFoundError extends Error {
  constructor(message='No file available for given path.') {
    super(message)
    this.name = 'FileNotFoundError'
  }
}

export class IsDirectoryError extends Error {
  constructor(message='The requested file is a directory.') {
    super(message)
    this.name = 'IsDirectoryError'
  }
}
