require('dotenv').config()
const { decryptMedia } = require('@open-wa/wa-automate')

const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Jakarta').locale('id')
const axios = require('axios')
const fetch = require('node-fetch')

const appRoot = require('app-root-path')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const db_group = new FileSync(appRoot+'/lib/data/group.json')
const db = low(db_group)
db.defaults({ group: []}).write()

const { 
    removeBackgroundFromImageBase64
} = require('remove.bg')

const {
    exec
} = require('child_process')

const { 
    menuId, 
    cekResi,
    destravaId,	
    urlShortener,
	Animhentai, 
    meme, 
    translate, 
    getLocationData,
    images,
    resep,
    rugapoi,
    rugaapi,
    cariKasar
} = require('./lib')

const { 
    msgFilter, 
    color, 
    processTime, 
    isUrl,
	download
} = require('./utils')

const { uploadImages } = require('./utils/fetcher')

const fs = require('fs-extra')
const banned = JSON.parse(fs.readFileSync('./settings/banned.json'))
const simi = JSON.parse(fs.readFileSync('./settings/simi.json'))
const ngegas = JSON.parse(fs.readFileSync('./settings/ngegas.json'))
const setting = JSON.parse(fs.readFileSync('./settings/setting.json'))

let { 
    ownerNumber, 
    groupLimit, 
    memberLimit,
    prefix
} = setting

const {
    apiNoBg,
	apiSimi
} = JSON.parse(fs.readFileSync('./settings/api.json'))

function formatin(duit){
    let	reverse = duit.toString().split('').reverse().join('');
    let ribuan = reverse.match(/\d{1,3}/g);
    ribuan = ribuan.join('.').split('').reverse().join('');
    return ribuan;
}

const inArray = (needle, haystack) => {
    let length = haystack.length;
    for(let i = 0; i < length; i++) {
        if(haystack[i].id == needle) return i;
    }
    return false;
}

