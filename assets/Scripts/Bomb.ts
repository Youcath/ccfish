import { _decorator, Component, Node, Animation, find, Vec2, UITransform, v3, Vec3 } from 'cc';
import { BombMask } from './BombMask';
const { ccclass, property } = _decorator;

@ccclass('Bomb')
export class Bomb extends Component {

    show(position: Vec3) {
        this.node.active = true;
        this.node.parent = find('Canvas');
        this.node.setPosition(position);
        const finishCallback = function () {
            this.node.active = false;
        };
        const anim = this.node.getComponent(Animation);
        anim.on(Animation.EventType.FINISHED, finishCallback, this, true);
        anim.play();
    }
}

