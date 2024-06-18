import { _decorator, Component, Animation, Vec2, v3, find, UITransform, CircleCollider2D } from 'cc';
const {ccclass, property} = _decorator;

import { Player } from './Player';

@ccclass('Net')
export default class Net extends Component {
    @property(Animation) anim: Animation | null = null;
    
    master: Player;
    private attack = 1;
    bulletLeve: number = 1;
    masterIndex: number; // 属于第几位玩家的子弹
    init(position: Vec2, master: Player, level: number) {
        this.bulletLeve = level;
        this.changeCollider();
        this.node.parent = find('Canvas');
        let pos = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(v3(position.x, position.y, 0));
        this.node.setPosition(pos);
        this.master = master;
        this.masterIndex = master.playerIndex;

        this.anim.play('net_' + this.bulletLeve);
    }

    changeCollider() {
        let collider = this.node.getComponent(CircleCollider2D);
        collider.radius = 32 + this.bulletLeve * 8;
    }

    getAttackValue(): number {
        return this.attack * this.bulletLeve;
    }

    despawnNet() {
        this.master.despawnNet(this.node);
    }
}

