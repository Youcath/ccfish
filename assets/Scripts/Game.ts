import { _decorator, Component, NodePool, Prefab, Node, SpriteAtlas, AudioClip, Vec3, instantiate, find, UITransform, error, resources, EventTouch, v3, Input, EventKeyboard, KeyCode, input, Animation, log } from 'cc';
const { ccclass, property } = _decorator;

import { FishType } from './FishType';
import Fish from './Fish';
import CoinController from './CoinController';
import { Utils } from './Utils';
import { AudioMgr } from './AudioMgr';
import { PlayerInfo, PlayerNodeConfig } from './PlayerInfo';
import { Player } from './Player';

@ccclass('Game')
export default class Game extends Component {
    @property(Prefab) fishPrefab: Prefab | null = null;
    @property(Prefab) bulletPrefab: Prefab | null = null;
    @property(Prefab) netPrefab: Prefab | null = null;
    @property(SpriteAtlas) spAtlas: SpriteAtlas | null = null;
    @property(AudioClip) bgm: AudioClip | null = null;

    @property(Prefab) playerPrefab: Prefab | null = null;

    //鱼对象池
    fishPool: NodePool;

    fishTypes: FishType[];
    playerInfo: PlayerInfo[];
    playerConfig: Map<number, Array<PlayerNodeConfig>>;
    players: Map<number, Node>;
    oneFish: Node;

    playerCount = 10;

    onLoad() {
        // 初始化pool
        this.initPools();

        // 加载fish相关
        this.loadFish();

        this.loadPlayer();

        this.initInput();
    }

    start() {
        // 播放背景音乐
        AudioMgr.inst.play(this.bgm);

        this.schedule(this.printNodeNumber, 1);
    }

    private printNodeNumber() {
        let count = this.node.children.length;
        log('node number: ' + count);
        log('pool size: ' + this.fishPool.size());
    }

    private initPools() {
        this.fishPool = new NodePool("Fish");
        let initCount = 10;
        for (let i = 0; i < initCount; ++i) {
            let fishPre = instantiate(this.fishPrefab);
            this.fishPool.put(fishPre);
        }
    }

    private loadFish() {
        // 动态加载json配置文件
        let self = this;
        resources.load("fishconfig", function (err, jsonAsset) {
            if (err) {
                error(err.message || err);
                return;
            }
            // 加载之后转类型
            self.fishTypes = jsonAsset.json;
            self.schedule(self.creatFish, 3);
        });
    }

    private loadPlayer() {
        // 动态加载json配置文件
        let self = this;
        resources.load("playerconfig", function (err, jsonAsset) {
            if (err) {
                error(err.message || err);
                return;
            }
            self.playerInfo = jsonAsset.json;
            if (self.playerInfo) {
                self.playerConfig = new Map<number, Array<PlayerNodeConfig>>();
                for (let i = 0; i < self.playerInfo.length; i++) {
                    let info = self.playerInfo[i];
                    self.playerConfig.set(info.playerNumber, info.nodes);
                }

                let nodes = self.playerConfig.get(self.playerCount);
                if (nodes) {
                    self.players = new Map<number, Node>();
                    for (let i = 0; i < nodes.length; i++) {
                        let config = nodes[i];
                        self.players.set(config.index, self.createPlayerNode(config));
                    }
                }
            }
        });
    }

