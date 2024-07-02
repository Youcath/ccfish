import { _decorator, Animation, Component, find, Node, Sprite, UITransform } from 'cc';
import Fish from './Fish';
const { ccclass, property } = _decorator;

@ccclass('MovingBg')
export class MovingBg extends Component {

    @property(Sprite) bg: Sprite | null;
    @property(Sprite) bg01: Sprite | null;
    @property(Sprite) bg02: Sprite | null;
    @property(Sprite) bg03: Sprite | null;
    @property(Sprite) wave: Sprite | null;

    private fishGroupBgArr: Sprite[];
    private fishGroupBgIndex = 0;
    private fishGroupBgNode: Node;
    private bgSpeed = 200;
    private isMoving = false;
    private leftNode;
    private rightNode;
    private fishes: Node[];
    private isFishGroupScene = false;
    private callback: () => void;

    public init() {
        this.fishGroupBgArr = [this.bg01, this.bg02, this.bg03];
        this.node.parent = find('Canvas');
        this.node.setSiblingIndex(0);
        this.bg.node.setPosition(0, 0);
        this.bg.node.active = true;
    }

    public isFishGroup(): boolean {
        return this.isFishGroupScene;
    }

    public startMove(fishes: Node[], callback: () => void) {
        this.isMoving = true;
        if (!this.isFishGroupScene) {
            // 切换到鱼潮
            this.fishGroupBgNode = this.getFishGroupBgNode();
            this.resetPos(this.fishGroupBgNode);
            this.rightNode = this.fishGroupBgNode;
            this.leftNode = this.bg.node;
        } else {
            // 切换到普通场景
            this.resetPos(this.bg.node);
            this.rightNode = this.bg.node;
            this.leftNode = this.fishGroupBgNode;
        }
        this.rightNode.active = true;
        this.wave.node.active = true;
        this.fishes = fishes;
        this.isFishGroupScene = !this.isFishGroupScene;
        this.callback = callback;
        this.wave.node.getComponent(Animation).play();
    }

    public update(deltaTime: number) {
        if (this.isMoving) {
            this.moveBackground(deltaTime);
        }
    }

    private getFishGroupBgNode(): Node {
        const node: Node = (this.fishGroupBgArr[this.fishGroupBgIndex]).node;
        if (this.fishGroupBgIndex + 1 >= this.fishGroupBgArr.length) {
            this.fishGroupBgIndex = 0;
        } else {
            this.fishGroupBgIndex++;
        }
        return node;
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


