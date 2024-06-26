import { _decorator, Animation, BoxCollider2D, Component, Contact2DType, Node, v3, Vec3 } from 'cc';
import Fish from './Fish';
import { FishType } from './config/FishType';
const { ccclass, property } = _decorator;

@ccclass('CombineFish')
export class CombineFish extends Component {
    // 三元四喜的相对排列坐标
    readonly threeLineLayout = [v3(155), v3(), v3(-155)];
    readonly threeCenterLayout = [v3(89.5), v3(-44.75, 77.5), v3(-44.75, -77.5)];
    readonly fourLineLayout = [v3(232), v3(77), v3(-77), v3(-232)];
    readonly fourCenterLayout = [v3(77.5, 77.5), v3(77.5, -77.5), v3(-77.5, -77.5), v3(-77.5, 77.5)];
    fishParent: Fish;

    fishNode: Node;
    ringNode1: Node;
    ringNode2: Node;

    init(fish: Fish, fishType: FishType, index: number) {
        this.fishParent = fish;
        this.fishNode = this.node.getChildByName('fish');
        this.ringNode1 = this.node.getChildByName('ring1');
        this.ringNode2 = this.node.getChildByName('ring2');
        let layout: Array<Vec3> = null;
        if (fishType.group.length == 3) {
            // 三元
            this.ringNode1.active = true;
            this.ringNode2.active = false;

            if (fishType.combine == 'line') {
                layout = this.threeLineLayout;
            } else if (fishType.combine == 'center') {
                layout = this.threeCenterLayout;
            }

            this.node.setPosition(layout[index]);
        } else if (fishType.group.length > 3) {
            // 四喜
            this.ringNode1.active = false;
            this.ringNode2.active = true;

            if (fishType.combine == 'line') {
                layout = this.fourLineLayout;
            } else if (fishType.combine == 'center') {
                layout = this.fourCenterLayout;
            }
            this.node.setPosition(layout[index]);
        }
        this.node.parent = fish.node;
        this.fishNode.angle = Math.PI / 2;
        this.fishNode.getComponent(Animation).play(fishType.group[index] + '_run');
    }

    start() {
        // 碰撞回调直接透传给父节点
        let collider = this.getComponent(BoxCollider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.fishParent.onCollisionEnter, this.fishParent);
        }
    }
}


