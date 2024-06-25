import { _decorator, Component, Vec3, find, UITransform, RichText, tween, v3 } from 'cc';
const { ccclass, property } = _decorator;

import CoinController from './CoinController'

// 鱼死亡时，在死亡处展示倍率的数字
@ccclass('NumUp')
export default class NumUp extends Component {

    cointroller: CoinController;
    init(pos: Vec3, num: number, ctr: CoinController) {
        let richText = this.node.getComponent(RichText);
        this.cointroller = ctr;
        let str = num.toString();
        let nums = str.split('');
        let text = `<img src=\'goldnum_x\'/>`
        nums.forEach(n => {
            text += `<img src=\'goldnum_${n}\'/>`;
        });
        richText.string = text;

        this.node.parent = find('Canvas');
        this.node.position = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(pos);
        this.node.angle = ctr.node.parent.angle;
        this.node.scale = v3();

        let despawn = () => {
            this.cointroller.despawnCoinup(this.node);
        };

        tween(this.node).to(1, {scale: v3(1, 1, 1)}).delay(0.5).to(0.5, {scale: v3()}).union().call(despawn).start();

    }


}