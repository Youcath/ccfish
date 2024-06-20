import { _decorator, Component, find, Graphics, Node, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Rope')
export class Rope extends Component {
    graphics: Graphics;

    init() {
        this.graphics = this.node.getComponent(Graphics);
        this.node.parent = find('Canvas');
        this.node.setSiblingIndex(3);
    }

    performSendAnim(playerPos: Vec3, fishPos: Vec3, callback: () => void) {
        tween().target(playerPos.clone()).to(2, fishPos, {
            onUpdate: (target: Vec3, ratio: number) => {
                this.graphics.moveTo(playerPos.x, playerPos.y);
                this.graphics.lineTo(target.x, target.y);
                this.graphics.stroke();
            }
        }).call(callback).start();
    }

    performReceiveAnim(playerPos: Vec3, fishPos: Vec3, callback: () => void) {
        tween().target(fishPos.clone()).to(2, playerPos, {
            onUpdate: (target: Vec3, ratio: number) => {
                this.graphics.clear();
                this.graphics.moveTo(playerPos.x, playerPos.y);
                this.graphics.lineTo(target.x, target.y);
                this.graphics.stroke();
            }
        }).call(callback).start();
    }
}