import { _decorator, Component, find, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MovingBg')
export class MovingBg extends Component {

    @property(Node) bg01: Node | null;
    @property(Node) bg02: Node | null;

    private bgSpeed = 75;
    private isMoving = false;
    private leftNode;
    private rightNode;

    public init() {
        this.node.parent = find('Canvas');
        this.node.setSiblingIndex(0);
        this.bg01.setPosition(0, 0);
        this.bg02.setPosition(this.bg02.getComponent(UITransform).width, 0);
        this.bg01.active = true;
        this.bg02.active = false;
    }

    public startMove() {
        this.isMoving = true;
        this.rightNode = this.bg01.active ? this.bg02 : this.bg01;
        this.leftNode = this.rightNode === this.bg01 ? this.bg02 : this.bg01;
        this.rightNode.active = true;
    }

    update(deltaTime: number) {
        if (this.isMoving) {
            this.moveBackground(deltaTime);
        }
    }

    private moveBackground(deltaTime: number) {
        const deltaX = this.bgSpeed * deltaTime;
        this.leftNode.setPosition(this.leftNode.position.x - deltaX, 0);
        this.rightNode.setPosition(Math.max(this.rightNode.position.x - deltaX, 0), 0);
        if (this.rightNode.position.x == 0) {
            this.leftNode.setPosition(this.leftNode.getComponent(UITransform).width, 0);
            this.leftNode.active = false;
            this.isMoving = false;
        }
    }
}


