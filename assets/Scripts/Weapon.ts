import { _decorator, Component, Animation, AudioSource } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Weapon')
export default class Weapon extends Component {
    @property(Animation)
    anim: Animation | null = null;
    curLevel: number;
    total: number;
    audio: AudioSource;

    init() {
        this.curLevel = 1;
        this.audio = this.node.getComponent(AudioSource);
        this.total = this.anim.clips.length;
    }
    plus() {
        if (this.curLevel + 1 > this.total) {
            this.curLevel = 1;
        } else {
            this.curLevel++;
        }
        this.audio.play();
        this.anim.play('weapon_level_' + this.curLevel);
    }
    reduce() {
        if (this.curLevel < 2) {
            this.curLevel = 1;
        } else {
            this.curLevel--;
        }
        this.audio.play();
        this.anim.play('weapon_level_' + this.curLevel);
    }

}


/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// const { ccclass, property } = cc._decorator;
// 
// @ccclass
// export default class Weapon extends cc.Component {
//     @property(cc.Animation)
//     anim: cc.Animation = null;
// 
//     curLevel: number;
//     total: number;
//     
//     init() {
//         this.curLevel = 1;
//         this.total = this.anim.getClips().length;
//     }
// 
//     plus() {
//         if (this.curLevel + 1 > this.total) {
//             this.curLevel = this.total;
//         } else {
//             this.curLevel++;
//         }
//         this.anim.play('weapon_level_' + this.curLevel);
//     }
// 
//     reduce() {
//         if (this.curLevel < 2) {
//             this.curLevel = 1;
//         } else {
//             this.curLevel--;
//         }
//         this.anim.play('weapon_level_' + this.curLevel);
//     }
//     
// 
// }
