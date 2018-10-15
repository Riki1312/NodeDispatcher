function Dispatcher()
{
    this.dispatcher = Object.create(sorter);
}

var sorter = {

    // !!--Library objects--!!
    Data: {
        listenerGet: [], listenerPost: [], listenerStatic: []
    },
    Methods: {
        errors: function (req, res) {
            require('fs').readFile(sorter.Settings.errorPagePath, (err, data) => {
                if (!err)
                {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(data);
                }
                else { res.end("Error 404"); }
            });
        }
    },
    Settings: {
        hostname: "127.0.0.1", port: 3000, debugMod: true,
        autoWriteHead: true, defaultHead: { 'Content-Type': 'text/html' },
        errorPagePath: "/error.html"
    },

    // !!--Basic--!!
    Listen: function (result, errorResult) {
        const http = require('http');
        const url = require('url');
        const path = require('path');
        const fs = require('fs');
        const qs = require('querystring');
        const mime = require('mime');

        errorResult = typeof errorResult !== 'undefined' ? errorResult : this.Methods.errors;

        const server = http.createServer((req, res) => {
            var method = req.method;
            var purl = url.parse(req.url, true);
            var routing = false;

            if (method.toUpperCase() === "GET")
            {
                this.Data.listenerGet.forEach((x) => {
                    if (x.url === purl.pathname)
                    {
                        if (this.Settings.autoWriteHead) { res.writeHead(200, this.Settings.defaultHead); }
                        else { res.statusCode = 200; }

                        x.result(req, res, purl.query);
                        if (this.Settings.debugMod) { console.log(`GET 200 request: ${ req.url }`); }
                        routing = true;
                    }
                });
            }
            else if (method.toUpperCase() === "POST")
            {
                this.Data.listenerPost.forEach((x) => {
                    if (x.url === purl.pathname)
                    {
                        if (this.Settings.autoWriteHead) { res.writeHead(200, this.Settings.defaultHead); }
                        else { res.statusCode = 200; }

                        var postData = '';
                        req.on('data', (data) => {
                            postData += data;
                            if (postData.length > 1e6)
                                req.connection.destroy();
                        });
                        req.on('end', () => {
                            postData = qs.parse(postData);

                            x.result(req, res, postData);
                            if (this.Settings.debugMod) { console.log(`POST 200 request: ${ req.url }`); }
                            routing = true;
                        });
                    }
                });
            }

            if (!routing)
            {
                const onError = () => {
                    if (this.Settings.autoWriteHead) {
                        res.writeHead(404, this.Settings.defaultHead);
                    }
                    else {
                        res.statusCode = 404;
                    }
                    if (this.Settings.debugMod) {
                        console.log(`Error 404 request: ${ req.url }`);
                    }
                    errorResult(req, res);
                };
                var error = true;

                this.Data.listenerStatic.forEach((x) => {
                    if (purl.pathname.includes(x.url))
                    {
                        const filePath = path.join(x.folderPath, purl.pathname.replace(x.url, "/"));
                        fs.readFile(filePath, (err, data) => {
                            if (!err)
                            {
                                res.writeHead(200, { "Content-Type": mime.getType(filePath) });
                                res.end(data);
                            }
                            else { onError(); }
                            routing = true;
                        });
                        error = false;
                    }
                });
                if (error && !routing) { onError(); }
            }
        });

        server.listen(this.Settings.port, this.Settings.hostname, () => {
            if (this.Settings.debugMod) { console.log(`Server running at http://${ this.Settings.hostname }:${ this.Settings.port }/`); }
            result(this.Settings.port, this.Settings.hostname);
        });
    },
    Get: function (url, result) {
        this.Data.listenerGet.push({ url: url, result: result });
    },
    Post: function (url, result) {
        this.Data.listenerPost.push({ url: url, result: result });
    },
    Static: function (url, folderPath) {
        this.Data.listenerStatic.push({ url: url, folderPath: folderPath });
    }
};

//
module.exports = new Dispatcher();
