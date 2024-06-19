// /*
//  * @Author: your name
//  * @Date: 2019-12-18 22:20:56
//  * @LastEditTime: 2020-02-17 18:34:37
//  * @LastEditors: Please set LastEditors
//  * @Description: In User Settings Edit
//  * @FilePath: \CourseFishd:\cocos20\CCFish\assets\Script\Bullet.ts
//  */

import { _decorator, Component, UITransform, Sprite, find, Collider2D, IPhysics2DContact, BoxCollider2D, Contact2DType, Vec3, v2, v3 } from 'cc';
const { ccclass, property } = _decorator;

import Game from './Game';
import Net from './Net';
import { Player } from './Player';
import { Utils } from './utils/Utils';

@ccclass('Bullet')
export default class Bullet extends Component {
    //    // 子弹初始角度
    angle: number = 0;
    game: Game;
    //    // 子弹攻击力，基础攻击力
    private attack: number = 1;
    //    // 子弹速度
    @property
    speed: number = 10;
    bulletLeve: number = 1;
    master: Player;
    masterIndex: number; // 属于第几位玩家的子弹
    target: Vec3 | undefined;
    shot(game: Game, level: number, master: Player) {
        this.game = game;
        this.master = master;
        this.masterIndex = master.playerIndex;
        // 启动update函数
        this.enabled = true;
        let weaponSite = master.weaponNode.parent.getComponent(UITransform).convertToWorldSpaceAR(master.weaponNode.getPosition());
        this.angle = -master.weaponNode.parent.angle - master.weaponNode.angle;
        this.node.angle = -this.angle;
        this.setBullet(level);
        this.node.parent = find('Canvas');
        let bpos = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(weaponSite);
        this.node.position = bpos;
    }

    setTarget(target: Vec3) {
        this.target = target;
    }

    protected start(): void {
        let collider = this.getComponent(BoxCollider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
        }
    }
    //  根据武器等级设置子弹等级
    setBullet(level: number) {
        this.bulletLeve = level;
        this.node.getComponent(Sprite).spriteFrame = this.game.spAtlas.getSpriteFrame('bullet' + this.bulletLeve);
    }
    update(dt) {
        let speedRate = 1;
        let bx = this.node.position.x;
        let by = this.node.position.y;
        if (this.master.weaponMode == 3) {
            // 穿透弹速度减半
            speedRate = 0.5;
        } else if (this.master.weaponMode == 4) {
            let targetNode = this.game.fishes.get(this.master.targetUuid);
            let targetPos = targetNode.getPosition();
            let dir = targetPos.clone().subtract(this.node.position);
            if (dir.length() < 8) {
                let workPos = find('Canvas').getComponent(UITransform).convertToWorldSpaceAR(targetPos);
                this.master.castNet(v2(workPos.x, workPos.y));
                this.master.despawnBullet(this.node);
                return;
            }
            // 计算夹角，这个夹角是带方向的
            let angle = Utils.angle(dir, v3(0, 1));
            //将弧度转换为欧拉角
            let degree = angle / Math.PI * 180;
            this.angle = -degree;
            this.node.angle = -this.angle;
        }

        bx += dt * this.speed * Math.sin(this.angle / 180 * Math.PI) * speedRate;
        by += dt * this.speed * Math.cos(this.angle / 180 * Math.PI) * speedRate;

        if (this.master.weaponMode != 4) {
            if (bx > 640) {
                // 到达右边界
                this.angle = -this.angle;
                bx = 640;
                this.node.angle = -this.angle;
            } else if (bx < -640) {
                // 到达左边界
                this.angle = -this.angle;
                bx = -640;
                this.node.angle = -this.angle;
            } else if (by > 360) {
                // 到达上边界
                this.angle = 180 - this.angle;
                by = 360;
                this.node.angle = -this.angle;
            } else if (by < -360) {
                // 到达下边界
                this.angle = 180 - this.angle;
                by = -360;
                this.node.angle = -this.angle;
            }
        }
        this.node.setPosition(bx, by);

        if (this.master.weaponMode == 3 && this.target instanceof Vec3) {
            if (this.node.getPosition().clone().subtract(this.target).length() < 8) {
                let p = this.node.parent.getComponent(UITransform).convertToWorldSpaceAR(this.target);
                this.master.castNet(v2(p.x, p.y));
                this.master.despawnBullet(this.node);
                return;
            }
        }


        if (this.node.getPosition().x >= 900
            || this.node.getPosition().x <= -900
            || this.node.getPosition().y >= 600
            || this.node.getPosition().y <= -600
        ) {
            // 跑出屏幕的子弹自动回收，保护代码，通常不会走进来
            this.master.oneBullet = null;
            this.master.despawnBullet(this.node);
        }
    }
    onCollisionEnter(self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null) {
        if (this.master.weaponMode == 2 || this.master.weaponMode == 3) {
            // do nothing
            return;
        }
        let net: Net = other.node.getComponent(Net);
        if (net) {
            // 来自网的碰撞忽略
            return;
        }
        let bullet: Bullet = other.node.getComponent(Bullet);
        if (bullet) {
            // 来自其他子弹的碰撞忽略
            return;
        }

        if (this.master.weaponMode == 1) {
            // 该子弹是一次性的碰撞，第一条鱼碰撞后就取消碰撞回调
            this.enabled = false;
            // 矩形碰撞组件顶点坐标，左上，左下，右下，右上
            let posb = self.worldAABB.center;

            this.master.castNet(posb);
            this.master.despawnBullet(this.node);
        }
    }

    getAttackValue(): number {
        return this.attack * this.bulletLeve;
    }
}

