import { _decorator, Animation, Component, find, instantiate, Node, NodePool,  UITransform,  v3, Vec2, Vec3 } from 'cc';
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
    anim: Node;
    oneBullet: Node;
    oneNet: Node;
    //子弹对象池
    bulletPool: NodePool;
    // 网对象池
    netsPool: NodePool;

    private bulletInterval = 0.4;
    private touchShotTime = 0;

    init(config: PlayerNodeConfig, game: Game) {
        this.bulletPool = new NodePool("Bullet");
        this.netsPool = new NodePool("Net");
        this.game = game;
        this.playerIndex = config.index;
        this.weaponNode = this.node.getChildByName("weapon");
        this.coinController = this.node.getChildByName("number_controller");
        this.anim = this.node.getChildByName("anim");
        this.anim.active = false;
        this.coinController.getComponent(CoinController).init();
        this.weaponNode.getComponent(Weapon).init();
        this.coinController.getComponent(CoinController).currentValue = 200;

        this.node.parent = find('Canvas');
        this.node.setSiblingIndex(999);
        this.node.position = v3(config.x, config.y, 0);
        this.node.angle = config.rotation;
    }

    shot() {
        let now = new Date().getTime();
        if (now - this.touchShotTime < this.bulletInterval * 1000) {
            return;
        }
        let level = this.weaponNode.getComponent(Weapon).curLevel;
        if (this.bulletPool.size() > 0) {
            this.oneBullet = this.bulletPool.get(this);
        } else {
            this.oneBullet = instantiate(this.game.bulletPrefab);
        }
        // 剩余金币
        let left = this.coinController.getComponent(CoinController).reduceCoin(level);
        if (left) {
            let bullet = this.oneBullet.getComponent(Bullet);
            bullet.enabled = true;
            bullet.shot(this.game, level, this);
        }
        this.weaponNode.getComponent(Animation).play('weapon_level_' + this.weaponNode.getComponent(Weapon).curLevel);
        this.touchShotTime = now;
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


    castNet(position:Vec2) {
        if (this.netsPool.size() > 0) {
            this.oneNet = this.netsPool.get(this);
        } else {
            this.oneNet = instantiate(this.game.netPrefab);
        }
        let bulletLevel = this.weaponNode.getComponent(Weapon).curLevel;
        this.oneNet.getComponent(Net).init(position, this, bulletLevel);
    }

    despawnBullet(bullet:Node) {
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
        this.anim.active = true;
        let animation = this.anim.getComponent(Animation);
        animation.crossFade('gold_down', 1);

        const self = this;
        let finishCallback = function() {
            self.anim.active = false;
        };
        animation.on(Animation.EventType.FINISHED, finishCallback, this);
    }
}


