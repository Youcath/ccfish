import { _decorator, Component, Animation, Vec3, v3, Sprite, find, UITransform, BoxCollider2D, tween, math, Tween, Node, log, Contact2DType, Collider2D, IPhysics2DContact, size, v2 } from 'cc';
const { ccclass, property } = _decorator;

import { FishState, FishType } from './FishType';
import Game from './Game';
import Bullet from './Bullet';
import Net from './Net';
import { Utils } from './Utils';
import { Bomb } from './Bomb'
import { GoldBonus } from './GoldBonus'


@ccclass('Fish')
export default class Fish extends Component {
    // animation 这个属性声明类型，为了在编辑器面板显示类型
    @property(Animation) anim: Animation | null = null;

    // 爆炸
    bomb: Node;
    // 金币奖励
    gold_bonus: Node;
    // Health point 血量 默认10
    hp: number = 10;
    // gold 打死掉落金币数量
    gold: number = 2;
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

    init(game: Game) {
        this.game = game;
        this.enabled = true;
        this.node.active = true;
        this.node.parent = game.node;
        this.bomb = this.node.getChildByName('bomb');
        this.gold_bonus = this.node.getChildByName('gold_bonus');
        this.spawnFish();
    }

    start() {
        let collider = this.getComponent(BoxCollider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
        }

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
        // 取出鱼的血量
        this.hp = this.fishType.hp;
        // 掉落金币
        this.gold = this.fishType.gold;
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
        let duration = Math.random() * 8 + 8;
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
            this.anim.play(this.fishType.name + '_die');
            if (this.fishType.name.includes('shayu')) {
    
                // 展示蒙层
                this.game.showMask();
                this.node.setSiblingIndex(999);
                this.bomb.getComponent(Bomb).show(this.node.position);
                this.game.showCameraEasing();
            }
            const self = this;
            const commonCallback = () => {
                self.game.hiddenMask();
                self.despawnFish();
            };
            // 被打死的动画播放完成之后回调
            this.anim!.on(Animation.EventType.FINISHED, () => {
                
                if (self.fishType.name.includes('shayu')) {
                    const fishType = self.fishType.name;
                    if (fishType.includes('jinshayu')) {
                        this.node.active = false;
                        this.gold_bonus.getComponent(GoldBonus).show(commonCallback);
                    } else {
                        commonCallback();
                    }
                } else {
                    self.despawnFish();
                }
            }, this);    
            // 播放金币动画，转为世界坐标
            let fp = this.node.parent.getComponent(UITransform).convertToWorldSpaceAR(this.node.position);
            if (this.gold > 0) {
                this.game.gainCoins(fp, this.gold, this.killerIndex);
                this.gold = 0;
            }
        }
    }

    private despawnFish() {
        // 可以不移除节点，停止所有动作也可以完成
        this.node.active = false;
        this.tween.stop();
        this.game.despawnFish(this.node);
        log('despawn one Fish.');
    }

    // 碰撞检测，鱼被打死的逻辑
    private isDie(): boolean {
        return this.fishState == FishState.dead;
    }

    private onCollisionEnter(self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null) {
        let bullet: Bullet = other.node.getComponent(Bullet);
        if (bullet) {
            if (bullet.master.weaponMode == 1) {
                this.hp -= bullet.getAttackValue();
                if (this.hp <= 0) {
                    this.fishState = FishState.dead;
                    this.killerIndex = bullet.masterIndex;
                }
                return;
            }
        }
        let net: Net = other.node.getComponent(Net);
        if (net) {
            let dmg = net.getAttackValue();
            if (net.game.weaponMode == 2) {
                dmg *= 2;
            }
            this.hp -= dmg;
            if (this.hp <= 0) {
                this.fishState = FishState.dead;
                this.killerIndex = net.masterIndex;
            }
        }
    }
}