    private initInput() {
        // 添加触摸事件
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);

        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);

        input.on(Input.EventType.KEY_PRESSING, this.onKeyPressing, this);
    }

    private createPlayerNode(config: PlayerNodeConfig): Node {
        let node = instantiate(this.playerPrefab);
        node.getComponent(Player).init(config, this);
        return node;
    }

    private creatFish() {
        // 一次创建8条鱼
        let fishCount = 3;
        for (let i = 0; i < fishCount; ++i) {
            let cfish: Node = null;
            if (this.fishPool.size() > 0) {
                cfish = this.fishPool.get(this);
            } else {
                cfish = instantiate(this.fishPrefab);
            }
            cfish.getComponent(Fish).init(this);
            cfish.setSiblingIndex(2);
        }
    }

    private onTouchStart(event: EventTouch) {
        // 所有炮台往触点发射炮弹
        this.players.forEach((v, k) => {
            // 触点是世界坐标，需要转换为和炮台一致的坐标系下
            let touchPos = v.getComponent(UITransform).convertToNodeSpaceAR(v3(event.getUILocation().x, event.getUILocation().y));
            // 炮台坐标
            let weaponPos = v.getComponent(Player).weaponNode.getPosition();
            // 炮台到触点的方向向量
            let dir = touchPos.subtract(weaponPos);
            // 计算夹角，这个夹角是带方向的
            let angle = Utils.angle(dir, v3(0, 1));
            //将弧度转换为欧拉角
            let degree = angle / Math.PI * 180;
            // 设置炮台角度
            v.getComponent(Player).weaponNode.angle = degree;
            v.getComponent(Player).shot();
        });

    }

    private onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            // 玩家1
            case KeyCode.ARROW_LEFT:
                this.players.get(1).getComponent(Player).weaponLeft();
                break;
            case KeyCode.ARROW_RIGHT:
                this.players.get(1).getComponent(Player).weaponRight();
                break;
            case KeyCode.SPACE:
            case KeyCode.ENTER:
                this.players.get(1).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_1:
                this.players.get(1).getComponent(Player).cheatCoins();
                break;

            // 玩家2
            case KeyCode.KEY_W:
                this.players.get(2).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_S:
                this.players.get(2).getComponent(Player).weaponRight();
                break;
            case KeyCode.KEY_X:
                this.players.get(2).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_2:
                this.players.get(2).getComponent(Player).cheatCoins();
                break;

            // 玩家3
            case KeyCode.KEY_E:
                this.players.get(3).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_D:
                this.players.get(3).getComponent(Player).weaponRight();
                break;
            case KeyCode.KEY_C:
                this.players.get(3).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_3:
                this.players.get(3).getComponent(Player).cheatCoins();
                break;

            // 玩家4
            case KeyCode.KEY_R:
                this.players.get(4).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_F:
                this.players.get(4).getComponent(Player).weaponRight();
                break;
            case KeyCode.KEY_V:
                this.players.get(4).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_4:
                this.players.get(4).getComponent(Player).cheatCoins();
                break;

            // 玩家5
            case KeyCode.KEY_T:
                this.players.get(5).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_G:
                this.players.get(5).getComponent(Player).weaponRight();
                break;
            case KeyCode.KEY_B:
                this.players.get(5).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_5:
                this.players.get(5).getComponent(Player).cheatCoins();
                break;

            // 玩家6
            case KeyCode.KEY_Y:
                this.players.get(6).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_H:
                this.players.get(6).getComponent(Player).weaponRight();
                break;
            case KeyCode.KEY_N:
                this.players.get(6).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_6:
                this.players.get(6).getComponent(Player).cheatCoins();
                break;

            // 玩家7
            case KeyCode.KEY_U:
                this.players.get(7).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_J:
                this.players.get(7).getComponent(Player).weaponRight();
                break;
            case KeyCode.KEY_M:
                this.players.get(7).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_7:
                this.players.get(7).getComponent(Player).cheatCoins();
                break;

            // 玩家8
            case KeyCode.KEY_I:
                this.players.get(8).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_K:
                this.players.get(8).getComponent(Player).weaponRight();
                break;
            case KeyCode.COMMA:
                this.players.get(8).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_8:
                this.players.get(8).getComponent(Player).cheatCoins();
                break;

            // 玩家9
            case KeyCode.KEY_O:
                this.players.get(9).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_L:
                this.players.get(9).getComponent(Player).weaponRight();
                break;
            case KeyCode.PERIOD:
                this.players.get(9).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_9:
                this.players.get(9).getComponent(Player).cheatCoins();
                break;

            // 玩家10
            case KeyCode.KEY_P:
                this.players.get(10).getComponent(Player).weaponLeft();
                break;
            case KeyCode.SEMICOLON:
                this.players.get(10).getComponent(Player).weaponRight();
                break;
            case KeyCode.SLASH:
                this.players.get(10).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_0:
                this.players.get(10).getComponent(Player).cheatCoins();
                break;
        }
    }

    private onKeyPressing(event: EventKeyboard) {
        switch (event.keyCode) {
            // 玩家1
            case KeyCode.ARROW_LEFT:
                this.players.get(1).getComponent(Player).weaponLeft();
                break;
            case KeyCode.ARROW_RIGHT:
                this.players.get(1).getComponent(Player).weaponRight();
                break;
            case KeyCode.SPACE:
            case KeyCode.ENTER:
                this.players.get(1).getComponent(Player).shot();
                break;

           // 玩家2
           case KeyCode.KEY_W:
            this.players.get(2).getComponent(Player).weaponLeft();
            break;
        case KeyCode.KEY_S:
            this.players.get(2).getComponent(Player).weaponRight();
            break;
        case KeyCode.KEY_X:
            this.players.get(2).getComponent(Player).shot();
            break;

        // 玩家3
        case KeyCode.KEY_E:
            this.players.get(3).getComponent(Player).weaponLeft();
            break;
        case KeyCode.KEY_D:
            this.players.get(3).getComponent(Player).weaponRight();
            break;
        case KeyCode.KEY_C:
            this.players.get(3).getComponent(Player).shot();
            break;

        // 玩家4
        case KeyCode.KEY_R:
            this.players.get(4).getComponent(Player).weaponLeft();
            break;
        case KeyCode.KEY_F:
            this.players.get(4).getComponent(Player).weaponRight();
            break;
        case KeyCode.KEY_V:
            this.players.get(4).getComponent(Player).shot();
            break;

        // 玩家5
        case KeyCode.KEY_T:
            this.players.get(5).getComponent(Player).weaponLeft();
            break;
        case KeyCode.KEY_G:
            this.players.get(5).getComponent(Player).weaponRight();
            break;
        case KeyCode.KEY_B:
            this.players.get(5).getComponent(Player).shot();
            break;

        // 玩家6
        case KeyCode.KEY_Y:
            this.players.get(6).getComponent(Player).weaponLeft();
            break;
        case KeyCode.KEY_H:
            this.players.get(6).getComponent(Player).weaponRight();
            break;
        case KeyCode.KEY_N:
            this.players.get(6).getComponent(Player).shot();
            break;

        // 玩家7
        case KeyCode.KEY_U:
            this.players.get(7).getComponent(Player).weaponLeft();
            break;
        case KeyCode.KEY_J:
            this.players.get(7).getComponent(Player).weaponRight();
            break;
        case KeyCode.KEY_M:
            this.players.get(7).getComponent(Player).shot();
            break;

        // 玩家8
        case KeyCode.KEY_I:
            this.players.get(8).getComponent(Player).weaponLeft();
            break;
        case KeyCode.KEY_K:
            this.players.get(8).getComponent(Player).weaponRight();
            break;
        case KeyCode.COMMA:
            this.players.get(8).getComponent(Player).shot();
            break;

        // 玩家9
        case KeyCode.KEY_O:
            this.players.get(9).getComponent(Player).weaponLeft();
            break;
        case KeyCode.KEY_L:
            this.players.get(9).getComponent(Player).weaponRight();
            break;
        case KeyCode.PERIOD:
            this.players.get(9).getComponent(Player).shot();
            break;

        // 玩家10
        case KeyCode.KEY_P:
            this.players.get(10).getComponent(Player).weaponLeft();
            break;
        case KeyCode.SEMICOLON:
            this.players.get(10).getComponent(Player).weaponRight();
            break;
        case KeyCode.SLASH:
            this.players.get(10).getComponent(Player).shot();
            break;
        }
    }

    public gainCoins(coinPos: Vec3, value: number, player: number) {
        this.players.get(player).getComponent(Player).gainCoins(coinPos, value);
    }

    public despawnFish(fish: Node) {
        // const self = this;
        // let callback = function () {
            
            this.fishPool.put(fish);
        // }
        // this.scheduleOnce(callback);
    }

    public playRewardAni(pos: Vec3) {
        const bomb = find('Canvas').getChildByName('bomb');
        bomb.setPosition(pos);
        bomb.active = true;
        const anim = bomb.getComponent(Animation);
        const self = this;
        let finishCallback = function() {
            bomb.active = false;
        };
        anim.play();
        anim.on(Animation.EventType.FINISHED, finishCallback, this);
    }

    // gameOver() {
    //     this.gameOverNode.setSiblingIndex(99);
    //     this.gameOverNode.active = true;
    //     this.unscheduleAllCallbacks();
    // }

    // gameRestart() {
    //     director.loadScene('Scene/main.scene');
    // }
}


