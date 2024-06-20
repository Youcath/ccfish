import { _decorator, Component, Prefab, Sprite, SpriteAtlas, NodePool, Node, Vec3, instantiate, UITransform, find, AudioSource, resources, AudioClip, tween, v3, RichText } from 'cc';
const { ccclass, property } = _decorator;

import Coins from './Coins';
import NumUp from './NumUp';
import { Player } from './Player';

@ccclass('CoinController')
export default class CoinController extends Component {
    @property(Prefab)
    coinPlusPrefab: Prefab | null = null;
    @property(Prefab)
    coinsPrefab: Prefab | null = null;
    @property(Sprite)
    number1: Sprite | null = null;
    @property(Sprite)
    number2: Sprite | null = null;
    @property(Sprite)
    number3: Sprite | null = null;
    @property(Sprite)
    number4: Sprite | null = null;
    @property(Sprite)
    number5: Sprite | null = null;
    @property(Sprite)
    number6: Sprite | null = null;
    @property(SpriteAtlas)
    timerAtlas: SpriteAtlas | null = null;
    @property
    currentValue: number = 0;
    @property
    toValue: number = 0;
    @property(AudioClip)
    gotSound1: AudioClip;
    @property(AudioClip)
    gotSound2: AudioClip;
    @property(AudioClip)
    gotSound3: AudioClip;

    @property(SpriteAtlas)
    numAtlas: SpriteAtlas | null = null;
    @property(Node)
    getCoinShow: Node;

    coinUpPool: NodePool;
    coinsPool: NodePool;
    //    // +金币数字
    coin_up: Node;
    //    // 获得金币
    oneCoin: Node;
    master: Player;
    audio: AudioSource;

    lastGot: number;
    //    // LIFE-CYCLE CALLBACKS:
    onLoad() {

    }
    init(master: Player) {
        this.master = master;
        this.coinUpPool = new NodePool();
        this.coinsPool = new NodePool();
        this.setValue(this.currentValue);
        this.audio = this.node.getComponent(AudioSource);
    }
    //    // 数字固定长度lenght，不够的补0
    prefixInteger(num: number, length: number) {
        return (Array(length).join('0') + num).slice(-length);
    }
    setValue(value: number) {
        let str = this.prefixInteger(value, 6);
        let nums = str.split('');
        this.number1.spriteFrame = this.timerAtlas.getSpriteFrame(nums[0].toString());
        this.number2.spriteFrame = this.timerAtlas.getSpriteFrame(nums[1].toString());
        this.number3.spriteFrame = this.timerAtlas.getSpriteFrame(nums[2].toString());
        this.number4.spriteFrame = this.timerAtlas.getSpriteFrame(nums[3].toString());
        this.number5.spriteFrame = this.timerAtlas.getSpriteFrame(nums[4].toString());
        this.number6.spriteFrame = this.timerAtlas.getSpriteFrame(nums[5].toString());
    }
    // 获取金币加数
    addCoins(value: number) {
        this.currentValue += value;
        this.setValue(this.currentValue);
    }
    // 发射子弹消耗金币
    reduceCoin(level: number): boolean {
        let cost = level;
        if (this.master.weaponMode == 3) {
            cost = Math.round(level * 1.5);
        }
        if (this.currentValue >= cost) {
            this.master.game.statistics.weaponCostUpdate(cost, this.master.playerIndex);
            this.master.game.statistics.scoreUpdate(-cost, this.master.playerIndex);
            this.setValue(this.currentValue -= cost);
            return true;
        }

        return false;
    }

    cheatCoin() {
        this.currentValue += 100;
        this.setValue(this.currentValue);
        this.master.game.statistics.scoreUpdate(100, this.master.playerIndex);
    }
    gainCoins(coinPos: Vec3, odds: number, bet: number) {
        const coinnum = odds * bet;
        this.master.game.statistics.scoreUpdate(coinnum, this.master.playerIndex);
        this.master.game.statistics.fishScoreUpdate(coinnum, this.master.playerIndex);
        // 上升的数字对象池
        if (this.coinUpPool.size() > 0) {
            this.coin_up = this.coinUpPool.get();
        } else {
            this.coin_up = instantiate(this.coinPlusPrefab);
        }

        this.coin_up.getComponent(NumUp).init(coinPos, odds, this);

        // 转为世界坐标
        let toPos = this.number3.node.parent.getComponent(UITransform).convertToWorldSpaceAR(this.number3.node.getPosition());

        let count = Math.round(coinnum / 10);
        for (let i = 0; i < count; i++) {
            let coin: Node;
            // 金币对象池
            if (this.coinsPool.size() > 0) {
                coin = this.coinsPool.get();
            } else {
                coin = instantiate(this.coinsPrefab);
            }
            coin.getComponent(Coins).init(this);
            coin.getComponent(Coins).goDown(coinPos, toPos, i);
        }
        this.addCoins(coinnum);
        this.doCoinNumberShowingAmin(coinnum);

        if (coinnum <= 10) {
            this.playSound(this.gotSound1);
        } else if (coinnum < 50) {
            this.playSound(this.gotSound2);
        } else {
            this.playSound(this.gotSound3);
        }
    }
    // 展示分值实际上涨数量的动画
    private doCoinNumberShowingAmin(coinnum: number) {
        const finishCallback = () => {
            this.getCoinShow.active = false;
            this.getCoinShow.position = v3(-86, 0);
        }

        if (this.getCoinShow.active) {
            // 还在显示上次的分数
            this.lastGot += coinnum;
            this.showNumbers(this.lastGot);
            tween(this.getCoinShow).stop();
            this.getCoinShow.position = v3(-86, 50);
            this.unschedule(finishCallback);
            this.scheduleOnce(finishCallback, 3);
        } else {
            this.getCoinShow.active = true;
            this.lastGot = coinnum;
            this.showNumbers(coinnum);
    
            tween(this.getCoinShow).stop();
            this.getCoinShow.position = v3(-86, 0);
            this.unschedule(finishCallback);
            tween(this.getCoinShow).by(1, {position: v3(0, 50)}).call(() => {
                this.scheduleOnce(finishCallback, 3);
            }).start();
        }
        
    }

    private showNumbers(num: number) {
        let str = num.toString();
        let nums = str.split('');

        let richText = this.getCoinShow.getComponent(RichText);
        let text = '';
        nums.forEach(n => {
            text += `<img src=\'goldnum_${n}\'/>`;
        });
        richText.string = text;
    }
    despawnCoins(coin: Node) {
        this.coinsPool.put(coin);
    }
    despawnCoinup(nup: Node) {
        this.coinUpPool.put(nup);
    }

    private playSound(sound: AudioClip) {
        this.audio.stop();
        this.audio.clip = sound;
        this.audio.play();
    }
}
