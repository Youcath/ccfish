import { _decorator, Component, Animation, Vec3, v3, Sprite, find, UITransform, BoxCollider2D, screen, bezierByTime, bezier, tween, math, Tween, Node, log } from 'cc';
const { ccclass, property } = _decorator;

import { FishState, FishType } from './FishType';
import Game from './Game';
import Bullet from './Bullet';

@ccclass('Fish')
export default class Fish extends Component {
//    // animation 这个属性声明类型，为了在编辑器面板显示类型
    @property(Animation)
    anim: Animation | null = null;//显示申明类型，才能有代码提示
//    // Health point 血量 默认10
    hp: number = 10;
//    // gold 打死掉落金币数量
    gold: number = 2;
//    // fish state 鱼的生命状态，默认都是活的
    fishState: FishState = FishState.alive;
//    // 保存上一次坐标,用于更新角度
    lastPosition: Vec3;
    fishType: FishType;
//    //暂存game实例
    game: Game;
    bezier1: Vec3[] = [v3(50, -100), v3(300, -400), v3(1800, -650)];
    bezier2: Vec3[] = [v3(100, -200), v3(400, -300), v3(1800, -600)];
    bezier3: Vec3[] = [v3(150, -300), v3(600, -400), v3(1800, -500)];
    bezier4: Vec3[] = [v3(50, 50), v3(400, 100), v3(1800, 200)];
    bezier5: Vec3[] = [v3(80, 200), v3(300, 500), v3(1800, 650)];
    bezier6: Vec3[] = [v3(100, 100), v3(350, 400), v3(1800, 500)];
    bezier7: Vec3[] = [v3(100, 2), v3(350, -2), v3(1800, 0)];
    bezierArray = new Array();
    readonly bezierCurve = (t: number, p1: Vec3, cp1: Vec3, cp2: Vec3, p2: Vec3, out: Vec3) => {
        out.x = bezier(p1.x, cp1.x, cp2.x, p2.x, t);
        out.y = bezier(p1.y, cp1.y, cp2.y, p2.y, t);
        out.z = bezier(p1.z, cp1.z, cp2.z, p2.z, t);
    }
    tween: Tween<Node> | undefined;

    init(game: Game) {
        this.bezierArray.push(this.bezier1);
        this.bezierArray.push(this.bezier2);
        this.bezierArray.push(this.bezier3);
        this.bezierArray.push(this.bezier4);
        this.bezierArray.push(this.bezier5);
        this.bezierArray.push(this.bezier6);
        this.bezierArray.push(this.bezier7);
        this.game = game;
        this.enabled = true;
        this.spawnFish(game);
    }
//    // spawnFish(fishType:FishType) {
    spawnFish(game: Game) {
        let fishStr = game.fishTypes.length;
        let randomFish = Math.floor(Math.random() * fishStr);
        this.fishType = game.fishTypes[randomFish];
       // this.node.position = cc.v3(-cc.random0To1()*100-200, cc.randomMinus1To1() * 300 + 350);
        let pos = v3(-Math.random() * 100 - 200, (Math.random() - 0.5) * 2 * 300 + 350);
        this.node.position = find('Canvas').getComponent(UITransform).convertToNodeSpaceAR(pos);
        let index = Math.floor(Math.random() * this.bezierArray.length);
        let bezier = this.bezierArray[index];
       // 贝塞尔曲线第一个控制点，用来计算初始角度
        let firstp = bezier[0];
        let k = Math.atan((firstp.y) / (firstp.x));
        this.node.angle = -k * 180 / 3.14;
        this.node.getComponent(Sprite).spriteFrame = this.game.spAtlas.getSpriteFrame(this.fishType.name + '_run_0');
       // 取出鱼的血量
        this.hp = this.fishType.hp;
       // 掉落金币
        this.gold = this.fishType.gold;
        this.fishState = FishState.alive;
        this.anim.play(this.fishType.name + '_run');
       // 加到canvas节点下才可以设置zorder
       // 默认zorder为0，bg设为-1，炮台设为1
        this.node.parent = find('Canvas');
        this.lastPosition = this.node.getPosition();
        this.changeCollider();
        this.swimming(bezier);

    }
//    // 重新设置碰撞区域
    changeCollider() {
        let collider = this.node.getComponent(BoxCollider2D);
        let contentSize = this.node.getComponent(UITransform).contentSize;
        collider.size = contentSize;
    }
//    // 小鱼游泳，贝塞尔曲线实现
    swimming(trace: any) {
        let windowSize = screen.windowSize;
       // var bezier = [cc.v3(100, -200), cc.v3(400, -500), cc.v3(1500, -600)];
        let speed = Math.random() * 10 + 10;
        const tempVec3 = v3();
        this.tween = tween(this.node).to(speed, { position: trace[2] }, { onUpdate: (target, ratio) => {
            this.bezierCurve(ratio, v3(), trace[0], trace[1], trace[2], tempVec3);
            this.node.setPosition(tempVec3);
        }}).start();

    }
    onLoad() {
    }
    update(dt) {
        this.updateDegree();
    }
    updateDegree() {
        let currentPos = this.node.getPosition();
       // 如果位移不超过1，不改变角度
        if (this.lastPosition.subtract(currentPos).length() < 1) {
            return;
        }
       // 移动的方向向量
       // 求角度
       let dir = currentPos.subtract(this.lastPosition);
    
        let angle = Game.angle(dir, v3(1, 0))// dir.signAngle(cc.v3(1, 0));
       // 转为欧拉角
        let degree = angle / Math.PI * 180;
        this.node.angle = -degree;
        this.lastPosition = currentPos;
        this.beAttack();
    }


    
    beAttack() {
        if (this.isDie()) {
           // 停止贝塞尔曲线动作
           this.tween.stop();

           //播放死亡动画
        let animState = this.anim.play(this.fishType.name + '_die');
           // 被打死的动画播放完成之后回调
           this.anim!.on(Animation.EventType.FINISHED, this.dieCallback, this);
           // 播放金币动画
           // 转为世界坐标
        let fp = this.node.parent.getComponent(UITransform).convertToWorldSpaceAR(this.node.position);
        this.game.gainCoins(fp, this.gold);
        } else {
           // 跑出屏幕的鱼自动回收
        this.despawnFish();
        }
    }
    dieCallback() {
       // 死亡动画播放完回收鱼
        log('fish die');
        this.tween.stop();
        this.game.despawnFish(this.node);
    }
    despawnFish() {
        if (this.node.getPosition().x > 900
        || this.node.getPosition().x < -1000
        || this.node.getPosition().y > 600
        || this.node.getPosition().y < -900
        ) {
           // this.node.removeFromParent();
           // 可以不移除节点，停止所有动作也可以完成
           this.tween.stop();
            this.game.despawnFish(this.node);
        }
    }
//    // 碰撞检测，鱼被打死的逻辑
    isDie(): boolean {
        if (this.fishState == FishState.dead) {
        return true;
        }
        return false;
    }
    onCollisionEnter(other, self) {
        let bullet = <Bullet>other.node.getComponent(Bullet);
        this.hp -= bullet.getAttackValue();
        if (this.hp <= 0) {
        this.fishState = FishState.dead;
        }
    }
}


