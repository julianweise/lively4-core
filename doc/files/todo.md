# TODO

<lively-script><script>
import FileCache from "src/client/filecache.js"
  
(async () => {
  
  var ul = document.createElement("ul")
  var files = await FileCache.current().db.files.filter(ea => ea.tags.indexOf("#TODO") != -1).toArray();
  files.forEach(ea => {
    ea.content.split("\n").filter(ea => ea.match(/#TODO/)).forEach(line => {
      var li = document.createElement("li")
      li.innerHTML = '<a href="' +ea.url + '">'+ea.name + '</a> ' + line 
      li.querySelector("a").onclick = (evt) => {
        evt.preventDefault()
        lively.openBrowser(ea.url, true, line)
      }
      ul.appendChild(li)
    })
  })
  return ul
})()
</script></lively-script>