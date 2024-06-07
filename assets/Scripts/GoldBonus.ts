import { _decorator, Component, Node, Animation, find, Vec2, UITransform, v3, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GoldBonus')
export class GoldBonus extends Component {

    appear(callback: () => void) {
        this.node.active = true;
        this.node.parent = find('Canvas');
        this.node.setPosition(v3());
        this.node.setSiblingIndex(999);
        const finishCallback = function () {
            this.node.active = false;
            callback();
        };
        const anim = this.node.getComponent(Animation);
        anim.on(Animation.EventType.FINISHED, finishCallback, this, true);
        anim.play();
    }
}

