import { _decorator, Component, Animation, SpriteAtlas, Sprite, Vec3, Director } from 'cc';
const { ccclass, property } = _decorator;

import CoinController from './CoinController'

@ccclass('NumUp')
export default class NumUp extends Component {
    @property(Animation)
    anim: Animation | null = null;
    @property(SpriteAtlas)
    numAtlas: SpriteAtlas | null = null;
    @property(Sprite)
    tensPlace: Sprite | null = null;
    @property(Sprite)
    onesPlace: Sprite | null = null;
    cointroller: CoinController;
    init(pos: Vec3, num: number, ctr: CoinController) {
        this.cointroller = ctr;
        let str = num.toString();
        let nums = str.split('');
        if (nums.length == 1) {
        this.onesPlace.node.active = false;
        this.tensPlace.spriteFrame = this.numAtlas.getSpriteFrame('goldnum_' + nums[0]);
        } else {
        this.onesPlace.node.active = true;
        this.tensPlace.spriteFrame = this.numAtlas.getSpriteFrame('goldnum_' + nums[0]);
        this.onesPlace.spriteFrame = this.numAtlas.getSpriteFrame('goldnum_' + nums[1]);
        }
        this.node.parent = Director.instance.getScene();
        this.node.position = pos;
        this.anim.play('coin_up');
        this.anim.on(Animation.EventType.STOP, this.despawn, this)

    }
    
    despawn() {
        this.cointroller.despawnCoinup(this.node);
    }
}


/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// import CoinController from './CoinController'
// const { ccclass, property } = cc._decorator;
// 
// @ccclass
// export default class NumUp extends cc.Component {
// 
// 
//     @property(cc.Animation)
//     anim: cc.Animation = null;
// 
//     @property(cc.SpriteAtlas)
//     numAtlas: cc.SpriteAtlas = null;
// 
//     @property(cc.Sprite)
//     tensPlace: cc.Sprite = null;
// 
//     @property(cc.Sprite)
//     onesPlace: cc.Sprite = null;
// 
//     cointroller: CoinController;
// 
//     init(pos: cc.Vec2, num: number, ctr: CoinController) {
//         this.cointroller = ctr;
//         let str = num.toString();
//         let nums = str.split('');
//         if (nums.length == 1) {
//             this.onesPlace.node.active = false;
//             this.tensPlace.spriteFrame = this.numAtlas.getSpriteFrame('goldnum_' + nums[0]);
//         } else {
//             this.onesPlace.node.active = true;
//             this.tensPlace.spriteFrame = this.numAtlas.getSpriteFrame('goldnum_' + nums[0]);
//             this.onesPlace.spriteFrame = this.numAtlas.getSpriteFrame('goldnum_' + nums[1]);
//         }
//         this.node.parent = cc.director.getScene();
//         this.node.position = pos;
//         let upState = this.anim.play('coin_up');
//         upState.on('stop', this.despawn, this);
// 
//     }
//     
//     despawn() {
//         this.cointroller.despawnCoinup(this.node);
//     }
// }
