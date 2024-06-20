import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Constant')
export class Constant {
    // 游戏人数
    static player_count = 10;
    // 抽水率
    static profit_rate = 0.25;
    // 圆环鱼产生概率
    static RING_RATE = 0.3;
    // 可以成为圆环鱼的倍率上限
    static RING_ODDS_LIMIT = 30;
    // 圆环鱼捕获后，同种鱼获取数量上限
    static RING_MAX_GET = 5;
}


