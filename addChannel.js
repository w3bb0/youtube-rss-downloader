const inquirer = require('inquirer');
const sqlite3 = require('sqlite3').verbose();
const Parser = require('rss-parser');
const parser = new Parser();
const crypto = require('crypto')

const db = new sqlite3.Database('./database/Videos.sqlite3', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    //console.log('Connected to the Videos database.');
});
PromtForLink()

function PromtForLink() {
    inquirer.prompt([{
        type: 'string',
        message: 'Enter a youtubers rss feed',
        name: 'link'
    }, ]).then(answers => addYoutuber(answers.link));;
}

function DoesChannelExsist(Author) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT Author Author
            FROM VideoIDS
            WHERE Author = ?`;
        db.all(sql, Author, (err, rows) => {
            if (err) {
                reject(err);
            }
            if (rows.length == 0) {
                resolve(false)
            } else {
                resolve(true)
            }
        });
    });
}

function addRSSLink(link) {
    db.run(`INSERT INTO rssLinks(Link) VALUES(?)`, [link], function(err) {
        if (err) {
            return console.log(">>" + err.message);
        }
    });
}

function addToVideos(author) {
    let id = crypto.randomBytes(20).toString('hex');
    db.run(`INSERT INTO VideoIDS(Author,ID) VALUES(?,?)`, [author, id], function(err) {
        if (err) {
            return console.log(">>" + err.message);
        }
    });
}
async function addYoutuber(url) {
    if (!url.includes("https://www.youtube.com/feeds/videos.xml?channel_id=")) {
        process.stdout.write('\033c');
        console.log(">>" + "the url is not a youtube rss feed")
        PromtForLink()
        return
    }
    let feed = await parser.parseURL(url);
    let Author = feed.items[0].author
    DoesChannelExsist(Author).then(trueOrFalse => {
        if (trueOrFalse == true) {
            process.stdout.write('\033c');
            console.log(">>" + "that channel is already in the database");
            PromtForLink()
        } else {
            addToVideos(Author)
            addRSSLink(url)
            process.stdout.write('\033c');
            console.log(">>" + "added channel to database");
            PromtForLink()
        }
    });
}