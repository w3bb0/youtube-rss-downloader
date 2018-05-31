const Parser = require('rss-parser');
const parser = new Parser();
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const ytdl = require('ytdl-core');
const winston = require('winston');
const config = require('./config.js')
winston.add(winston.transports.File, {
    filename: 'log.txt'
});
winston.remove(winston.transports.Console);
const db = new sqlite3.Database('./database/Videos.sqlite3', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    if (config.logging.databaseConnection == true) {
        winston.log('info', 'Connected to the Videos database.');
    }
});

function IsVideoNew(Author, ID) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT Author Author,
            ID ID
            FROM VideoIDS
            WHERE Author = ? AND ID = ?`;
        db.all(sql, [Author, ID], (err, rows) => {
            if (err) {
                reject(err);
            }
            if (rows.length == 0) {
                resolve(true)
            } else {
                resolve(false)
            }
        });
    });
}

function updateAuthor(Author, ID) {
    return new Promise((resolve, reject) => {
        let sql = `UPDATE VideoIDS
           SET ID = ?
           WHERE Author = ?`;
        db.run(sql, [ID, Author], function(err) {
            if (err) {
                reject(err.message);
            }
            if (this.changes == 1) {
                resolve(true)
            } else {
                reject("something went uh oh when updating a authors latest vid")
            }
        });
    });
}

function downloadVideo(url, name, author) {
    if (config.logging.videoDownloading == true) {
        winston.log('info', "downloading the video: " + name + " from " + author);
    }
    let stream = ytdl(url)
    stream.pipe(fs.createWriteStream(config.downloadPath + '/' + name + '.' + config.fileExtension))
    stream.on('progress', (chunkLength, downloaded, total) => {
        if (downloaded / total * 100 == 100 && config.logging.videoDownloading == true) {
            winston.log('info', "finished downloading the video: " + name + " from " + author);
        }
    });
}
async function checkFeed(url) {
    let feed = await parser.parseURL(url);
    if (feed.items[0].id.includes("yt:video:")) {
        IsVideoNew(feed.items[0].author, feed.items[0].id).then(result => {
            if (result == true) {
                updateAuthor(feed.items[0].author, feed.items[0].id).then(updated => {
                    if (updated == true) {
                        let name = feed.items[0].title.replace(/[\/:*?"<>|"]/g, "");
                        downloadVideo(feed.items[0].link, name, feed.items[0].author)
                    }
                }).catch((err) => {
                    winston.log('error', "something broke send this to the dev if you wanna make him cry: " + err);
                });
            }
        }).catch((err) => {
            winston.log('error', "something broke send this to the dev if you wanna make him cry: " + err);
        });
    } else {
        winston.log('error', "not a video idk if this is even a thing tbh")
    }
}

function grabLinks() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.all(`SELECT Link as Link
            FROM rssLinks`, (err, rows) => {
                if (err) {
                    reject(err.message);
                }
                resolve(rows);
            });
        });
    });
}

function checkChannels() {
    grabLinks().then(links => {
        for (var i = 0; i < links.length; i++) {
            checkFeed(links[i].Link);
        }
    });
}
updateAuthor("Linus Tech Tips", "AWSEDRTGH")
checkChannels()
//setInterval(checkChannels, config.priceRefreshInterval * 1000);