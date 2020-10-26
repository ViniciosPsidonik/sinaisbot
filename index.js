const fs = require('fs')
const axios = require('axios')
const moment = require('moment')
const WebSocket = require('ws')
require('dotenv').config()
const Players = require('./mongo')

const TelegramBot = require('node-telegram-bot-api')
const { parse } = require('path')
const token = process.env.BOT_TOKEN
const bot = new TelegramBot(token, { polling: true })
let schedules = []

let activesStringss = []
let playersMap = new Map()

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

let commandsList = ['/start', '/stop', '/edit']
const invalidValue = "Valor inválido, por favor digite um valor válido.";

bot.on('message', async msg => {
    // console.log(msg);
    if (msg.text) {
        // console.log(msg.from);
        // bot.getChat()
        // bot.sendMessage(msg.chat.id, "Tudo certo, aguarde os sinais...")
        if (msg.chat.type == 'private') {
            if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'getEditOptionValue' && !commandsList.includes(msg.text.toLowerCase())) {
                if (playersMap.get(msg.chat.id).editOptionValue == '1') {
                    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), login: msg.text.toLowerCase().trim() })
                    successValueChanged(msg);
                } else if (playersMap.get(msg.chat.id).editOptionValue == '2') {
                    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), pass: msg.text.toLowerCase().trim() })
                    successValueChanged(msg);
                }
                else if (playersMap.get(msg.chat.id).editOptionValue == '3') {
                    if (isNumeric(msg.text.trim())) {
                        playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), amount: parseFloat(msg.text.toLowerCase().trim()) })
                        successValueChanged(msg);
                    } else {
                        bot.sendMessage(msg.chat.id, invalidValue)
                    }
                }
                else if (playersMap.get(msg.chat.id).editOptionValue == '4') {
                    if (isNumeric(msg.text.trim())) {
                        playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), stopWin: parseFloat(msg.text.toLowerCase().trim()) })
                        successValueChanged(msg);
                    } else {
                        bot.sendMessage(msg.chat.id, invalidValue)
                    }
                }
                else if (playersMap.get(msg.chat.id).editOptionValue == '5') {
                    if (isNumeric(msg.text.trim())) {
                        playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), stopLoss: parseFloat(msg.text.toLowerCase().trim()) })
                        successValueChanged(msg);
                    } else {
                        bot.sendMessage(msg.chat.id, invalidValue)
                    }
                }
                else if (playersMap.get(msg.chat.id).editOptionValue == '6') {
                    if (msg.text.toLowerCase().trim() == '1') {
                        playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), conta: 'real' })
                        successValueChanged(msg);
                    } else if (msg.text.toLowerCase().trim() == '2') {
                        playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), conta: 'demo' })
                        successValueChanged(msg);
                    } else {
                        bot.sendMessage(msg.chat.id, invalidValue)
                    }
                }
                else if (playersMap.get(msg.chat.id).editOptionValue == '7') {
                    if (msg.text.toLowerCase().trim() == '1') {
                        playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), gale: true, actualGale: 0 })
                        successValueChanged(msg);
                    } else if (msg.text.toLowerCase().trim() == '2') {
                        playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), gale: false })
                        successValueChanged(msg);
                    } else {
                        bot.sendMessage(msg.chat.id, invalidValue)
                    }
                }
                else if (playersMap.get(msg.chat.id).editOptionValue == '8') {
                    if (isNumeric(msg.text.trim())) {
                        playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), galeFactor: parseFloat(msg.text.toLowerCase().trim()) })
                        successValueChanged(msg);
                    } else {
                        bot.sendMessage(msg.chat.id, invalidValue)
                    }
                }
                else if (playersMap.get(msg.chat.id).editOptionValue == '9') {
                    if (isNumeric(msg.text.trim())) {
                        playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), galeLevel: parseFloat(msg.text.toLowerCase().trim()) })
                        successValueChanged(msg);
                    } else {
                        bot.sendMessage(msg.chat.id, invalidValue)
                    }
                }

                console.log(playersMap);

            } else if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'editOption' && !commandsList.includes(msg.text.toLowerCase())) {
                playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'getEditOptionValue', editOptionValue: msg.text.toLowerCase().trim() })
                if (msg.text.toLowerCase().trim() == '1') {
                    bot.sendMessage(msg.chat.id, "Por favor informe o seu login da Iq Options.")
                } else if (msg.text.toLowerCase().trim() == '2') {
                    bot.sendMessage(msg.chat.id, "Por favor informe o sua senha da Iq Options.")
                }
                else if (msg.text.toLowerCase().trim() == '3') {
                    bot.sendMessage(msg.chat.id, "Por favor informe o valor da entrada.")
                }
                else if (msg.text.toLowerCase().trim() == '4') {
                    bot.sendMessage(msg.chat.id, "Informe seu stop Win.")
                }
                else if (msg.text.toLowerCase().trim() == '5') {
                    bot.sendMessage(msg.chat.id, "Informe seu stop Loss.")
                }
                else if (msg.text.toLowerCase().trim() == '6') {
                    bot.sendMessage(msg.chat.id, "Informe o tipo da conta: \n 1- Real \n 2- Demo")
                }
                else if (msg.text.toLowerCase().trim() == '7') {
                    bot.sendMessage(msg.chat.id, "Você deseja utilizar MartinGale para o próximo sinal? \n 1- Sim \n 2- Não")
                }
                else if (msg.text.toLowerCase().trim() == '8') {
                    bot.sendMessage(msg.chat.id, "Informe o fator multiplicador do Gale.")
                }
                else if (msg.text.toLowerCase().trim() == '9') {
                    bot.sendMessage(msg.chat.id, "Informe o número de entradas de Gale após a inicial.")
                }
                else if (msg.text.toLowerCase().trim() == '10') {
                    bot.sendMessage(msg.chat.id, "Nenhum dado alterado.")
                    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: playersMap.get(msg.chat.id).actionBeforeEdit, actionBeforeEdit: '', editOptionValue: '' })
                }
                else {
                    bot.sendMessage(msg.chat.id, invalidValue)
                }
                console.log(playersMap);

            } else if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'getGaleLevel' && !commandsList.includes(msg.text.toLowerCase())) {
                if (isNumeric(msg.text.trim())) {
                    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'ok', galeLevel: parseInt(msg.text.trim()) })
                    bot.sendMessage(msg.chat.id, "Tudo certo, aguarde os sinais... para alterar alguma informação, digite /edit.")
                } else {
                    bot.sendMessage(msg.chat.id, invalidValue)
                }
                console.log(playersMap);

            } else if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'getGaleFactor' && !commandsList.includes(msg.text.toLowerCase())) {
                if (isNumeric(msg.text.trim())) {
                    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'getGaleLevel', galeFactor: parseFloat(msg.text.trim()) })
                    bot.sendMessage(msg.chat.id, "Informe o número de entradas de Gale após a inicial.")
                } else {
                    bot.sendMessage(msg.chat.id, invalidValue)
                }
                console.log(playersMap);

            } else if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'getGale' && !commandsList.includes(msg.text.toLowerCase())) {
                if (msg.text.toLowerCase().trim() == '1') {
                    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'getGaleFactor', gale: true, actualGale: 0 })
                    bot.sendMessage(msg.chat.id, "Informe o fator multiplicador do Gale.")
                } else if (msg.text.toLowerCase().trim() == '2') {
                    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'ok', gale: false })
                    bot.sendMessage(msg.chat.id, "Tudo certo, aguarde os sinais... para alterar alguma informação, digite /edit.")
                } else {
                    bot.sendMessage(msg.chat.id, invalidValue)
                }
                console.log(playersMap);

            } else if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'getConta' && !commandsList.includes(msg.text.toLowerCase())) {
                if (msg.text.toLowerCase().trim() == '1') {
                    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'getGale', conta: 'real' })
                    bot.sendMessage(msg.chat.id, "Você deseja utilizar MartinGale para o próximo sinal? \n 1- Sim \n 2- Não")
                } else if (msg.text.toLowerCase().trim() == '2') {
                    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'getGale', conta: 'demo' })
                    bot.sendMessage(msg.chat.id, "Você deseja utilizar MartinGale para o próximo sinal? \n 1- Sim \n 2- Não")
                } else {
                    bot.sendMessage(msg.chat.id, invalidValue)
                }
                console.log(playersMap);

            } else if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'getStopLoss' && !commandsList.includes(msg.text.toLowerCase())) {
                if (isNumeric(msg.text.trim())) {
                    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'getConta', stopLoss: parseFloat(msg.text.trim()) })
                    console.log(playersMap);
                    bot.sendMessage(msg.chat.id, "Informe o tipo da conta: \n 1- Real \n 2- Demo")
                } else {
                    bot.sendMessage(msg.chat.id, invalidValue)
                }
            } else if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'getStopWin' && !commandsList.includes(msg.text.toLowerCase())) {
                if (isNumeric(msg.text.trim())) {
                    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'getStopLoss', stopWin: parseFloat(msg.text.trim()) })
                    console.log(playersMap);
                    bot.sendMessage(msg.chat.id, "Informe seu stop Loss.")
                } else {
                    bot.sendMessage(msg.chat.id, invalidValue)
                }
            } else if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'getAmount' && !commandsList.includes(msg.text.toLowerCase())) {
                if (isNumeric(msg.text.trim())) {
                    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'getStopWin', amount: parseFloat(msg.text.trim()) })
                    console.log(playersMap);
                    bot.sendMessage(msg.chat.id, "Informe seu stop Win.")
                } else {
                    bot.sendMessage(msg.chat.id, invalidValue)
                }
            } else if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'checkCredenciais' && !commandsList.includes(msg.text.toLowerCase())) {
                if (msg.text.toLowerCase() == '1') {
                    saveWS(msg, 'getAmount')
                } else if (msg.text.toLowerCase() == '2') {
                    start(msg)
                }
            } else if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'confirmPass' && !commandsList.includes(msg.text.toLowerCase())) {
                if (msg.text.toLowerCase() == '1') {
                    saveWS(msg, 'getAmount');
                } else if (msg.text.toLowerCase() == '2') {
                    getPasssss(msg);
                }
            } else if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'getPass' && !commandsList.includes(msg.text.toLowerCase())) {
                playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'confirmPass', pass: msg.text.trim() })
                console.log(playersMap);
                bot.sendMessage(msg.chat.id, "Sua senha está correta? -> " + msg.text + '\n 1- Sim \n 2- Não')
            } else if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'confirmLogin' && !commandsList.includes(msg.text.toLowerCase())) {
                if (msg.text.toLowerCase() == '1') {
                    getPasssss(msg);
                } else if (msg.text.toLowerCase() == '2') {
                    start(msg);
                }
            } else if (playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'getLogin' && !commandsList.includes(msg.text.toLowerCase())) {
                playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'confirmLogin', login: msg.text.trim() })
                bot.sendMessage(msg.chat.id, "Seu login está correto? -> " + msg.text + '\n 1- Sim \n 2- Não')
                console.log(playersMap);
            } else if ((msg.text.toLowerCase() == ('/start') && !playersMap.has(msg.chat.id)) || (msg.text.toLowerCase() == ('/start') && !checkPlayerObj(msg.chat.id) && playersMap.get(msg.chat.id).lastAction == 'stop')) {
                start(msg);
            } else if (msg.text.toLowerCase() == ('/start') && playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'stop') {
                bot.sendMessage(msg.chat.id, "Utilizar as mesmas credenciais da IQ? \n 1- Sim \n 2- Não");
                playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'checkCredenciais' })
            } else if (msg.text.toLowerCase() == ('/stop')) {
                bot.sendMessage(msg.chat.id, "Robo paralisado, digite /start para iniciar novamente.");
                console.log(playersMap.get(msg.chat.id));
                playersMap.get(msg.chat.id).ws.terminate()
                playersMap.get(msg.chat.id).ws = null
                playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'stop' })
            } else if (msg.text.toLowerCase() == ('/edit') && playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'ok' || msg.text.toLowerCase() == ('/edit') && playersMap.has(msg.chat.id) && playersMap.get(msg.chat.id).lastAction && playersMap.get(msg.chat.id).lastAction == 'stop') {
                playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), actionBeforeEdit: playersMap.get(msg.chat.id).lastAction, lastAction: 'editOption' })
                bot.sendMessage(msg.chat.id, "Qual das informações deseja alterar?\n" + `1-Login -> ${playersMap.get(msg.chat.id).login} \n2-Senha -> ${playersMap.get(msg.chat.id).pass} \n3-Valor entrada -> ${playersMap.get(msg.chat.id).amount} \n4-StopWin -> ${playersMap.get(msg.chat.id).stopWin} \n5-StopLoss -> ${playersMap.get(msg.chat.id).stopLoss} \n6-Tipo da Conta -> ${playersMap.get(msg.chat.id).conta} \n7-Utilizar Gale -> ${playersMap.get(msg.chat.id).gale ? 'Sim' : 'Não'} \n8-Fator do Gale -> ${playersMap.get(msg.chat.id).galeFactor} \n9-Nível do Gale -> ${playersMap.get(msg.chat.id).galeLevel} \n10-Sair`)
            }
        }

        // playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: '' })

        if (msg.text.toUpperCase().includes('CALL') || msg.text.toUpperCase().includes('PUT')) {
            schedules.push(msg.text)
            console.log(schedules);
        }

        if (msg.text.includes('/sinal')) {
            schedules.push(msg.text)
            console.log(schedules);
        }

    }

});

