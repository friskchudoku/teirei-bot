var request = require('request');
var headers = {
    'Content-Type': 'application/json'
}
const Botkit = require('botkit');
//設定
var start = null;
var end = null;
var date = null;

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
/**
 * 時刻確認用
 */
controller.hears(['--time', '-t'], ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    date = new Date();
    //日付を出力
    bot.reply(message, date.toString());
    bot.reply(message, "messageの中身を確認します : " + JSON.stringify(message));
    bot.reply(message, "必要な情報は見れているのかテスト: " + message.channel + " : " + message.ts);

    bot.api.channels.replies({
        token: channels_replies.form.token,
        channel: channels_replies.form.channel,
        thread_ts: channels_replies.form.ts
    }, function (err, res) {
        console.log(res);
    });

});
//データストアのテスト
controller.hears('savetest', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    testuser = {
        id : message.user,
        user : message.user,
        name : 'friskman'
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
//データの削除はまた今度



/**
 * 朝会　始め
 */
controller.hears(['--asakai', '-a'], ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    if (start) {
        bot.say({
            text: "もう朝会始まってそう",
            channel: message.channel
        });
    } else {
        start = {
            time: new Date(),
            channel: message.channel,
            ts: 'undef'
        };
        bot.say({
            text: "@here 朝会スレッドはこちら start : " + start.time,
            channel: message.channel
        }, function (bot, message) {//適当に書いたら動いた
            start.ts = message.ts;
        });
        /*
        bot.api.channels.history({
            token : process.env.token,
            channel : start.channel,
            count : 1
        },function(err,res){
            console.log(res);
        });
        */
    }
});
//朝会スレッドのtsを取得したい
controller.hears('朝会スレッドはこちら', 'bot_message', function (bot, message) {
    start.ts = message.ts;
    console.log('syutoku');
});

/**
 * 朝会　終わり
 */
var asakaiEndMsg1 = '---朝会終了---';
var asakaiEndMsg2 = '所要時間：'
var asakaiEndMsg2 = 'ms'
controller.hears(['--owari', '-o'], ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
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