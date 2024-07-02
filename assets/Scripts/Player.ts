import { _decorator, Animation, Component, find, instantiate, Node, NodePool, AudioSource, v3, Vec2, Vec3, UITransform, v2, RichText, tween, size } from 'cc';
import Weapon from './Weapon';
import CoinController from './CoinController';
import { PlayerNodeConfig } from './config/PlayerInfo';
import Game from './Game';
import Bullet from './Bullet';
import Net from './Net';
import { Utils } from './utils/Utils';
import { Constant } from './config/Constant';
import { TreasureController } from './TreasureController';
const { ccclass, property } = _decorator;

@ccclass('Player')
export class Player extends Component {
    @property(Node)
    playerNumNode: Node;
    @property(Node)
    betNode: Node;
    @property(Node)
    weaponNode: Node;

    currentBet = Constant.START_BET;
    playerIndex: number;
    game: Game;

    coinController: Node;
    treasureController: Node;
    plusNode: Node;
    minusNode: Node;
    oneBullet: Node;
    oneNet: Node;
    itemNode: Node;
    //子弹对象池
    bulletPool: NodePool;
    // 网对象池
    netsPool: NodePool;
    audio: AudioSource;
    weaponMode = 1; // 1为普通炮弹，遇到鱼就张网；2为追踪弹；3为穿透炮弹，在目标点张网
    chooseFishIndex = -1;
    targetPos: Vec3; // for weapon 3
    targetUuid: string; // for weapon 4
    itemName = "";

    weaponDamage = 1;

    bullets: Array<Node>;

    private touchShotTime = 0;

    init(config: PlayerNodeConfig, game: Game) {
        this.bulletPool = new NodePool("Bullet");
        this.netsPool = new NodePool("Net");
        this.bullets = new Array();
        this.game = game;
        this.playerIndex = config.index;
        this.coinController = this.node.getChildByName("number_controller");
        this.treasureController = this.node.getChildByName("treasure_controller");
        this.plusNode = this.node.getChildByName("plus");
        this.minusNode = this.node.getChildByName("minus");
        this.coinController.getComponent(CoinController).init(this);
        this.treasureController.getComponent(TreasureController).init(this);
        this.weaponNode.getComponent(Weapon).init();

        // 设置初始积分 start
        this.coinController.getComponent(CoinController).currentValue = 2000;
        game.statistics.scoreUpdate(2000, config.index);
        // 设置初始积分 end
        this.audio = this.node.getComponent(AudioSource);

        this.node.parent = find('Canvas');
        this.node.setSiblingIndex(999);
        this.node.position = v3(config.x, config.y, 0);
        this.node.angle = config.rotation;
        this.showSwitchButton();
        this.showPlayerNumber();
        this.showBet();
    }

    shot() {
        let level = this.weaponNode.getComponent(Weapon).curLevel;

        if (this.itemName == '') {
            // 无道具情况
            if (this.weaponMode == 1) {
                let now = new Date().getTime();
                if (now - this.touchShotTime < Constant.BULLET_INTERVAL * 1000) {
                    return;
                }
                let left = this.coinController.getComponent(CoinController).reduceCoin(this.currentBet);
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
                    bullet.shot(this.game, level, this);
                }
                this.audio.play();
                this.weaponNode.getComponent(Weapon).playShot();
                this.touchShotTime = now;
            } else if (this.weaponMode == 2) {
                let now = new Date().getTime();
                if (now - this.touchShotTime < Constant.BULLET_INTERVAL * 1000) {
                    return;
                }
                let left = this.coinController.getComponent(CoinController).reduceCoin(this.currentBet);
                if (left) {
                    const targetNode = this.game.fishManager.fishes.get(this.targetUuid);
                    let world = find('Canvas').getComponent(UITransform).convertToWorldSpaceAR(targetNode.getPosition());
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
                this.weaponNode.getComponent(Weapon).playShot();
                this.touchShotTime = now;

            } else if (this.weaponMode == 3) {
                let now = new Date().getTime();
                if (now - this.touchShotTime < Constant.BULLET_INTERVAL * 1000) {
                    return;
                }
                let left = this.coinController.getComponent(CoinController).reduceCoin(this.currentBet);
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
                this.weaponNode.getComponent(Weapon).playShot();
                this.touchShotTime = now;
            }
        } else {
            // 下面处理各种道具发射
            if (this.itemName == "yiwangdajin") {
                if (this.itemNode) {
                    this.itemNode.active = false;
                }
                if (this.oneBullet == null) {
                    // 没有子弹在飞
                    let bulletNode = null;
                    if (this.bulletPool.size() > 0) {
                        bulletNode = this.bulletPool.get(this);
                    } else {
                        bulletNode = instantiate(this.game.bulletPrefab);
                    }
                    this.oneBullet = bulletNode;

                    let bullet = bulletNode.getComponent(Bullet);
                    bullet.enabled = true;
                    bullet.shot(this.game, level, this);

                    this.audio.play();
                    this.weaponNode.getComponent(Weapon).playShot();
                } else {
                    // 获取子弹的世界坐标
                    let pos = find('Canvas').getComponent(UITransform).convertToWorldSpaceAR(this.oneBullet.getPosition());
                    this.despawnBullet(this.oneBullet);
                    this.oneBullet = null;
                    this.castNet(v2(pos.x, pos.y));
                    this.itemName = '';
                }
            }
        }
    }