const checkPlayerObj = id => {
    let map = playersMap.get(id)
    let lastAction = map.lastAction
    let login = map.login
    let pass = map.pass
    let ws = map.ws
    let lastTradeId = map.lastTradeId
    let balanceId = map.balanceId
    let amount = map.lastAction
    let stopWin = map.lastAction
    let stopLoss = map.lastAction
    let conta = map.lastAction

    if (lastAction && login && pass && ws && lastTradeId && balanceId && amount && stopWin && stopLoss && conta) {
        return true
    }

    return false
}

const getDirection = (msg) => {
    if (msg.toUpperCase().includes('CALL')) {
        return 'CALL'
    } else {
        return 'PUT'
    }
}

const getTimeFrame = (msg) => {
    if (msg.includes('M15')) {
        return 15
    } else if (msg.includes('M5')) {
        return 5
    } else {
        return 1
    }
}

const getActiveFor = msg => {

    if (!msg.toLowerCase().includes('otc')) {
        for (var [key, value] of activesMapString) {
            if (msg.toUpperCase().includes(key)) {
                return value
            }
        }
    } else {
        for (var [key, value] of activesMapStringOtc) {
            if (msg.toUpperCase().includes(key)) {
                return value
            }
        }
    }
}

bot.on("polling_error", (e) => {
    console.log('aquiiii');
    console.log(e)
});

