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
//あとでモジュール化する関数
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
            });
            //データ取得
            var thread = getThread(channel_data, bot)
                .then(function (messages) {
                    if (messages[0].reply_count) {
                        var threadMessage = '';
                        messages.forEach(function (element) {
                            threadMessage.concat(element.text).concat('¥r¥n');
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
                })
                .catch(function (err) {
                    console.log(err);
                });
            console.log(thread + "+");

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

//Bのチャンネルを監視し特定の単語に反応する。
//特定の単語が見つかった場合、Aチャンネルに設定された文字列の投稿を行う。
//設定値：チャンネルA チャンネルB 特定の単語 イベント発生時の文字列
//必要な機能
/**
 * 監視対象の設定機能
 * 
 * 仕様
 * ボットにメンションで設定を行うリプライをする
 * 
 * 設定を行い、設定ID、設定内容をコメントする（PIN止め）
 */

/**
 * 設定ID一覧
 * 
 * ボットにメンションでリプライする
 * 
 * ボットが設定ID 設定内容を全て出力する
 */

/**
 * 設定削除
 * 設定IDを指定したリプライ
 * 
 * 設定を削除し、「設定ID 設定内容を削除しました」というコメントを出す
 */

/**
 * 設定停止
 * 設定IDを指定したリプ
 * 
 * 設定の有効フラグを切、「設定ID 設定内容を停止しました」というコメントを出す
 */
/**
 * 設定再開命令
 * 
 * 設定IDを指定したリプ
 * 
 * 設定の有効フラグを入、「設定ID 設定内容を有効にしました」というコメントを出す
 */





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