// /*
//  * @Author: your name
//  * @Date: 2019-12-18 22:20:56
//  * @LastEditTime: 2020-02-17 18:34:37
//  * @LastEditors: Please set LastEditors
//  * @Description: In User Settings Edit
//  * @FilePath: \CourseFishd:\cocos20\CCFish\assets\Script\Bullet.ts
//  */

import { _decorator, Component, UITransform, math, Director, Sprite, screen, v3, find, Collider2D, IPhysics2DContact, BoxCollider2D, Contact2DType } from 'cc';
const { ccclass, property } = _decorator;

import Game from './Game';

@ccclass('Bullet')
export default class Bullet extends Component {
//    // 子弹初始角度
    angle: number = 0;
    game: Game;
//    // 子弹攻击力，基础攻击力
    private attack: number = 4;
//    // 子弹速度
    @property
    speed: number = 10;
    bulletLeve: number = 1;
    shot(game: Game, level: number) {
        this.game = game;
       // 启动update函数
        this.enabled = true;
        let weaponSite = game.weaponNode.parent.getComponent(UITransform).convertToWorldSpaceAR(game.weaponNode.getPosition());
        this.angle = -game.weaponNode.angle;
        this.node.angle = -this.angle;
        this.setBullet(level);
        this.node.parent = find('Canvas');
        let bpos = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(weaponSite);
        this.node.position = bpos;
    }

    protected start(): void {
        let collider = this.getComponent(BoxCollider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
        }
    }
//    // 根据武器等级设置子弹等级
    setBullet(level: number) {
        this.bulletLeve = level;
        this.node.getComponent(Sprite).spriteFrame = this.game.spAtlas.getSpriteFrame('bullet' + this.bulletLeve);
    }
    update(dt) {
        let bx = this.node.position.x;
        let by = this.node.position.y;
        bx += dt * this.speed * Math.sin(this.angle / 180 * 3.14);
        by += dt * this.speed * Math.cos(this.angle / 180 * 3.14);
        this.node.setPosition(bx, by);

        // if (this.node.position.x > screen.windowSize.width + 100
        // || this.node.position.x < -100
        // || this.node.position.y > screen.windowSize.height + 100
        // || this.node.position.y < 0
        // ) {
        // this.game.despawnBullet(this.node);
        // }
    }
    onCollisionEnter(self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null) {
       // 矩形碰撞组件顶点坐标，左上，左下，右下，右上
        let posb = self.worldAABB.center;

        this.game.castNet(posb);
        this.game.despawnBullet(this.node);
        
    }

    getAttackValue(): number {
        return this.attack * this.bulletLeve;
    }
}


/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// /*
//  * @Author: your name
//  * @Date: 2019-12-18 22:20:56
//  * @LastEditTime: 2020-02-17 18:34:37
//  * @LastEditors: Please set LastEditors
//  * @Description: In User Settings Edit
//  * @FilePath: \CourseFishd:\cocos20\CCFish\assets\Script\Bullet.ts
//  */
// import Game from './Game';
// const { ccclass, property } = cc._decorator;
// 
// @ccclass
// export default class Bullet extends cc.Component {
//     // 子弹初始角度
//     angle: number = 0;
// 
//     game: Game;
// 
//     // 子弹攻击力，基础攻击力
//     private attack: number = 4;
// 
//     // 子弹速度
//     @property
//     speed: number = 10;
// 
//     bulletLeve: number = 1;
// 
//     shot(game: Game, level: number) {
//         this.game = game;
//         // 启动update函数
//         this.enabled = true;
//         let weaponSite = game.weaponNode.parent.convertToWorldSpaceAR(game.weaponNode.getPosition());
//         this.angle = -game.weaponNode.angle;
//         this.node.angle = -this.angle;
//         let bpos = cc.v2(weaponSite.x + 50 * Math.sin(this.angle / 180 * 3.14), weaponSite.y + 50 * Math.cos(this.angle / 180 * 3.14));
//         this.setBullet(level);
//         this.node.position = bpos;
//         this.node.parent = cc.director.getScene();
//     }
// 
//     // 根据武器等级设置子弹等级
//     setBullet(level: number) {
//         this.bulletLeve = level;
//         this.node.getComponent(cc.Sprite).spriteFrame = this.game.spAtlas.getSpriteFrame('bullet' + this.bulletLeve);
//     }
// 
//     update(dt) {
//         let bx = this.node.x;
//         let by = this.node.y;
//         bx += dt * this.speed * Math.sin(this.angle / 180 * 3.14);
//         by += dt * this.speed * Math.cos(this.angle / 180 * 3.14);
//         this.node.x = bx;
//         this.node.y = by;
// 
//         if (this.node.x > cc.winSize.width + 100
//             || this.node.x < -100
//             || this.node.y > cc.winSize.height + 100
//             || this.node.y < 0
//         ) {
//             this.game.despawnBullet(this.node);
//         }
//     }
//     onCollisionEnter(other, self) {
//         // 矩形碰撞组件顶点坐标，左上，左下，右下，右上
//         let posb = self.world.points;
//         // 取左上和右上坐标计算中点当做碰撞中点
//         let posNet = posb[0].add(posb[3]).mul(0.5);
//         this.game.castNet(posNet);
//         this.game.despawnBullet(this.node);
//     }
// 
//     getAttackValue(): number {
//         return this.attack * this.bulletLeve;
//     }
// }