const verifyObj = (array, obj) => {
    for (let index = 0; index < array.length; index++) {
        const element = array[index];
        if (element.time && element.time == obj.time && element.active && element.active == obj.active)
            return true
    }
    return false
}

//55099058
const url = 'wss://iqoption.com/echo/websocket'

let payoutMap = new Map()
let buysCount = new Map()
let buyUsersIds = []

const onOpen = () => {
    if (log)
        console.log(`Connected with websocket..`)
}

const onError = error => {
    console.log(`WebSocket error: ${error}`)
}

const messageHeader = (body, name, req = "") => {
    return { 'name': name, 'msg': body, "request_id": req }
}

const subscribeLiveDeal = (name, active_id, type, expirationTime, subsType) => {
    let data
    if (type == 'digital') {
        data = {
            "name": name,
            "params": {
                "routingFilters": {
                    "instrument_active_id": active_id,
                    "expiration_type": "PT" + expirationTime + "M"
                }
            },
            "version": "2.0"
        }
    } else {
        data = {
            'name': name,
            'params': {
                'routingFilters': {
                    'active_id': active_id,
                    'option_type': type
                }
            },
            'version': '2.0'
        }
    }
    ws.send(JSON.stringify(messageHeader(data, subsType)))
}

const getLeaders = (ws) => {
    let countryId = 0
    if (country)
        countryId = countries.get(country)
    data = {
        "name": "sendMessage",
        "msg": {
            "name": "request-leaderboard-deals-client",
            "version": "1.0",
            "body": {
                "country_id": countryId,
                "user_country_id": 0,
                "from_position": 1,
                "to_position": !!topTradersRange ? topTradersRange : 0,
                "near_traders_country_count": 0,
                "near_traders_count": 0,
                "top_country_count": 0,
                "top_count": 0,
                "top_type": 2
            }
        }, "request_id": ""
    }

    if (log)
        console.log(JSON.stringify(data))
    ws.send(JSON.stringify(data))
}

