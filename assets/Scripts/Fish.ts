import { _decorator, Component, Animation, Vec3, v3, Sprite, UITransform, BoxCollider2D, tween, math, Tween, Node, Contact2DType, Collider2D, IPhysics2DContact, size, v2, Prefab, instantiate, Widget, RichText, SpriteAtlas, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

import { FishState, FishType } from './config/FishType';
import Game from './Game';
import Net from './Net';
import { Utils } from './utils/Utils';
import { Bomb } from './Bomb'
import { Constant } from './config/Constant';
import { CombineFish } from './CombineFish';

@ccclass('Fish')
export default class Fish extends Component {

    // animation 这个属性声明类型，为了在编辑器面板显示类型
    @property(Animation) anim: Animation | null = null;
    @property(Prefab) bombPreb: Prefab | null = null;
    @property(Prefab) fishRingPreb: Prefab | null = null;
    @property(Prefab) fishPatternPrefab: Prefab;
    @property(Prefab) fishOddsPrefab: Prefab;
    @property(Prefab) fishBubblePrefab: Prefab;
    @property(SpriteFrame) stormNetSprite: SpriteFrame;
    @property(SpriteAtlas) moveAtlas: SpriteAtlas;

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
    // 三元四喜子节点集合
    patterns: Array<Node> = new Array();
    // 展示即时倍率的节点
    oddsNode: Node;
    // 泡泡的节点
    bubbleNode: Node;

    tween: Tween<Node | number> | undefined;
    killerIndex: number;

    gotRate: number = 0; // 捕获概率
    hp: number = 0; // 基础血量

    _uuid: string = '';
    hasRing = false;

    init(game: Game, type: FishType) {
        this._uuid = new Date().getTime() + "-" + this.uuid;
        this.game = game;
        this.fishType = type;
        this.enabled = true;
        this.node.active = true;
        this.node.parent = game.node;
        this.initFishType();
    }

    start() {
        let collider = this.getComponent(BoxCollider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
        }
    }

    unuse() {
        this._uuid = '';
        this.unschedule(this.scheduleOdds);
        if (this.patterns) {
            this.patterns.forEach(p => {
                p.removeFromParent();
                p.destroy();
            });
            this.patterns.splice(0);
        }
        if (this.bubbleNode) {
            this.bubbleNode.active = false;
        }
        if (this.oddsNode) {
            this.oddsNode.active = false;
        }
    }

    private initFishType() {
        this.fishState = FishState.alive;
        this.hp = this.fishType.baseHp;
        this.lastPosition = this.node.getPosition();

        if (this.fishType.group && this.fishType.group.length > 2) {
            this.anim.stop();
            this.node.getComponent(Sprite).spriteFrame = null;
            const len = Math.min(4, this.fishType.group.length);
            for (let i = 0; i < len; i++) {
                let pattern = instantiate(this.fishPatternPrefab);
                pattern.getComponent(CombineFish).init(this, this.fishType, i);
                this.patterns.push(pattern);
            }
        } else {
            this.node.getComponent(Sprite).spriteFrame = this.moveAtlas.getSpriteFrame(this.fishType.name + '_move1');
            this.changeCollider();
            this.anim.play('move_' + this.fishType.name);
        }
    }

    // 重新设置碰撞区域
    private changeCollider() {
        let collider = this.node.getComponent(BoxCollider2D);
        collider.offset = v2(this.fishType.x, this.fishType.y);
        collider.size = new math.Size(this.fishType.w, this.fishType.h);
    }

    performRing(enabledRing: boolean) {
        this.dealOdds();

        let ringNode = this.node.getChildByName('fishRing');
        if (ringNode == null) {
            ringNode = instantiate(this.fishRingPreb);
            this.node.addChild(ringNode);
        }
        if (this.odds * this.multiple < Constant.RING_ODDS_LIMIT && Math.random() <= Constant.RING_RATE && enabledRing && this.patterns.length <= 0) {
            // 倍率小于30的鱼，20%概率生成环
            this.hasRing = true;
            ringNode.active = true;
            let s = this.node.getComponent(BoxCollider2D).size;
            let diameter = Math.sqrt(Math.pow(s.x, 2) + Math.pow(s.y, 2)); // 环的直径取鱼矩形框的对角线
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

    private dealOdds() {

        if (this.fishType.appearance == 'odds') {
            if (this.oddsNode == null) {
                this.oddsNode = instantiate(this.fishOddsPrefab);
                this.node.addChild(this.oddsNode);
            }
            this.oddsNode.active = true;

            this.gotRate = Utils.getGetRate(this.fishType.oddsUp, this.fishType.multipleUp, Constant.profit_rate, 1);
            this.scheduleOdds();
            this.schedule(this.scheduleOdds, 1);
        } else if (this.fishType.appearance == 'bubble') {
            if (this.bubbleNode == null) {
                this.bubbleNode = instantiate(this.fishBubblePrefab);
                this.node.addChild(this.bubbleNode);
            }
            this.bubbleNode.active = true;

            this.odds = Utils.getValueRandom(this.fishType.oddsUp, this.fishType.oddsDown);
            this.multiple = Utils.getValueRandom(this.fishType.multipleUp, this.fishType.multipleDown);
            this.gotRate = Utils.getGetRate(this.odds, this.multiple, Constant.profit_rate, 1);
            this.anim.play('yiwangdajin');
            this.bubbleNode.getComponent(UITransform).setContentSize(size(160, 160));
        } else {
            this.odds = Utils.getValueRandom(this.fishType.oddsUp, this.fishType.oddsDown);
            this.multiple = Utils.getValueRandom(this.fishType.multipleUp, this.fishType.multipleDown);
            this.gotRate = Utils.getGetRate(this.odds, this.multiple, Constant.profit_rate, this.hasRing ? Constant.RING_MAX_GET : 1);
        }
    }

    private scheduleOdds() {
        if (this.oddsNode) {
            this.odds = Utils.getValueRandom(this.fishType.oddsUp, this.fishType.oddsDown);
            this.multiple = Utils.getValueRandom(this.fishType.multipleUp, this.fishType.multipleDown);

            let str = (this.odds * this.multiple).toString();
            let nums = str.split('');

            let richText = this.oddsNode.getComponent(RichText);
            let text = `<b>倍率: </b><img src=\'goldnum_x\'/>`;
            nums.forEach(n => {
                text += `<img src=\'goldnum_${n}\'/>`;
            });
            richText.string = text;

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
            let angle = Utils.angle(dir, v3(this.fishType.dirx, this.fishType.diry));
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
            } else if (this.fishType.name == "yiwangdajin") {
                let fp = this.node.parent.getComponent(UITransform).convertToWorldSpaceAR(this.node.position);
                const getItem = () => {
                    this.despawnFish();
                    this.game.gainYiwangdajin(this.killerIndex, fp);
                }
                this.tween.stop();
                this.scheduleOnce(getItem, 0.5);
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

    dieNow(killer: number) {
        this.fishState = FishState.dead;
        this.killerIndex = killer;
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
        } else if (this.fishType.name.includes('shayu')) {
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
            this.tween.stop();
            this.scheduleOnce(this.despawnFish, 1.5);
            // 集宝箱
            if (this.fishType.appearance == 'treasure') {
                this.game.collectTreasures(this.killerIndex, fp);
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

    onCollisionEnter(self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null) {
        let net: Net = other.node.getComponent(Net);
        if (net) {
            if (net.master.weaponMode == 2) {
                if (net.master.targetUuid != this._uuid) {
                    // 追踪模式的网只对目标鱼产生伤害
                    return;
                }
            } 
            if (net.master.itemName != '') {
                // 有道具效果，碰撞交给子弹或网来处理
                return;
            }

            if (this.hp > 0) {
                this.hp -= net.master.weaponDamage;
                return;
            }

            let random = math.pseudoRandomRange(Math.random() * new Date().getTime(), 0, 1);
            if (this.fishState == FishState.alive && this.gotRate >= random) {
                this.dieNow(net.masterIndex);
            }
        }
    }
}
