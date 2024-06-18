import { _decorator, Component, Animation, Vec3, Director, Tween, TweenAction, math, find, UITransform, v3 } from 'cc';
const { ccclass, property } = _decorator;

import CoinController from './CoinController'

@ccclass('Coins')
export default class Coins extends Component {
    coinPoss: Vec3[] = [v3(), v3(40, 0), v3(-40, 0), v3(0, 40), v3(0, -40), v3(40, 40), v3(-40, -40), v3(40, -40), v3(-40, 40)];
    @property(Animation)
    anim: Animation | null = null;
    cointroller: CoinController;
    init(ctr: CoinController) {
        this.cointroller = ctr;
        // this.anim.play('gold_down');
    }
    goDown(pos: Vec3, toPos: Vec3, index: number) {
        this.node.parent = find('Canvas');
        let relative = this.coinPoss[index % 9];
        let startPos = v3(pos.x + relative.x, pos.y + relative.y);
        this.node.position = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(startPos);
        let to = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(toPos);
        let tween = new Tween(this.node);
        const self = this;
        let callback = function() {
            self.cointroller.despawnCoins(self.node);
        }
        this.anim.play();
        this.anim.once(Animation.EventType.FINISHED, () => {
            tween.to(1.5, {scale: new math.Vec3(0.5, 0.5, 0.5), position: to})
            .call(callback).start();
        }, this);
    }
    

}
