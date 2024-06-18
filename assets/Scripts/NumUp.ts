import { _decorator, Component, Animation, SpriteAtlas, Sprite, Vec3, Director, find, UITransform } from 'cc';
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
        this.node.parent = find('Canvas');
        this.node.position = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(pos);
        const self = this;

        let despawn = function () {
            self.cointroller.despawnCoinup(self.node);
        }

        this.anim.play('coin_up');
        this.anim.on(Animation.EventType.STOP, despawn, this);

    }


}