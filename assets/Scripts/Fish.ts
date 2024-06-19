import { _decorator, Component, Animation, Vec3, v3, Sprite, UITransform, BoxCollider2D, tween, math, Tween, Node, Contact2DType, Collider2D, IPhysics2DContact, size, v2, Prefab, instantiate, System, sys } from 'cc';
const { ccclass, property } = _decorator;

import { FishState, FishType } from './config/FishType';
import Game from './Game';
import Net from './Net';
import { Utils } from './utils/Utils';
import { Bomb } from './Bomb'


@ccclass('Fish')
export default class Fish extends Component {
    // animation 这个属性声明类型，为了在编辑器面板显示类型
    @property(Animation) anim: Animation | null = null;
    @property(Prefab) bombPreb: Prefab | null = null;

    // 爆炸
    bomb: Node;
    // 基础赔率
    odds: number = 10;
    // 翻倍数
    multiple: number = 1;
    // fish state 鱼的生命状态，默认都是活的
    fishState: FishState = FishState.alive;
    // 保存上一次坐标,用于更新角度
    lastPosition: Vec3;
    // 起始坐标
    startPosition: Vec3;
    // 第一个控制点
    firstPosition: Vec3;
    // 种类
    fishType: FishType;
    // 暂存game实例
    game: Game;

    tween: Tween<Node> | undefined;
    killerIndex: number;

    gotRate: number = 0; // 捕获概率

    _uuid: string = '';

    init(game: Game) {
        this._uuid = new Date().getTime() + "-" + this.uuid;
        this.game = game;
        this.enabled = true;
        this.node.active = true;
        this.node.parent = game.node;
        this.spawnFish();
    }

    start() {
        let collider = this.getComponent(BoxCollider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
        }
    }

    unuse() {
        this._uuid = '';
    }

    private spawnFish() {
        // 种类
        let randomFish = Math.random() * this.game.totalWeight;
        let typeIndex = 0;
        let tmp = 0;
        for (; typeIndex < this.game.fishTypes.length; typeIndex++) {
            tmp += this.game.fishTypes[typeIndex].weight;
            if (tmp > randomFish) {
                break;
            }
        }
        this.fishType = this.game.fishTypes[typeIndex];
        // 位置
        this.startPosition = Utils.getOutPosition();
        this.node.position = this.startPosition;
        // 贝塞尔曲线第一个控制点，用来计算初始角度
        this.firstPosition = Utils.getInnerPosition();
        let k = Math.atan((this.firstPosition.y) / (this.firstPosition.x));
        this.node.angle = -k * 180 / Math.PI;
        this.node.getComponent(Sprite).spriteFrame = this.game.spAtlas.getSpriteFrame(this.fishType.name + '_run_0');
        this.odds = Utils.getValueRandom(this.fishType.oddsUp, this.fishType.oddsDown);
        this.multiple = Utils.getValueRandom(this.fishType.multipleUp, this.fishType.multipleDown);
        this.gotRate = Utils.getGetRate(this.odds, this.multiple, this.game.profitRate);
        this.fishState = FishState.alive;

        this.lastPosition = this.node.getPosition();
        this.changeCollider();
        this.anim.play(this.fishType.name + '_run');
        this.swimming();
    }

    // 重新设置碰撞区域
    private changeCollider() {
        let collider = this.node.getComponent(BoxCollider2D);
        collider.offset = v2(this.fishType.x, this.fishType.y);
        collider.size = new math.Size(this.fishType.w, this.fishType.h);
    }

    // 小鱼游泳，贝塞尔曲线实现
    private swimming() {
        let duration = Math.random() * 10 + 12;
        const tempVec3 = v3();
        const finalPos = Utils.getOutPosition();  // 终点
        const secondPos = Utils.getInnerPosition(); // 第二个控制点
        this.tween = tween(this.node).to(duration, { position: finalPos }, {
            onUpdate: (target, ratio) => {
                Utils.bezierCurve(ratio, this.startPosition, this.firstPosition, secondPos, finalPos, tempVec3);
                this.node.setPosition(tempVec3.clone());
            }
        })
            .call(() => {
                this.despawnFish();
            })
            .start();
    }

    protected update(dt: number): void {
        if (this.lastPosition) {
            let currentPos = this.node.getPosition();
            // 如果位移不超过1 直接销毁
            let ds = this.lastPosition.clone().subtract(currentPos).length();
            if (ds < 1) {
                return;
            }
            // 移动的方向向量
            // 求角度
            let dir = currentPos.clone().subtract(this.lastPosition);
            let angle = Utils.angle(dir, v3(1, 0))
            // 转为欧拉角
            let degree = angle / Math.PI * 180;
            this.node.angle = degree;
            this.lastPosition = currentPos;
            this.beAttack();
        }
    }

    private beAttack() {
        if (this.isDie()) {
            // 停止贝塞尔曲线动作
            this.tween.stop();
            let collider = this.node.getComponent(BoxCollider2D);
            collider.size = size(0, 0);
            // 播放金币动画，转为世界坐标
            let fp = this.node.parent.getComponent(UITransform).convertToWorldSpaceAR(this.node.position);
            if (this.odds > 0) {
                this.game.gainCoins(fp, this.odds * this.multiple, this.killerIndex);
                this.odds = 0;
            }
            // 死亡动画
            this.anim.play(this.fishType.name + '_die');
            if (this.fishType.name.includes('jinshayu')) {
                this.game.showMask();
                this.node.setSiblingIndex(999);
                const self = this;
                this.anim!.on(Animation.EventType.FINISHED, () => {
                    this.game.showBonus(() => {
                        self.game.hiddenMask();
                    });
                    self.despawnFish();
                }, this, true);
            } else {
                if (this.fishType.name.includes('shayu')) {
                    this.game.showMask();
                    this.node.setSiblingIndex(999);
                    this.bomb = instantiate(this.bombPreb);
                    this.bomb.getComponent(Bomb).show(this.node.position);
                    this.game.showCameraEasing();
                    this.anim!.on(Animation.EventType.FINISHED, () => {
                        this.game.hiddenMask();
                        this.despawnFish();
                    }, this, true);
                } else {
                    this.anim!.on(Animation.EventType.FINISHED, this.despawnFish, this, true);
                }
            }
        }
    }

    private despawnFish() {
        // 可以不移除节点，停止所有动作也可以完成
        this.node.active = false;
        this.tween.stop();
        this.game.despawnFish(this.node);
    }

    // 碰撞检测，鱼被打死的逻辑
    private isDie(): boolean {
        return this.fishState == FishState.dead;
    }

    private onCollisionEnter(self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null) {
        let net: Net = other.node.getComponent(Net);
        if (net) {
            if (net.master.weaponMode == 4) {
                if (net.master.targetUuid != this._uuid) {
                    // 追踪模式的网只对目标鱼产生伤害
                    return;
                }
            }
            let random = Math.random();
            if (this.fishState != FishState.dead && this.gotRate >= random) {
                this.fishState = FishState.dead;
                this.killerIndex = net.masterIndex;
            }
        }
    }
}
