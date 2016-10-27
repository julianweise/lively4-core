/*
 * # LivelyInspector 
 * A tool similar to the chrome "Elements" pane and the JavaScript object explorer
 */
import Morph from './Morph.js';

export default class Inspector   extends Morph {

  displayValue(value) {
    var node = document.createElement("pre");
    node.innerHTML = JSON.stringify(value);
    return node;
  }
  
  /*
   * called, when selecting a subobject 
   */
  onSelect(obj) {
    this.selection = obj;
    lively.showElement(obj)
    window.that = obj // #Experimental
    this.get("#editor").doitContext = obj;
  }
  
  displayObject(object) {
    var node = document.createElement("ul");
    var createChild = (ea) => {
      var child = document.createElement("span");
      child.innerHTML = "" + object[ea] + "...";
      child.onclick = evt => {
        child.innerHTML = "";
        child.appendChild(this.display(object[ea]));
        evt.stopPropagation();
      };
      return child;
    };
  
    Object.keys(object).forEach( ea => {
      var eaNode = document.createElement("li");
      eaNode.innerHTML = "" + ea  + ": ";
      eaNode.onclick = evt => {
        eaNode.innerHTML = "" + ea  + ": ";
        eaNode.appendChild(createChild(ea));
        evt.stopPropagation();
      };
      eaNode.appendChild(createChild(ea));
      node.appendChild(eaNode);
    });
    return node;
  }
  
  
  renderNode(node, obj, expanded) {
    node.isExpanded = expanded || obj.textContent.length < 80;
    
    
    var tagName = obj.tagName;
    if (obj instanceof ShadowRoot) {
      tagName = "shadowRoot";
    }
    
    if (!tagName) {
      if (obj.textContent.match(/^[ \n]*$/)) return node
      if (obj.textContent.length > 100)
        node.innerHTML = "<pre>" +  obj.textContent + "</pre>";
      else
        node.innerHTML = obj.textContent;
      
      return node;
    }
    node.innerHTML = "<a id='expand'>▶</a><a id='tagname'>&lt;"+ tagName.toLowerCase() + "&gt;</a>" +
      "<span id='content'><a id='more' class='more'>...</a></span>" +
      "&lt;/" + tagName.toLowerCase() + "&gt;";
    
    if (node.isExpanded) {
      node.querySelector('#expand').innerHTML = "▼";
    }

    var contentNode = node.querySelector("#content");
    node.querySelector("#more").onclick = (evt) => {
      this.renderNode(node, obj, true);
    };
    node.querySelector("#expand").onclick = (evt) => {
      this.renderNode(node, obj, !node.isExpanded);
    };
    node.querySelector("#tagname").onclick = (evt) => {
      this.onSelect(obj);
    };
    
    if (node.isExpanded) {
      contentNode.innerHTML = "";
      if (obj.shadowRoot) {
        contentNode.appendChild(this.displayNode(obj.shadowRoot))  ;
      }  
      obj.childNodes.forEach( ea => { 
        contentNode.appendChild(this.displayNode(ea));
      });
    }
  }
  
  displayNode(obj) {
    var node;
    if (obj.tagName || obj instanceof ShadowRoot)
      node = document.createElement("div");
    else
      node = document.createElement("span");
    node.setAttribute("class","element");
    this.renderNode(node, obj, false);
    return node;
  }
  
  display(obj) {
    if (obj instanceof HTMLElement) {
     return this.displayNode(obj);
     // return this.displayObject(obj)
    } else if (obj instanceof Object){
      return this.displayObject(obj);
    } else {
      return this.displayValue(obj);
    }
  }

  inspect(obj) {
    this.targetObject = obj;
    this.get("#editor").doitContext = obj;
    this.innerHTML = "";
    this.get("#container").appendChild(this.display(obj));
  }
  
  livelyMigrate(oldInstance) {
    this.inspect(oldInstance.targetObject) ;   
  } 
}
