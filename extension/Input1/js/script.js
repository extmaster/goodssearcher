const ll = (s = ".selector+label") => document.querySelectorAll(s);
let  site = "glo";
chrome.storage.local.get("site", s => site = s.site);

(() => ll(".localize").forEach((l) => l.title = chrome.i18n.getMessage(l.id)))();
sites = {
	"AliExpress": {
		name: "aliexpress.com",
		link: ["https://www.aliexpress.com/wholesale?SearchText="]
	},
	"eBay": {
		name: "ebay.com",
		link: ["https://www.ebay.com/sch/i.html?_nkw="]
	},
	"Amazon": {
		name: "amazon.com",
		link: ["https://www.amazon.com/s?k="]
	},
	"GearBest": {
		name: "gearbest.com",
		link: ["https://www.gearbest.com/search/?Keyword="]
	},
	"YouTube": {
		name: "youtube.com",
		link: ["https://www.youtube.com/results?search_query="]
	},
	"SunSky": {
		name: "sunsky-online.com",
		link: ["https://www.sunsky-online.com/product/default!search.do?keyword="]
	},
	"DealeXtreme": {
		name: "dealextreme.com",
		link: ["https://www.dx.com/s/"]
	},
	"TinyDeal": {
		name: "tinydeal.com",
		link: ["https://www.tinydeals.co/?s="]
	},
	"Joom": {
		name: "joom.com",
		link: ["https://www.joom.com/en/search/q."]
	},
	"BangGood": {
		name: "banggood.com",
		link: ["https://www.banggood.com/search/", ".html"]
	},
	"TomTop": {
		name: "tomtop.com",
		link: ["https://www.tomtop.com/search/", ".html"]
	},
	"Asos": {
		name: "asos.com",
		link: ["https://www.asos.com/search/?q="]
	},
	"AliBaba": {
		name: "alibaba.com",
		link: ["https://www.alibaba.com/trade/search?SearchText="]
	}
},
action = {
	setting() {
		ll("#set, #maid").forEach((a) => a.classList.toggle("visible"))
	},
	maid() {
		action.setting();
		ll("#checkbox4")[0].checked = false;
	},
	onSite(s, cl) {
		let links = cl.map((l) => {
			let x = sites[l.innerText].link[0] + s + (sites[l.innerText].link[1] || "");
			if (/aliexpress/.test(x) && (/[а-я]+/i.test(s) || site==="rus")) x = x.replace("aliexpress.com", "aliexpress.ru");
			return x;
		});
		search(links)
	},
	onGoogle(s, cl) {
		makeLink("https://www.google.com/search?q=", s, cl)
	},
	onYandex(s, cl) {
		makeLink("https://yandex.com/yandsearch?text=", s, cl)
	}
};
chrome.storage.local.get(["check", "sites"], (s) => {
	var check = s.check || "0000000", labeles = ll(),
		sites = (s.sites || "AliExpress:eBay:Amazon:GearBest:YouTube").split(":");
	ll(".checkbox").forEach((c, i) => {
		c.checked = check[i] === "1";
		c.onchange = saveCheck;
		if (sites[i]) labeles[i].innerText = sites[i]
	})
})
document.body.onmouseup = (e) => {
	if (/bar|hamburger/.test(e.target.className)) action.setting();
	else if (id = e.target.id) chrome.storage.local.get(["selection"], (s) => action[id](s.selection, [...ll()].filter((l) => l.control.checked == true)))
}

function setHandler() {
	document.body.oncontextmenu = (e) => {
		e.preventDefault();
		changeLabel(e)
	}
	document.body.onmousewheel = (e) => changeLabel(e)
}

setHandler();

function changeLabel(e) {
	if (e.target.tagName == "LABEL") {
		e.target.style.left = "200px";
		document.body.oncontextmenu = null;
		document.body.onmousewheel = null;
		setTimeout(() => {
			let arraySites = Object.keys(sites),
				regExpLabels = new RegExp([...ll()].map((l) => l.innerText).join("|"));
			for (let n = 0; n < arraySites.length; n++) {
				if (arraySites[n] === e.target.innerText) {
					while (regExpLabels.test(arraySites[n])) {
						if (e.type === "contextmenu" || (e.type === "wheel" && e.wheelDeltaY < 0)) n = (n < arraySites.length - 1) ? n + 1 : 0
						else n = (n > 0) ? n - 1 : arraySites.length - 1
					}
					e.target.innerText = arraySites[n];
					break
				}
			}
			e.target.style.left = "0px";
			saveSite();
			setHandler()
		}, 200)
	}
}

function saveSite() {
	chrome.storage.local.set({
		"sites": [...ll()].map((l) => l.innerText).join(":")
	})
}

function saveCheck() {
	chrome.storage.local.set({
		"check": [...ll(".checkbox")].map((b) => b.checked ? "1" : "0").join("")
	})
}

function makeLink(l, s, cl) {
	search(cl.map((n) => l + s + " site:" + sites[n.innerText].name))
}

function search(links) {
	links.forEach((l) => {
		chrome.tabs.create({
			url: l,
			active: false
		})
	})
}
