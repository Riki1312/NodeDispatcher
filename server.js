const app = require("./dispatcher").dispatcher;
const puppeteer = require('puppeteer');

app.Get("/", (req, res, par) => {
    res.end("AppStreaming");
});

app.Get("/extract-cb01", (req, res, par) => {
    res.write(JSON.stringify(par));

    //
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(par.url); //{timeout: 80000}

        const htmlContent = await page.evaluate(() => document.documentElement.innerHTML);

        ExtractCb01SwzzLink(htmlContent, (ret) => {
            res.end(`<h1>${ JSON.stringify(ret.url) }</h1>`);
        });

        browser.close();
    })();
    //
});

app.Get("/extract-openload", (req, res, par) => {
    res.write(JSON.stringify(par));

    //
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(par.url);

        const htmlContent = await page.evaluate(() => document.documentElement.innerHTML);

        ExtractOpenloadDirectLink(htmlContent, (ret) => {
            res.end(`<h1>${ ret.url }</h1>`);
        });

        browser.close();
    })();
    //
});

app.Settings.hostname = "127.0.0.4";
app.Listen((port, host) => {
    console.log("Server started");
});

Hosters = [
    { name: "Openload", urlpattern: /https?:\/\/(?:www\.)?(?:openload\.(?:co|io|link)|oload\.(?:tv|stream|site|xyz))\/(?:f|embed)\/([a-zA-Z0-9-_]+)/i }
];
function ExtractCb01SwzzLink(html, callback)
{
    //document.documentElement.innerHTML.match(/https?:\/\/(?:www\.)?(?:swzz\.(?:xyz|XYX|com))\/(?:HR|link|hr)\/(([go.php\?id=0-9]+)|([a-zA-Z0-9-_\/]*))/gi)
    let url = html.match(/http:\/\/swzz[^"]+|http:\/\/vcrypt[^"]+/gi);
    callback({ url: url, info: null });
}
function ExtractOpenloadDirectLink(html, callback)
{
    let url = "https://openload.co/stream/";
    url += />\s*([\w-]+~\d{10,}~\d+\.\d+\.0\.0~[\w-]+)\s*</.exec(html)[1];
    url += "?mime=true";
    callback({ url: url, info: null });
}
