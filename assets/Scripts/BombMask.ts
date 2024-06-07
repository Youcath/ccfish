import { _decorator, Component, find, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BombMask')
export class BombMask extends Component {

    appear() {
        this.node.parent = find('Canvas');
        this.node.setSiblingIndex(999);
        this.node.active = true;
    }

    disappear() {
        this.node.active = false;
    }
    
}

