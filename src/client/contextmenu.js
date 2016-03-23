// import lively from "./lively.js";
// #TODO this will fetch an old version of the lively module... 

export default class ContextMenu {
  
  static hide() {
    if (this.menu) $(this.menu).remove()
  }
  
  static openComponentInWindow (name, evt) {
    var comp  = document.createElement(name)
    this.hide()
    return lively.components.openInWindow(comp).then((w) => {
        lively.setPosition(w, lively.pt(evt.pageX, evt.pageY))
        return comp
    })
  }
  
  static items (target) {
    if (target) {
      return [
        ["show", (evt) => {
           this.hide()
           lively.showElement(target)
        }],
        ["show source", (evt) => {
           this.hide()
           lively.showSource(target, evt)
        }]
      ]  
    } else {
      return [
      ["Workspace", (evt) => {
        this.hide()
        lively.openWorkspace("", lively.pt(evt.pageX, evt.pageY))
      }],
      ["Browser",     (evt) => {
        this.openComponentInWindow("lively-container", evt).then(comp => {
          comp.followPath(lively4url +"/")
          comp.parentElement.style.width = "700px"
      })
      }],
      ["File Editor",     (evt) => this.openComponentInWindow("lively-editor", evt)],
      ["File Browser",    (evt) => this.openComponentInWindow("lively-file-browser", evt)],
      ["Filesystems",     (evt) => this.openComponentInWindow("lively-filesystems", evt)],
      ["Terminal",        (evt) => this.openComponentInWindow("lively-terminal", evt)],
      ["Console",         (evt) => this.openComponentInWindow("lively-console", evt)],
       ["Math Workspace",         (evt) => this.openComponentInWindow("lively-math", evt)],
      ["Component Bin",   (evt) => this.openComponentInWindow("lively-component-bin", evt)],
      ["Customize Page",   (evt) => 
        lively.import("customize").then(c => c.openCustomizeWorkspace())],
      ["Persistens Settings", (evt) => {
          this.openComponentInWindow("lively-persistence-settings", evt).then((comp) => {
              comp.parentElement.style.height = "150px"
              comp.parentElement.style.width = "400px"
          })
      }],
      // #TODO use sub menues here
      ["Wiki",     (evt) => {
        this.openComponentInWindow("lively-container", evt).then(comp => {
          comp.followPath("https://lively-kernel.org/lively4/Wiki/Home.md")
      })
      }],
      ["Journal",     (evt) => {
        this.openComponentInWindow("lively-container", evt).then(comp => {
          comp.followPath("https://lively-kernel.org/lively4/Wiki/Journal.md")
      })
      }],
      ["Text", (evt) => {
              var text  = document.createElement("p")
              text.innerHTML = "Hello"
              text.contentEditable = true
              $('body')[0].appendChild(text)
              lively.setPosition(text, lively.pt(evt.pageX, evt.pageY))
              this.hide()
      }],
      ["Rectangle", (evt) => {
          var morph  = document.createElement("div")
          morph.style.width = "200px"
          morph.style.height = "100px"
          lively.setPosition(morph, lively.pt(evt.pageX, evt.pageY))
          morph.style.backgroundColor = "blue"
          $('body')[0].appendChild(morph)
          this.hide()
      }]
    ]}
  }
  
  static openIn(container, evt, target) {
    this.hide()
    var menu = lively.components.createComponent("lively-menu")
    return lively.components.openIn(container, menu).then(() => {
      this.menu = menu
      
      
      if (evt) lively.setPosition(menu, lively.pt(evt.pageX, evt.pageY))

      menu.openOn(this.items(target), evt).then(() => {
      })
      return menu
    })
  }
}

console.log("loaded contextmenu")

