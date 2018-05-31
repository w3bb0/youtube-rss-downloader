const inquirer = require('inquirer');
const sqlite3 = require('sqlite3').verbose();
const Parser = require('rss-parser');
const parser = new Parser();

const db = new sqlite3.Database('./database/Videos.sqlite3', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the Videos database.');
});

async function removeChannel(url) {
    let feed = await parser.parseURL(url);
    let Author = feed.items[0].author
    console.log("removing all traces of " + Author + " from the database")

    db.run(`DELETE FROM VideoIDS WHERE Author =?`, Author, function(err) {
        if (err) {
        	console.log("oh dear your entire databse may be bricked")
            return console.error(err.message);
        }
    });

    db.run(`DELETE FROM rssLinks WHERE Link =?`, url, function(err) {
        if (err) {
        	console.log("oh dear your entire database is probaly bricked")
            promptForLink()
            return console.error(err.message);
        }
        console.log(Author + ` removed`);
        promptForLink()
    });
}

function promptForLink() {
    grabLinks().then(links => {
        inquirer.prompt([{
            type: 'list',
            name: 'link',
            message: 'what channel rss feed to DELETE?',
            choices: links,
        }, ]).then(answers => removeChannel(answers.link));;
    });
}

function grabLinks() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.all(`SELECT Link as Link
            FROM rssLinks`, (err, rows) => {
                if (err) {
                    reject(err.message);
                }
                links = []
                for (var i = 0; i < rows.length; i++) {
                    links.push(rows[i].Link)
                }
                resolve(links)
            });
        });
    });
}
promptForLink()