    // 传入世界坐标
    setTargetPos(pos: Vec3) {
        let canvas = find('Canvas');
        let nodePos = canvas.getComponent(UITransform).convertToNodeSpaceAR(pos);
        this.targetPos = nodePos;
    }

    setTarget(t: string) {
        if (t != this.targetUuid) {
            this.targetUuid = t;
            while (this.bullets.length > 0) {
                let n = this.bullets.pop();
                // 切换目标时，瞄准上个目标的子弹原地销毁
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
        } else if (this.weaponMode == 3) {
            this.plusNode.active = false;
            this.minusNode.active = true;
            this.minusNode.angle = 90;
        } else {
            this.plusNode.active = false;
            this.minusNode.active = true;
            this.minusNode.angle = 45;
        }
    }

    private showPlayerNumber() {
        let rt = this.playerNumNode.getComponent(RichText);
        let str = this.playerIndex.toString();
        let nums = str.split('');

        let text = '';
        nums.forEach(n => {
            text += `<img src=\'${n}\'/>`;
        });
        rt.string = text;
    }

    private showBet() {
        let rt = this.betNode.getComponent(RichText);
        let str = this.currentBet.toString();
        let nums = str.split('');

        let text = '';
        nums.forEach(n => {
            text += `<img src=\'goldnum_${n}\'/>`;
        });
        rt.string = text;
    }

    // 下注
    updateBet() {
        this.currentBet += Constant.BET_INTERVAL;
        if (this.currentBet > Constant.MAX_BET) {
            this.currentBet = Constant.START_BET;
        }
        this.showBet();
        let weapon = this.weaponNode.getComponent(Weapon);
        let levelInterval = Math.round((Constant.MAX_BET - Constant.START_BET) / 8);
        let level = Math.round((this.currentBet - Constant.START_BET) / levelInterval);
        if (level < 1) {
            level = 1;
        }
        if (level > 8) {
            level = 8;
        }
        weapon.setLevel(level);
    }

    switchMode() {
        if (this.weaponMode >= 3) {
            this.weaponMode = 1;
        } else {
            this.weaponMode++;
        }
        this.showSwitchButton();
    }

    switchModeTo(mode: number) {
        this.weaponMode = mode;
        if (this.weaponMode > 3 || this.weaponMode <= 0) {
            this.weaponMode = 1;
        }
        this.showSwitchButton();
    }

    gainItem(name: string, pos: Vec3) {

        // 获取道具的动画
        if (!this.itemNode) {
            this.itemNode = this.node.getChildByName('item');
        }
        this.itemNode.active = true;
        let stratPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(pos);
        this.itemNode.getComponent(Animation).play(name);
        const end = () => {
            this.itemName = name;
            this.itemNode.getComponent(UITransform).setContentSize(size(80, 80));
            while (this.bullets.length > 0) {
                let n = this.bullets.pop();
                // 其余子弹原地销毁
                this.despawnBullet(n);
            }
        }
        // 道具飞到玩家位置的动画
        this.itemNode.setPosition(stratPos);
        tween(this.itemNode).to(1, { position: v3(42, -5) }).call(end).start();
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

    gainCoins(coinPos: Vec3, odds: number) {
        this.coinController.getComponent(CoinController).gainCoins(coinPos, odds, this.currentBet);
    }

    gainTreasures(pos: Vec3) {
        this.treasureController.getComponent(TreasureController).gain(pos);
    }

    resetTreasures() {
        this.treasureController.getComponent(TreasureController).reset();
    }

    currentTreasureCount(): number {
        return this.treasureController.getComponent(TreasureController).currentTreasureCount();
    }
}


