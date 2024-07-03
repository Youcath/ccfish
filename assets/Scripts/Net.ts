import { _decorator, Component, Animation, Vec2, v3, find, UITransform, CircleCollider2D, tween, Contact2DType, Collider2D, IPhysics2DContact } from 'cc';
const {ccclass, property} = _decorator;

import { Player } from './Player';
import Fish from './Fish';

@ccclass('Net')
export default class Net extends Component {
    @property(Animation) anim: Animation | null = null;
    
    master: Player;
    bulletLeve: number = 1;
    masterIndex: number; // 属于第几位玩家的子弹

    totalOdds: number; // 道具累计的倍率
    maxOdds: number; // 道具倍率上限
    init(position: Vec2, master: Player, level: number) {
        this.bulletLeve = level > 7 ? 7 : level;
        
        this.node.parent = find('Canvas');
        let pos = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(v3(position.x, position.y, 0));
        this.node.setPosition(pos);
        this.master = master;
        this.masterIndex = master.playerIndex;
        this.node.scale = v3(1, 1, 1);

        if (this.master.itemName == '') {
            this.anim.play('net_' + this.bulletLeve);
        } else if (this.master.itemName == 'yiwangdajin') {
            this.maxOdds = 100;
            this.anim.play(this.master.itemName);
            tween(this.node).to(1, {scale: v3(1.5, 1.5, 1.5)}).start();
            this.scheduleOnce(this.despawnNet, 5);
        }
        this.changeCollider();
    }

    changeCollider() {
        let collider = this.node.getComponent(CircleCollider2D);
        if (this.master.itemName == '') {
            collider.radius = 32 + this.bulletLeve * 8;
        } else if (this.master.itemName == 'yiwangdajin') {
            collider.radius = 150;
            collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
        }

    }

    despawnNet() {
        this.maxOdds = 0;
        this.totalOdds = 0;
        this.node.getComponent(CircleCollider2D).off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter);
        this.master.despawnNet(this.node);
    }

    
    onCollisionEnter(self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null) {
        let fish: Fish = other.node.getComponent(Fish);
        if (fish) {
            let fishOdds = fish.odds * fish.multiple;
            if (fishOdds + this.totalOdds <= this.maxOdds) {
                // 累计倍率没达到上限，可以杀死鱼
                fish.dieNow(this.masterIndex);
                this.totalOdds += fishOdds;
            }
        }
    }
}