const buy = (amount, active_id, direction, expired, type, timeFrame) => {
    for (var [key, value] of playersMap) {
        if (value.lastAction == 'ok') {
            let data
            if (typeof type == 'number') {
                data = {
                    "name": "sendMessage",
                    "msg": {
                        "body":
                        {
                            "price": parseFloat(value.amount),
                            "active_id": active_id,
                            "expired": expired,
                            "direction": direction,
                            "option_type_id": type,//turbo 1 binary
                            "user_balance_id": value.balanceId
                        }
                        , "name": "binary-options.open-option", "version": "1.0"
                    },
                    "request_id": key.toString()
                }
            } else {
                let expirationAt = moment.unix(expired).utcOffset(0).format("YYYYMMDDHHmm")//YYYYMMDDhhmm
                const activeString = getActiveString(active_id, activesMapString)
                const instrumentId = 'do' + activeString + expirationAt + type + direction.toUpperCase().substring(0, 1) + 'SPT'

                data = {
                    "name": "sendMessage",
                    "msg": {
                        "name": "digital-options.place-digital-option",
                        "version": "1.0",
                        "body": {
                            "user_balance_id": value.balanceId,
                            "instrument_id": instrumentId,
                            "amount": value.amount.toString()
                        }
                    }, "request_id": key.toString()
                }
            }
            console.log(`M${timeFrame} / ${direction.toUpperCase()} / ${getActiveString(active_id, activesMapString)} / ${value.amount} / ${currentTimemmssDate}`);

            bot.sendMessage(key, `[ ENTRADA -> M${timeFrame} / ${direction.toUpperCase()} / ${getActiveString(active_id, activesMapString)} / VALOR: ${value.amount} ]`)

            console.log(JSON.stringify(data))
            value.ws.send(JSON.stringify(data))
        }
    }
}

setInterval(() => {
    // await subs('live-deal-binary-option-placed' , 'unsubscribeMessage')
    // console.log('unsubscribeMessage');
    if (!soros && !gale) {
        runningActives = []
        runningActivesBinary = []
        runningActivesDigital = []
        runningActivesDigitalFive = []
        // auth()
        if (soros)
            positionOpenedSoros = false
        if (gale)
            positionOpenedGale = false
    }
}, 300000);

const getActiveString = (active, map) => {
    for (var [key, value] of map) {
        if (value == active) {
            return key
        }
    }
}

let cleanned = false

const b = async () => {
    if (!!topTradersRange || copyIds.length > 0) {

        let fsConfig = fs.readFileSync('config.json')
        let config = JSON.parse(fsConfig)
        copyIds = !isNaN(config.copyIds.split(',')[0]) && !isNaN(config.copyIds.split(',')[1]) ? config.copyIds.split(',') : []


        if (log)
            console.log('cleaning...')
        cleanned = true

        leadersArray = []
        getLeadersBool = false
    }
}

setInterval(() => {
    b()
}, 240000)//60000

let currentTime
let currentTimemmssDate
let currentTimemmss
let currentTimemmsssss
let buysss = []

