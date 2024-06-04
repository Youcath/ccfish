import { _decorator, Component, find, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BombMask')
export class BombMask extends Component {

    init() {
        this.node.parent = find('Canvas');
        this.node.setSiblingIndex(999);
    }

    appear() {
        this.node.active = true;
    }

    disappear() {
        this.node.active = false;
    }
}

