const { create, Client } = require('@open-wa/wa-automate')
const figlet = require('figlet')
const options = require('./utils/options')
const { color, messageLog } = require('./utils')
const HandleMsg = require('./HandleMsg')

const start = (aruga = new Client()) => {
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('BOT', { font: 'Ghost', horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color('[DEV]'), color('ArugaZ', 'yellow'))
    console.log(color('[~>>]'), color('BOT Started!', 'green'))

    // Mempertahankan sesi agar tetap nyala
    aruga.onStateChanged((state) => {
        console.log(color('[~>>]', 'red'), state)
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') aruga.forceRefocus()
    })


	        aruga.onGlobalParicipantsChanged((async (heuh) => {
            await welcome(aruga, heuh)
            //left(aruga, heuh)
            }))
         aruga.onAddedToGroup(((chat) => {
            let totalMem = chat.groupMetadata.participants.length
            if (totalMem < 30) { 
            	 aruga.sendText(chat.id, `Tchau os únicos membros ${totalMem}, Se você quiser convidar o bot, o número mínimo de membros é 30`).then(() =>  aruga.leaveGroup(chat.id)).then(() =>  aruga.deleteChat(chat.id))
            } else {
                 aruga.sendText(chat.groupMetadata.id, `Olá membros do grupo *${chat.contact.name}* obrigado por convidar este bot, para ver meus comandos use *!help*`)
            }
        }))

        aruga.onIncomingCall(( async (call) => {
            await aruga.sendText(call.peerJid, 'Não consigo receber chamadas. me ligar = block!')
            .then(() => aruga.contactBlock(call.peerJid))
        }))

     // ketika seseorang mengirim pesan
     aruga.onMessage(async (message) => {
        aruga.getAmountOfLoadedMessages() // menghapus pesan cache jika sudah 3000 pesan.
            .then((msg) => {
                if (msg >= 30000) {
                    console.log('[aruga]', color(`Alcance da mensagem carregada ${msg}, cortando cache de mensagem...`, 'yellow'))
                    aruga.cutMsgCache()
                }
            })
        HandleMsg(aruga, message)    
    
    })
	
    // Message log for analytic
    aruga.onAnyMessage((anal) => { 
        messageLog(anal.fromMe, anal.type)
    })
}

//create session
create(options(true, start))
    .then((aruga) => start(aruga))
    .catch((err) => new Error(err))
