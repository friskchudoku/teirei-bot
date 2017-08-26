
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
    /*
    bot.say({
        channel: 'general',
        text: message.toString(),
        username: 'hoge',
        icon_url: ''
                });
     */
});


/**
 * 朝会　始め
 */
var asakaiStart = '朝会こそが人間の可能性なのかもしれん';
controller.hears(['--asakai','-a'],['direct_message','direct_mention','mention'],function(bot,message) {
    if(startTime){
        bot.say({
            text : "もう朝会始まってそう",
            channel : message.channel
        });
    }else{
        startTime = new Date();
        bot.say({
            text : "朝会スレッドはこちらですよ〜！ startTime : " + startTime.toString(),
            channel : message.channel
        });
        
    }
});

/**
 * 朝会　終わり
 */
var asakaiEndMsg1 = 'みなさんが朝会を終了させるまでに';
var asakaiEndMsg2 = 'msかかりました。'
controller.hears(['--owari','-o'],['direct_message','direct_mention','mention'],function(bot,message) {
    if(startTime){
        endTime = new Date();
        //bot.reply(message,asakaiEndMsg1 + (endTime - startTime) + asakaiEndMsg2); 
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