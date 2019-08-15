const fs = require("fs");
const https = require("https");

const emojiVersion = process.argv.slice(2)[0];
const supportedVersions = ["4.0", "5.0", "11.0", "12.0"];
const unicodeUrl = `https://unicode.org/Public/emoji/${emojiVersion}/emoji-test.txt`;

if (!supportedVersions.includes(emojiVersion)) {
    console.error("unsupported emoji version!");
    process.exit(1);
}

const getEmojiTable = uri => {
    console.log("retrieving emoji-test.txt...");
    
    // retrieve emoji-test.txt from unicode's servers
    https.get(uri, res => {
        
        const contentLength = parseInt(res.headers["content-length"], 10);
        let data;
        let recieved = 0;
        
        
        res.on("data", chunk => {
            data += chunk;
            recieved += chunk.length;
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(`progress: ${(100 * recieved / contentLength).toFixed(2)}%`);
        });
        
        res.on("end", () => {
            process.stdout.write("\n");
            console.log("done!");
            parseEmojiData(data);
        });
        
    }).on("error", err => {
        throw err;
    });
}

const parseEmojiData = data => {
    console.log("parsing emoji-test.txt...");
    
    // make array of each line
    data = data.split("\n");
    
    // filter comments, empty lines, and unqualified emojis
    data = data.filter(e => {
        return (!e.startsWith("#") && e.length) && e.includes("fully-qualified");
    });
    
    const table = [];
    
    data.forEach(e => {
        // create temporary array to store individual emoji properties
        // specifically:
        // 0: codepoints
        // 1: qualification
        // 2: emoji & emoji name
        const emoji = e.split(/\;|\#/);
        
        // prefix each codepoint with 0x to indicate hexadecimal
        const codepoints = emoji[0].trim().split(" ").map(e => {
            return "0x" + e;
        });
        
        // get text after first space
        let emojiName = emoji[2].trim().split(/ (.+)/)[1];
        
        // exclude nulls/undefineds
        if (emojiName) {
            // remove prefixes
            emojiName = emojiName.replace("flag: ", "").replace(":", "");
            // lowercase
            emojiName = emojiName.toLowerCase();
        }
        
        table.push({
            name: emojiName,
            char: String.fromCodePoint(...codepoints)
        });
    });
    
    console.log("done!");
    
    writeTable(table);
}

const writeTable = data => {
    console.log("writing emoji_table.json...");
    
    fs.writeFile("./emoji_table.json", JSON.stringify(data), err => {
        if (err) throw err;
        console.log("finished!");
    });
}

console.log(`generating emoji table for version ${emojiVersion}`);
getEmojiTable(unicodeUrl);