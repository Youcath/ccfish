import { _decorator, Component, Animation, Vec3, Director, Tween, TweenAction, math } from 'cc';
const { ccclass, property } = _decorator;

import CoinController from './CoinController'

@ccclass('Coins')
export default class Coins extends Component {
    @property(Animation)
    anim: Animation | null = null;
    cointroller: CoinController;
    init(ctr: CoinController) {
        this.cointroller = ctr;
        this.anim.play('gold_down');
    }
    goDown(pos: Vec3, toPos?: Vec3) {
        this.node.parent = Director.instance.getScene()
        this.node.position = pos;
        let tween = new Tween(this.node);
        tween.to(0.8, {scale: new math.Vec3(0.5, 0.5, 0.5), position: toPos})
        .call(this.despawnCoin).start();
    }
    
    despawnCoin() {
        this.cointroller.despawnCoins(this.node);
    }
}


/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// import CoinController from './CoinController'
// const { ccclass, property } = cc._decorator;
// 
// @ccclass
// export default class Coins extends cc.Component {
//     @property(cc.Animation)
//     anim: cc.Animation = null;
// 
//     cointroller: CoinController;
// 
// 
//     init(ctr: CoinController) {
//         this.cointroller = ctr;
//         this.anim.play('gold_down');
//     }
// 
//     goDown(pos: cc.Vec2, toPos?: cc.Vec2) {
//         this.node.parent = cc.director.getScene()
//         this.node.position = pos;
//         let spawn = cc.spawn(cc.moveTo(0.8, toPos), cc.scaleTo(0.8, 0.5));
//         let cb = cc.callFunc(this.despawnCoin, this);
//         let acf = cc.sequence(spawn, cb);
//         this.node.runAction(acf);
//     }
//     
//     despawnCoin() {
//         this.cointroller.despawnCoins(this.node);
//     }
// 
// }