/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// import { FishState, FishType } from './FishType';
// import Game from './Game';
// import Bullet from './Bullet';
// import Fluxay from './FluxayFrag';
// const { ccclass, property } = cc._decorator;
// 
// 
// 
// @ccclass
// export default class Fish extends cc.Component {
// 
//     // animation 这个属性声明类型，为了在编辑器面板显示类型
//     @property(cc.Animation)
//     anim: cc.Animation = null;//显示申明类型，才能有代码提示
// 
//     // Health point 血量 默认10
//     hp: number = 10;
//     // gold 打死掉落金币数量
//     gold: number = 2;
// 
//     // fish state 鱼的生命状态，默认都是活的
//     fishState: FishState = FishState.alive;
// 
//     // 保存上一次坐标,用于更新角度
//     lastPosition: cc.Vec3;
// 
//     fishType: FishType;
// 
//     //暂存game实例
//     game: Game;
// 
//     bezier1: cc.Vec3[] = [cc.v3(50, -100), cc.v3(300, -400), cc.v3(1800, -650)];
//     bezier2: cc.Vec3[] = [cc.v3(100, -200), cc.v3(400, -300), cc.v3(1800, -600)];
//     bezier3: cc.Vec3[] = [cc.v3(150, -300), cc.v3(600, -400), cc.v3(1800, -500)];
//     bezier4: cc.Vec3[] = [cc.v3(50, 50), cc.v3(400, 100), cc.v3(1800, 200)];
//     bezier5: cc.Vec3[] = [cc.v3(80, 200), cc.v3(300, 500), cc.v3(1800, 650)];
//     bezier6: cc.Vec3[] = [cc.v3(100, 100), cc.v3(350, 400), cc.v3(1800, 500)];
//     bezier7: cc.Vec3[] = [cc.v3(100, 2), cc.v3(350, -2), cc.v3(1800, 0)];
//     bezierArray = new Array();
// 
//     init(game: Game) {
//         this.bezierArray.push(this.bezier1);
//         this.bezierArray.push(this.bezier2);
//         this.bezierArray.push(this.bezier3);
//         this.bezierArray.push(this.bezier4);
//         this.bezierArray.push(this.bezier5);
//         this.bezierArray.push(this.bezier6);
//         this.bezierArray.push(this.bezier7);
//         this.game = game;
//         this.enabled = true;
//         this.spawnFish(game);
//     }
// 
//     // spawnFish(fishType:FishType) {
//     spawnFish(game: Game) {
//         let fishStr = game.fishTypes.length;
//         let randomFish = Math.floor(Math.random() * fishStr);
//         this.fishType = game.fishTypes[randomFish];
//         // this.node.position = cc.v3(-cc.random0To1()*100-200, cc.randomMinus1To1() * 300 + 350);
//         let pos = cc.v3(-Math.random() * 100 - 200, (Math.random() - 0.5) * 2 * 300 + 350);
//         this.node.position = cc.find('Canvas').convertToNodeSpaceAR(pos);
//         let index = Math.floor(Math.random() * this.bezierArray.length);
//         let bezier = this.bezierArray[index];
//         // 贝塞尔曲线第一个控制点，用来计算初始角度
//         let firstp = bezier[0];
//         let k = Math.atan((firstp.y) / (firstp.x));
//         this.node.angle = -k * 180 / 3.14;
//         this.node.getComponent(cc.Sprite).spriteFrame = this.game.spAtlas.getSpriteFrame(this.fishType.name + '_run_0');
//         // 取出鱼的血量
//         this.hp = this.fishType.hp;
//         // 掉落金币
//         this.gold = this.fishType.gold;
//         this.fishState = FishState.alive;
//         this.anim.play(this.fishType.name + '_run');
//         // 加到canvas节点下才可以设置zorder
//         // 默认zorder为0，bg设为-1，炮台设为1
//         this.node.parent = cc.find('Canvas');
//         this.lastPosition = this.node.getPosition();
//         this.changeCollider();
//         this.swimming(bezier);
// 
//     }
// 
//     // 重新设置碰撞区域
//     changeCollider() {
//         let collider = this.node.getComponent(cc.BoxCollider);
//         collider.size = this.node.getContentSize();
//     }
// 
//     // 小鱼游泳，贝塞尔曲线实现
//     swimming(trace: any) {
//         let windowSize = cc.winSize;
//         // var bezier = [cc.v3(100, -200), cc.v3(400, -500), cc.v3(1500, -600)];
//         let speed = Math.random() * 10 + 10;
//         let bezerby = cc.bezierBy(speed, trace);
//         this.node.runAction(bezerby);
//     }
// 
//     onLoad() {
//     }
// 
//     update(dt) {
//         // this.updateDegree();
//         this.updateDegree();
//     }
// 
//     updateDegree() {
//         let currentPos = this.node.getPosition();
//         // 如果位移不超过1，不改变角度
//         if (this.lastPosition.sub(currentPos).mag() < 1) {
//             return;
//         }
//         // 移动的方向向量
//         let dir = currentPos.sub(this.lastPosition);
//         // 求角度
//         let angle = cc.v3(dir).signAngle(cc.v3(1, 0))// dir.signAngle(cc.v3(1, 0));
//         // 转为欧拉角
//         let degree = angle / Math.PI * 180;
//         this.node.angle = -degree;
//         this.lastPosition = currentPos;
//         this.beAttack();
//     }
//     
//     beAttack() {
//         if (this.isDie()) {
//             // 停止贝塞尔曲线动作
//             this.node.stopAllActions();
//             //播放死亡动画
//             let animState = this.anim.play(this.fishType.name + '_die');
//             // 被打死的动画播放完成之后回调
//             animState.on('finished', this.dieCallback, this);
//             // 播放金币动画
//             // 转为世界坐标
//             let fp = this.node.parent.convertToWorldSpaceAR(this.node.position);
//             this.game.gainCoins(fp, this.gold);
//         } else {
//             // 跑出屏幕的鱼自动回收
//             this.despawnFish();
//         }
//     }
// 
//     dieCallback() {
//         // 死亡动画播放完回收鱼
//         cc.log('fish die');
//         this.node.stopAllActions();
//         this.game.despawnFish(this.node);
//     }
// 
//     despawnFish() {
//         if (this.node.x > 900
//             || this.node.x < -1000
//             || this.node.y > 600
//             || this.node.y < -900
//         ) {
//             // this.node.removeFromParent();
//             // 可以不移除节点，停止所有动作也可以完成
//             this.node.stopAllActions();
//             this.game.despawnFish(this.node);
//         }
//     }
// 
//     // 碰撞检测，鱼被打死的逻辑
//     isDie(): boolean {
//         if (this.fishState == FishState.dead) {
//             return true;
//         }
//         return false;
//     }
// 
//     onCollisionEnter(other, self) {
//         let bullet = <Bullet>other.node.getComponent(Bullet);
//         this.hp -= bullet.getAttackValue();
//         if (this.hp <= 0) {
//             this.fishState = FishState.dead;
//         }
//     }
// 
// }
