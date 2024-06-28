import { _decorator, Component, Node, NodePool, Sprite, tween, UITransform, v3, Vec3 } from 'cc';
import { Player } from './Player';
const { ccclass, property } = _decorator;

@ccclass('TreasureController')
export class TreasureController extends Component {

    @property(Sprite) t1: Sprite | null = null;
    @property(Sprite) t2: Sprite | null = null;
    @property(Sprite) t3: Sprite | null = null;
    @property(Sprite) t4: Sprite | null = null;
    @property(Sprite) t5: Sprite | null = null;

    private master: Player;
    private currentCount: number = 0;
    private tArr: Sprite[];

    init(master: Player) {
        this.master = master;
        this.tArr = [this.t1, this.t2, this.t3, this.t4, this.t5];
    }

    gain(pos: Vec3) {
        const treasure: Sprite = this.tArr[this.currentCount];
        treasure.node.active = true;
        const startPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(pos)
        const endPos = treasure.node.position.clone();
        treasure.node.setPosition(startPos);
        tween(treasure.node).to(1.0, {position: endPos}).start();
        this.currentCount++;
    }

    reset() {
        this.currentCount = 0;
        this.tArr.forEach((t) => {
            t.node.active = false;
        })
    }

    currentTreasureCount() {
        return this.currentCount;
    }
}

