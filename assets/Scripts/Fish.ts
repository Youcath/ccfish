import { _decorator, Component, Animation, Vec3, v3, Sprite, UITransform, BoxCollider2D, tween, math, Tween, Node, Contact2DType, Collider2D, IPhysics2DContact, size, v2, Prefab, instantiate, System, sys, Size, Widget } from 'cc';
const { ccclass, property } = _decorator;

import { FishState, FishType } from './config/FishType';
import Game from './Game';
import Net from './Net';
import { Utils } from './utils/Utils';
import { Bomb } from './Bomb'
import { Constant } from './config/Constant';

@ccclass('Fish')
export default class Fish extends Component {
    // animation 这个属性声明类型，为了在编辑器面板显示类型
    @property(Animation) anim: Animation | null = null;
    @property(Prefab) bombPreb: Prefab | null = null;
    @property(Prefab) subFishPreb: Prefab | null = null;

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

    tween: Tween<Node | number> | undefined;
    killerIndex: number;

    gotRate: number = 0; // 捕获概率

    _uuid: string = '';
    hasRing = false;

    init(game: Game, type: FishType) {
        this._uuid = new Date().getTime() + "-" + this.uuid;
        this.game = game;
        this.fishType = type;
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
        this.node.getComponent(Sprite).spriteFrame = this.game.spAtlas.getSpriteFrame(this.fishType.name + '_run_0');
        this.odds = Utils.getValueRandom(this.fishType.oddsUp, this.fishType.oddsDown);
        this.multiple = Utils.getValueRandom(this.fishType.multipleUp, this.fishType.multipleDown);
        this.gotRate = Utils.getGetRate(this.odds, this.multiple, Constant.profit_rate, this.hasRing ? Constant.RING_MAX_GET : 1);
        this.fishState = FishState.alive;

        this.lastPosition = this.node.getPosition();
        this.changeCollider();
        this.anim.play(this.fishType.name + '_run');
    }

    // 重新设置碰撞区域
    private changeCollider() {
        let collider = this.node.getComponent(BoxCollider2D);
        collider.offset = v2(this.fishType.x, this.fishType.y);
        collider.size = new math.Size(this.fishType.w, this.fishType.h);
    }

    performRing(enabledRing: boolean) {
        let ringNode = this.node.getChildByName('subFish');
        if (ringNode == null) {
            ringNode = instantiate(this.subFishPreb);
            this.node.addChild(ringNode);
        }
        if (this.odds * this.multiple < Constant.RING_ODDS_LIMIT && Math.random() <= Constant.RING_RATE && enabledRing) {
            // 倍率小于30的鱼，20%概率生成环
            this.hasRing = true;
            ringNode.active = true;
            let s = this.node.getComponent(UITransform).contentSize;
            let diameter = Math.max(s.x, s.y); // 环的直径取鱼矩形框的长边
            ringNode.getComponent(UITransform).setContentSize(size(diameter, diameter));
            let w = ringNode.getComponent(Widget);
            w.horizontalCenter = this.fishType.x; // 根据碰撞体积的中心偏移调整圆心位置
            w.verticalCenter = this.fishType.y;

            tween(ringNode).to(6, { angle: 360 }).to(6, { angle: 0 }).union().repeatForever().start(); // 圆环永久旋转
        } else {
            ringNode.active = false;
            this.hasRing = false;
        }
    }

    // 小鱼游泳，贝塞尔曲线实现
    swimmingBezier(startPos: Vec3, finalPos: Vec3, firstPos: Vec3, secondPos: Vec3, duration: number, delay?: number) {
        // 位置
        this.startPosition = startPos;
        this.node.position = this.startPosition;
        // 贝塞尔曲线第一个控制点，用来计算初始角度
        this.firstPosition = firstPos;
        let k = Math.atan((this.firstPosition.y) / (this.firstPosition.x));
        this.node.angle = -k * 180 / Math.PI;
        const tempVec3 = v3();
        this.tween = tween(this.node).delay(delay).to(duration, { position: finalPos }, {
            onUpdate: (target, ratio) => {
                Utils.bezierCurve(ratio, this.startPosition, this.firstPosition, secondPos, finalPos, tempVec3);
                this.node.setPosition(tempVec3.clone());
            }
        }).union()
            .call(() => {
                this.despawnFish();
            })
            .start();
    }

    swimmingLinear(startPos: Vec3, byPos: Vec3, finalPos: Vec3, duration: number) {
        this.node.position = startPos;
        this.tween = tween(this.node)
            .to(duration, { position: byPos })
            .delay(10.0)
            .to(duration, { position: finalPos })
            .union()
            .call(() => {
                this.despawnFish();
            })
            .start();
    }

    swimmingCircle(startAngle: number, radium: number, duration: number) {
        this.node.active = false;
        const self = this;
        this.tween = tween(this.node)
            .to(duration, { position: v3(Math.cos(startAngle) * radium, Math.sin(startAngle) * radium) }, {
                onUpdate(target: Node, ratio: number) {
                    self.node.setPosition(v3(Math.cos(-4 * Math.PI * ratio + startAngle) * radium, Math.sin(-4 * Math.PI * ratio + startAngle) * radium));
                    if (-4 * Math.PI * ratio + startAngle < 0) {
                        self.node.active = true;
                    }
                },
            })
            .to(3, { position: v3(Math.cos(startAngle) * 1000, Math.sin(startAngle) * 1000) })
            .union()
            .call(() => {
                this.despawnFish();
            })
            .start();
    }

    protected update(dt: number): void {
        if (this.lastPosition) {
            if (this.isDying()) {
                // dying不需要移动位置
                return;
            }
            let currentPos = this.node.getPosition();
            // 如果位移不超过1 直接销毁
            let ds = this.lastPosition.clone().subtract(currentPos).length();
            if (ds < 0.00001) {
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

            if (this.hasRing) {
                this.fishState = FishState.dying;
                this.game.fishManager.ringFishedGet(this, this.killerIndex);
            } else {
                this.performNormalDie();
            }
        }
    }

    dyingNow() {
        this.fishState = FishState.dying;
        this.tween.stop();
        let collider = this.node.getComponent(BoxCollider2D);
        collider.size = size(0, 0);
    }

    private performNormalDie() {
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

    performReceiveAnim(finalPos: Vec3) {
        tween(this.node).to(2, {
            position: finalPos
        }).start();
    }

    public despawnFish() {
        // 可以不移除节点，停止所有动作也可以完成
        this.node.active = false;
        this.tween.stop();
        this.game.trySwitchTargetNow(this.node);
        this.game.despawnFish(this.node);
    }

    private isDie(): boolean {
        return this.fishState == FishState.dead;
    }

    private isDying() {
        return this.fishState == FishState.dying;
    }

    private onCollisionEnter(self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null) {
        let net: Net = other.node.getComponent(Net);
        if (net) {
            if (net.master.weaponMode == 4) {
                if (net.master.targetUuid != this._uuid) {
                    // 追踪模式的网只对目标鱼产生伤害
                    return;
                }
            } else if (net.master.weaponMode == 2) {
                if (this.fishState == FishState.alive && this.odds * this.multiple < 30) {
                    this.fishState = FishState.dead;
                    this.killerIndex = net.masterIndex;
                }
                return;
            }
            let random = math.pseudoRandomRange(Math.random() * new Date().getTime(), 0, 1);
            if (this.fishState == FishState.alive && this.gotRate >= random) {
                this.fishState = FishState.dead;
                this.killerIndex = net.masterIndex;
            }
        }
    }
}
