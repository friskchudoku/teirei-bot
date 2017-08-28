var request = require('request');
var headers = {
  'Content-Type':'application/json'
}
var channels_replies = {
  url: 'https://slack.com/api/channels.replies',
  method: 'POST',
  headers: headers,
  json: true,
  form: {
            token : process.env.token,
            channel : 'undef',
            ts : 'undef'
        }
}
const Botkit = require('botkit');
//設定
var startTime = null;
var endTime = null;
var date = null;

if (!process.env.token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

const controller = Botkit.slackbot({
    debug: false
});

controller.spawn({
    token: process.env.token
}).startRTM(function(err){
    if (err) {
        throw new Error(err);
    }
});
/**
 * 時刻確認用
 */
controller.hears(['--time','-t'],['direct_message','direct_mention','mention'],function(bot,message){
    date = new Date();
    //日付を出力
    bot.reply(message,date.toString());
    bot.reply(message,"messageの中身を確認します : " + JSON.stringify(message));
    bot.reply(message,"必要な情報は見れているのかテスト: " + message.channel + " : " + message.ts);
    channels_replies.form.channel = message.channel;
    channels_replies.form.ts = message.ts;
    request.post(channels_replies,function(err,res,body){
        console.log(JSON.stringify(res.body));
    });

});


/**
 * 朝会　始め
 */
controller.hears(['--asakai','-a'],['direct_message','direct_mention','mention'],function(bot,message) {
    if(startTime){
        bot.say({
            text : "もう朝会始まってそう",
            channel : message.channel
        });
    }else{
        startTime = new Date();
        bot.say({
            text : "朝会スレッドはこちら startTime : " + startTime.toString(),
            channel : message.channel
        });
        
    }
});

/**
 * 朝会　終わり
 */
var asakaiEndMsg1 = '---朝会終了---';
var asakaiEndMsg2 = '所要時間：'
var asakaiEndMsg2 = 'ms'
controller.hears(['--owari','-o'],['direct_message','direct_mention','mention'],function(bot,message) {
    if(startTime){
        endTime = new Date();
        //bot.reply(message,asakaiEndMsg1 + (endTime - startTime) + asakaiEndMsg2); 
        //このタイミングでスレッドの取得を行いたい
        //つまりAPIを叩くということだと思うのだが...?

        bot.say({
            text : asakaiEndMsg1 + (endTime - startTime) + asakaiEndMsg2,
            channel : message.channel
        });
        startTime = null;
    }else{
        bot.say({
            text : "朝会始まってなくね？",
            channel : message.channel
        });
    }
});