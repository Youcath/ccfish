import { _decorator, Component, Node, Animation, find, Vec2, UITransform, v3, Vec3 } from 'cc';
import { BombMask } from './BombMask';
const { ccclass, property } = _decorator;

@ccclass('Bomb')
export class Bomb extends Component {
    @property(Animation) anim: Animation | null = null;

    init(position: Vec3, aniCallback: () => void) {
        this.node.active = true;
        this.node.parent = find('Canvas');
        this.node.setPosition(position);
        let finishCallback = function () {
            this.node.active = false;
            aniCallback();
        };
        this.anim.on(Animation.EventType.FINISHED, finishCallback, this);
        this.anim.play();
    }
}
