import { _decorator, Animation, Component, find, instantiate, Node, NodePool, AudioSource, v3, Vec2, Vec3, UITransform, v2 } from 'cc';
import Weapon from './Weapon';
import CoinController from './CoinController';
import { PlayerNodeConfig } from './config/PlayerInfo';
import Game from './Game';
import Bullet from './Bullet';
import Net from './Net';
import { Utils } from './Utils';
const { ccclass, property } = _decorator;

@ccclass('Player')
export class Player extends Component {
    playerIndex: number;
    game: Game;
    weaponNode: Node;
    coinController: Node;
    plusNode: Node;
    minusNode: Node;
    oneBullet: Node;
    oneNet: Node;
    //子弹对象池
    bulletPool: NodePool;
    // 网对象池
    netsPool: NodePool;
    audio: AudioSource;
    weaponMode = 1; // 1为普通炮弹，遇到鱼就张网；2为可控炮弹，第二次shot张网；3为穿透炮弹，在目标点张网；4为追踪弹
    chooseFishIndex = -1;
    targetPos: Vec3; // for weapon 3
    targetNode: Node; // for weapon 4

    bullets: Array<Node>;

    private bulletInterval = 0.2;
    private touchShotTime = 0;

    init(config: PlayerNodeConfig, game: Game) {
        this.bulletPool = new NodePool("Bullet");
        this.netsPool = new NodePool("Net");
        this.bullets = new Array();
        this.game = game;
        this.playerIndex = config.index;
        this.weaponNode = this.node.getChildByName("weapon");
        this.coinController = this.node.getChildByName("number_controller");
        this.plusNode = this.node.getChildByName("plus");
        this.minusNode = this.node.getChildByName("minus");
        this.coinController.getComponent(CoinController).init(this);
        this.weaponNode.getComponent(Weapon).init();
        this.coinController.getComponent(CoinController).currentValue = 200;
        game.statistics.scoreUpdate(200, config.index);
        this.audio = this.node.getComponent(AudioSource);

        this.node.parent = find('Canvas');
        this.node.setSiblingIndex(999);
        this.node.position = v3(config.x, config.y, 0);
        this.node.angle = config.rotation;
        this.showSwitchButton();
    }

    shot() {
        let level = this.weaponNode.getComponent(Weapon).curLevel;
        // 剩余金币
        
        if (this.weaponMode == 1 || this.weaponMode == 4) {
            let now = new Date().getTime();
            if (now - this.touchShotTime < this.bulletInterval * 1000) {
                return;
            }
            let left = this.coinController.getComponent(CoinController).reduceCoin(level);
            if (left) {
                if (this.weaponMode == 4 && this.targetNode) {
                    let world = find('Canvas').getComponent(UITransform).convertToWorldSpaceAR(this.targetNode.getPosition());
                    let targetPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(world);
                    // 炮台坐标
                    let weaponPos = this.weaponNode.getPosition();
                    // 炮台到触点的方向向量
                    let dir = targetPos.subtract(weaponPos);
                    // 计算夹角，这个夹角是带方向的
                    let angle = Utils.angle(dir, v3(0, 1));
                    //将弧度转换为欧拉角
                    let degree = angle / Math.PI * 180;
                    // 设置炮台角度
                    this.weaponNode.angle = degree;
                }
                let bulletNode = null;
                if (this.bulletPool.size() > 0) {
                    bulletNode = this.bulletPool.get(this);
                } else {
                    bulletNode = instantiate(this.game.bulletPrefab);
                }
                this.bullets.push(bulletNode);
                let bullet = bulletNode.getComponent(Bullet);
                bullet.enabled = true;
                bullet.shot(this.game, level, this);
            }
            this.audio.play();
            this.weaponNode.getComponent(Animation).play('weapon_level_' + this.weaponNode.getComponent(Weapon).curLevel);
            this.touchShotTime = now;
        } else if (this.weaponMode == 2) {
            let left = this.coinController.getComponent(CoinController).reduceCoin(level);
            if (left) {
                if (this.oneBullet == null) {
                    // 没有子弹在飞
                    let bulletNode = null;
                    if (this.bulletPool.size() > 0) {
                        bulletNode = this.bulletPool.get(this);
                    } else {
                        bulletNode = instantiate(this.game.bulletPrefab);
                    }
                    this.bullets.push(bulletNode);

                    let bullet = bulletNode.getComponent(Bullet);
                    bullet.enabled = true;
                    bullet.shot(this.game, level, this);

                    this.audio.play();
                    this.weaponNode.getComponent(Animation).play('weapon_level_' + this.weaponNode.getComponent(Weapon).curLevel);
                } else {
                    // 获取子弹的世界坐标
                    let pos = find('Canvas').getComponent(UITransform).convertToWorldSpaceAR(this.oneBullet.getPosition());
                    this.despawnBullet(this.oneBullet);
                    this.oneBullet = null;
                    this.castNet(v2(pos.x, pos.y));
                }
            }
        } else if (this.weaponMode == 3) {
            let now = new Date().getTime();
            if (now - this.touchShotTime < this.bulletInterval * 1000) {
                return;
            }
            let left = this.coinController.getComponent(CoinController).reduceCoin(level);
            if (left) {
                let bulletNode = null;
                if (this.bulletPool.size() > 0) {
                    bulletNode = this.bulletPool.get(this);
                } else {
                    bulletNode = instantiate(this.game.bulletPrefab);
                }
                this.bullets.push(bulletNode);
                let bullet = bulletNode.getComponent(Bullet);
                bullet.enabled = true;
                bullet.setTarget(this.targetPos);
                bullet.shot(this.game, level, this);
            }
            this.audio.play();
            this.weaponNode.getComponent(Animation).play('weapon_level_' + this.weaponNode.getComponent(Weapon).curLevel);
            this.touchShotTime = now;
        }

    }

