const data = {
    shops: {
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
    regsLinks: [
        ["https:\\/\\/([a-z]+\\.)?([a-z]+\\.)?aliexpress\\.[a-z]{2,3}\\/item\\/\\d+\\.html", "5n8knuvb"],
        ["https:\\/\\/market\\.yandex\\.\\w{2,4}\\/product--[\\w-]+\\/\\d+", "5dxbwz8b"],
        ["https:\\/\\/(www\\.)?mvideo\\.ru\\/products\\/[\\w-]+", "3s5jmb9m"],
        ["https:\\/\\/hoff\\.ru\\/catalog\\/[a-z]+\\/[a-z]+\\/[a-z_]+\\/[\\w]+\\/\\?articul=\\d+", "ytjmr868"],
        ["https:\\/\\/(www\\.)?citilink\\.ru\\/product\\/[\\w-]+-\\d+\\/", "yc32z2pk"],
        ["https:\\/\\/(www\\.)?alibaba\\.com\\/product-detail\\/[\\w-]+_\\d+\\.html", "54px8yd4"],
        ["https:\\/\\/(www\\.)?svyaznoy\\.ru\\/catalog\\/[a-z]+\\/\\d+\\/\\d+", "ydvu2ctr"],
        ["https:\\/\\/(www\\.)?eldorado\\.ru\\/cat\\/detail\\/[\\w-]+\\/", "2p968e3v"],
        ["https:\\/\\/(www\\.)?booking\\.com\\/index(\\.[a-z-]{2,5})?\\.html", "ewmekt4j"],
        ["https:\\/\\/[a-z]{2,3}\\.banggood\\.com\\/[\\w-]+-p-\\d+\\.html", "39usmyzx"],
        ["https:\\/\\/(www\\.)?honor\\.ru\\/[a-z]+\\/[\\w-]+\\/", "pfu622en"]
    ]
};

async function getData(link) {
    let status;
    let _data = await fetch(link)
        .then(s => {
            status = s;
            return s.json()
        })
        .catch(() => false);
    return [_data, status ? status.ok : false]
};

function getStorage() {
    chrome.storage.local.get(["shops", "regsLinks"])
        .then(d => !d.shops && setStorage(data))
};

function setStorage(d) {
    chrome.storage.local.set({
        "shops": d.shops,
        "regsLinks": d.regsLinks
    })
};

chrome.cookies.getAll({
        "name": "aep_usuc_f"
    }, (cc) => {
        let site = "glo";
        cc.forEach(c => {
                if (/site=rus/i.test(c.value)) {
                    site = "rus"
                }
            }
        )
        chrome.storage.local.set({
            "site": site
        })
    }
);

getData("https://github.com/extmaster/goodssearcher/raw/main/setting.json").then(r => r[0] ? setStorage(r[0]) : getStorage());

chrome.runtime.onMessage.addListener(async (request, sender) => {
    await getData(request.link).then((s) => {
            chrome.tabs.sendMessage(
                sender.tab.id,
                {status: s[1]}
        )
    })
})
