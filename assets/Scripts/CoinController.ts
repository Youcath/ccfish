import { _decorator, Component, Prefab, Sprite, SpriteAtlas, NodePool, Node, Vec3, instantiate, UITransform, find, AudioSource, resources, AudioClip, tween, v3 } from 'cc';
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
    @property(Sprite)
    tensPlace: Sprite | null = null;
    @property(Sprite)
    onesPlace: Sprite | null = null;

    coinUpPool: NodePool;
    coinsPool: NodePool;
    //    // +金币数字
    coin_up: Node;
    //    // 获得金币
    oneCoin: Node;
    master: Player;
    audio: AudioSource;
    coinCounting: Node;
    //    // LIFE-CYCLE CALLBACKS:
    onLoad() {

    }
    init(master: Player) {
        this.master = master;
        this.coinUpPool = new NodePool();
        this.coinsPool = new NodePool();
        this.setValue(this.currentValue);
        this.audio = this.node.getComponent(AudioSource);
        this.coinCounting = master.node.getChildByName('CoinCounting');
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
    gainCoins(coinPos: Vec3, coinnum: number) {
        this.master.game.statistics.scoreUpdate(coinnum, this.master.playerIndex);
        this.master.game.statistics.fishScoreUpdate(coinnum, this.master.playerIndex);
        // 上升的数字对象池
        if (this.coinUpPool.size() > 0) {
            this.coin_up = this.coinUpPool.get();
        } else {
            this.coin_up = instantiate(this.coinPlusPrefab);
        }

        this.coin_up.getComponent(NumUp).init(coinPos, coinnum, this);

        // // 金币对象池
        // if (this.coinsPool.size() > 0) {
        //     this.oneCoin = this.coinsPool.get();
        // } else {
        //     this.oneCoin = instantiate(this.coinsPrefab);
        // }
        // this.oneCoin.getComponent(Coins).init(this);
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
        this.coinCounting.active = true;
        let str = coinnum.toString();
        let nums = str.split('');
        if (nums.length == 1) {
            this.onesPlace.node.active = false;
            this.tensPlace.spriteFrame = this.numAtlas.getSpriteFrame('goldnum_' + nums[0]);
        } else {
            this.onesPlace.node.active = true;
            this.tensPlace.spriteFrame = this.numAtlas.getSpriteFrame('goldnum_' + nums[0]);
            this.onesPlace.spriteFrame = this.numAtlas.getSpriteFrame('goldnum_' + nums[1]);
        }
        tween(this.coinCounting).by(1, {position: v3(0, 50)}).call(() => {
            this.coinCounting.active = false;
            this.coinCounting.position = v3(-60, 0);
        }).start();

        if (coinnum <= 10) {
            this.playSound(this.gotSound1);
        } else if (coinnum < 50) {
            this.playSound(this.gotSound2);
        } else {
            this.playSound(this.gotSound3);
        }
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


/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// import Coins from './Coins';
// import NumUp from './NumUp';
// const { ccclass, property } = cc._decorator;
//
// @ccclass
// export default class CoinController extends cc.Component {
//
//     @property(cc.Prefab)
//     coinPlusPrefab: cc.Prefab = null;
//
//     @property(cc.Prefab)
//     coinsPrefab: cc.Prefab = null;
//
//     @property(cc.Sprite)
//     number1: cc.Sprite = null;
//
//     @property(cc.Sprite)
//     number2: cc.Sprite = null;
//
//     @property(cc.Sprite)
//     number3: cc.Sprite = null;
//
//     @property(cc.Sprite)
//     number4: cc.Sprite = null;
//
//     @property(cc.Sprite)
//     number5: cc.Sprite = null;
//
//     @property(cc.Sprite)
//     number6: cc.Sprite = null;
//
//     @property(cc.SpriteAtlas)
//     timerAtlas: cc.SpriteAtlas = null;
//
//     @property
//     currentValue: number = 0;
//
//     @property
//     toValue: number = 0;
//
//     coinUpPool: cc.NodePool;
//     coinsPool: cc.NodePool;
//
//     // +金币数字
//     coin_up: cc.Node;
//
//     // 获得金币
//     oneCoin: cc.Node;
//
//     // LIFE-CYCLE CALLBACKS:
//
//     onLoad() {
//
//     }
//
//     init() {
//         this.coinUpPool = new cc.NodePool();
//         this.coinsPool = new cc.NodePool();
//         this.setValue(this.currentValue);
//     }
//
//     // 数字固定长度lenght，不够的补0
//     prefixInteger(num: number, length: number) {
//         return (Array(length).join('0') + num).slice(-length);
//     }
//
//     setValue(value: number) {
//         let str = this.prefixInteger(value, 6);
//         let nums = str.split('');
//         this.number1.spriteFrame = this.timerAtlas.getSpriteFrame(nums[0].toString());
//         this.number2.spriteFrame = this.timerAtlas.getSpriteFrame(nums[1].toString());
//         this.number3.spriteFrame = this.timerAtlas.getSpriteFrame(nums[2].toString());
//         this.number4.spriteFrame = this.timerAtlas.getSpriteFrame(nums[3].toString());
//         this.number5.spriteFrame = this.timerAtlas.getSpriteFrame(nums[4].toString());
//         this.number6.spriteFrame = this.timerAtlas.getSpriteFrame(nums[5].toString());
//     }
//
//     // 获取金币加数
//     addCoins(value: number) {
//         this.currentValue += value;
//         this.setValue(this.currentValue);
//     }
//
//     // 发射子弹消耗金币
//     reduceCoin(level: number): boolean{
//         if (this.currentValue >= level) {
//             this.setValue(this.currentValue-=level);
//             return true;
//         }
//
//         return false;
//     }
//
//     gainCoins(coinPos: cc.Vec2, coinnum: number) {
//         // 上升的数字对象池
//         if (this.coinUpPool.size() > 0) {
//             this.coin_up = this.coinUpPool.get();
//         } else {
//             this.coin_up = cc.instantiate(this.coinPlusPrefab);
//         }
//
//         this.coin_up.getComponent(NumUp).init(coinPos, coinnum, this);
//
//         // 金币对象池
//         if (this.coinsPool.size() > 0) {
//             this.oneCoin = this.coinsPool.get();
//         } else {
//             this.oneCoin = cc.instantiate(this.coinsPrefab);
//         }
//         this.oneCoin.getComponent(Coins).init(this);
//         // 转为世界坐标
//         let toPos = this.node.convertToWorldSpaceAR(this.number3.node.position);
//         this.oneCoin.getComponent(Coins).goDown(coinPos, toPos);
//         this.addCoins(coinnum);
//     }
//
//     despawnCoins(coin:cc.Node) {
//         this.coinsPool.put(coin);
//     }
//
//     despawnCoinup(nup:cc.Node) {
//         this.coinUpPool.put(nup);
//     }
// }
