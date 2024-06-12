import { _decorator, Animation, Component, find, instantiate, Node, NodePool, AudioSource, v3, Vec2, Vec3, UITransform, v2 } from 'cc';
import Weapon from './Weapon';
import CoinController from './CoinController';
import { PlayerNodeConfig } from './PlayerInfo';
import Game from './Game';
import Bullet from './Bullet';
import Net from './Net';
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
    weaponMode = 1; // 1为普通炮弹，遇到鱼就张网；2为可控炮弹，第二次shot张网；3为穿透炮弹，在目标点张网
    chooseFishIndex = -1;
    targetPos: Vec3; // for weapon 3

    private bulletInterval = 0.4;
    private touchShotTime = 0;

    init(config: PlayerNodeConfig, game: Game) {
        this.bulletPool = new NodePool("Bullet");
        this.netsPool = new NodePool("Net");
        this.game = game;
        this.playerIndex = config.index;
        this.weaponNode = this.node.getChildByName("weapon");
        this.coinController = this.node.getChildByName("number_controller");
        this.plusNode = this.node.getChildByName("plus");
        this.minusNode = this.node.getChildByName("minus");
        this.coinController.getComponent(CoinController).init(this);
        this.weaponNode.getComponent(Weapon).init();
        this.coinController.getComponent(CoinController).currentValue = 200;
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
        let left = this.coinController.getComponent(CoinController).reduceCoin(level);
        if (this.weaponMode == 1) {
            let now = new Date().getTime();
            if (now - this.touchShotTime < this.bulletInterval * 1000) {
                return;
            }
            if (this.bulletPool.size() > 0) {
                this.oneBullet = this.bulletPool.get(this);
            } else {
                this.oneBullet = instantiate(this.game.bulletPrefab);
            }
            if (left) {
                let bullet = this.oneBullet.getComponent(Bullet);
                bullet.enabled = true;
                bullet.shot(this.game, level, this);
            }
            this.audio.play();
            this.weaponNode.getComponent(Animation).play('weapon_level_' + this.weaponNode.getComponent(Weapon).curLevel);
            this.touchShotTime = now;
        } else if (this.weaponMode == 2) {
            if (left) {
                if (this.oneBullet == null) {
                    // 没有子弹在飞
                    if (this.bulletPool.size() > 0) {
                        this.oneBullet = this.bulletPool.get(this);
                    } else {
                        this.oneBullet = instantiate(this.game.bulletPrefab);
                    }


                    let bullet = this.oneBullet.getComponent(Bullet);
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
            if (this.bulletPool.size() > 0) {
                this.oneBullet = this.bulletPool.get(this);
            } else {
                this.oneBullet = instantiate(this.game.bulletPrefab);
            }
            if (left) {
                let bullet = this.oneBullet.getComponent(Bullet);
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
        if (this.weaponMode >= 3) {
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
        const self = this;
        let callback = function () {
            self.bulletPool.put(bullet);
        }
        this.scheduleOnce(callback);
    }

    despawnNet(net: Node) {
        this.netsPool.put(net);
    }

    gainCoins(coinPos: Vec3, value: number) {
        this.coinController.getComponent(CoinController).gainCoins(coinPos, value);
    }
}


