import { _decorator, Animation, Component, find, Node, Sprite, UITransform } from 'cc';
import Fish from './Fish';
import { Constant } from './config/Constant'
const { ccclass, property } = _decorator;

@ccclass('MovingBg')
export class MovingBg extends Component {

    @property(Sprite) bg01: Sprite | null;
    @property(Sprite) bg02: Sprite | null;
    @property(Sprite) wave: Sprite | null;

    private bgSpeed = 75;
    private isMoving = false;
    private leftNode;
    private rightNode;
    private fishes: Node[];
    private isFishGroupScene = false;
    private callback: () => void;

    public init() {
        this.node.parent = find('Canvas');
        this.node.setSiblingIndex(0);
        this.bg01.node.setPosition(0, 0);
        this.resetPos(this.bg02.node);
        this.bg01.node.active = true;
        this.bg02.node.active = false;
        this.wave.node.active = false;
    }

    public isFishGroup(): boolean {
        return this.isFishGroupScene;
    }

    public startMove(fishes: Node[], callback: () => void) {
        this.isMoving = true;
        this.rightNode = this.bg01.node.active ? this.bg02.node : this.bg01.node;
        this.leftNode = this.rightNode === this.bg01.node ? this.bg02.node : this.bg01.node;
        this.rightNode.active = true;
        this.wave.node.active = true;
        this.fishes = fishes;
        this.isFishGroupScene = !this.isFishGroupScene;
        this.callback = callback;
        this.wave.node.getComponent(Animation).play();
    }

    update(deltaTime: number) {
        if (this.isMoving) {
            this.moveBackground(deltaTime);
        }
    }

    private resetPos(bgNode: Node) {
        const bgWidth = bgNode.getComponent(UITransform).width;
        const waveWidth = this.wave.node.getComponent(UITransform).width;
        bgNode.setPosition(bgWidth, 0);
        this.wave.node.setPosition((bgWidth + waveWidth) / 2 - 50, 0);
    }

    private moveBackground(deltaTime: number) {
        const deltaX = this.bgSpeed * deltaTime;
        this.leftNode.setPosition(this.leftNode.position.x - deltaX, 0);
        this.rightNode.setPosition(Math.max(this.rightNode.position.x - deltaX, 0), 0);
        this.wave.node.setPosition(this.wave.node.position.x - deltaX, 0);
        this.despawnFishIfNeed(this.rightNode.position.x);
        if (this.rightNode.position.x == 0) {
            this.wave.node.getComponent(Animation).stop();
            this.resetPos(this.leftNode);
            this.leftNode.active = false;
            this.wave.node.active = false;
            this.isMoving = false;
            this.callback();
        }
    }

    private despawnFishIfNeed(boundX: number) {
        this.fishes.forEach((fish) => {
            const fishX = find('Canvas').getComponent(UITransform).convertToWorldSpaceAR(fish.position).x;
            if (fishX >= boundX || fishX <= 0) {
                fish.getComponent(Fish).despawnFish();
            }
        })
    }
}