const onMessage = e => {
    // if (ws && ws.readyState === WebSocket.OPEN) {
    const message = JSON.parse(e.data)

    if (logg && message.name != 'instrument-quotes-generated' && message.name != 'api_option_init_all_result')
        console.log('RES = ' + e.data)

    if (sessionBalance >= StopWin) {
        console.log('Stop Win Alcançado...')
        ws.terminate()
        schedules = []
        ws = null
        sessionBalance = 0
        stopp = true
    }

    if (buyUsersIds.includes(message.request_id)) {
        if (log)
            console.log('RED = ' + e.data)
        const index = buyUsersIds.indexOf(message.request_id);
        if (index > -1) {
            buyUsersIds.splice(index, 1);
        }
    }

    if (playersMap.has(parseInt(message.request_id))) {
        console.log('RES = ' + e.data)
        let lastTradeId = playersMap.get(parseInt(message.request_id)).lastTradeId
        lastTradeId.push(message.msg.id)
        playersMap.set(parseInt(message.request_id), { ...playersMap.get(parseInt(message.request_id)), lastTradeId })
    }

    if (sessionBalance <= StopLoss * -1) {
        console.log('Stop Loss Alcançado...')
        ws.terminate()
        schedules = []
        // ws = null
        sessionBalance = 0
        stopp = true
    }

    if (message.name == 'profile' && message.msg) {
        profileStuf(message, 'live-deal-binary-option-placed', message.request_id)
    }

    if (message.name == 'option' && message.status != 0) {
        const active = message.request_id.split('/')[0]
        buysCount.set(parseInt(active), buysCount.get(parseInt(active)) - 1)
        console.log(`Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`)
        console.log('RES = ' + e.data)
        if (soros)
            positionOpenedSoros = false
        if (gale)
            positionOpenedGale = false
    }

    if (message.name == 'digital-option-placed' && message.status != 2000) {
        const active = message.request_id.split('/')[0]
        buysCount.set(parseInt(active), buysCount.get(parseInt(active)) - 1)
        console.log(`Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`)
        console.log('RES = ' + e.data)
        if (soros)
            positionOpenedSoros = false
        if (gale)
            positionOpenedGale = false
    }

    for (var [key, value] of playersMap) {

        if (value.sessionBalance && Math.abs(value.sessionBalance) >= value.stopWin && value.lastAction != 'stop') {
            bot.sendMessage(key, "Stop Win alcançado, parando bot...")
            playersMap.get(key).ws.terminate()
            playersMap.get(key).ws = null
            playersMap.set(key, { ...playersMap.get(key), lastAction: 'stop' })
        } else if (value.sessionBalance && Math.abs(value.sessionBalance) >= value.stopLoss && value.lastAction != 'stop') {
            bot.sendMessage(key, "Stop Loss alcançado, parando bot...")
            playersMap.get(key).ws.terminate()
            playersMap.get(key).ws = null
            playersMap.set(key, { ...playersMap.get(key), lastAction: 'stop' })
        }
    }

    if (message.name == 'option-closed') {
        optionClosed(message)
    }

    if (message.name == 'position-changed') {
        positionChangedStuff(message)
    }

    if (message.name == "live-deal-binary-option-placed") {
        if (message.msg.option_type == 'turbo') {
            if (!runningActives.includes(message.msg.active_id))
                runningActives.push(message.msg.active_id)
        } else {
            if (!runningActivesBinary.includes(message.msg.active_id))
                runningActivesBinary.push(message.msg.active_id)
        }
    }

    if (message.name == "live-deal-digital-option") {
        if (message.msg.expiration_type == 'PT1M') {
            if (!runningActivesDigital.includes(message.msg.instrument_active_id))
                runningActivesDigital.push(message.msg.instrument_active_id)
        } else {
            if (!runningActivesDigitalFive.includes(message.msg.instrument_active_id))
                runningActivesDigitalFive.push(message.msg.instrument_active_id)
        }
    }

    if (message.name == 'heartbeat') {
        currentTime = message.msg
        currentTimemmss = moment.unix(currentTime / 1000).utcOffset(-3).add(1, 's').format("HH:mm")
        currentTimemmssDate = moment.unix(currentTime / 1000).utcOffset(-3).add(1, 's').format("YYYY-MM-DD HH:mm:ss")
        if (log)
            console.log(currentTimemmssDate)

    }
    if (schedules.length > 0)
        for (let index = 0; index < schedules.length; index++) {
            let element = schedules[index]
            if (element) {
                let hourmm
                let timeFrame = getTimeFrame(element)

                if (element.includes(':')) {
                    hourmm = element.substring(element.length - 5, element.length)
                } else {
                    if (timeFrame != 1) {
                        let timeInt = parseInt(currentTimemmss.substring(currentTimemmss.length - 2, currentTimemmss.length))
                        let resto = timeInt % timeFrame
                        if (resto != 0) {
                            timeFrame = timeFrame - resto
                        }
                    }
                    hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(1, 's').add(timeFrame, 'm').format(" HH:mm")
                    schedules[index] = element + hourmm
                }

                // console.log(schedules[index]);

                if (currentTimemmss && currentTimemmss.includes(hourmm.trim())) {
                    const active = getActiveFor(element)
                    const direction = getDirection(element).toLowerCase()
                    // const moment5 = moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).add(timeFrame, 'm').add(3, 'h').format('X')
                    const moment5 = moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).add(timeFrame, 'm').format('X')

                    if (timeFrame && active && direction && moment5) {
                        // let turboPayout
                        // let digitalPayout
                        // if (payoutMap.has('turbo')) {
                        //     if (payoutMap.get('turbo').has(active)) {
                        //         turboPayout = payoutMap.get('turbo').get(active)
                        //     }
                        // }
                        // if (payoutMap.has('digital')) {
                        //     if (payoutMap.get('digital').has(active)) {
                        //         digitalPayout = payoutMap.get('digital').get(active)
                        //     }
                        // }

                        // if (digitalPayout && turboPayout && digitalPayout > turboPayout) {
                        //     buy(amount, active, direction, parseInt(moment5), timeFrame == 1 ? "PT1M" : "PT5M")
                        // } else if (digitalPayout && turboPayout && digitalPayout <= turboPayout) {
                        buy(amount, active, direction, parseInt(moment5), 3, timeFrame)
                        // } else if (turboPayout) {
                        //     buy(amount, active, direction, parseInt(moment5), 3)
                        // } else if (digitalPayout) {
                        //     buy(amount, active, direction, parseInt(moment5), timeFrame == 1 ? "PT1M" : "PT5M")
                        // } else {
                        //     buy(amount, active, direction, parseInt(moment5), 3)
                        // }

                        // console.log(moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).add(timeFrame, 'm').format('HH:mm:ss'));
                        // console.log(moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).add(timeFrame * 2, 'm').format('HH:mm:ss'));
                        // console.log(moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).add(timeFrame * 3, 'm').format('HH:mm:ss'));


                    }
                    schedules.splice(index, 1);
                    index--
                }
            }
        }
    // }
}



