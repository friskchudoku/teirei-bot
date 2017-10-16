
//リクエストを叩くための設定（だったような）
var request = require('request');
var headers = {
    'Content-Type': 'application/json'
}

const Botkit = require('botkit');

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}
//データを保存するファイルの指定
const controller = Botkit.slackbot({
    json_file_store: 'storage_bot_db'
});
//起動時の設定（だろう）　いじらなくていい所
controller.spawn({
    token: process.env.token
}).startRTM(function (err) {
    if (err) {
        throw new Error(err);
    }
});


//あとでモジュール化する関数
/**
 * @classdesc スレッドデータを取得する。Promise
 * @param {obj} channel_data データストアに保存してある朝会の情報 {id,ts,time}
 * @param {obj} bot　bot機能のインスタンス？よくわからん 
 * @return  messages 
 * 
 */
function getThread(channel_data, bot) {
    return new Promise(function (resolve, reject) {
        bot.api.channels.replies({
            token: process.env.token,
            channel: channel_data.id,
            thread_ts: channel_data.ts
        }, function (err, res) {
            if (err) {
                reject(err);
                return;
            }
            resolve(res.messages);
        });
    });
}


//asakai start 書き直し
controller.hears(['朝会始め', '--start'], 'direct_mention', function (bot, message) {
    controller.storage.channels.get(message.channel, function (err, channel_data) {
        if (channel_data) {
            bot.say({
                text: "朝会はすでに始まっています",
                channel: message.channel
            });
        } else {
            let time = new Date();
            bot.say({
                text: '<@here> 本日（' + time + '）の朝会スレッドはこちら',
                channel: message.channel
            }, function (err, res) {
                bot.api.pins.add({
                    channel:res.channel,
                    timestamp:res.ts
                });
                controller.storage.channels.save({
                    id: message.channel, time: time, ts: res.ts
                }, function (err) {
                    if (err) {
                        bot.say({
                            text: "データストアの利用に失敗",
                            channel: message.channel
                        });
                    }
                });
            });
        }
    });
});
//asakai end 書き直し
controller.hears(['朝会終わり', '--end'], 'direct_mention', function (bot, message) {
    //チャンネルID.jsonに保存しているデータを取り出す
    controller.storage.channels.get(message.channel, function (err, channel_data) {
        if (!channel_data) {
            bot.say({
                text: '朝会はまだ始まっていません',
                channel: message.channel
            });
        } else {
            bot.say({
                text: '朝会を終了しました。本日の朝会時間：' + (new Date() - new Date(channel_data.time)) + 'ms',
                channel: message.channel
            });
            //データ取得
            var thread = getThread(channel_data, bot)
            .then(function (messages) {
                if (messages[0].reply_count) {
                    var threadMessage = '';
                    messages.forEach(function (element) {
                        console.log(JSON.stringify(element));
                        threadMessage = threadMessage + element.text + '¥n';
                        /*
                        threadMessage.push({
                            text: element.text,
                            user: element.user
                        });
                        */
                    });
                    return threadMessage;
                } else {
                    bot.say({
                        text: "スレッドに対するリプライはありません",
                        channel: message.channel
                    });
                    return;
                }
            }).then(function(thread_message){
                bot.say({
                    text: thread_message,
                    channel:message.channel
                });
            })
            .catch(function (err) {
                console.log(err);
            });
            
            controller.storage.channels.delete(message.channel, function (err) {
                if (err) {
                    bot.say({
                        text: 'このデータストアがやばい！2017',
                        channel: message.channel
                    });
                }
            });
            
        }
    });
});

/**
 * 情報確認用テスト
 */
controller.hears('-t', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    console.log(
        bot.say({
            text: JSON.stringify(message),
            channel: message.channel
        }));
});
//データストアのテスト
controller.hears('savetest', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    testuser = {
        id: message.user,
        user: message.user,
        name: 'friskman'
    };
    //saveする際、第一引数の項目：IDを参照してそのファイル名でjsonファイルをつくっている模様
    //ユーザごと、チャンネルごと、チームごとの設定も同じように行うことができる　と思う
    //user => idとして使うのはいいけどややこしいし個人的にはidフィールドとnameフィールドを個別に設けたい

    controller.storage.users.save(testuser, function (err, id) {
        bot.say({
            text: "データを保存しました。" + JSON.stringify(testuser),
            channel: message.channel
        });
    });
});
//データストアからデータを取り出すテスト
controller.hears('gettest', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    //引数１のユーザIDに該当するデータを引っ張ってくる
    controller.storage.users.get(message.user, function (err, user) {
        console.log(JSON.stringify(user) + " : " + JSON.stringify(err));
        bot.say({
            text: 'a',//JSON.stringify(user),
            channel: message.channel
        });
    });
});