    // 传入世界坐标
    setTargetPos(pos: Vec3) {
        let canvas = find('Canvas');
        let nodePos = canvas.getComponent(UITransform).convertToNodeSpaceAR(pos);
        this.targetPos = nodePos;
    }

    setTarget(t: Node) {
        if (t != this.targetNode) {
            this.targetNode = t;
            while (this.bullets.length > 0) {
                let n = this.bullets.pop();
                // 切换目标时，瞄准上个目标的子弹原地销毁
                let p = find('Canvas').getComponent(UITransform).convertToWorldSpaceAR(n.getPosition());
                this.castNet(v2(p.x, p.y));
                this.despawnBullet(n);
            }
        }
    }

    chooseFish(id: number) {
        this.chooseFishIndex = id;
    }

    private showSwitchButton() {
        if (this.weaponMode == 1) {
            this.plusNode.active = true;
            this.minusNode.active = false;
        } else if (this.weaponMode == 2) {
            this.plusNode.active = false;
            this.minusNode.active = true;
            this.minusNode.angle = 0;
        } else {
            this.plusNode.active = false;
            this.minusNode.active = true;
            this.minusNode.angle = 90;
        }
    }

    switchMode() {
        if (this.weaponMode >= 4) {
            this.weaponMode = 1;
        } else {
            this.weaponMode++;
        }
        this.showSwitchButton();
    }

    cheatCoins() {
        this.coinController.getComponent(CoinController).cheatCoin();
    }

    weaponLeft() {
        this.weaponNode.angle = this.weaponNode.angle + 10;
    }

    weaponRight() {
        this.weaponNode.angle = this.weaponNode.angle - 10;
    }


    castNet(position: Vec2) {
        if (this.netsPool.size() > 0) {
            this.oneNet = this.netsPool.get(this);
        } else {
            this.oneNet = instantiate(this.game.netPrefab);
        }
        let bulletLevel = this.weaponNode.getComponent(Weapon).curLevel;
        this.oneNet.getComponent(Net).init(position, this, bulletLevel);
    }

    despawnBullet(bullet: Node) {
        let index = this.bullets.indexOf(bullet);
        if (index >= 0) {
            this.bullets.splice(index, 1);
        }
        const self = this;
        let callback = function () {
            self.bulletPool.put(bullet);
        }
        this.scheduleOnce(callback);
    }

    despawnNet(net: Node) {
        this.netsPool.put(net);
    }

    gainCoins(coinPos: Vec3, odds: number, bet: number) {
        this.coinController.getComponent(CoinController).gainCoins(coinPos, odds, bet);
    }
}


