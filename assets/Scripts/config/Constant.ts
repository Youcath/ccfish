import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Constant')
export class Constant {
    // 游戏人数
    static player_count = 10;
    // 抽水率
    static profit_rate = 0.25;
    // 子弹是否传屏消失，fasle则会无限反弹
    static bullet_pass = false;
    // 圆环鱼产生概率
    static RING_RATE = 0.3;
    // 可以成为圆环鱼的倍率上限
    static RING_ODDS_LIMIT = 20;
    // 圆环鱼捕获后，同种鱼获取数量上限
    static RING_MAX_GET = 5;
    // 子弹发射最小间隔单位秒
    static BULLET_INTERVAL = 0.2;

    // 初始下注
    static START_BET = 10;
    // 下注上限
    static MAX_BET = 200;
    // 下注间隔
    static BET_INTERVAL = 10;
}


