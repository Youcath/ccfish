import { _decorator, Component, NodePool, Prefab, Node, SpriteAtlas, AudioClip, Vec3, instantiate, UITransform, error, resources, EventTouch, v3, Input, EventKeyboard, KeyCode, input, tween, Camera, Event } from 'cc';
const { ccclass, property } = _decorator;

import { FishType } from './FishType';
import Fish from './Fish';
import { Utils } from './Utils';
import { AudioMgr } from './AudioMgr';
import { PlayerInfo, PlayerNodeConfig } from './PlayerInfo';
import { Player } from './Player';
import Weapon from './Weapon';
import { BombMask } from './BombMask';
import { GoldBonus } from './GoldBonus';
import { Statistics } from './Statistics';

@ccclass('Game')
export default class Game extends Component {
    @property(Prefab) fishPrefab: Prefab | null = null;
    @property(Prefab) bulletPrefab: Prefab | null = null;
    @property(Prefab) netPrefab: Prefab | null = null;
    @property(Prefab) playerPrefab: Prefab | null = null;
    @property(Prefab) maskPrefab: Prefab | null = null;
    @property(Prefab) bonusPrefab: Prefab | null = null;
    @property(SpriteAtlas) spAtlas: SpriteAtlas | null = null;
    @property(AudioClip) bgm: AudioClip | null = null;
    @property(Node) statisticsNode: Node;
    statistics: Statistics;

    // 鱼对象池
    fishPool: NodePool;
    // 爆炸对象池
    bombPool: NodePool;
    // 蒙层
    mask: Node;
    // 奖励动画
    bonus: Node;
    fishTypes: FishType[];
    playerInfo: PlayerInfo[];
    playerConfig: Map<number, Array<PlayerNodeConfig>>;
    players: Map<number, Node>;
    camera: Node;
    fishes: Map<string, Node>; // 活跃的鱼集合

    debugLayout: Node;

    maskShowing = 0;
    bonusShowing = false;
    cameraEasing = false;

    totalWeight = 0; 

    // 游戏人数
    playerCount = 10;
    // 抽水率
    profitRate = 0.2;

    onLoad() {
        this.initNodes();
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

        this.camera = this.node.getChildByName('Camera');
        this.debugLayout = this.node.getChildByName('DebugLayout');
    }

    private initNodes() {
        this.statistics = this.statisticsNode.getComponent(Statistics);

    }

    private initPools() {
        // 鱼
        this.fishes = new Map();
        this.fishPool = new NodePool("Fish");
        let initCount = 10;
        for (let i = 0; i < initCount; ++i) {
            let fishPre = instantiate(this.fishPrefab);
            this.fishPool.put(fishPre);
        }
        // 爆炸
        this.bombPool = new NodePool("Bomb");
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
            self.totalWeight = 0;
            for (let i = 0; i < self.fishTypes.length; i++) {
                self.totalWeight += self.fishTypes[i].weight;
            }
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
            self.statisticsNode.active = false;
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
        let fishCount = 8;
        for (let i = 0; i < fishCount; ++i) {
            let cfish: Node = null;
            if (this.fishPool.size() > 0) {
                cfish = this.fishPool.get(this);
            } else {
                cfish = instantiate(this.fishPrefab);
            }
            cfish.getComponent(Fish).init(this);
            cfish.setSiblingIndex(2);
            // this.fishes.put(cfish);
            // this.onFishTouch(cfish);
        }
    }

    // private onFishTouch(fish: Node) {
    //     const callback = (event: EventTouch) => {
    //         // let index = this.fishes.indexOf(fish);
    //         this.players.forEach((v, k) => {

    //         });
            
    //     };
    //     fish.on(Input.EventType.TOUCH_START, callback, fish);
    // }

    private onTouchStart(event: EventTouch) {
        if (this.maskShowing > 0) return;

        // 所有炮台往触点发射炮弹
        this.players.forEach((v, k) => {
            let world = v3(event.getUILocation().x, event.getUILocation().y);
            v.getComponent(Player).setTargetPos(world);
            // 触点是世界坐标，需要转换为和炮台一致的坐标系下
            let touchPos = v.getComponent(UITransform).convertToNodeSpaceAR(world);
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

    debugButton(event: Event) {
        if (this.debugLayout) {
            if (this.debugLayout.active) {
                this.debugLayout.active = false;
            } else {
                this.debugLayout.active = true;
            }
        }
    }

    statisticsButton(event: Event) {
        if (this.statisticsNode) {
            if (this.statisticsNode.active) {
                this.statisticsNode.active = false;
            } else {
                this.statisticsNode.active = true;
            }
        }
    }

    switchButtonAll(event: Event, customEventData: number) {
        for (let i = 1; i <= 10; i++) {
            this.switchButton(event, i + '');
        }
    }

    switchButton(event: Event, customEventData: string) {
        this.players.get(Number.parseInt(customEventData)).getComponent(Player).weaponNode.getComponent(Weapon).plus();
    }

    cheatButtonAll(event: Event, customEventData: number) {
        for (let i = 1; i <= 10; i++) {
            this.cheatButton(event, i + '');
        }
    }

    cheatButton(event: Event, customEventData: string) {
        this.players.get(Number.parseInt(customEventData)).getComponent(Player).cheatCoins();
    }

    switchModeButtonAll(event: Event, customEventData: string) {
        for (let i = 1; i <= 10; i++) {
            this.switchModeButton(event, i + '');
        }
    }
    switchModeButton(event: Event, customEventData: string) {
        this.players.get(Number.parseInt(customEventData)).getComponent(Player).switchMode();
    }

    private onKeyDown(event: EventKeyboard) {
        if (this.maskShowing > 0) return;

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
        if (this.maskShowing > 0) return;

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
        this.fishPool.put(fish);
    }

    public showMask() {
        this.maskShowing++;
        if (this.maskShowing > 1) {
            return;
        }
        // 蒙层
        if (this.mask == null) {
            this.mask = instantiate(this.maskPrefab);
        }
        this.mask.getComponent(BombMask).appear();
    }

    public hiddenMask() {
        this.maskShowing--;
        if (this.maskShowing > 0) {
            return;
        }
        const mask = this.mask.getComponent(BombMask);
        if (mask) {
            mask.disappear();
        }
    }

    public showBonus(callback: () => void) {
        if (this.bonusShowing) {
            callback();
            return;
        }
        this.bonusShowing = true;
        // 奖励动画
        if (this.bonus == null) {
            this.bonus = instantiate(this.bonusPrefab);
        }
        this.bonus.getComponent(GoldBonus).appear(() => {
            this.bonusShowing = false;
            callback();
        });
    }

    public showCameraEasing() {
        if (this.cameraEasing) {
            return;
        }
        this.cameraEasing = true;
        // 震动方向为向量（3， 10）
        tween(this.camera).by(1.2, { position: v3(2 * Math.random() + 1, 5 * Math.random() + 5) }, {
            easing: Utils.easing
        }).start();
        let camera = this.camera.getComponent(Camera);
        if (camera) {
            tween(camera).by(1.5, { orthoHeight: 3 * Math.random() + 2 }, {
                easing: Utils.easing
            })
            .call(() => {
                this.cameraEasing = false;
            }).start();
        }
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