/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// import { FishState, FishType } from './FishType';
// import Fish from './Fish';
// import Bullet from './Bullet';
// import Net from './Net';
// import CoinController from './CoinController';
// import Weapon from './Weapon';
// const { ccclass, property } = cc._decorator;
//
// @ccclass
// export default class Game extends cc.Component {
//     //鱼对象池
//     fishPool: cc.NodePool;
//     fishTypes: FishType[];
//
//     @property(cc.Prefab)
//     fishPrefab: cc.Prefab = null;
//
//     @property(cc.Node)
//     weaponNode: cc.Node = null;
//
//     @property(cc.Prefab)
//     bulletPrefab: cc.Prefab = null;
//
//     @property(cc.Prefab)
//     netPrefab: cc.Prefab = null;
//
//     @property(cc.Node)
//     coinController: cc.Node = null;
//
//     @property(cc.SpriteAtlas)
//     spAtlas: cc.SpriteAtlas = null;
//
//     @property(cc.Node)
//     gameOverNode: cc.Node = null;
//
//     @property({
//         type:cc.AudioClip
//     })
//     bgm: cc.AudioClip = null;
//
//
//     oneFish: cc.Node;
//     oneBullet: cc.Node;
//     oneNet: cc.Node;
//
//     //子弹对象池
//     bulletPool: cc.NodePool;
//     netsPool: cc.NodePool;
//
//     onLoad() {
//         cc.audioEngine.playMusic(this.bgm, true);
//
//         let manager = cc.director.getCollisionManager();
//         manager.enabled = true;
//         // manager.enabledDebugDraw = true;
//         // manager.enabledDrawBoundingBox = true;
//
//         this.bulletPool = new cc.NodePool(Bullet);
//         this.fishPool = new cc.NodePool(Fish);
//         // 池子里面多放几条鱼
//         let initCount = 10;
//         for (let i = 0; i < initCount; ++i){
//             let fishPre = cc.instantiate(this.fishPrefab);
//             this.fishPool.put(fishPre);
//         }
//         this.netsPool = new cc.NodePool();
//
//         this.coinController.getComponent(CoinController).init();
//         this.weaponNode.getComponent(Weapon).init();
//         // 设置zorder，控制显示层级
//         // 背景在最下层，最上层是炮台
//         // 中间层是鱼
//         cc.find('Canvas/gameBg').zIndex = -1;
//         cc.find('Canvas/bottomBar').zIndex = 1;
//         this.gameOverNode.zIndex = 2;
//         this.gameOverNode.active = false;
//
//         let self = this;
//         cc.debug.setDisplayStats(true);
//         // 动态加载json配置文件
//         cc.loader.loadRes("fishconfig", function (err, jsonAsset) {
//             if (err) {
//                 cc.error(err.message || err);
//                 return;
//             }
//             // 加载之后转类型
//             self.fishTypes = <FishType[]>jsonAsset.json;
//             self.schedule(self.creatFish, 2);
//         });
//
//
//
//         // 添加触摸事件
//         this.node.on(cc.Node.EventType.TOUCH_START, function (event: cc.Event.EventTouch) {
//             // 触点是世界坐标，需要转换为和炮台一致的坐标系下
//             let touchPos = self.weaponNode.parent.convertToNodeSpaceAR(event.getLocation());
//             // 炮台坐标
//             let weaponPos = self.weaponNode.getPosition();
//             // 炮台到触点的方向向量
//             let dir = touchPos.sub(weaponPos);
//             // 计算夹角，这个夹角是带方向的
//             let angle = dir.signAngle(cc.v2(0, 1));
//             //将弧度转换为欧拉角
//             let degree = angle / Math.PI * 180;
//             // 设置炮台角度
//             self.weaponNode.angle = -degree;
//             let bulletLevel = self.weaponNode.getComponent(Weapon).curLevel;
//             self.shot(bulletLevel);
//         }, this);
//         this.node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
//             // cc.log('touch move');
//         }, this);
//         this.node.on(cc.Node.EventType.TOUCH_END, function (event) {
//             // cc.log('touch end');
//         }, this);
//
//
//     }
//
//     shot(level:number) {
//         if (this.bulletPool.size() > 0) {
//             this.oneBullet = this.bulletPool.get(this);
//         } else {
//             this.oneBullet = cc.instantiate(this.bulletPrefab);
//         }
//         // 剩余金币
//         let left = this.coinController.getComponent(CoinController).reduceCoin(level);
//         if (left) {
//             this.oneBullet.getComponent(Bullet).shot(this, level);
//         } else {
//             if (this.coinController.getComponent(CoinController).currentValue == 0) {
//                 this.gameOver();
//             }
//         }
//
//     }
//
//     creatFish() {
//         /**
//         if (this.fishPool.size() > 0) {
//             this.oneFish = this.fishPool.get(this);
//         } else {
//             this.oneFish = cc.instantiate(this.fishPrefab);
//         }
//         this.oneFish.getComponent(Fish).init(this);
//         */
//        //一次创建3条鱼
//
//         let fishCount = 3;
//         for (let i = 0; i < fishCount; ++i){
//             let cfish: cc.Node = null;
//             if (this.fishPool.size() > 0) {
//                 cfish = this.fishPool.get(this);
//             } else {
//                 cfish = cc.instantiate(this.fishPrefab);
//             }
//            cfish.getComponent(Fish).init(this);
//         }
//
//
//     }
//
//
//     castNet(position:cc.Vec2) {
//         if (this.netsPool.size() > 0) {
//             this.oneNet = this.netsPool.get(this);
//         } else {
//             this.oneNet = cc.instantiate(this.netPrefab);
//         }
//         let bulletLevel = this.weaponNode.getComponent(Weapon).curLevel;
//         this.oneNet.getComponent(Net).init(position,this,bulletLevel);
//     }
//
//     despawnFish(fish: cc.Node) {
//         this.fishPool.put(fish);
//     }
//
//     despawnBullet(bullet:cc.Node) {
//         this.bulletPool.put(bullet);
//     }
//
//     despawnNet(net: cc.Node) {
//         this.netsPool.put(net);
//     }
//
//     gainCoins(coinPos: cc.Vec2, value: number) {
//         this.coinController.getComponent(CoinController).gainCoins(coinPos, value);
//     }
//
//     gameOver() {
//         this.gameOverNode.active = true;
//         this.unscheduleAllCallbacks();
//     }
//
//     gameRestart() {
//         // cc.game.restart();
//         cc.director.loadScene('mainscene');
//     }
// }
