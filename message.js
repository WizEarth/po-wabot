const config = require('./settings/config');
const fs = require('fs');
const axios = require('axios');
const chalk = require("chalk");
const jimp = require("jimp")
const util = require("util");
const crypto  = require("crypto")
const fetch = require("node-fetch")
const moment = require("moment-timezone");
const path = require("path")
const os = require('os');
const speed = require('performance-now')
const { spawn, exec, execSync } = require('child_process');
const { default: baileys, getContentType } = require("@shennmine/baileys");
module.exports = client = async (client, m, chatUpdate, store) => {
    try {
        const body = (
            m.mtype === "conversation" ? m.message.conversation :
            m.mtype === "imageMessage" ? m.message.imageMessage.caption :
            m.mtype === "videoMessage" ? m.message.videoMessage.caption :
            m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text :
            m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
            m.mtype === "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
            m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
            m.mtype === "interactiveResponseMessage" ? JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id :
            m.mtype === "templateButtonReplyMessage" ? m.msg.selectedId :
            m.mtype === "messageContextInfo" ? m.message.buttonsResponseMessage?.selectedButtonId ||
            m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text : ""
        );
        
        const sender = m.key.fromMe ? client.user.id.split(":")[0] + "@s.whatsapp.net" ||
              client.user.id : m.key.participant || m.key.remoteJid;
        
        const senderNumber = sender.split('@')[0];
        const budy = (typeof m.text === 'string' ? m.text : '');
        const prefa = ["", "!", ".", ",", "🐤", "🗿"];

        const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><™©®Δ^βα~¦|/\\©^]/;
        const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';
        const from = m.key.remoteJid;
        const isGroup = from.endsWith("@g.us");
        const botNumber = await client.decodeJid(client.user.id);
        const isBot = botNumber.includes(senderNumber)
        
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const command2 = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase()
        const args = body.trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        const text = q = args.join(" ");
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        const qmsg = (quoted.msg || quoted);
        const isMedia = /image|video|sticker|audio/.test(mime);
        
        const { smsg, fetchJson, sleep, formatSize, runtime } = require('./w-shennmine/lib/myfunction');     
        const cihuy = fs.readFileSync('./w-shennmine/lib/media/w-shennmine.jpg')
        const { fquoted } = require('./w-shennmine/lib/fquoted')

        // group
        const groupMetadata = m?.isGroup ? await client.groupMetadata(m.chat).catch(() => ({})) : {};
        const groupName = m?.isGroup ? groupMetadata.subject || '' : '';
        const participants = m?.isGroup ? groupMetadata.participants?.map(p => {
            let admin = null;
            if (p.admin === 'superadmin') admin = 'superadmin';
            else if (p.admin === 'admin') admin = 'admin';
            return {
                id: p.id || null,
                jid: p.jid || null,
                admin,
                full: p
            };
        }) || []: [];
        const groupOwner = m?.isGroup ? participants.find(p => p.admin === 'superadmin')?.jid || '' : '';
        const groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.jid || p.id);
        const isBotAdmins = m?.isGroup ? groupAdmins.includes(botNumber) : false;
        const isAdmins = m?.isGroup ? groupAdmins.includes(m.sender) : false;
        const isGroupOwner = m?.isGroup ? groupOwner === m.sender : false;
        
        if (m.message) {
            console.log('\x1b[30m--------------------\x1b[0m');
            console.log(chalk.bgHex("#4a69bd").bold(`▢ New Message`));
            console.log(
                chalk.bgHex("#ffffff").black(
                    `   ▢ Tanggal: ${new Date().toLocaleString()} \n` +
                    `   ▢ Pesan: ${m.body || m.mtype} \n` +
                    `   ▢ Pengirim: ${pushname} \n` +
                    `   ▢ JID: ${senderNumber} \n`
                )
            );
            console.log();
        }
        
        const reaction = async (jidss, emoji) => {
            client.sendMessage(jidss, {
                react: {
                    text: emoji,
                    key: m.key 
                } 
            })
        };
        
        async function reply(text) {
            client.sendMessage(m.chat, {
                text: "\n" + text + "\n",
                contextInfo: {
                    mentionedJid: [sender],
                    externalAdReply: {
                        title: config.settings.title,
                        body: config.settings.description,
                        thumbnailUrl: config.thumbUrl,
                        sourceUrl: config.socialMedia.Telegram,
                        renderLargerThumbnail: false,
                    }
                }
            }, { quoted: fquoted.packSticker })
        }
        
        const pluginsLoader = async (directory) => {
            let plugins = [];
            const folders = fs.readdirSync(directory);
            folders.forEach(file => {
                const filePath = path.join(directory, file);
                if (filePath.endsWith(".js")) {
                    try {
                        const resolvedPath = require.resolve(filePath);
                        if (require.cache[resolvedPath]) {
                            delete require.cache[resolvedPath];
                        }
                        const plugin = require(filePath);
                        plugins.push(plugin);
                    } catch (error) {
                        console.log(`${filePath}:`, error);
                    }
                }
            });
            return plugins;
        };

        const pluginsDisable = true;
        const plugins = await pluginsLoader(path.resolve(__dirname, "./command"));
        const plug = {
            client,
            prefix,
            command, 
            reply, 
            text, 
            isBot,
            reaction,
            pushname, 
            mime,
            quoted,
            sleep,
            fquoted,
            fetchJson 
        };

        for (let plugin of plugins) {
            if (plugin.command.find(e => e == command.toLowerCase())) {
                if (plugin.isBot && !isBot) {
                    return
                }
                
                if (plugin.private && !plug.isPrivate) {
                    return m.reply(config.message.private);
                }

                if (typeof plugin !== "function") return;
                await plugin(m, plug);
            }
        }
        
        if (!pluginsDisable) return;  

        switch (command) {
            case "menu":{
                if (!isBot) return
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const formattedUsedMem = formatSize(usedMem);
                const formattedTotalMem = formatSize(totalMem);
                let timestamp = speed()
                let latensi = speed() - timestamp
                let menu = `
 ▢ speed: ${latensi.toFixed(4)} s
 ▢ runtime: ${runtime(process.uptime())}
 ▢ RAM: ${formattedUsedMem} / ${formattedTotalMem}`

let command = `
 ▢ ${prefix}tagall
 ▢ ${prefix}get
 ▢ ${prefix}insp
 ▢ ${prefix}csesi
 ▢ ${prefix}exec
 ▢ ${prefix}eval
 ▢ ${prefix}mesinfo`

client.sendMessage(m.chat, { text: `${menu}
${command}`});
            }
            break
            case "mesinfo": {
                if (!m.quoted) return reply("harap reply ke sebuah pesan untuk mengecek mtype dan id-nya.");
             
                const type = m.quoted.mtype;
                const id = m.quoted.id;
                reply(`Pesan yang di-reply memiliki:\n- Tipe pesan: *${type}*\n- ID pesan: *${id}*`);
            }
            break;
            case "get":{
                if (!isBot) return
                if (!/^https?:\/\//.test(text)) return reply(`*ex:* ${prefix + command} https://kyuurzy.site`);
                const ajg = await fetch(text);
                await reaction(m.chat, "⚡")
                
                if (ajg.headers.get("content-length") > 100 * 1024 * 1024) {
                    throw `Content-Length: ${ajg.headers.get("content-length")}`;
                }

                const contentType = ajg.headers.get("content-type");
                if (contentType.startsWith("image/")) {
                    return client.sendMessage(m.chat, {
                        image: { url: text }
                    }, { quoted: fquoted.packSticker });
                }
        
                if (contentType.startsWith("video/")) {
                    return client.sendMessage(m.chat, {
                        video: { url: text } 
                    }, { quoted: fquoted.packSticker });
                }
                
                if (contentType.startsWith("audio/")) {
                    return client.sendMessage(m.chat, {
                        audio: { url: text },
                        mimetype: 'audio/mpeg', 
                        ptt: true
                    }, { quoted: fquoted.packSticker });
                }
        
                let alak = await ajg.buffer();
                try {
                    alak = util.format(JSON.parse(alak + ""));
                } catch (e) {
                    alak = alak + "";
                } finally {
                    return reply(alak.slice(0, 65536));
                }
            }
            break
            case "insp": {
                if (!isBot) return
                if (!text && !m.quoted) return reply(`*reply:* ${prefix + command}`);
                let quotedType = m.quoted?.mtype || '';
                let penis = JSON.stringify({ [quotedType]: m.quoted }, null, 2);
                const acak = `insp-${crypto.randomBytes(6).toString('hex')}.json`;
                
                await client.sendMessage(m.chat, {
                    document: Buffer.from(penis),
                    fileName: acak,
                    mimetype: "application/json"
                }, { quoted: fquoted.packSticker })
            }
            break
            case 'tagall':{
                if (!isBot) return
                const textMessage = args.join(" ") || "nothing";
                let teks = `tagall message :\n> *${textMessage}*\n\n`;
                const groupMetadata = await client.groupMetadata(m.chat);
                const participants = groupMetadata.participants;
                for (let mem of participants) {
                    teks += `@${mem.id.split("@")[0]}\n`;
                }

                client.sendMessage(m.chat, {
                    text: teks,
                    mentions: participants.map((a) => a.id)
                }, { quoted: fquoted.packSticker });
            }
            break
            case "exec": {
                if (!isBot) return;
                if (!budy.startsWith(".exec")) return;
                
                const { exec } = require("child_process");
                const args = budy.trim().split(' ').slice(1).join(' ');
                if (!args) return reply(`*ex:* ${prefix + command} ls`);
                exec(args, (err, stdout) => {
                    if (err) return reply(String(err));
                    if (stdout) return reply(stdout);
                });
            }
            break;
            case "eval": {
                if (!isBot) return;
                if (!budy.startsWith(".eval")) return;
                
                const args = budy.trim().split(' ').slice(1).join(' ');
                if (!args) return reply(`*ex:* ${prefix + command} m.chat`);
                let teks;
                try {
                    teks = await eval(`(async () => { ${args.startsWith("return") ? "" : "return"} ${args} })()`);
                } catch (e) {
                    teks = e;
                } finally {
                    await reply(require('util').format(teks));
                }
            }
            break
            case 'xsrc': {
  // 1) Feedback loading
  const xnxx = require('xnxx-scraper')
  await client.sendMessage(from, { text: '🔍 Mencari di xnxx...' }, { quoted: m })

  // 2) Ambil query
  const query = args.length ? args.join(' ') : 'squirt'

  try {
    // 3) Panggil scraper
    const response = await xnxx.search(query)
    // Ambil maksimal 20 hasil
    const items = Array.isArray(response.result)
      ? response.result.slice(0, 20)
      : []

    // 4) Siapkan rows untuk NativeFlow
    const rows = items.map((vid, idx) => ({
      header: `${idx + 1}`,
      title: vid.title.substring(0, 20),
      description: vid.link,
      id: `.gxnxx ${vid.link}`
    }))

    // 5) Kirim pesan hanya dengan NativeFlow single_select
    await client.sendMessage(from, {
      text: `*Hasil Pencarian "${query}" (Top ${items.length})*\nPilih video untuk diunduh:`,
      footer: '© NIH RESULT NYA',
      headerType: 1,
      viewOnce: true,
      buttons: [
        {
          buttonId: 'xnxxsrcv2_native',
          buttonText: { displayText: '📥 Daftar Unduhan' },
          type: 4,
          nativeFlowInfo: {
            name: 'single_select',
            paramsJson: JSON.stringify({
              title: 'Pilih Video untuk Diunduh',
              sections: [
                {
                  title: `Hasil "${query}"`,
                  highlight_label: '🔗',
                  rows
                }
              ]
            })
          }
        }
      ]
    }, { quoted: null })

  } catch (err) {
    console.error('xnxx-scraper error:', err)
    await client.sendMessage(
      from,
      { text: '⚠️ Gagal mengambil data dari xnxx-scraper.' },
      { quoted: null }
    )
  }
  
}
break
case 'gxnxx': {
const { xnxxSearch, xnxxDownload } = require('@mr.janiya/xnxx-scraper');

  // 1. Loading notice
  await client.sendMessage(from, { text: '🔄 Mengunduh detail video dari xnxx...' }, { quoted: m })

  // 2. Ambil URL dari args
  const url = args[0]
  if (!url || !url.startsWith('http')) {
    return await client.sendMessage(from, {
      text: '⚠️ Mohon sertakan URL video xnxx. Contoh:\n\nxnxxdownv2 https://www.xnxx.com/video-xxxxx'
    }, { quoted: m })
  }
    try {
    // 3. Panggil downloader
    const data = await xnxxDownload(url)
    const info = data.result

    // 4. Siapkan caption
    let caption = `*${info.title}*\n`
    caption += `📌 URL: ${info.URL}\n`
    caption += `⏱ Durasi: ${info.duration}s\n`
    caption += `ℹ️ Info: ${info.info.replace(/\\t/g, ' ')}\n\n`
    // 5. Kirim thumbnail + caption
    const buttons = [
  { buttonId: `.xnxxdownv2 ${info.URL}`, buttonText: { displayText: 'DOWNLOAD' }, type: 1 }
]

const buttonMessage = {
    image: { url: info.image }, // image: buffer or path
    caption,
    footer: 'nih hasil nya',
    buttons,
    headerType: 1,
    viewOnce: true
}

await client.sendMessage(m.chat, buttonMessage, { quoted: null })

  } catch (err) {
    console.error('xnxxDownload error:', err)
    await client.sendMessage(from, {
      text: '❌ Gagal mengambil detail video dari xnxx-scraper.'
    }, { quoted: m })
  }
  
  }
  break
case 'xnxxdownv2': {
  const { xnxxSearch, xnxxDownload } = require('@mr.janiya/xnxx-scraper');

  // 1. Loading notice
  await client.sendMessage(from, { text: '🔄 Mengunduh detail video dari xnxx...' }, { quoted: m })

  // 2. Ambil URL dari args
  const url = args[0]
  if (!url || !url.startsWith('http')) {
    return await client.sendMessage(from, {
      text: '⚠️ Mohon sertakan URL video xnxx. Contoh:\n\nxnxxdownv2 https://www.xnxx.com/video-xxxxx'
    }, { quoted: m })
  }

  try {
    // 3. Panggil downloader
    const data = await xnxxDownload(url)
    const info = data.result

    // 4. Siapkan caption
    let caption = `*${info.title}*\n`
    caption += `📌 URL: ${info.URL}\n`
    caption += `⏱ Durasi: ${info.duration}s\n`
    caption += `ℹ️ Info: ${info.info.replace(/\\t/g, ' ')}\n\n`
    caption += `*Link Unduhan:*\n`
    // files: low, high, HLS
    if (info.files.low) caption += `• Low Quality: ${info.files.low}\n`
    if (info.files.high) caption += `• High Quality: ${info.files.high}\n`
    if (info.files.HLS) caption += `• HLS Stream: ${info.files.HLS}\n`

    // 5. Kirim thumbnail + caption
    await client.sendMessage(from, {
      image: { url: info.image },
      caption
    }, { quoted: m })
await client.sendMessage(m.chat, {
video: { url: info.files.high }, caption: `Video Nya` }, { quoted: null })
  } catch (err) {
    console.error('xnxxDownload error:', err)
    await client.sendMessage(from, {
      text: '❌ Gagal mengambil detail video dari xnxx-scraper.'
    }, { quoted: m })
  }
 
}
            break;
            default:
        }
    } catch (err) {
        console.log(require("util").format(err));
    }
};

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