setInterval(() => {
    // axios.get('https://checkpayout.herokuapp.com/opened').then(res => {
    //     openedMap = res.data.openedMap
    // })
    getCandle()
}, 5000);


function successValueChanged(msg) {
    bot.sendMessage(msg.chat.id, "Valor alterado com sucesso.");
    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: playersMap.get(msg.chat.id).actionBeforeEdit, actionBeforeEdit: '', editOptionValue: '' })
}

function getPasssss(msg) {
    playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: 'getPass' });
    console.log(playersMap);
    bot.sendMessage(msg.chat.id, "Por favor informe o sua senha da Iq Options:");
}

function start(msg) {
    bot.sendMessage(msg.chat.id, "Por favor informe o seu login da Iq Options.");
    playersMap.set(msg.chat.id, { lastAction: 'getLogin' });
}

function saveWS(msg, state) {
    let ws = auth(playersMap.get(msg.chat.id).login, playersMap.get(msg.chat.id).pass, msg.chat.id.toString());

    const getws = setInterval(() => {
        if (ws != undefined) {
            playersMap.set(msg.chat.id, { ...playersMap.get(msg.chat.id), lastAction: state, ws, lastTradeId: new Array() });
            console.log(playersMap);
            bot.sendMessage(msg.chat.id, "Por favor informe o valor da entrada.");
            clearInterval(getws);
        }
    }, 1000);
}

function getCandle() {
    for (let index = 0; index < activesStringss.length; index++) {
        const element = activesStringss[index];
        let data = {
            "name": "get-candles",
            "version": "2.0",
            "body": {
                "active_id": activesMapString.get(element.active),
                "size": parseInt(element.time.substring(1, 2)) * 60,
                "to": currentTime,
                "count": 20,
            }
        };
        ws.send(JSON.stringify(messageHeader(data, 'sendMessage', element.active + '/' + element.time)));
    }
}

function optionClosed(message) {
    for (var [key, value] of playersMap) {
        if (value.lastTradeId.includes(message.msg.option_id)) {
            let active = message.msg.active_id

            let profitAmount = message.msg.profit_amount - value.amount
            let sessionBalance = value.sessionBalance
            
            if (typeof sessionBalance != 'undefined') {
                sessionBalance = parseFloat(sessionBalance)
                sessionBalance += parseFloat(profitAmount)
            } else {
                sessionBalance = parseFloat(profitAmount)
            }

            bot.sendMessage(key, `=== ${profitAmount < 0 ? "❌ Loss" : "✅ Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance)} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} ===`)

            console.log(`=== ${profitAmount < 0 ? "❌ Loss" : "✅ Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance)} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario / ${currentTimemmssDate} ===`)

            console.log(profitAmount);
            console.log(value.gale);
            console.log(value.actualGale);
            console.log(value.galeLevel);
            console.log(sessionBalance);
            console.log(profitAmount < 0 && value.gale && value.actualGale <= value.galeLevel);

            let amountInitial = !value.amountInitial ? value.amount : value.amountInitial

            if (profitAmount < 0 && value.gale && value.actualGale < value.galeLevel) {
                playersMap.set(key, {
                    ...value,
                    amountInitial,
                    amount: value.amount * value.galeFactor,
                    actualGale: value.actualGale + 1,
                    sessionBalance: parseFloat(sessionBalance)
                })

            } else if (profitAmount < 0 && value.gale) {
                playersMap.set(key, {
                    ...value,
                    amount: value.amountInitial,
                    actualGale: 0,
                    sessionBalance: parseFloat(sessionBalance)
                })
            }
            console.log(playersMap);
        }
    }
}

function positionChangedStuff(message) {
    if (message.msg.status == 'closed') {
        let active = message.msg.active_id

        for (let index = 0; index < buysss.length; index++) {
            const element = buysss[index];
            if (element.id == `${active}/${message.msg.raw_event.instrument_expiration / 1000}` && (!element.galeLevel || element.galeLevel < element.gale)) {
                let profitAmount = message.msg.close_profit ? message.msg.close_profit - element.amount : element.amount * -1
                sessionBalance += profitAmount

                if (profitAmount < 0) {
                    stopp = true
                    if (profitAmount < 0)
                        console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / DIGITAL / ${currentTimemmssDate}`)
                    else
                        console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / DIGITAL / ${currentTimemmssDate}`)

                } else {
                    amount = message.msg.close_profit
                    winsCount++
                    buysss.splice(index, 1);
                    index--
                    if (profitAmount < 0)
                        console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / DIGITAL / ${currentTimemmssDate}`)
                    else
                        console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / DIGITAL / ${currentTimemmssDate}`)
                    if (winsCount >= 2) {
                        stopp = true
                    }

                }
                break
            } else if (element.id == `${active}/${message.msg.raw_event.instrument_expiration / 1000}`) {
                let profitAmount = message.msg.close_profit ? message.msg.close_profit - element.amount : element.amount * -1
                sessionBalance += profitAmount
                buysss.splice(index, 1);
                index--
                if (profitAmount < 0)
                    console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario / ${currentTimemmssDate}`)
                else
                    console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario / ${currentTimemmssDate}`)
            }
        }
    }
}