module.exports = HandleMsg = async (aruga, message) => {
    try {
        const { type, id, from, t, sender, author, isGroupMsg, chat, chatId, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
        let { body } = message
        var { name, formattedTitle } = chat
        let { pushname, verifiedName, formattedName } = sender
        pushname = pushname || verifiedName || formattedName // verifiedName is the name of someone who uses a business account
        const botNumber = await aruga.getHostNumber() + '@c.us'
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        const groupAdmins = isGroupMsg ? await aruga.getGroupAdmins(groupId) : ''
        const isGroupAdmins = groupAdmins.includes(sender.id) || false
		const chats = (type === 'chat') ? body : (type === 'image' || type === 'video') ? caption : ''
		const pengirim = sender.id
        const isBotGroupAdmins = groupAdmins.includes(botNumber) || false
		const krisar = '558387871031@c.us'

        // Bot Prefix
        body = (type === 'chat' && body.startsWith(prefix)) ? body : ((type === 'image' && caption || type === 'video' && caption) && caption.startsWith(prefix)) ? caption : ''
        const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
        const arg = body.trim().substring(body.indexOf(' ') + 1)
        const args = body.trim().split(/ +/).slice(1)
		const argx = chats.slice(0).trim().split(/ +/).shift().toLowerCase()
        const isCmd = body.startsWith(prefix)
        const uaOverride = process.env.UserAgent
        const url = args.length !== 0 ? args[0] : ''
        const isQuotedImage = quotedMsg && quotedMsg.type === 'image'
	    const isQuotedVideo = quotedMsg && quotedMsg.type === 'video'
		
		// [IDENTIFY]
		const isOwnerBot = ownerNumber.includes(pengirim)
        const isBanned = banned.includes(pengirim)
		const isSimi = simi.includes(chatId)
		const isNgegas = ngegas.includes(chatId)
		const isKasar = await cariKasar(chats)
	
	//[AUTO READ] Auto read message 
	aruga.sendSeen(chatId)
	    
	// Filter Banned People	
        if (isBanned) {
            return aruga.reply(from, "banido, agora é só ligar para o batman!😎")
        }
		
        switch (command) {
        case 'ping':
            await aruga.sendText(from, `Pong!!!!\nSpeed: ${processTime(t, moment())} _Second_`)
            break			
        case 'neko':
        case 'hentai':
		      return aruga.reply(from, 'ihh ala quer ver porno 2D KKK', id)
		    break
		case 'porn':	
		     return aruga.reply(from, 'ih ala quer ver porno punheteiro KKK', id)	
        case 'admlist':
            if ((isGroupMsg) && (isGroupAdmins)) {
                let msg = `Lista de adimin do grupo: *${formattedTitle}*\n\n`
                let index = 1
                for (admin of groupAdmins) {
                    msg += `@${admin.replace(/@c.us/g, '')}\n`
                }
                await aruga.sendTextWithMentions(from, msg)
            }
            insert(author, type, content, pushname, from, argv)
            break			
        case 'sugestao':
		     if (args.length == 0) return aruga.reply(from, `Desculpe, o formato da mensagem está errado.\nuse ${prefix}sugestao (texto)\nex:${prefix}sugestao eu gostaria q o bot tivesse.../neu nao gostei do bot pois...`, id)
            await aruga.sendText(krisar, `[sugestao] de ${pushname} (${from})\n\n${args.join(' ')}`)
            insert(author, type, content, pushname, from, argv)
            break			
        case 'comandos':
        case 'menu':
        case 'help':
            await aruga.sendText(from, menuId.textMenu(pushname))
            .then(() => ((isGroupMsg) && (isGroupAdmins)) ? aruga.sendText(from, `Menu Admin Grup: *${prefix}menuadmin*`) : null)
            break
        case 'grupolink':
            var link = await aruga.getGroupInviteLink(groupId)
            if (!isGroupMsg) return aruga.reply(from,`Link do grupo: ${formattedTitle} ${link}`, id)
            insert(author, type, content, pushname, from, argv)
            break				
        case 'menuadmin':
            if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (!isGroupAdmins) return aruga.reply(from, 'Falha, este comando só pode ser usado por administradores de grupo!', id)
            await aruga.sendText(from, menuId.textAdmin())
            break
        case 'criador':
            return aruga.reply(from, 'wa.me/+558387871031', id)
            break	
        case 'insta':
            return aruga.reply(from, 'o insta não e do dono do bot!\nhttps://instagram.com/vinizn.vfx?igshid=oyp2j9f2eae1', id)
            break
        case 'entrar':
            if (args.length == 0) return aruga.reply(from, `Se você quiser convidar o bot para o grupo, convide ou com\ntipo ${prefix}join [link group]`, id)
            let linkgrup = body.slice(6)
            let islink = linkgrup.match(/(https:\/\/chat.whatsapp.com)/gi)
            let chekgrup = await aruga.inviteInfo(linkgrup)
            if (!islink) return aruga.reply(from, 'Desculpe, o link do grupo está errado! por favor nos envie o link correto', id)
            if (isOwnerBot) {
                await aruga.joinGroupViaLink(linkgrup)
                      .then(async () => {
                          await aruga.sendText(from, 'Entrou no grupo com sucesso através do link!')
                          await aruga.sendText(chekgrup.id, `Para descobrir os comandos neste tipo de bot ${prefix}menu`)
                      })
            } else {
                let cgrup = await aruga.getAllGroups()
                if (cgrup.length > groupLimit) return aruga.reply(from, `Desculpe, o grupo neste bot está cheio\nGrupo máximo é: ${groupLimit}`, id)
                if (cgrup.size < memberLimit) return aruga.reply(from, `Desculpe, BOT não entrará se os membros do grupo não excederem ${memberLimit} pessoas`, id)
                await aruga.joinGroupViaLink(linkgrup)
                      .then(async () =>{
                          await aruga.reply(from, 'Entrou no grupo com sucesso através do link!', id)
                      })
                      .catch(() => {
                          aruga.reply(from, 'Falhou!', id)
                      })
            }
            break
        case 'botstat': {
            const loadedMsg = await aruga.getAmountOfLoadedMessages()
            const chatIds = await aruga.getAllChatIds()
            const groups = await aruga.getAllGroups()
            aruga.sendText(from, `Status :\n- *${loadedMsg}* Mensagens carregadas\n- *${groups.length}* Bate-papos em grupo\n- *${chatIds.length - groups.length}* Bate-papos pessoais\n- *${chatIds.length}* Total de Chats`)
            break
        }

        // Sticker Creator
        case 'sticker':
        case 'fig':
            if ((isMedia || isQuotedImage) && args.length === 0) {
                const encryptMedia = isQuotedImage ? quotedMsg : message
                const _mimetype = isQuotedImage ? quotedMsg.mimetype : mimetype
                const mediaData = await decryptMedia(encryptMedia, uaOverride)
                const imageBase64 = `data:${_mimetype};base64,${mediaData.toString('base64')}`
                aruga.sendImageAsSticker(from, imageBase64)
                .then(() => {
                    aruga.reply(from, 'Aqui está sua figurinha')
                    console.log(`figurinha processado em ${processTime(t, moment())} segundos`)
                })
            } else if (args[0] === 'nobg') {
                if (isMedia || isQuotedImage) {
                    try {
                    var mediaData = await decryptMedia(message, uaOverride)
                    var imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                    var base64img = imageBase64
                    var outFile = './media/noBg.png'
		            // kamu dapat mengambil api key dari website remove.bg dan ubahnya difolder settings/api.json
                    var result = await removeBackgroundFromImageBase64({ base64img, apiKey: apiNoBg, size: 'auto', type: 'auto', outFile })
                    await fs.writeFile(outFile, result.base64img)
                    await aruga.sendImageAsSticker(from, `data:${mimetype};base64,${result.base64img}`)
                    } catch(err) {
                    console.log(err)
	   	            await aruga.reply(from, 'Desculpe, o limite de uso de hoje atingiu o máximo', id)
                    }
                }
            } else if (args.length === 1) {
                if (!isUrl(url)) { await aruga.reply(from, 'Desculpe, você enviou o comando errado.', id) }
                aruga.sendStickerfromUrl(from, url).then((r) => (!r && r !== undefined)
                    ? aruga.sendText(from, 'Desculpe, o link que você enviou não contém uma imagem.')
                    : aruga.reply(from, 'Here\'s your sticker')).then(() => console.log(`figurinha processado em ${processTime(t, moment())} segundos`))
            } else {
                await aruga.reply(from, `Sem imagens! Usar ${prefix}sticker\n\n\nEnvie fotos com legendas\n${prefix}sticker <biasa>\n${prefix}sticker nobg <tanpa background>\n\nou enviar mensagem com\n${prefix}sticker <link_gambar>`, id)
            }
            break
        case 'stickergif':
        case 'figif':
            if (isMedia || isQuotedVideo) {
                if (mimetype === 'video/mp4' && message.duration < 10 || mimetype === 'image/gif' && message.duration < 10) {
                    var mediaData = await decryptMedia(message, uaOverride)
                    aruga.reply(from, '[ESPERE] Em andamento⏳ aguarde ± 1 min!', id)
                    var filename = `./media/stickergif.${mimetype.split('/')[1]}`
                    await fs.writeFileSync(filename, mediaData)
                    await exec(`gify ${filename} ./media/stickergf.gif --fps=30 --scale=240:240`, async function (error, stdout, stderr) {
                        var gif = await fs.readFileSync('./media/stickergf.gif', { encoding: "base64" })
                        await aruga.sendImageAsSticker(from, `data:image/gif;base64,${gif.toString('base64')}`)
                        .catch(() => {
                            aruga.reply(from, 'Desculpe, o arquivo é muito grande!', id)
                        })
                    })
                  } else {
                    aruga.reply(from, `[❗] Envie um GIF com uma legenda *${prefix}stickergif* max 10 sec!`, id)
                   }
                } else {
		    aruga.reply(from, `[❗] Envie um GIF com uma legenda *${prefix}stickergif*`, id)
	        }
            break
        case 'meme':
            if ((isMedia || isQuotedImage) && args.length >= 2) {
                const top = arg.split('|')[0]
                const bottom = arg.split('|')[1]
                const encryptMedia = isQuotedImage ? quotedMsg : message
                const mediaData = await decryptMedia(encryptMedia, uaOverride)
                const getUrl = await uploadImages(mediaData, false)
                const ImageBase64 = await meme.custom(getUrl, top, bottom)
                aruga.sendFile(from, ImageBase64, 'image.png', '', null, true)
                    .then(() => {
                        aruga.reply(from, 'Obrigado!',id)
                    })
                    .catch(() => {
                        aruga.reply(from, 'Há um erro!')
                    })
            } else {
                await aruga.reply(from, `Sem imagem! Envie uma foto com uma legenda ${prefix}meme <teks_atas> | <teks_bawah>\nexemplo: ${prefix}meme texto superior | texto abaixo`, id)
            }
            break
        case 'escrever':
            if (args.length == 0) return aruga.reply(from, `Faça o bot escrever o texto que é enviado como imagem\nUso: ${prefix}escrever [texto]\n\ncontoh: ${prefix}escrever i love you 3000`, id)
            const nulisq = body.slice(9)
            const nulisp = await rugaapi.tulis(nulisq)
            await aruga.sendImage(from, `${nulisp}`, '', '', id)
            .catch(() => {
                aruga.reply(from, 'Error!', id)
            })
            break
        //Media
        case 'ytmp3':
            if (args.length == 0) return aruga.reply(from, `Para baixar músicas do youtube\ntipo: ${prefix}ytmp3 [link_yt]`, id)
            const linkmp3 = args[0].replace('https://youtu.be/','').replace('https://www.youtube.com/watch?v=','')
			rugaapi.ytmp3(`https://youtu.be/${linkmp3}`)
            .then(async(res) => {
				if (res.error) return aruga.sendFileFromUrl(from, `${res.url}`, '', `${res.error}`)
				await aruga.sendFileFromUrl(from, `${res.result.thumb}`, '', `Canção encontrada\n\nJudul: ${res.result.title}\nDesc: ${res.result.desc}\nPaciência novamente enviada`, id)
				await aruga.sendFileFromUrl(from, `${res.result.url}`, '', '', id)
				.catch(() => {
					aruga.reply(from, `ESTE URL ${args[0]} NUNCA FOI BAIXADO ANTES ..URL SERÁ REINICIADA APÓS 60 MINUTOS`, id)
				})
			})
            break
        case 'ytmp4':
            if (args.length == 0) return aruga.reply(from, `Para baixar músicas do youtube\ntipo: ${prefix}ytmp3 [link_yt]`, id)
            const linkmp4 = args[0].replace('https://youtu.be/','').replace('https://www.youtube.com/watch?v=','')
			rugaapi.ytmp4(`https://youtu.be/${linkmp4}`)
            .then(async(res) => {
				if (res.error) return aruga.sendFileFromUrl(from, `${res.url}`, '', `${res.error}`)
				await aruga.sendFileFromUrl(from, `${res.result.thumb}`, '', `Canção encontrada\n\nTítulo: ${res.result.title}\nDesc: ${res.result.desc}\nPaciência novamente enviada`, id)
				await aruga.sendFileFromUrl(from, `${res.result.url}`, '', '', id)
				.catch(() => {
					aruga.reply(from, `ESTE URL ${args[0]} NUNCA FOI BAIXADO ANTES ..URL SERÁ REINICIADA APÓS 60 MINUTOS`, id)
				})
			})
            break
		case 'fb':
		case 'facebook':
			if (args.length == 0) return aruga.reply(from, `Para baixar vídeos do link do facebook\ntipo: ${prefix}fb [link_fb]`, id)
			rugaapi.fb(args[0])
			.then(async (res) => {
				const { link, linkhd, linksd } = res
				if (res.status == 'error') return aruga.sendFileFromUrl(from, link, '', 'Desculpe, seu url não foi encontrado', id)
				await aruga.sendFileFromUrl(from, linkhd, '', 'Aqui esta o video', id)
				.catch(async () => {
					await aruga.sendFileFromUrl(from, linksd, '', 'Aqui esta o video', id)
					.catch(() => {
						aruga.reply(from, 'Desculpe, seu url não foi encontrado', id)
					})
				})
			})
			break
			
		//Primbon Menu
        case 'citar':
            const quotex = await rugaapi.quote()
            await aruga.reply(from, quotex, id)
            .catch(() => {
                aruga.reply(from, 'Error!', id)
            })
            break
		case 'historia':
			rugaapi.cerpen()
			.then(async (res) => {
				await aruga.reply(from, res.result, id)
			})
			break
		case 'cersex':
			rugaapi.cersex()
			.then(async (res) => {
				await aruga.reply(from, res.result, id)
			})
			break
		case 'poesia':
			rugaapi.puisi()
			.then(async (res) => {
				await aruga.reply(from, res.result, id)
			})
			break

        //Random Images
        case 'anime':
            if (args.length == 0) return aruga.reply(from, `Usar ${prefix}anime\nPor favor digite: ${prefix}anime [query]\nExemplo: ${prefix}anime random\n\nconsultas disponíveis:\nrandom, waifu, husbu, neko`, id)
            if (args[0] == 'random' || args[0] == 'waifu' || args[0] == 'husbu' || args[0] == 'neko') {
                fetch('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/random/anime/' + args[0] + '.txt')
                .then(res => res.text())
                .then(body => {
                    let randomnime = body.split('\n')
                    let randomnimex = randomnime[Math.floor(Math.random() * randomnime.length)]
                    aruga.sendFileFromUrl(from, randomnimex, '', 'Nee..', id)
                })
                .catch(() => {
                    aruga.reply(from, 'Error!', id)
                })
            } else {
                aruga.reply(from, `Desculpe, a consulta não está disponível. Por favor digite ${prefix}anime para ver a lista de consulta`)
            }
            break
        case 'memes':
            const randmeme = await meme.random()
            aruga.sendFileFromUrl(from, randmeme, '', '', id)
            .catch(() => {
                aruga.reply(from, 'Error!', id)
            })
            break
        
        // Search Any
        case 'images':
            if (args.length == 0) return aruga.reply(from, `Para pesquisar imagens no pinterest\ntipo: ${prefix}images [search]\nexemplo: ${prefix}images naruto`, id)
            const cariwall = body.slice(8)
            const hasilwall = await images.fdci(cariwall)
            await aruga.sendFileFromUrl(from, hasilwall, '', '', id)
            .catch(() => {
                aruga.reply(from, 'Error!', id)
            })
            break
        case 'sreddit':
            if (args.length == 0) return aruga.reply(from, `Para procurar imagens no sub reddit\ntipo: ${prefix}sreddit [search]\ncontoh: ${prefix}sreddit naruto`, id)
            const carireddit = body.slice(9)
            const hasilreddit = await images.sreddit(carireddit)
            await aruga.sendFileFromUrl(from, hasilreddit, '', '', id)
            .catch(() => {
                aruga.reply(from, 'Error!', id)
            })
	    break
        case 'receita':
            if (args.length == 0) return aruga.reply(from, `Para encontrar receitas de comida\nComo usar: ${prefix}receita [search]\n\nexemplo: ${prefix}resep tahu`, id)
            const cariresep = body.slice(7)
            const hasilresep = await resep.resep(cariresep)
            await aruga.reply(from, hasilresep + '\n\nEsta é a receita da comida..', id)
            .catch(() => {
                aruga.reply(from, 'Error!', id)
            })
            break
        case 'nekopoi':
             rugapoi.getLatest()
            .then((result) => {
                rugapoi.getVideo(result.link)
                .then((res) => {
                    let heheq = '\n'
                    for (let i = 0; i < res.links.length; i++) {
                        heheq += `${res.links[i]}\n`
                    }
                    aruga.reply(from, `titulo: ${res.title}\n\nLink:\n${heheq}\nmasih tester bntr :v`)
                })
            })
            .catch(() => {
                aruga.reply(from, 'Error!', id)
            })
            break
        case 'stalkig':
            if (args.length == 0) return aruga.reply(from, `Para perseguir a conta de alguém no Instagram\ntipo ${prefix}stalkig [username]\nexemplo: ${prefix}stalkig vinizn.pcx`, id)
            const igstalk = await rugaapi.stalkig(args[0])
            const igstalkpict = await rugaapi.stalkigpict(args[0])
            await aruga.sendFileFromUrl(from, igstalkpict, '', igstalk, id)
            .catch(() => {
                aruga.reply(from, 'Error!', id)
            })
            break
        case 'wiki':
            if (args.length == 0) return aruga.reply(from, `Para encontrar uma palavra da wikipedia\ntipo: ${prefix}wiki [a palavra]`, id)
            const wikip = body.slice(6)
            const wikis = await rugaapi.wiki(wikip)
            await aruga.reply(from, wikis, id)
            .catch(() => {
                aruga.reply(from, 'Error!', id)
            })
            break
        case 'clima':
            if (args.length == 0) return aruga.reply(from, `Para ver o clima em uma área\ntipo: ${prefix}clima [são paulo]`, id)
            const cuacaq = body.slice(7)
            const cuacap = await rugaapi.cuaca(cuacaq)
            await aruga.reply(from, cuacap, id)
            .catch(() => {
                aruga.reply(from, 'Error!', id)
            })
            break
        case 'letra':
            if (args.length == 0) return aruga.reply(from, `Para pesquisar a letra de uma música\btipo: ${prefix}lirik [judul_lagu]`, id)
            rugaapi.lirik(body.slice(7))
            .then(async (res) => {
                await aruga.reply(from, `Letra da música: ${body.slice(7)}\n\n${res}`, id)
            })
            break
        case 'acordes':
            if (args.length == 0) return aruga.reply(from, `Para pesquisar as letras e acordes de uma música\btipo: ${prefix}acordes [judul_lagu]`, id)
            const chordq = body.slice(7)
            const chordp = await rugaapi.chord(chordq)
            await aruga.reply(from, chordp, id)
            .catch(() => {
                aruga.reply(from, 'Error!', id)
            })
            break
        case 'play'://silahkan kalian custom sendiri jika ada yang ingin diubah
            if (args.length == 0) return aruga.reply(from, `Para procurar músicas do youtube\n\nUsar: ${prefix}play judul lagu`, id)
            axios.get(`https://arugaytdl.herokuapp.com/search?q=${body.slice(6)}`)
            .then(async (res) => {
                await aruga.sendFileFromUrl(from, `${res.data[0].thumbnail}`, ``, `Canção encontrada\n\nTítulo: ${res.data[0].title}\nDuração: ${res.data[0].duration}detik\nCarregado: ${res.data[0].uploadDate}\nvisualizações: ${res.data[0].viewCount}`, id)
				rugaapi.ytmp3(`https://youtu.be/${res.data[0].id}`)
				.then(async(res) => {
					if (res.status == 'error') return aruga.sendFileFromUrl(from, `${res.link}`, '', `${res.error}`)
					await aruga.sendFileFromUrl(from, `${res.thumb}`, '', `Canção encontrada\n\nTítulo ${res.title}\n\nPaciência novamente enviada`, id)
					await aruga.sendFileFromUrl(from, `${res.link}`, '', '', id)
					.catch(() => {
						aruga.reply(from, `ESTE URL ${args[0]} JÁ BAIXOU ANTERIORMENTE .. URL IRÁ RESETAR APÓS 60 MINUTOS`, id)
					})
				})
            })
            .catch(() => {
                aruga.reply(from, 'Error!', id)
            })
            break
		case 'movie':
			if (args.length == 0) return aruga.reply(from, `Para pesquisar um filme no site sdmovie.fun\ntipo: ${prefix}movie judulnya`, id)
			rugaapi.movie((body.slice(7)))
			.then(async (res) => {
				if (res.status == 'error') return aruga.reply(from, res.hasil, id)
				await aruga.sendFileFromUrl(from, res.link, 'movie.jpg', res.hasil, id)
			})
			break
        case 'whatanime':
            if (isMedia && type === 'image' || quotedMsg && quotedMsg.type === 'image') {
                if (isMedia) {
                    var mediaData = await decryptMedia(message, uaOverride)
                } else {
                    var mediaData = await decryptMedia(quotedMsg, uaOverride)
                }
                const fetch = require('node-fetch')
                const imgBS4 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                aruga.reply(from, 'Searching....', id)
                fetch('https://trace.moe/api/search', {
                    method: 'POST',
                    body: JSON.stringify({ image: imgBS4 }),
                    headers: { "Content-Type": "application/json" }
                })
                .then(respon => respon.json())
                .then(resolt => {
                	if (resolt.docs && resolt.docs.length <= 0) {
                		aruga.reply(from, 'Desculpe, não sei o que é este anime, certifique-se de que a imagem a ser pesquisada não está desfocada / cortada', id)
                	}
                    const { is_adult, title, title_chinese, title_romaji, title_english, episode, similarity, filename, at, tokenthumb, anilist_id } = resolt.docs[0]
                    teks = ''
                    if (similarity < 0.92) {
                    	teks = '*Eu tenho pouca fé nisso* :\n\n'
                    }
                    teks += `➸ *Title Japanese* : ${title}\n➸ *Title chinese* : ${title_chinese}\n➸ *Title Romaji* : ${title_romaji}\n➸ *Title English* : ${title_english}\n`
                    teks += `➸ *R-18?* : ${is_adult}\n`
                    teks += `➸ *Eps* : ${episode.toString()}\n`
                    teks += `➸ *Kesamaan* : ${(similarity * 100).toFixed(1)}%\n`
                    var video = `https://media.trace.moe/video/${anilist_id}/${encodeURIComponent(filename)}?t=${at}&token=${tokenthumb}`;
                    aruga.sendFileFromUrl(from, video, 'anime.mp4', teks, id).catch(() => {
                        aruga.reply(from, teks, id)
                    })
                })
                .catch(() => {
                    aruga.reply(from, 'Error!', id)
                })
            } else {
				aruga.reply(from, `Desculpe, o formato está errado\n\nEnvie uma foto com uma legenda ${prefix}whatanime\n\nOu responda a fotos com legendas ${prefix}whatanime`, id)
			}
            break
            
        // Other Command:
            if (args.length == 0) return aruga.reply(from, `Converte texto em som (google voice)\ntipo: ${prefix}tts <codigo da lingua> <texto>\nexemplo : ${prefix}tts id halo\npara kode bahasa cek disini : https://anotepad.com/note/read/5xqahdy8`)
            const ttsGB = require('node-gtts')(args[0])
            const dataText = body.slice(8)
			if (dataText.length > 180) return aruga.reply(from,  `O texto é muito longo vai tomar no cu eric!`, id)
                try {
                    ttsGB.save('./media/tts.mp3', dataText, function () {
                    aruga.sendPtt(from, './media/tts.mp3', id)
                    })
                } catch (err) {
                    aruga.reply(from, err, id)
                }
            break			
        case 'traduzir':
            if (args.length != 1) return aruga.reply(from, `Desculpe, o formato da mensagem está errado.\nResponda a uma mensagem com uma legenda ${prefix}translate <codigo da lingua>\nexemplo ${prefix}translate id`, id)
            if (!quotedMsg) return aruga.reply(from, `Desculpe, o formato da mensagem está errado.\nResponda a uma mensagem com uma legenda ${prefix}translate <codigo da lingua>\nexemplo ${prefix}translate id`, id)
            const quoteText = quotedMsg.type == 'chat' ? quotedMsg.body : quotedMsg.type == 'image' ? quotedMsg.caption : ''
            translate(quoteText, args[0])
                .then((result) => aruga.sendText(from, result))
                .catch(() => aruga.sendText(from, 'Error.'))
            break
        case 'shortlink':
            if (args.length == 0) return aruga.reply(from, `tipo ${prefix}shortlink <url>`, id)
            if (!isUrl(args[0])) return aruga.reply(from, 'Desculpe, o url que você enviou é inválido.', id)
            const shortlink = await urlShortener(args[0])
            await aruga.sendText(from, shortlink)
            .catch(() => {
                aruga.reply(from, 'Error!', id)
            })
            break
        // Group Commands (group admin only)
		case 'donogrupo':
            if (!isGroupMsg) return aruga.reply(from, 'Este comando só pode ser usado em grupos!', id)
            const Owner_ = chat.groupMetadata.owner
            await aruga.sendTextWithMentions(from, `dono do grupo : @${Owner_}`)
			insert(author, type, content, pushname, from, argv)
            break
	    case 'adicionar':
            if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro de grupos!', id)
            if (!isGroupAdmins) return aruga.reply(from, 'Falha, este comando só pode ser usado por administradores do grupo!', id)
            if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)
	        if (args.length !== 1) return aruga.reply(from, `Usar ${prefix}add\nUsar: ${prefix}add <numero>\nexemplo: ${prefix}add 559xxx`, id)
                try {
                    await aruga.addParticipant(from,`${args[0]}@c.us`)
                } catch {
                    aruga.reply(from, 'Incapaz de adicionar alvo', id)
                }
            break
		case 'say':
            if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (args.length !== 1) return aruga.reply(from,  `use ${prefix}say (texto)`)
            let saytext = body.slice(4)
            await aruga.sendText(from, saytext)
			break
		case 'addcr':
            if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro de grupos!', id)
            if (!isOwnerBot) return aruga.reply(from, 'so eu posso usar rlx ai KKK', id)
			if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)	
	        if (args.length !== 1) return aruga.reply(from, `Usar ${prefix}add\nUsar: ${prefix}add <numero>\nexemplo: ${prefix}add 559xxx`, id)
                try {
                    await aruga.addParticipant(from,`${args[0]}@c.us`)
                } catch {
                    aruga.reply(from, 'Incapaz de adicionar alvo', id)
                }
            break			
        case 'remover':
            if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (!isGroupAdmins) return aruga.reply(from, 'Falha, este comando só pode ser usado por administradores de grupo!', id)
            if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)
            if (mentionedJidList.length === 0) return aruga.reply(from, 'Desculpe, o formato da mensagem está errado.\nMarque uma ou mais pessoas a serem expulsas', id)
            if (mentionedJidList[0] === botNumber) return await aruga.reply(from, 'Desculpe, o formato da mensagem está errado.\nTidak dapat mengeluarkan akun bot sendiri', id)
            await aruga.sendTextWithMentions(from, `Pedido recebido, emitido:\n${mentionedJidList.map(x => `@${x.replace('@c.us', '')}`).join('\n')}`)
            for (let i = 0; i < mentionedJidList.length; i++) {
                if (groupAdmins.includes(mentionedJidList[i])) return await aruga.sendText(from, 'Falha, você não pode remover o administrador do grupo.')
                await aruga.removeParticipant(groupId, mentionedJidList[i])
            }
            break        
		case 'kickcr':
            if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (!isOwnerBot) return aruga.reply(from, 'so eu consigo dar esse comando rlx ai KKK', id)
            if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)
            if (mentionedJidList.length === 0) return aruga.reply(from, 'Desculpe, o formato da mensagem está errado.\nMarque uma ou mais pessoas a serem expulsas', id)
            if (mentionedJidList[0] === botNumber) return await aruga.reply(from, 'Maaf, format pesan salah.\nTidak dapat mengeluarkan akun bot sendiri', id)
            await aruga.sendTextWithMentions(from, `Pedido recebido, emitido:\n${mentionedJidList.map(x => `@${x.replace('@c.us', '')}`).join('\n')}`)
            for (let i = 0; i < mentionedJidList.length; i++) {
                await aruga.removeParticipant(groupId, mentionedJidList[i])
            }
            break
        case 'promover':
            if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (!isGroupAdmins) return aruga.reply(from, 'Falha, este comando só pode ser usado por administradores de grupo!', id)
            if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)
            if (mentionedJidList.length !== 1) return aruga.reply(from, 'Desculpe, só pode promover 1 usuário', id)
            if (groupAdmins.includes(mentionedJidList[0])) return await aruga.reply(from, 'Desculpe, o usuário já é um administrador.', id)
            if (mentionedJidList[0] === botNumber) return await aruga.reply(from, 'Desculpe, o formato da mensagem está errado.\nNão é possível promover sua própria conta de bot', id)
            await aruga.promoteParticipant(groupId, mentionedJidList[0])
            await aruga.sendTextWithMentions(from, `Não é mais membro comun😎 @${mentionedJidList[0].replace('@c.us', '')} e admin.`)
            break
		case 'promotecr':
            if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (!isOwnerBot) return aruga.reply(from, 'so eu consigo dar esse comando rlx ai KKK', id)
            if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)
            if (mentionedJidList.length !== 1) return aruga.reply(from, 'Desculpe, só pode promover 1 usuário', id)
            if (groupAdmins.includes(mentionedJidList[0])) return await aruga.reply(from, 'Desculpe, o usuário já é um administrador.', id)
            if (mentionedJidList[0] === botNumber) return await aruga.reply(from, 'Desculpe, o formato da mensagem está errado.\nNão é possível promover sua própria conta de bot', id)
            await aruga.promoteParticipant(groupId, mentionedJidList[0])
            await aruga.sendTextWithMentions(from, `Pedido aceito, adicionado @${mentionedJidList[0].replace('@c.us', '')} como admin.`)
            break	
        case 'rebaixar':
            if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (!isGroupAdmins) return aruga.reply(from, 'Falha, este comando só pode ser usado por administradores de grupo!', id)
            if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)
            if (mentionedJidList.length !== 1) return aruga.reply(from, 'Desculpe, apenas 1 usuário pode ser rebaixado', id)
            if (!groupAdmins.includes(mentionedJidList[0])) return await aruga.reply(from, 'Desculpe, o usuário ainda não é um administrador.', id)
            if (mentionedJidList[0] === botNumber) return await aruga.reply(from, 'Desculpe, o formato da mensagem está errado.\nNão é possível demonstrar a conta do bot', id)
            await aruga.demoteParticipant(groupId, mentionedJidList[0])
            await aruga.sendTextWithMentions(from, `agora e membro comum @${mentionedJidList[0].replace('@c.us', '')}.`)
            break
		case 'demotecr':
            if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (!isOwnerBot) return aruga.reply(from, 'so eu consigo dar esse comando rlx ai KKK', id)
            if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)
            if (mentionedJidList.length !== 1) return aruga.reply(from, 'Desculpe, apenas 1 usuário pode ser rebaixado', id)
            if (!groupAdmins.includes(mentionedJidList[0])) return await aruga.reply(from, 'Desculpe, o usuário ainda não é um administrador.', id)
            if (mentionedJidList[0] === botNumber) return await aruga.reply(from, 'Desculpe, o formato da mensagem está errado.\nNão é possível demonstrar a conta do bot', id)
            await aruga.demoteParticipant(groupId, mentionedJidList[0])
            await aruga.sendTextWithMentions(from, `Pedido aceito, remover posição @${mentionedJidList[0].replace('@c.us', '')}.`)
            break	
        case 'sair':
            if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (!isGroupAdmins) return aruga.reply(from, 'Falha, este comando só pode ser usado por administradores de grupo!', id)
            aruga.sendText(from, 'Good bye... ( ⇀‸↼‶ )').then(() => aruga.leaveGroup(groupId))
            break
		case 'byecr':
            if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (!isOwnerBot) return aruga.reply(from, 'so eu consigo dar esse comando rlx ai KKK', id)
            aruga.sendText(from, 'Good bye... ( ⇀‸↼‶ )').then(() => aruga.leaveGroup(groupId))
            break	
        case 'delet':
            if (!isGroupAdmins) return aruga.reply(from, 'Falha, este comando só pode ser usado por administradores de grupo!', id)
            if (!quotedMsg) return aruga.reply(from, `Desculpe, o formato da mensagem está errado, por favor.\nResponda às mensagens do bot com uma legenda ${prefix}delet`, id)
            if (!quotedMsgObj.fromMe) return aruga.reply(from, `Desculpe, o formato da mensagem está errado, por favor.\nResponda às mensagens do bot com uma legenda ${prefix}delet`, id)
            aruga.deleteMessage(quotedMsgObj.chatId, quotedMsgObj.id, false)
            break
		case 'delcr':
            if (!isOwnerBot) return aruga.reply(from, 'so eu consigo dar esse comando rlx ai KKK', id)
            if (!quotedMsg) return aruga.reply(from, `Desculpe, o formato da mensagem está errado, por favor.\nResponda às mensagens do bot com uma legenda ${prefix}delet`, id)
            if (!quotedMsgObj.fromMe) return aruga.reply(from, `Desculpe, o formato da mensagem está errado, por favor.\nResponda às mensagens do bot com uma legenda ${prefix}delet`, id)
            aruga.deleteMessage(quotedMsgObj.chatId, quotedMsgObj.id, false)
            break	
        case 'todos':
            if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if ((isGroupAdmins) && (isOwnerBot)) return aruga.reply(from, 'Falha, este comando só pode ser usado por administradores de grupo!', id)
            const groupMem = await aruga.getGroupMembers(groupId)
            let hehex = '╔══✪〘 Todos os Membros 〙✪══\n'
            for (let i = 0; i < groupMem.length; i++) {
                hehex += '╠➥'
                hehex += ` @${groupMem[i].id.replace(/@c.us/g, '')}\n`
            }
            hehex += '╚═〘 *BOA NOITE BRUNO* 〙'
            await aruga.sendTextWithMentions(from, hehex)
            break 			
		case 'silenciar':
			if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (!isGroupAdmins) return aruga.reply(from, 'Falha, este comando só pode ser usado por administradores de grupo!', id)
            if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)
			if (args.length !== 1) return aruga.reply(from, `Para alterar as configurações do chat em grupo para que apenas o administrador possa bater papo\n\nuse:\n${prefix}silenciar on --ativar\n${prefix}silenciar off --desativar`, id)
            if (args[0] == 'on') {
				aruga.setGroupToAdminsOnly(groupId, true).then(() => aruga.sendText(from, 'Alterado com sucesso para que apenas administradores possam bater papo!'))
			} else if (args[0] == 'off') {
				aruga.setGroupToAdminsOnly(groupId, false).then(() => aruga.sendText(from, 'Alterado com sucesso para que todos os membros possam conversar!'))
			} else {
				aruga.reply(from, `Para alterar as configurações do chat em grupo para que apenas o administrador possa bater papo\n\nuse:\n${prefix}silenciar on --ativar\n${prefix}silenciar off --desativar`, id)
			}
			break
		case 'mutegrupcr':
			if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (!isOwnerBot) return aruga.reply(from, 'Falha, este comando só pode ser usado pelo dono do bot!', id)
            if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)
			if (args.length !== 1) return aruga.reply(from, `Para alterar as configurações do chat em grupo para que apenas o administrador possa bater papo\n\nuse:\n${prefix}mutegrup on --ativar\n${prefix}mutegrup off --desativar`, id)
            if (args[0] == 'on') {
				aruga.setGroupToAdminsOnly(groupId, true).then(() => aruga.sendText(from, 'Alterado com sucesso para que apenas administradores possam bater papo!'))
			} else if (args[0] == 'off') {
				aruga.setGroupToAdminsOnly(groupId, false).then(() => aruga.sendText(from, 'Alterado com sucesso para que todos os membros possam conversar!'))
			} else {
				aruga.reply(from, `Para alterar as configurações do chat em grupo para que apenas o administrador possa bater papo\n\nuse:\n${prefix}mutegrup on --ativar\n${prefix}mutegrup off --desativar`, id)
			}
			break	
		case 'setfoto':
			if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (!isGroupAdmins) return aruga.reply(from, 'Falha, este comando só pode ser usado por administradores de grupo!', id)
            if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)
			if (isMedia && type == 'image' || isQuotedImage) {
				const dataMedia = isQuotedImage ? quotedMsg : message
				const _mimetype = dataMedia.mimetype
				const mediaData = await decryptMedia(dataMedia, uaOverride)
				const imageBase64 = `data:${_mimetype};base64,${mediaData.toString('base64')}`
				await aruga.setGroupIcon(groupId, imageBase64)
			} else if (args.length === 1) {
				if (!isUrl(url)) { await aruga.reply(from, 'Desculpe, o link que você enviou é inválido.', id) }
				aruga.setGroupIconByUrl(groupId, url).then((r) => (!r && r !== undefined)
				? aruga.reply(from, 'Desculpe, o link que você enviou não contém uma imagem.', id)
				: aruga.reply(from, 'Alterou com sucesso o perfil do grupo.', id))
			} else {
				aruga.reply(from, `Estes comandos são usados ​​para mudar o ícone/chat de grupo de perfil\n\n\nuse:\n1. Por favor envie/responda a uma imagem com uma legenda ${prefix}setprofile\n\n2. Por favor digite ${prefix}setprofile linkImage`)
			}
			break
		case 'setprofilecr':
			if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
            if (!isOwnerBot) return aruga.reply(from, 'rlx so eu posso usar KKK', id)
            if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)
			if (isMedia && type == 'image' || isQuotedImage) {
				const dataMedia = isQuotedImage ? quotedMsg : message
				const _mimetype = dataMedia.mimetype
				const mediaData = await decryptMedia(dataMedia, uaOverride)
				const imageBase64 = `data:${_mimetype};base64,${mediaData.toString('base64')}`
				await aruga.setGroupIcon(groupId, imageBase64)
			} else if (args.length === 1) {
				if (!isUrl(url)) { await aruga.reply(from, 'Desculpe, o link que você enviou é inválido.', id) }
				aruga.setGroupIconByUrl(groupId, url).then((r) => (!r && r !== undefined)
				? aruga.reply(from, 'Desculpe, o link que você enviou não contém uma imagem.', id)
				: aruga.reply(from, 'Alterou com sucesso o perfil do grupo.', id))
			} else {
				aruga.reply(from, `Estes comandos são usados ​​para mudar o ícone/chat de grupo de perfil\n\n\nuse:\n1. Por favor envie/responda a uma imagem com uma legenda ${prefix}setprofile\n\n2. Por favor digite ${prefix}setprofile linkImage`)
			}
			break
        //Owner Group
        case 'kickall': 
        if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
		let isOwner = chat.groupMetadata.owner == pengirim
		if (!isOwner) return aruga.reply(from, 'Desculpe, este comando só pode ser usado pelo proprietário do grupo!', id)	
        if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)
            const allMem = await aruga.getGroupMembers(groupId)
            for (let i = 0; i < allMem.length; i++) {
                if (groupAdmins.includes(allMem[i].id)) {
                } else {
                    await aruga.removeParticipant(groupId, allMem[i].id)
                }
            }
            aruga.reply(from, 'sem membros comum aqui🙄😡😡', id)
            break
        case 'kickallcr': 
        if (!isGroupMsg) return aruga.reply(from, 'Desculpe, este comando só pode ser usado dentro do grupo!', id)
        if (!isOwnerBot) return aruga.reply(from, 'AIAIKKK', id)	
        if (!isBotGroupAdmins) return aruga.reply(from, 'Falha, adicione o bot como administrador do grupo!', id)
             const tds = await aruga.getGroupMembers(groupId)
             for (let b = 0; b < tds.length; b++) {
              await aruga.removeParticipant(groupId, tds[b].id)
            } 
            break            	
        //Owner Bot
        case 'ban':
            if (!isOwnerBot) return aruga.reply(from, 'Este pedido é apenas para proprietários do bot!', id)
            if (args.length == 0) return aruga.reply(from, `Para banir alguém de usar comandos\n\nComo digitar: \n${prefix}ban add 559xx --ativar\n${prefix}ban del 628xx --ativar\n\ncomo banir rapidamente muitos tipos de grupos:\n${prefix}ban @tag @tag @tag`, id)
            if (args[0] == 'add') {
                banned.push(args[1]+'@c.us')
                fs.writeFileSync('./settings/banned.json', JSON.stringify(banned))
                aruga.reply(from, 'banido com sucesso!')
            } else
            if (args[0] == 'del') {
                let xnxx = banned.indexOf(args[1]+'@c.us')
                banned.splice(xnxx,1)
                fs.writeFileSync('./settings/banned.json', JSON.stringify(banned))
                aruga.reply(from, 'desbanido com sucesso!')
            } else {
             for (let i = 0; i < mentionedJidList.length; i++) {
                banned.push(mentionedJidList[i])
                fs.writeFileSync('./settings/banned.json', JSON.stringify(banned))
                aruga.reply(from, 'banido com sucesso!', id)
                }
            }
            break
        case 'bss': //untuk broadcast atau promosi
            if (!isOwnerBot) return aruga.reply(from, 'Este pedido é apenas para proprietários do bot!', id)
            if (args.length == 0) return aruga.reply(from, ``)
            let msg = body.slice(5)
            const chatz = await aruga.getAllChatIds()
            for (let idk of chatz) {
                var cvk = await aruga.getChatById(idk)
                if (!cvk.isReadOnly) aruga.sendText(idk, `\n\n${msg}`)
                if (cvk.isReadOnly) aruga.sendText(idk, `\n\n${msg}`)
            }
            aruga.reply(from, 'Broadcast Success!', id)
            break			
        case 'leaveall': //mengeluarkan bot dari semua group serta menghapus chatnya
            if (!isOwnerBot) return aruga.reply(from, 'Este pedido é apenas para proprietários do bot', id)
            const allChatz = await aruga.getAllChatIds()
            const allGroupz = await aruga.getAllGroups()
            for (let gclist of allGroupz) {
                await aruga.sendText(gclist.contact.id, `Desculpe, o bot está limpando, chat total está ativo : ${allChatz.length}`)
                await aruga.leaveGroup(gclist.contact.id)
                await aruga.deleteChat(gclist.contact.id)
            }
            aruga.reply(from, 'Success leave all group!', id)
            break
        case 'cxlearalll': //menghapus seluruh pesan diakun bot
            if (!isOwnerBot) return aruga.reply(from, 'Este pedido é apenas para proprietários do bot', id)
            const allChatx = await aruga.getAllChats()
            for (let dchat of allChatx) {
                await aruga.deleteChat(dchat.id)
            }
            aruga.reply(from, 'Success clear all chat!', id)
            break
        default:
            break
        }
		
		// Simi-simi function
		if ((!isCmd && isGroupMsg && isSimi) && message.type === 'chat') {
			axios.get(`https://arugaz.herokuapp.com/api/simisimi?kata=${encodeURIComponent(message.body)}&apikey=${apiSimi}`)
			.then((res) => {
				if (res.data.status == 403) return aruga.sendText(ownerNumber, `${res.data.result}\n\n${res.data.pesan}`)
				aruga.reply(from, `Simi berkata: ${res.data.result}`, id)
			})
			.catch((err) => {
				aruga.reply(from, `${err}`, id)
			})
		}
		
		// Kata kasar function
		if(!isCmd && isGroupMsg && isNgegas) {
            const find = db.get('group').find({ id: groupId }).value()
            if(find && find.id === groupId){
                const cekuser = db.get('group').filter({id: groupId}).map('members').value()[0]
                const isIn = inArray(pengirim, cekuser)
                if(cekuser && isIn !== false){
                    if(isKasar){
                        const denda = db.get('group').filter({id: groupId}).map('members['+isIn+']').find({ id: pengirim }).update('denda', n => n + 5000).write()
                        if(denda){
                            await aruga.reply(from, "Jangan badword bodoh\nDenda +5.000\nTotal : Rp"+formatin(denda.denda), id)
                        }
                    }
                } else {
                    const cekMember = db.get('group').filter({id: groupId}).map('members').value()[0]
                    if(cekMember.length === 0){
                        if(isKasar){
                            db.get('group').find({ id: groupId }).set('members', [{id: pengirim, denda: 5000}]).write()
                        } else {
                            db.get('group').find({ id: groupId }).set('members', [{id: pengirim, denda: 0}]).write()
                        }
                    } else {
                        const cekuser = db.get('group').filter({id: groupId}).map('members').value()[0]
                        if(isKasar){
                            cekuser.push({id: pengirim, denda: 5000})
                            await aruga.reply(from, "Jangan badword bodoh\nDenda +5.000", id)
                        } else {
                            cekuser.push({id: pengirim, denda: 0})
                        }
                        db.get('group').find({ id: groupId }).set('members', cekuser).write()
                    }
                }
            } else {
                if(isKasar){
                    db.get('group').push({ id: groupId, members: [{id: pengirim, denda: 5000}] }).write()
                    await aruga.reply(from, "Jangan badword bodoh\nDenda +5.000\nTotal : Rp5.000", id)
                } else {
                    db.get('group').push({ id: groupId, members: [{id: pengirim, denda: 0}] }).write()
                }
            }
        }
    } catch (err) {
        console.log(color('[EROR]', 'red'), err)
    }
}