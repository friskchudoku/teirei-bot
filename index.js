var request = require('request');
var headers = {
    'Content-Type': 'application/json'
}
const Botkit = require('botkit');

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

const controller = Botkit.slackbot({
    json_file_store: 'storage_bot_db'
});

controller.spawn({
    token: process.env.token
}).startRTM(function (err) {
    if (err) {
        throw new Error(err);
    }
});
//発言を行いその情報を返す
function myfunc1(str) {
    var ts = null;
}
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
                text: '@here 本日（' + time + '）の朝会スレッドはこちら',
                channel: message.channel
            }, function (err, res) {
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
            }, function (err) {
                //データ取得
                controller.storage.channels.delete(message.channel, function (err) {
                    if (err) {
                        bot.say({
                            text: 'このデータストアがやばい！2017',
                            channel: message.channel
                        });
                    }
                });
            });
        }
    });
});
/**
 * スレッドからデータを引っ張ってくるサンプル
controller.hears('-o', 'direct_mention', function (bot, message) {
    if (start) {
        end = new Date();
        //bot.reply(message,asakaiEndMsg1 + (endTime - startTime) + asakaiEndMsg2); 
        //このタイミングでスレッドの取得を行いたい
        //つまりAPIを叩くということだと思うのだが...?
        bot.api.channels.replies({
            token: process.env.token,
            channel: start.channel,
            thread_ts: start.ts
        }, function (err, res) {
            var arr = res.messages;
            arr.forEach(function (element) {
                console.log(element.text);
            });
        });


        bot.say({
            text: asakaiEndMsg1 + (end - start.time) + asakaiEndMsg2,
            channel: message.channel
        });
        start = null;
    } else {
        bot.say({
            text: "朝会始まってなくね？",
            channel: message.channel
        });
    }
});
 */