function profileStuf(message, name, req) {
    const balances = message.msg.balances
    for (let index = 0; index < balances.length; index++) {
        const element = balances[index]
        if (config.conta == 'demo') {
            if (element.type == 4) {
                message.msg.balance_id = element.id
            }
        }
        else if (config.conta == 'real') {
            if (element.type == 1) {
                message.msg.balance_id = element.id
            }
        }
    }
    playersMap.set(parseInt(req), { ...playersMap.get(parseInt(req)), balanceId: message.msg.balance_id })

    // subscribePortifolio()

    // if (!getLeadersBool) {
    //     getLeadersBool = true
    //     getLeaders(ws)
    // }

    // subs(name, 'subscribeMessage')

}

function subs(name, subsType) {
    if (binarias) {
        if (payout)
            ws.send(JSON.stringify({ "name": "api_option_init_all", "msg": "", "request_id": "" }))
        for (let i = 0; i < otcActives.length; i++) {
            subscribeLiveDeal(name, otcActives[i], 'turbo', null, subsType)
        }

        if (binariasTimes.includes("M5+"))
            for (let i = 0; i < otcActives.length; i++) {
                subscribeLiveDeal(name, otcActives[i], 'binary', null, subsType)
            }
    }
    if (digital) {
        name = 'live-deal-digital-option'
        if (digitalTimes.includes("M1"))
            for (let i = 0; i < otcActivesDigital.length; i++) {
                subscribeLiveDeal(name, otcActivesDigital[i], 'digital', '1', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 60, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }
        if (digitalTimes.includes("M5"))
            for (let i = 0; i < otcActivesDigital.length; i++) {
                subscribeLiveDeal(name, otcActivesDigital[i], 'digital', '5', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 300, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }

        if (digitalTimes.includes("M15"))
            for (let i = 0; i < otcActivesDigital.length; i++) {
                subscribeLiveDeal(name, otcActivesDigital[i], 'digital', '15', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 900, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }
    }

    if (binarias) {
        name = 'live-deal-binary-option-placed'
        for (let i = 0; i < activesMap.length; i++) {
            subscribeLiveDeal(name, activesMap[i], 'turbo', null, subsType)
        }
        if (binariasTimes.includes("M5+"))
            for (let i = 0; i < activesMap.length; i++) {
                subscribeLiveDeal(name, activesMap[i], 'binary', null, subsType)
            }
    }
    if (digital) {
        name = 'live-deal-digital-option'
        if (digitalTimes.includes("M1"))
            for (let i = 0; i < activesMapDigital.length; i++) {
                subscribeLiveDeal(name, activesMapDigital[i], 'digital', '1', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 60, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }

        if (digitalTimes.includes("M5"))
            for (let i = 0; i < activesMapDigital.length; i++) {
                subscribeLiveDeal(name, activesMapDigital[i], 'digital', '5', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 300, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }

        if (digitalTimes.includes("M15"))
            for (let i = 0; i < activesMapDigital.length; i++) {
                subscribeLiveDeal(name, activesMapDigital[i], 'digital', '15', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 900, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }
    }
}

function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return {
        minutes,
        seconds: parseInt((seconds < 10 ? '0' : '') + seconds)
    }
}



const activesMap = [108, 7, 943, 101, 7, 943, 101, 944, 99, 107, 2, 4, 1, 104, 102, 103, 3, 947, 5, 8, 100, 72, 6, 168, 105, 212, 945]
const activesMapDigital = [7, 943, 7, 943, 101, 944, 99, 107, 2, 4, 1, 104, 102, 103, 3, 947, 5, 8, 100, 72, 6, 168, 105, 945]
const otcActives = [76, 77, 78, 79, 80, 81, 84, 85, 86]
const otcActivesDigital = [76, 77, 78, 79, 80, 81, 84, 85, 86]
const payoutActives = [108, 7, 943, 101, 7, 943, 101, 944, 99, 107, 2, 4, 1, 104, 102, 103, 3, 947, 5, 8, 100, 72, 6, 168, 105, 212, 76, 77, 78, 79, 80, 81, 84, 85, 86]

const activesMapStringOtc = new Map([
    ['EURUSD-OTC', 76],
    ['EURGBP-OTC', 77],
    ['USDCHF-OTC', 78],
    ['EURJPY-OTC', 79],
    ['NZDUSD-OTC', 80],
    ['GBPUSD-OTC', 81],
    ['GBPJPY-OTC', 84],
    ['USDJPY-OTC', 85],
    ['AUDCAD-OTC', 86]
])

const activesMapString = new Map([
    ['AUDCAD', 7],
    ['EURAUD', 108],
    ['EURCAD', 105],
    ['EURNZD', 212],
    ['AUDCHF', 943],
    ['AUDJPY', 101],
    ['AUDNZD', 944],
    ['AUDUSD', 99],
    ['CADCHF', 107],
    ['EURGBP', 2],
    ['EURJPY', 4],
    ['EURUSD', 1],
    ['GBPAUD', 104],
    ['CADJPY', 945],
    ['GBPCAD', 102],
    ['GBPCHF', 103],
    ['GBPJPY', 3],
    ['GBPNZD', 947],
    ['GBPUSD', 5],
    ['NZDUSD', 8],
    ['USDCAD', 100],
    ['USDCHF', 72],
    ['USDJPY', 6],
    ['USDNOK', 168],
    ['EURUSD-OTC', 76],
    ['EURGBP-OTC', 77],
    ['USDCHF-OTC', 78],
    ['EURJPY-OTC', 79],
    ['NZDUSD-OTC', 80],
    ['GBPUSD-OTC', 81],
    ['GBPJPY-OTC', 84],
    ['USDJPY-OTC', 85],
    ['AUDCAD-OTC', 86]
])
const activesDigitalMapString = new Map([
    ['AUDCAD', 7],
    ['AUDCHF', 943],
    ['AUDJPY', 101],
    ['AUDNZD', 944],
    ['AUDUSD', 99],
    ['CADCHF', 107],
    ['EURGBP', 2],
    ['EURJPY', 4],
    ['EURUSD', 1],
    ['EURCAD', 105],
    ['CADJPY', 945],
    ['GBPAUD', 104],
    ['GBPCAD', 102],
    ['GBPJPY', 3],
    ['GBPNZD', 947],
    ['GBPUSD', 5],
    ['NZDUSD', 8],
    ['USDCAD', 100],
    ['USDJPY', 6],
    ['USDNOK', 168],
    ['USDCHF', 72],
    ['EURUSD-OTC', 76],
    ['EURGBP-OTC', 77],
    ['USDCHF-OTC', 78],
    ['EURJPY-OTC', 79],
    ['NZDUSD-OTC', 80],
    ['GBPUSD-OTC', 81],
    ['GBPJPY-OTC', 84],
    ['USDJPY-OTC', 85],
    ['AUDCAD-OTC', 86]
])


const loginAsync = async (ssid, ws, chatId) => {
    await doLogin(ssid, ws, chatId)
}
let logged
const doLogin = (ssid, ws, chatId) => {
    return new Promise((resolve, reject) => {
        if (ws.readyState === WebSocket.OPEN) {
            console.log(JSON.stringify({ 'name': 'ssid', 'msg': ssid, "request_id": chatId }))
            ws.send(JSON.stringify({ 'name': 'ssid', 'msg': ssid, "request_id": chatId }))
            logged = true
            resolve()
        } else {
            ws.terminate()
            ws = new WebSocket(urlIq)
            ws.onopen = onOpen
            ws.onerror = onError
            ws.onmessage = onMessage
            resolve()
        }
    })
}

const auth = (login, password, chatId) => {
    let ws = new WebSocket(url)
    ws.onopen = onOpen
    ws.onerror = onError
    ws.onmessage = onMessage
    axios.post('https://auth.iqoption.com/api/v2/login', {
        identifier: login,
        password: password
    }).then((response) => {
        ssid = response.data.ssid
        const loginn = setInterval(() => {
            if (logged) {
                clearInterval(loginn)
            }
            loginAsync(ssid, ws, chatId)
        }, 500);


    }).catch(function (err) {
        console.log('Erro ao se conectar... Tente novamente')
    })
    return ws
}

const getPayout = (type) => {
    return new Promise((resolve, reject) => {
        axios.get(`https://checkpayout1.herokuapp.com/payout/${type}`).then((res) => {
            return resolve(res.data)
        }).catch((err) => {
            return resolve(0)
        })
    })
}

const intervalGetPayout = async () => {
    let activesPayout = new Map()
    let turbo = await getPayout('turbo')

    if (turbo)
        for (let i = 0; i < turbo.length; i++) {
            if (i % 2 == 0) {
                activesPayout.set(turbo[i], turbo[i + 1])
            }
        }
    payoutMap.set('turbo', activesPayout)
    activesPayout = new Map()

    let binary = await getPayout('binary')
    if (binary)
        for (let i = 0; i < binary.length; i++) {
            if (i % 2 == 0) {
                activesPayout.set(binary[i], binary[i + 1])
            }
        }
    payoutMap.set('binary', activesPayout)
    activesPayout = new Map()

    let digital = await getPayout('digital')
    if (digital)
        for (let i = 0; i < digital.length; i++) {
            if (i % 2 == 0) {
                activesPayout.set(digital[i], digital[i + 1])
            }
        }
    payoutMap.set('digital', activesPayout)
}

intervalGetPayout()

// axios.post('https://auth.iqoption.com/api/v2/login', {
//     identifier: config.login,
//     password: config.password
// }).then((response) => {
//     ssid = response.data.ssid
//     console.log(ssid);
//     loginAsync(ssid)
// }).catch(function (err) {
//     if (err)
//         console.log('Erro ao se conectar... Tente novamente')
// })

function subscribePortifolio() {
    let data = { "name": "portfolio.position-changed", "version": "2.0", "params": { "routingFilters": { "instrument_type": "digital-option", "user_balance_id": userBalanceId } } }

    ws.send(JSON.stringify(messageHeader(data, 'subscribeMessage')))
}