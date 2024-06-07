import { _decorator, Component, Node, Animation, find, Vec2, UITransform, v3, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GoldBonus')
export class GoldBonus extends Component {

    show(callback: () => void) {
        this.node.active = true;
        this.node.parent = find('Canvas');
        this.node.setPosition(v3());
        const finishCallback = function () {
            this.node.active = false;
            callback();
        };
        const anim = this.node.getComponent(Animation);
        anim.on(Animation.EventType.FINISHED, finishCallback, this);
        anim.play();
    }
}

