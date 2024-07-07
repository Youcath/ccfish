import { _decorator, Component, NodePool, Prefab, Node, SpriteAtlas, AudioClip, Vec3, instantiate, UITransform, error, resources, EventTouch, v3, Input, EventKeyboard, KeyCode, input, tween, Camera, Event, director } from 'cc';
const { ccclass, property } = _decorator;

import Fish from './Fish';
import { Utils } from './utils/Utils';
import { PlayerInfo, PlayerNodeConfig } from './config/PlayerInfo';
import { Player } from './Player';
import { BombMask } from './BombMask';
import { GoldBonus } from './GoldBonus';
import { Statistics } from './debug/Statistics';
import { Debug } from './debug/Debug';
import { Constant } from './config/Constant';
import { MovingBg } from './MovingBg';
import { AudioMgr } from './AudioMgr';
import { FishManager } from './FishManager';
import { EventManager } from './EventManager'

@ccclass('Game')
export default class Game extends Component {
    @property(Prefab) gameBgPrefab: Prefab | null = null;
    @property(Prefab) fishPrefab: Prefab | null = null;
    @property(Prefab) bulletPrefab: Prefab | null = null;
    @property(Prefab) netPrefab: Prefab | null = null;
    @property(Prefab) playerPrefab: Prefab | null = null;
    @property(Prefab) maskPrefab: Prefab | null = null;
    @property(Prefab) bonusPrefab: Prefab | null = null;
    @property(Prefab) debugPrefab: Prefab | null = null;
    @property(Prefab) subDebugPrefab: Prefab | null = null;
    @property(Prefab) statisticsPrefab: Prefab | null = null;
    @property(Prefab) substatisticsPrefab: Prefab | null = null;
    @property(Prefab) lineGraphicsPrefab: Prefab | null = null;
    @property(SpriteAtlas) spAtlas: SpriteAtlas | null = null;

    gameBgNode: Node;
    gameBg: MovingBg;
    fishManager: FishManager;
    eventManager: EventManager;

    statisticsNode: Node;
    statistics: Statistics;

    // 爆炸对象池
    bombPool: NodePool;
    // 蒙层
    mask: Node;
    // 奖励动画
    bonus: Node;

    playerInfo: PlayerInfo[];
    playerConfig: Map<number, Array<PlayerNodeConfig>>;
    players: Map<number, Node>;
    camera: Node;

    debugLayout: Node;

    cameraEasing = false;

    onLoad() {
        this.initNodes();
        this.fishManager = new FishManager();
        this.fishManager.init(this);
        this.eventManager = new EventManager();
        this.loadPlayer();
        this.initInput();
        this.playBgm();
    }

    start() {
        this.camera = this.node.getChildByName('Camera');
        this.initDebug();
    }

    private initNodes() {
        if (!this.gameBgNode) {
            this.gameBgNode = instantiate(this.gameBgPrefab);
            this.gameBg = this.gameBgNode.getComponent(MovingBg);
            this.gameBg.init();
        }
        if (!this.statisticsNode) {
            this.statisticsNode = instantiate(this.statisticsPrefab);
            this.statistics = this.statisticsNode.getComponent(Statistics);
            this.statistics.init(this);
            this.statisticsNode.active = false;
        }
    }

    private initDebug() {
        if (!this.debugLayout) {
            this.debugLayout = instantiate(this.debugPrefab);
            this.debugLayout.getComponent(Debug).init(this);
        }
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

                let nodes = self.playerConfig.get(Constant.player_count);
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

        input.on(Input.EventType.KEY_DOWN, this.onKeyDownOrPressing, this);

        input.on(Input.EventType.KEY_PRESSING, this.onKeyDownOrPressing, this);
    }

    private playBgm() {
        AudioMgr.inst.play(this.gameBg.isFishGroup() ? "bg02" : "bg01");
    }

    private createPlayerNode(config: PlayerNodeConfig): Node {
        let node = instantiate(this.playerPrefab);
        node.getComponent(Player).init(config, this);
        return node;
    }

    onFishTouch(fish: Node) {
        const callback = (event: EventTouch) => {
            this.players.forEach((v, k) => {
                const f = fish.getComponent(Fish)._uuid;
                v.getComponent(Player).setTarget(f);
            });
            this.onTouchStart(event);
        };
        fish.on(Input.EventType.TOUCH_START, callback, fish);
    }

    private onTouchStart(event: EventTouch) {
        this.eventManager.handleTouchEventForPlayers(event, this.players);
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
        this.players.get(Number.parseInt(customEventData)).getComponent(Player).updateBet();
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
        let index = Number.parseInt(customEventData);
        let player = this.players.get(index).getComponent(Player);
        player.switchMode();
        if (player.weaponMode == 2 && this.fishManager.fishes.length() > 0) {
            this.switchTarget(index);
        }
    }

    private onKeyDownOrPressing(event: EventKeyboard) {        
        this.eventManager.handleKeyboardEventForPlayers(event.keyCode, this.players);
    }

    public gainCoins(coinPos: Vec3, odds: number, player: number) {
        this.players.get(player).getComponent(Player).gainCoins(coinPos, odds);
    }

    public gainYiwangdajin(playerIndex: number, pos: Vec3) {
        let player = this.players.get(playerIndex).getComponent(Player);
        player.gainItem("yiwangdajin", pos)
    }

    public collectTreasures(playerIndex: number, playerPos: Vec3) {
        const player = this.players.get(playerIndex).getComponent(Player);
        player.gainTreasures(playerPos);
        if (player.currentTreasureCount() >= 5) {
            player.resetTreasures();
            // todo: 播放彩金动画
            
        }
    }

    public trySwitchTargetNow(fish: Node) {
        const f = fish.getComponent(Fish);
        this.players.forEach((v, k) => {
            let player = v.getComponent(Player);
            if (player.weaponMode == 2 && f._uuid == player.targetUuid) {
                // 需要切换目标
                this.switchTarget(k, f._uuid);
            }
        });
    }

    public switchTarget(num: number, ignoreUuid?: string) {
        let player = this.players.get(num).getComponent(Player);
        this.fishManager.switchTarget(player, num, ignoreUuid);
    }

    public despawnFish(fish: Node) {
        fish.off(Input.EventType.TOUCH_START);
        this.fishManager.despawnFish(fish);
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

    public gameRestart() {
        console.log('game reset!');
        director.loadScene('Scene/main.scene');
    }

    public gameMoveBg() {
        Constant.IGNORE_ALL_INPUT = true;
        this.fishManager.stopCreateFish();
        this.fishManager.keepAllFishStill();
        this.gameBg.startMove(this.fishManager.fishes.values(), () => {
            this.playBgm();
            this.fishManager.createSceneFishes();
            Constant.IGNORE_ALL_INPUT = false;
        });
        Constant.bullet_pass = this.gameBg.isFishGroup();
    }
}